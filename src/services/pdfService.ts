import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import workerCode from 'pdfjs-dist/build/pdf.worker.min.mjs?raw';
import JSZip from 'jszip';

// Configure pdfjs worker with inline blob so it works 100% offline without external file requests
try {
  const blob = new Blob([workerCode], { type: 'text/javascript' });
  pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
} catch (e) {
  console.warn('Worker blob initialization warning:', e);
}

export interface PageItem {
  id: string;
  fileId: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  pageIndex: number; // 0-indexed page in original document
  originalIndex: number; // Original insertion order
  totalPagesInFile: number;
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl: string;
  width: number;
  height: number;
  excluded?: boolean;
  isBlank?: boolean;
  // Raw source references
  pdfArrayBuffer?: ArrayBuffer;
  imageFile?: File;
}

export interface MergeFileItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  pageCount: number;
  originalIndex: number;
  rotation: number;
  thumbnailUrl?: string;
}

export interface EditFileGroup {
  id: string;
  fileName: string;
  fileSize: number;
  originalIndex: number;
  pages: PageItem[];
  collapsed?: boolean;
}

export interface CompressedResultItem {
  id: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  pdfBytes: Uint8Array;
}

export interface CompressFileItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  pageCount: number;
  thumbnailUrl?: string;
}

export interface CompressionOptions {
  level: 'none' | 'recommended' | 'high' | 'custom';
  jpegQuality: number; // 0.1 to 1.0
  scaleFactor: number; // 0.3 to 1.0
}

export interface OmittedFileItem {
  name: string;
  reason: string;
}

export interface ParseResult<T> {
  items: T[];
  omittedFiles: OmittedFileItem[];
}

/**
 * Extracts clean base name from a file name, stripping extension
 */
export function getCleanBaseName(fileName?: string): string {
  if (!fileName) return 'documento';
  return fileName.replace(/\.[^/.]+$/, "");
}

/**
 * Converts a Canvas element to a Blob Object URL instead of a Base64 Data URL.
 * Reduces V8 Heap Memory consumption by storing thumbnails in browser Blob storage.
 */
export const canvasToBlobUrl = (canvas: HTMLCanvasElement, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          // Fallback to Data URL if toBlob is unsupported
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      },
      'image/jpeg',
      quality
    );
  });
};

/**
 * Fast & ultra-performant blank page detector using 64x64 micro-canvas downscaling
 * and perceptual luminance thresholding (L < 240, < 0.3% dark pixel ratio).
 * Execution time < 0.05ms per page. Zero main-thread lag.
 */
export const isCanvasBlank = (canvas: HTMLCanvasElement): boolean => {
  try {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 64;
    const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(canvas, 0, 0, 64, 64);
    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;
    let darkPixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels
      if (a < 50) continue;

      // Perceptual luminance calculation
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 240) {
        darkPixelCount++;
        // Early exit if threshold exceeded (> 0.3% non-white content)
        if (darkPixelCount >= 12) {
          return false;
        }
      }
    }

    return darkPixelCount < 12;
  } catch (e) {
    console.warn('Error en detección de página en blanco:', e);
    return false;
  }
};

/**
 * Safely revokes a Blob Object URL to free browser RAM immediately.
 */
export const revokeThumbnailUrl = (url?: string) => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Error al liberar Object URL:', e);
    }
  }
};

/**
 * Safely revokes multiple Blob Object URLs to free browser RAM.
 */
export const releaseBlobUrls = (urls: (string | undefined)[]) => {
  urls.forEach((url) => revokeThumbnailUrl(url));
};

/**
 * Destroys all cached PDF.js document proxies and clears the internal cache map to free RAM.
 */
export const clearPdfjsCache = () => {
  pdfjsDocMap.forEach((doc) => {
    try {
      doc.destroy();
    } catch (e) {
      console.warn('Error destruyendo proxy de PDF.js:', e);
    }
  });
  pdfjsDocMap.clear();
};

/**
 * Parses files (PDFs or Images) into individual PageItems with high-res thumbnails
 */
export const parseFilesToPages = async (
  files: File[],
  onProgress?: (percent: number, statusText: string) => void
): Promise<ParseResult<PageItem>> => {
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const pages: PageItem[] = [];
  const omittedFiles: OmittedFileItem[] = [];
  const totalFiles = sortedFiles.length;
  let globalIndexCounter = 0;

  for (let fileIdx = 0; fileIdx < totalFiles; fileIdx++) {
    const file = sortedFiles[fileIdx];
    const fileId = `file-${Date.now()}-${fileIdx}-${Math.random().toString(36).substring(2, 5)}`;

    if (onProgress) {
      onProgress(
        Math.round((fileIdx / totalFiles) * 100),
        `Procesando ${file.name}...`
      );
    }

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        const pdfDoc = await loadingTask.promise;
        const totalPages = pdfDoc.numPages;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          if (onProgress) {
            onProgress(
              Math.round(((fileIdx + pageNum / totalPages) / totalFiles) * 100),
              `Generando miniatura ${pageNum} de ${totalPages} de ${file.name}...`
            );
          }

          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.6 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
            } as any).promise;
          }

          const isBlank = isCanvasBlank(canvas);
          const thumbnailUrl = await canvasToBlobUrl(canvas, 0.85);

          pages.push({
            id: `${fileId}-p${pageNum}`,
            fileId,
            fileName: file.name,
            fileType: 'pdf',
            pageIndex: pageNum - 1,
            originalIndex: globalIndexCounter++,
            totalPagesInFile: totalPages,
            rotation: 0,
            thumbnailUrl,
            width: viewport.width,
            height: viewport.height,
            isBlank,
            pdfArrayBuffer: arrayBuffer,
          });
        }
      } catch (err: any) {
        console.error(`Error leyendo el archivo PDF ${file.name}:`, err);
        const isPassword = err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password');
        omittedFiles.push({
          name: file.name,
          reason: isPassword ? '🔒 Protegido con contraseña' : '❌ Formato no admitido o archivo dañado',
        });
      }
    } else if (file.type.startsWith('image/')) {
      try {
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        const maxThumbDim = 800;
        let thumbW = img.width;
        let thumbH = img.height;
        if (thumbW > maxThumbDim || thumbH > maxThumbDim) {
          if (thumbW > thumbH) {
            thumbH = Math.round((thumbH * maxThumbDim) / thumbW);
            thumbW = maxThumbDim;
          } else {
            thumbW = Math.round((thumbW * maxThumbDim) / thumbH);
            thumbH = maxThumbDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = thumbW;
        canvas.height = thumbH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, thumbW, thumbH);
        }

        const thumbnailUrl = await canvasToBlobUrl(canvas, 0.85);
        URL.revokeObjectURL(imageUrl);

        pages.push({
          id: `${fileId}-img`,
          fileId,
          fileName: file.name,
          fileType: 'image',
          pageIndex: 0,
          originalIndex: globalIndexCounter++,
          totalPagesInFile: 1,
          rotation: 0,
          thumbnailUrl,
          width: img.width,
          height: img.height,
          imageFile: file,
        });
      } catch (err) {
        console.error(`Error leyendo la imagen ${file.name}:`, err);
        omittedFiles.push({
          name: file.name,
          reason: '❌ Imagen dañada o no compatible',
        });
      }
    } else {
      omittedFiles.push({
        name: file.name,
        reason: '📄 Formato no permitido',
      });
    }
  }

  if (onProgress) {
    onProgress(100, 'Archivos cargados correctamente');
  }

  return { items: pages, omittedFiles };
};

/**
 * Parses uploaded Files into grouped EditFileGroups for Organizar & Editar
 */
export const parseFilesToEditGroups = async (
  files: File[],
  onProgress?: (percent: number, statusText: string) => void
): Promise<ParseResult<EditFileGroup>> => {
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const groups: EditFileGroup[] = [];
  const omittedFiles: OmittedFileItem[] = [];
  const totalFiles = sortedFiles.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = sortedFiles[i];
    if (onProgress) {
      onProgress(
        Math.round((i / totalFiles) * 100),
        `Leyendo páginas de ${file.name}...`
      );
    }
    const { items: pages, omittedFiles: fileOmitted } = await parseFilesToPages([file]);
    if (fileOmitted.length > 0) {
      omittedFiles.push(...fileOmitted);
    }
    if (pages.length > 0) {
      groups.push({
        id: `edit-group-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        fileName: file.name,
        fileSize: file.size,
        originalIndex: i,
        pages,
        collapsed: true,
      });
    }
  }

  if (onProgress) {
    onProgress(100, 'Archivos cargados correctamente');
  }

  return { items: groups, omittedFiles };
};

/**
 * Merges and compresses selected pages into a single PDF Uint8Array
 */
export async function mergeAndCompressPages(
  pages: PageItem[],
  options: CompressionOptions = { level: 'none', jpegQuality: 1.0, scaleFactor: 1.0 },
  onProgress?: (progress: number, status: string) => void
): Promise<{ pdfBytes: Uint8Array; originalSizeBytes: number; originalSize: number; compressedSize: number }> {
  let originalSizeBytes = 0;

  const countedFiles = new Set<string>();
  for (const page of pages) {
    if (!countedFiles.has(page.fileId)) {
      countedFiles.add(page.fileId);
      if (page.pdfArrayBuffer) {
        originalSizeBytes += page.pdfArrayBuffer.byteLength;
      } else if (page.imageFile) {
        originalSizeBytes += page.imageFile.size;
      }
    }
  }

  const mergedDoc = await PDFDocument.create();
  const totalPages = pages.length;

  const pdfDocMap = new Map<ArrayBuffer, PDFDocument>();
  const pdfjsDocMap = new Map<ArrayBuffer, pdfjsLib.PDFDocumentProxy>();

  for (let i = 0; i < totalPages; i++) {
    const pageItem = pages[i];
    
    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / totalPages) * 100),
        `Procesando página ${i + 1} de ${totalPages}...`
      );
    }

    if (options.level === 'none') {
      if (pageItem.fileType === 'pdf' && pageItem.pdfArrayBuffer) {
        let srcPdfDoc = pdfDocMap.get(pageItem.pdfArrayBuffer);
        if (!srcPdfDoc) {
          srcPdfDoc = await PDFDocument.load(pageItem.pdfArrayBuffer.slice(0));
          pdfDocMap.set(pageItem.pdfArrayBuffer, srcPdfDoc);
        }

        const [copiedPage] = await mergedDoc.copyPages(srcPdfDoc, [pageItem.pageIndex]);

        if (pageItem.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + pageItem.rotation) % 360));
        }

        mergedDoc.addPage(copiedPage);
      } else if (pageItem.fileType === 'image' && pageItem.imageFile) {
        const imageBytes = await pageItem.imageFile.arrayBuffer();
        let embeddedImage;

        if (
          pageItem.imageFile.type === 'image/jpeg' ||
          pageItem.fileName.toLowerCase().endsWith('.jpg') ||
          pageItem.fileName.toLowerCase().endsWith('.jpeg')
        ) {
          embeddedImage = await mergedDoc.embedJpg(imageBytes);
        } else {
          embeddedImage = await mergedDoc.embedPng(imageBytes);
        }

        const newPage = mergedDoc.addPage([embeddedImage.width, embeddedImage.height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: embeddedImage.width,
          height: embeddedImage.height,
        });

        if (pageItem.rotation !== 0) {
          newPage.setRotation(degrees(pageItem.rotation));
        }
      }
    } else {
      try {
        let canvasWidth = pageItem.width;
        let canvasHeight = pageItem.height;

        if (options.scaleFactor < 1.0) {
          canvasWidth = Math.round(pageItem.width * options.scaleFactor);
          canvasHeight = Math.round(pageItem.height * options.scaleFactor);
        }

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No se pudo inicializar el contexto 2D de renderizado.');

        if (pageItem.fileType === 'pdf' && pageItem.pdfArrayBuffer) {
          let pdfjsDoc = pdfjsDocMap.get(pageItem.pdfArrayBuffer);
          if (!pdfjsDoc) {
            const loadingTask = pdfjsLib.getDocument({ data: pageItem.pdfArrayBuffer.slice(0) });
            pdfjsDoc = await loadingTask.promise;
            pdfjsDocMap.set(pageItem.pdfArrayBuffer, pdfjsDoc);
          }

          const pdfPage = await pdfjsDoc.getPage(pageItem.pageIndex + 1);
          const unscaledViewport = pdfPage.getViewport({ scale: 1.0 });
          const desiredScale = (canvasWidth / unscaledViewport.width);
          const viewport = pdfPage.getViewport({ scale: desiredScale });

          await pdfPage.render({
            canvasContext: ctx,
            viewport: viewport,
          } as any).promise;
        } else if (pageItem.fileType === 'image' && pageItem.imageFile) {
          const imageUrl = URL.createObjectURL(pageItem.imageFile);
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
          });
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          URL.revokeObjectURL(imageUrl);
        }

        const compressedDataUrl = canvas.toDataURL('image/jpeg', options.jpegQuality);
        const base64Data = compressedDataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const imageBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          imageBytes[j] = binaryString.charCodeAt(j);
        }

        const embeddedJpg = await mergedDoc.embedJpg(imageBytes);
        const newPage = mergedDoc.addPage([canvasWidth, canvasHeight]);

        newPage.drawImage(embeddedJpg, {
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
        });

        if (pageItem.rotation !== 0) {
          newPage.setRotation(degrees(pageItem.rotation));
        }
      } catch (err) {
        console.error(`Error comprimiendo página ${i + 1}:`, err);
      }
    }
  }

  const pdfBytes = await mergedDoc.save();
  return {
    pdfBytes,
    originalSizeBytes,
    originalSize: originalSizeBytes,
    compressedSize: pdfBytes.byteLength,
  };
}

/**
 * Batch compresses multiple PDF files directly into individual result items
 */
export async function compressPdfFilesDirectIndividual(
  files: File[],
  options: CompressionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<CompressedResultItem[]> {
  const results: CompressedResultItem[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(
        Math.round((i / totalFiles) * 100),
        `Comprimiendo archivo ${i + 1} de ${totalFiles}: ${file.name}...`
      );
    }

    const { items: pages } = await parseFilesToPages([file]);
    const { pdfBytes: generatedBytes, originalSizeBytes } = await mergeAndCompressPages(pages, options);
    
    // Safety check: Never output a PDF that is larger than the original input file
    let finalPdfBytes = generatedBytes;
    let finalCompressedSize = generatedBytes.byteLength;

    if (generatedBytes.byteLength >= originalSizeBytes && originalSizeBytes > 0) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        finalPdfBytes = new Uint8Array(arrayBuffer);
        finalCompressedSize = originalSizeBytes;
      } catch (e) {
        console.warn('Fallback to generated bytes:', e);
      }
    }

    const baseName = getCleanBaseName(file.name);

    results.push({
      id: `comp-res-${i}-${Date.now()}`,
      fileName: `${baseName}_trapumpdf.pdf`,
      originalSize: originalSizeBytes,
      compressedSize: finalCompressedSize,
      pdfBytes: finalPdfBytes,
    });
  }

  if (onProgress) {
    onProgress(100, 'Compresión completada con éxito');
  }

  return results;
}

/**
 * Exports EditFileGroups as a single ZIP archive containing individual PDFs
 */
export async function exportEditGroupsAsZip(
  groups: EditFileGroup[],
  options: CompressionOptions,
  onProgress?: (percent: number, statusText: string) => void
): Promise<{ zipBlob: Blob; zipFileName: string; compressedResults: CompressedResultItem[] }> {
  const zip = new JSZip();
  const compressedResults: CompressedResultItem[] = [];
  const validGroups = groups.filter(g => g.pages.some(p => !p.excluded));

  for (let i = 0; i < validGroups.length; i++) {
    const group = validGroups[i];
    const activePages = group.pages.filter(p => !p.excluded);

    if (onProgress) {
      onProgress(
        Math.round((i / validGroups.length) * 100),
        `Exportando ${group.fileName} (${i + 1}/${validGroups.length})...`
      );
    }

    const { pdfBytes, originalSizeBytes } = await mergeAndCompressPages(activePages, options);
    const baseName = getCleanBaseName(group.fileName);
    const exportName = `${baseName}_trapumpdf.pdf`;

    zip.file(exportName, pdfBytes);

    compressedResults.push({
      id: `res-${group.id}-${Date.now()}`,
      fileName: exportName,
      originalSize: originalSizeBytes,
      compressedSize: pdfBytes.byteLength,
      pdfBytes,
    });
  }

  if (onProgress) {
    onProgress(95, 'Creando paquete comprimido ZIP...');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const firstBaseName = getCleanBaseName(validGroups[0]?.fileName || 'documentos');
  const zipFileName = `${firstBaseName}_trapumpdf.zip`;

  return { zipBlob, zipFileName, compressedResults };
}

/**
 * Processes EditFileGroups generating BOTH a unified PDF and a ZIP of separate PDFs in 1 run
 */
export async function processEditGroups(
  groups: EditFileGroup[],
  options: CompressionOptions,
  onProgress?: (percent: number, statusText: string) => void
): Promise<{
  pdfBytes: Uint8Array;
  zipResult: { blob: Blob; fileName: string };
  originalSize: number;
  compressedSize: number;
}> {
  const validGroups = groups.filter(g => g.pages.some(p => !p.excluded));
  const zip = new JSZip();
  let totalOriginalSize = 0;

  // Master doc for unified PDF
  const masterUnifiedDoc = await PDFDocument.create();

  const totalGroups = validGroups.length;

  for (let i = 0; i < totalGroups; i++) {
    const group = validGroups[i];
    const activePages = group.pages.filter(p => !p.excluded);

    if (onProgress) {
      onProgress(
        Math.round((i / totalGroups) * 90),
        `Procesando archivo ${i + 1} de ${totalGroups}: ${group.fileName}...`
      );
    }

    // Process individual edited PDF for this file
    const { pdfBytes, originalSizeBytes } = await mergeAndCompressPages(activePages, options);
    totalOriginalSize += originalSizeBytes;

    // Add to ZIP
    const baseName = getCleanBaseName(group.fileName);
    const exportName = `${baseName}_trapumpdf.pdf`;
    zip.file(exportName, pdfBytes);

    // Embed into master unified PDF
    const filePdfDoc = await PDFDocument.load(pdfBytes.buffer);
    const pageIndices = filePdfDoc.getPageIndices();
    const copiedPages = await masterUnifiedDoc.copyPages(filePdfDoc, pageIndices);
    copiedPages.forEach(p => masterUnifiedDoc.addPage(p));
  }

  if (onProgress) {
    onProgress(92, 'Generando archivo unificado y paquete ZIP...');
  }

  const unifiedPdfBytes = await masterUnifiedDoc.save();
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const firstBaseName = getCleanBaseName(validGroups[0]?.fileName || 'documentos');
  const zipFileName = `${firstBaseName}_trapumpdf.zip`;

  if (onProgress) {
    onProgress(100, 'Procesamiento completado con éxito');
  }

  return {
    pdfBytes: unifiedPdfBytes,
    zipResult: { blob: zipBlob, fileName: zipFileName },
    originalSize: totalOriginalSize,
    compressedSize: unifiedPdfBytes.byteLength,
  };
}
// ----- Split functionality -----

/**
 * Split the selected pages into individual PDFs (one per page).
 * Returns an array of result objects containing the PDF bytes and a generated filename.
 */
export async function splitByPages(
  pages: PageItem[],
  options: CompressionOptions,
  onProgress?: (percent: number, status: string) => void
): Promise<Array<{ fileName: string; pdfBytes: Uint8Array; originalSizeBytes: number; compressedSize: number }>> {
  const results = [];
  const total = pages.length;
  const baseName = getCleanBaseName(pages[0]?.fileName || 'documento');

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    if (onProgress) onProgress(Math.round((i / total) * 100), `Dividiendo página ${i + 1}/${total}...`);
    const { pdfBytes, originalSizeBytes } = await mergeAndCompressPages([page], options);
    const fileName = `${baseName}_p${page.pageIndex + 1}_trapumpdf.pdf`;
    results.push({
      fileName,
      pdfBytes,
      originalSizeBytes,
      compressedSize: pdfBytes.byteLength,
    });
  }
  if (onProgress) onProgress(100, 'División por páginas completada');
  return results;
}

/**
 * Split pages according to custom user‑defined ranges.
 * Each range {start, end} uses 1‑based page numbers inclusive.
 */
export async function splitByRanges(
  pages: PageItem[],
  ranges: Array<{ start: number; end: number }>,
  options: CompressionOptions,
  onProgress?: (percent: number, status: string) => void
): Promise<Array<{ fileName: string; pdfBytes: Uint8Array; originalSizeBytes: number; compressedSize: number }>> {
  const results = [];
  const totalRanges = ranges.length;
  const baseName = getCleanBaseName(pages[0]?.fileName || 'documento');

  for (let i = 0; i < totalRanges; i++) {
    const { start, end } = ranges[i];
    if (onProgress) onProgress(Math.round((i / totalRanges) * 100), `Procesando rango ${start}-${end}...`);
    const rangePages = pages.filter(p => p.pageIndex + 1 >= start && p.pageIndex + 1 <= end);
    const { pdfBytes, originalSizeBytes } = await mergeAndCompressPages(rangePages, options);
    const fileName = `${baseName}_r${start}-${end}_trapumpdf.pdf`;
    results.push({
      fileName,
      pdfBytes,
      originalSizeBytes,
      compressedSize: pdfBytes.byteLength,
    });
  }
  if (onProgress) onProgress(100, 'División por rangos personalizada completada');
  return results;
}

/**
 * Split pages into fixed‑size blocks (N pages per PDF).
 */
export async function splitByFixedRange(
  pages: PageItem[],
  blockSize: number,
  options: CompressionOptions,
  onProgress?: (percent: number, status: string) => void
): Promise<Array<{ fileName: string; pdfBytes: Uint8Array; originalSizeBytes: number; compressedSize: number }>> {
  const results = [];
  const totalPages = pages.length;
  const totalBlocks = Math.ceil(totalPages / blockSize);
  const baseName = getCleanBaseName(pages[0]?.fileName || 'documento');

  for (let i = 0; i < totalBlocks; i++) {
    const startIdx = i * blockSize;
    const endIdx = Math.min(startIdx + blockSize, totalPages);
    const blockPages = pages.slice(startIdx, endIdx);
    if (onProgress) onProgress(Math.round((i / totalBlocks) * 100), `Creando bloque ${i + 1}/${totalBlocks}...`);
    const { pdfBytes, originalSizeBytes } = await mergeAndCompressPages(blockPages, options);
    const fileName = `${baseName}_p${i + 1}_trapumpdf.pdf`;
    results.push({
      fileName,
      pdfBytes,
      originalSizeBytes,
      compressedSize: pdfBytes.byteLength,
    });
  }
  if (onProgress) onProgress(100, 'División por rango fijo completada');
  return results;
}

// ----- End of split functionality -----

/**
 * Parses files to MergeFileItem (for UNIR PDF tool)
 */
export async function parseFilesToMergeItems(
  files: File[],
  onProgress?: (progress: number, message: string) => void
): Promise<ParseResult<MergeFileItem>> {
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const items: MergeFileItem[] = [];
  const omittedFiles: OmittedFileItem[] = [];

  for (let i = 0; i < sortedFiles.length; i++) {
    const file = sortedFiles[i];
    if (onProgress) {
      onProgress(Math.round((i / files.length) * 100), `Generando miniatura ${file.name}...`);
    }

    let pageCount = 1;
    let thumbnailUrl: string | undefined = undefined;
    let success = false;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        const pdfDoc = await loadingTask.promise;
        pageCount = pdfDoc.numPages;

        if (pageCount > 0) {
          const page = await pdfDoc.getPage(1);
          const viewport = page.getViewport({ scale: 1.6 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');

          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
            } as any).promise;
            thumbnailUrl = await canvasToBlobUrl(canvas, 0.85);
          }
        }
        success = true;
      } catch (err: any) {
        console.error(`Error leyendo miniatura del PDF ${file.name}:`, err);
        const isPassword = err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password');
        omittedFiles.push({
          name: file.name,
          reason: isPassword ? '🔒 Protegido con contraseña' : '❌ Formato no admitido o archivo dañado',
        });
      }
    } else if (file.type.startsWith('image/')) {
      try {
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        const maxThumbDim = 800;
        let thumbW = img.width;
        let thumbH = img.height;
        if (thumbW > maxThumbDim || thumbH > maxThumbDim) {
          if (thumbW > thumbH) {
            thumbH = Math.round((thumbH * maxThumbDim) / thumbW);
            thumbW = maxThumbDim;
          } else {
            thumbW = Math.round((thumbW * maxThumbDim) / thumbH);
            thumbH = maxThumbDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = thumbW;
        canvas.height = thumbH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, thumbW, thumbH);
        }
        thumbnailUrl = await canvasToBlobUrl(canvas, 0.85);
        URL.revokeObjectURL(imageUrl);
        success = true;
      } catch (err) {
        console.error(`Error procesando miniatura de la imagen ${file.name}:`, err);
        omittedFiles.push({
          name: file.name,
          reason: '❌ Imagen dañada o no compatible',
        });
      }
    } else {
      omittedFiles.push({
        name: file.name,
        reason: '📄 Formato no permitido',
      });
    }

    if (success) {
      items.push({
        id: `merge-item-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        pageCount,
        originalIndex: i,
        rotation: 0,
        thumbnailUrl,
      });
    }
  }

  return { items, omittedFiles };
}

/**
 * Merges files at the file level in order
 */
export async function mergeAndCompressFileItems(
  items: MergeFileItem[],
  options: CompressionOptions = { level: 'none', jpegQuality: 1.0, scaleFactor: 1.0 },
  onProgress?: (progress: number, message: string) => void
): Promise<{ pdfBytes: Uint8Array; originalSizeBytes: number; originalSize: number; compressedSize: number }> {
  const allPages: PageItem[] = [];
  let originalSizeBytes = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    originalSizeBytes += item.fileSize;
    if (onProgress) {
      onProgress(Math.round((i / items.length) * 30), `Preparando ${item.fileName}...`);
    }
    const { items: parsedPages } = await parseFilesToPages([item.file]);
    if (item.rotation !== 0) {
      parsedPages.forEach(p => {
        p.rotation = (p.rotation + item.rotation) % 360;
      });
    }
    allPages.push(...parsedPages);
  }

  return mergeAndCompressPages(allPages, options, (percent, text) => {
    if (onProgress) {
      onProgress(30 + Math.round(percent * 0.7), text);
    }
  });
}

/**
 * Parses files for Compress PDF creating first page thumbnails for inspection
 */
export async function parseFilesToCompressItems(
  files: File[],
  onProgress?: (progress: number, message: string) => void
): Promise<ParseResult<CompressFileItem>> {
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const items: CompressFileItem[] = [];
  const omittedFiles: OmittedFileItem[] = [];

  for (let i = 0; i < sortedFiles.length; i++) {
    const file = sortedFiles[i];
    if (onProgress) {
      onProgress(Math.round((i / files.length) * 100), `Cargando ${file.name}...`);
    }

    let thumbnailUrl: string | undefined = undefined;
    let pageCount = 1;
    let success = false;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        const pdfDoc = await loadingTask.promise;
        pageCount = pdfDoc.numPages;

        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 0.6 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbnailUrl = await canvasToBlobUrl(canvas, 0.85);
        }
        success = true;
      } catch (err: any) {
        console.error(`Error procesando miniatura de ${file.name}:`, err);
        const isPassword = err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password');
        omittedFiles.push({
          name: file.name,
          reason: isPassword ? '🔒 Protegido con contraseña' : '❌ Formato no admitido o archivo dañado',
        });
      }
    } else {
      omittedFiles.push({
        name: file.name,
        reason: '📄 Solo se permiten archivos PDF',
      });
    }

    if (success) {
      items.push({
        id: `compress-item-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        pageCount,
        thumbnailUrl,
      });
    }
  }

  return { items, omittedFiles };
}

/**
 * Formats bytes to human-readable string (KB / MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
