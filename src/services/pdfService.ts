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
  jpegQuality?: number; // 0.1 to 1.0
  scaleFactor?: number; // 0.3 to 1.0
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
  // Strip file extension
  let base = fileName.replace(/\.[^/.]+$/, "");
  // Strip any trailing _trapumpdf to avoid duplicates like Acta_trapumpdf_trapumpdf
  base = base.replace(/_trapumpdf$/i, "");
  return base;
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
 * High-precision, zero-blur blank page detector.
 * Samples full-resolution pixels directly with step-sampling to eliminate downscaling wash-out.
 * Execution time < 0.05ms per page with early exit.
 */
export const isCanvasBlank = (canvas: HTMLCanvasElement): boolean => {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return false;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const step = 4; // Sample 1 pixel every 4 pixels vertically & horizontally
    let darkPixelCount = 0;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 50) continue; // Skip transparent pixels

        // Perceptual luminance calculation
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // Any pixel darker than 242 is considered content (text, lines, stamps, ink)
        if (luminance < 242) {
          darkPixelCount++;
          // Early exit: if we find more than 5 content pixels, it is NOT blank
          if (darkPixelCount >= 5) {
            return false;
          }
        }
      }
    }

    return darkPixelCount < 5;
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

interface DestroyableProxy {
  destroy?: () => Promise<void> | void;
  cleanup?: () => void;
}

function isDestroyable(target: unknown): target is DestroyableProxy {
  return typeof target === 'object' && target !== null && ('destroy' in target || 'cleanup' in target);
}

export async function safeDestroy(target: unknown): Promise<void> {
  if (!isDestroyable(target)) return;
  try {
    if (typeof target.destroy === 'function') {
      await target.destroy();
    } else if (typeof target.cleanup === 'function') {
      target.cleanup();
    }
  } catch (e) {
    console.warn('Advertencia al liberar proxy de PDF:', e);
  }
}

const pdfjsGlobalDocMap = new Map<unknown, unknown>();

export const clearPdfjsCache = () => {
  pdfjsGlobalDocMap.forEach((doc) => {
    safeDestroy(doc);
  });
  pdfjsGlobalDocMap.clear();
};

/**
 * Centralized File ArrayBuffer cache to avoid duplicating ArrayBuffers across hundreds of PageItems
 */
const pdfFileBufferMap = new Map<string, ArrayBuffer>();

export function storeFileBuffer(fileId: string, buffer: ArrayBuffer): void {
  pdfFileBufferMap.set(fileId, buffer);
}

export function getFileBuffer(fileId: string): ArrayBuffer | undefined {
  return pdfFileBufferMap.get(fileId);
}

export function removeFileBuffer(fileId: string): void {
  pdfFileBufferMap.delete(fileId);
}

export function syncFileBufferMap(activeFileIds: Set<string>): void {
  for (const key of pdfFileBufferMap.keys()) {
    if (!activeFileIds.has(key)) {
      pdfFileBufferMap.delete(key);
    }
  }
}

export function clearFileBufferMap(): void {
  pdfFileBufferMap.clear();
}

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
      let pdfDoc: unknown = null;
      try {
        const arrayBuffer = await file.arrayBuffer();
        storeFileBuffer(fileId, arrayBuffer);

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        pdfDoc = await loadingTask.promise;
        const totalPages = (pdfDoc as { numPages: number }).numPages;

        // Process thumbnails in concurrent batches of 4 pages
        const BATCH_SIZE = 4;
        for (let startPage = 1; startPage <= totalPages; startPage += BATCH_SIZE) {
          const endPage = Math.min(startPage + BATCH_SIZE - 1, totalPages);
          const batchPromises = [];

          for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
            batchPromises.push((async (pNum) => {
              const page = await (pdfDoc as { getPage: (num: number) => Promise<any> }).getPage(pNum);
              // Scale 0.95 gives ~350px width: retina-crisp for 175px cards and saves 55% RAM/render time
              const viewport = page.getViewport({ scale: 0.95 });

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              if (context) {
                await page.render({
                  canvasContext: context,
                  viewport: viewport,
                }).promise;
              }

              let isBlank = false;
              try {
                const textContent = await page.getTextContent();
                const hasText = textContent.items.some((item: any) => item.str && item.str.trim().length > 0);
                if (!hasText) {
                  isBlank = isCanvasBlank(canvas);
                }
              } catch {
                isBlank = isCanvasBlank(canvas);
              }

              const thumbnailUrl = await canvasToBlobUrl(canvas, 0.85);

              return {
                id: `${fileId}-p${pNum}`,
                fileId,
                fileName: file.name,
                fileType: 'pdf' as const,
                pageIndex: pNum - 1,
                originalIndex: 0,
                totalPagesInFile: totalPages,
                rotation: 0,
                thumbnailUrl,
                width: viewport.width,
                height: viewport.height,
                isBlank,
                pdfArrayBuffer: arrayBuffer,
              };
            })(pageNum));
          }

          const batchResults = await Promise.all(batchPromises);
          for (const pageItem of batchResults) {
            pageItem.originalIndex = globalIndexCounter++;
            pages.push(pageItem);
          }

          if (onProgress) {
            onProgress(
              Math.round(((fileIdx + endPage / totalPages) / totalFiles) * 100),
              `Generando miniaturas (${endPage}/${totalPages}) de ${file.name}...`
            );
          }
        }
      } catch (err: any) {
        console.error(`Error leyendo el archivo PDF ${file.name}:`, err);
        const isPassword = err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password');
        omittedFiles.push({
          name: file.name,
          reason: isPassword ? '🔒 Protegido con contraseña' : '❌ Formato no admitido o archivo dañado',
        });
      } finally {
        if (pdfDoc) {
          await safeDestroy(pdfDoc);
        }
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
      const buffer = getFileBuffer(page.fileId) || page.pdfArrayBuffer;
      if (buffer) {
        originalSizeBytes += buffer.byteLength;
      } else if (page.imageFile) {
        originalSizeBytes += page.imageFile.size;
      }
    }
  }

  const mergedDoc = await PDFDocument.create();
  const totalPages = pages.length;

  const pdfDocMap = new Map<ArrayBuffer, PDFDocument>();
  const pdfjsDocMap = new Map<ArrayBuffer, unknown>();

  for (let i = 0; i < totalPages; i++) {
    const pageItem = pages[i];
    const pageBuffer = getFileBuffer(pageItem.fileId) || pageItem.pdfArrayBuffer;
    
    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / totalPages) * 100),
        `Procesando página ${i + 1} de ${totalPages}...`
      );
    }

    if (options.level === 'none') {
      if (pageItem.fileType === 'pdf' && pageBuffer) {
        let srcPdfDoc = pdfDocMap.get(pageBuffer);
        if (!srcPdfDoc) {
          srcPdfDoc = await PDFDocument.load(pageBuffer.slice(0));
          pdfDocMap.set(pageBuffer, srcPdfDoc);
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
        const scale = options.scaleFactor ?? 1.0;
        let canvasWidth = pageItem.width;
        let canvasHeight = pageItem.height;

        if (scale < 1.0) {
          canvasWidth = Math.round(pageItem.width * scale);
          canvasHeight = Math.round(pageItem.height * scale);
        }

        let canvas: HTMLCanvasElement | OffscreenCanvas;
        let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

        if (typeof OffscreenCanvas !== 'undefined') {
          canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
          ctx = canvas.getContext('2d');
        } else {
          canvas = document.createElement('canvas');
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          ctx = canvas.getContext('2d');
        }

        if (!ctx) throw new Error('No se pudo inicializar el contexto 2D de renderizado.');

        if (pageItem.fileType === 'pdf' && pageBuffer) {
          let pdfjsDoc = pdfjsDocMap.get(pageBuffer) as pdfjsLib.PDFDocumentProxy | undefined;
          if (!pdfjsDoc) {
            const loadingTask = pdfjsLib.getDocument({ data: pageBuffer.slice(0) });
            pdfjsDoc = await loadingTask.promise;
            pdfjsDocMap.set(pageBuffer, pdfjsDoc);
          }

          const pdfPage = await pdfjsDoc.getPage(pageItem.pageIndex + 1);
          const unscaledViewport = pdfPage.getViewport({ scale: 1.0 });
          const desiredScale = (canvasWidth / unscaledViewport.width);
          const viewport = pdfPage.getViewport({ scale: desiredScale });

          await pdfPage.render({
            canvasContext: ctx,
            viewport: viewport,
          }).promise;
        } else if (pageItem.fileType === 'image' && pageItem.imageFile) {
          const imageUrl = URL.createObjectURL(pageItem.imageFile);
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
          });
          (ctx as any).drawImage(img, 0, 0, canvasWidth, canvasHeight);
          URL.revokeObjectURL(imageUrl);
        }

        const imageBytes = await canvasToJpegBytes(canvas, options.jpegQuality || 0.7);
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

  // Cleanup all pdfjsDoc proxies from the map
  for (const doc of pdfjsDocMap.values()) {
    await safeDestroy(doc);
  }

  const pdfBytes = await mergedDoc.save({ useObjectStreams: true });
  return {
    pdfBytes,
    originalSizeBytes,
    originalSize: originalSizeBytes,
    compressedSize: pdfBytes.byteLength,
  };
}

/**
 * Helper to convert canvas directly to Uint8Array JPEG bytes without Base64/atob strings
 */
async function canvasToJpegBytes(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number
): Promise<Uint8Array> {
  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } else {
    const htmlCanvas = canvas as HTMLCanvasElement;
    return new Promise((resolve, reject) => {
      htmlCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob falló al generar imagen.'));
            return;
          }
          const arrayBuffer = await blob.arrayBuffer();
          resolve(new Uint8Array(arrayBuffer));
        },
        'image/jpeg',
        quality
      );
    });
  }
}

/**
 * Compresses a single PDF file directly with intelligent hybrid vector/raster stream optimization
 */
export async function compressSinglePdfFile(
  file: File,
  options: CompressionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ pdfBytes: Uint8Array; originalSizeBytes: number; compressedSize: number }> {
  const originalSizeBytes = file.size;
  const arrayBuffer = await file.arrayBuffer();

  const srcPdfDoc = await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: true });
  let pdfjsDoc: any = null;

  try {
    pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const numPages = pdfjsDoc.numPages;

    const outputDoc = await PDFDocument.create();

  for (let pIdx = 0; pIdx < numPages; pIdx++) {
    if (onProgress) {
      onProgress(
        Math.round(((pIdx + 1) / numPages) * 100),
        `Optimizando página ${pIdx + 1} de ${numPages}...`
      );
    }

    const pdfPage = await pdfjsDoc.getPage(pIdx + 1);
    let hasVectorText = false;
    try {
      const textContent = await pdfPage.getTextContent();
      hasVectorText = textContent.items.some((it: any) => it.str && it.str.trim().length > 0);
    } catch {
      hasVectorText = false;
    }

    // Keep vector streams if options.level is 'low' or 'recommended' and page contains text
    // Only re-sample if explicitly requested 'high' compression or page is purely a scanned image
    const shouldKeepVector = options.level !== 'high' && hasVectorText;

    if (shouldKeepVector) {
      const [copiedPage] = await outputDoc.copyPages(srcPdfDoc, [pIdx]);
      outputDoc.addPage(copiedPage);
    } else {
      const unscaledViewport = pdfPage.getViewport({ scale: 1.0 });
      const scale = options.scaleFactor || 0.85;
      const targetWidth = Math.round(unscaledViewport.width * scale);
      const targetHeight = Math.round(unscaledViewport.height * scale);
      const viewport = pdfPage.getViewport({ scale: targetWidth / unscaledViewport.width });

      let canvas: HTMLCanvasElement | OffscreenCanvas;
      let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

      if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(targetWidth, targetHeight);
        ctx = canvas.getContext('2d');
      } else {
        canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx = canvas.getContext('2d');
      }

      if (!ctx) {
        const [copiedPage] = await outputDoc.copyPages(srcPdfDoc, [pIdx]);
        outputDoc.addPage(copiedPage);
        continue;
      }

      await (pdfPage.render({ canvasContext: ctx, viewport } as any)).promise;
      const imageBytes = await canvasToJpegBytes(canvas, options.jpegQuality || 0.7);
      const embeddedJpg = await outputDoc.embedJpg(imageBytes);

      const newPage = outputDoc.addPage([targetWidth, targetHeight]);
      newPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: targetWidth,
        height: targetHeight,
      });
    }
  }

    const generatedBytes = await outputDoc.save({ useObjectStreams: true });

    let finalBytes = generatedBytes;
    let finalSize = generatedBytes.byteLength;

    if (generatedBytes.byteLength >= originalSizeBytes && originalSizeBytes > 0) {
      finalBytes = new Uint8Array(arrayBuffer);
      finalSize = originalSizeBytes;
    }

    return {
      pdfBytes: finalBytes,
      originalSizeBytes,
      compressedSize: finalSize,
    };
  } finally {
    if (pdfjsDoc) {
      try {
        await pdfjsDoc.destroy();
      } catch {}
    }
  }
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

    const { pdfBytes, originalSizeBytes, compressedSize } = await compressSinglePdfFile(
      file,
      options,
      (pagePercent, pageText) => {
        if (onProgress) {
          const overall = Math.round(((i + pagePercent / 100) / totalFiles) * 100);
          onProgress(overall, `[${i + 1}/${totalFiles}] ${pageText}`);
        }
      }
    );

    const baseName = getCleanBaseName(file.name);

    results.push({
      id: `comp-res-${i}-${Date.now()}`,
      fileName: `${baseName}_trapumpdf.pdf`,
      originalSize: originalSizeBytes,
      compressedSize: compressedSize,
      pdfBytes,
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
  options: CompressionOptions = { level: 'none' },
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
    const filePdfDoc = await PDFDocument.load(pdfBytes);
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
  options: CompressionOptions = { level: 'none' },
  onProgress?: (percent: number, status: string) => void
): Promise<Array<{ fileName: string; pdfBytes: Uint8Array; originalSizeBytes: number; compressedSize: number }>> {
  const results = [];
  const total = pages.length;
  const baseName = getCleanBaseName(pages[0]?.fileName || 'documento');

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    if (onProgress) onProgress(Math.round((i / total) * 100), `Dividiendo página ${i + 1}/${total}...`);
    const { pdfBytes, originalSizeBytes } = await mergeAndCompressPages([page], options);
    const fileName = `${baseName}_pagina_${page.pageIndex + 1}_trapumpdf.pdf`;
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
  options: CompressionOptions = { level: 'none' },
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
    const fileName = start === end
      ? `${baseName}_pagina_${start}_trapumpdf.pdf`
      : `${baseName}_paginas_${start}-${end}_trapumpdf.pdf`;
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
  options: CompressionOptions = { level: 'none' },
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
    const fileName = `${baseName}_parte_${i + 1}_trapumpdf.pdf`;
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
      let pdfDoc: any = null;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        pdfDoc = await loadingTask.promise;
        pageCount = pdfDoc.numPages;

        if (pageCount > 0) {
          const page = await pdfDoc.getPage(1);
          const viewport = page.getViewport({ scale: 0.95 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');

          if (context) {
            await (page.render({
              canvasContext: context,
              viewport: viewport,
            } as any)).promise;
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
      } finally {
        if (pdfDoc) {
          try {
            await pdfDoc.destroy();
          } catch {}
        }
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
      let pdfDoc: any = null;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        pdfDoc = await loadingTask.promise;
        pageCount = pdfDoc.numPages;

        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 0.6 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await (page.render({ canvasContext: ctx, viewport } as any)).promise;
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
      } finally {
        if (pdfDoc) {
          try {
            await pdfDoc.destroy();
          } catch {}
        }
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
