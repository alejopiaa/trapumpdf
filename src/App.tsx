import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/common/Header';
import { HeroBanner } from './components/common/HeroBanner';
import { Footer } from './components/common/Footer';
import { ResultCard } from './components/ResultCard';
import { ProgressModal } from './components/common/ProgressModal';
import { LightboxModal } from './components/common/LightboxModal';
import { HomeView } from './components/views/HomeView';
import { MergeView } from './components/views/MergeView';
import { EditView } from './components/views/EditView';
import { SplitView } from './components/views/SplitView';
import { CompressView } from './components/views/CompressView';
import { usePdfMerge } from './hooks/usePdfMerge';
import { usePdfEdit } from './hooks/usePdfEdit';
import { usePdfSplit } from './hooks/usePdfSplit';
import { usePdfCompress } from './hooks/usePdfCompress';
import { AboutModal } from './components/common/AboutModal';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './components/ui/button';
import {
  parseFilesToPages,
  parseFilesToMergeItems,
  parseFilesToEditGroups,
  parseFilesToCompressItems,
  mergeAndCompressPages,
  mergeAndCompressFileItems,
  compressPdfFilesDirectIndividual,
  exportEditGroupsAsZip,
  processEditGroups,
  splitByPages,
  splitByRanges,
  splitByFixedRange,
  getCleanBaseName,
  clearPdfjsCache,
} from './services/pdfService';
import type { OmittedFileItem } from './services/pdfService';

function App() {
  const [activeTool, setActiveTool] = useState<'home' | 'merge' | 'edit' | 'split' | 'compress'>('home');
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Light-first theme state management
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('secmun_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('secmun_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('secmun_theme', 'light');
    }
  }, [isDarkMode]);

  // Persistent Custom Hooks for Tools
  const pdfMerge = usePdfMerge();
  const pdfEdit = usePdfEdit();
  const pdfSplit = usePdfSplit();
  const pdfCompress = usePdfCompress();

  // Async Processing & Progress State
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, text: '' });
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelRef = useRef(false);

  // Lightbox Preview Modal State
  const [lightboxPageIdx, setLightboxPageIdx] = useState<number | null>(null);
  const [lightboxGroupId, setLightboxGroupId] = useState<string | null>(null);
  const [lightboxFileId, setLightboxFileId] = useState<string | null>(null);
  const [lightboxScale, setLightboxScale] = useState<number>(1.0);

  const addFilesInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const updateProgress = (percent: number, text: string) => {
    if (cancelRef.current) return;
    setProgress({ percent: Math.round(percent), text });
  };

  const handleCancelProcessing = () => {
    cancelRef.current = true;
    setIsLoading(false);
    setProgress({ percent: 0, text: '' });
  };

  // Silent Power-User Hotkeys (Ctrl+A, Delete/Supr)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        if (activeTool === 'split' && pdfSplit.pages.length > 0) {
          e.preventDefault();
          pdfSplit.selectAllPages();
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeTool === 'split' && pdfSplit.selectedPageIds.size > 0) {
          e.preventDefault();
          pdfSplit.deleteSelectedPages();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, pdfSplit]);

  const pendingToolSwitchRef = useRef<'home' | 'merge' | 'edit' | 'split' | 'compress' | null>(null);
  const [pendingToolSwitch, setPendingToolSwitch] = useState<'home' | 'merge' | 'edit' | 'split' | 'compress' | null>(null);

  const hasActiveFiles = Boolean(
    (activeTool === 'merge' && pdfMerge.mergeFiles.length > 0) ||
    (activeTool === 'edit' && pdfEdit.editGroups.length > 0) ||
    (activeTool === 'split' && pdfSplit.pages.length > 0) ||
    (activeTool === 'compress' && pdfCompress.compressItems.length > 0)
  );

  const handleToolSwitch = (tool: 'home' | 'merge' | 'edit' | 'split' | 'compress') => {
    if (tool === activeTool) return;
    if (!hasActiveFiles) {
      setActiveTool(tool);
      setResult(null);
      setErrorMessage(null);
      setOmittedFiles([]);
      return;
    }
    pendingToolSwitchRef.current = tool;
    setPendingToolSwitch(tool);
  };

  const handleConfirmToolSwitch = (forcedTool?: 'home' | 'merge' | 'edit' | 'split' | 'compress' | null) => {
    const nextTool = forcedTool || pendingToolSwitch || pendingToolSwitchRef.current;
    pendingToolSwitchRef.current = null;
    setPendingToolSwitch(null);
    if (nextTool) {
      handleClearAll();
      setActiveTool(nextTool);
    }
  };

  const handleCancelToolSwitch = () => {
    pendingToolSwitchRef.current = null;
    setPendingToolSwitch(null);
  };

  const handleStartNewProcess = () => {
    handleClearAll();
    setActiveTool('home');
  };

  const [omittedFiles, setOmittedFiles] = useState<OmittedFileItem[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setIsLoading(true);
    cancelRef.current = false;
    setResult(null);
    setErrorMessage(null);

    try {
      if (activeTool === 'compress') {
        const { items: newItems, omittedFiles: fileOmitted } = await parseFilesToCompressItems(files, updateProgress);
        if (cancelRef.current) return;
        pdfCompress.setCompressItems((prev) => [...prev, ...newItems]);
        setOmittedFiles(fileOmitted);
      } else if (activeTool === 'edit') {
        const { items: newGroups, omittedFiles: fileOmitted } = await parseFilesToEditGroups(files, updateProgress);
        if (cancelRef.current) return;
        pdfEdit.setEditGroups((prev) => [...prev, ...newGroups]);
        setOmittedFiles(fileOmitted);
      } else if (activeTool === 'split') {
        const { items: newPages, omittedFiles: fileOmitted } = await parseFilesToPages([files[0]], updateProgress);
        if (cancelRef.current) return;
        pdfSplit.initPages(newPages);
        setOmittedFiles(fileOmitted);
      } else {
        const { items: newItems, omittedFiles: fileOmitted } = await parseFilesToMergeItems(files, updateProgress);
        if (cancelRef.current) return;
        pdfMerge.setMergeFiles((prev) => [...prev, ...newItems]);
        setOmittedFiles(fileOmitted);
      }
    } catch (err: any) {
      if (err?.message === 'CANCELLED_BY_USER' || cancelRef.current) return;
      console.error('Error al parsear archivos:', err);
      setErrorMessage(err?.message || 'Error al procesar los archivos seleccionados.');
    } finally {
      setIsLoading(false);
      setProgress({ percent: 0, text: '' });
    }
  };

  const handleAddFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleFilesSelected(files);
      e.target.value = '';
    }
  };

  const handleClearAll = () => {
    cancelRef.current = true;
    pdfMerge.clearMergeState();
    pdfEdit.clearEditState();
    pdfSplit.clearSplitState();
    pdfCompress.clearCompressState();
    clearPdfjsCache();
    setOmittedFiles([]);
    setResult(null);
    setErrorMessage(null);
    setLightboxPageIdx(null);
    setLightboxGroupId(null);
    setLightboxFileId(null);
    setLightboxScale(1.0);
  };

  const handleProcess = async (exportMode?: 'single' | 'zip') => {
    setIsLoading(true);
    cancelRef.current = false;
    setProgress({ percent: 0, text: 'Iniciando procesamiento...' });
    setResult(null);
    setErrorMessage(null);

    try {
      if (activeTool === 'compress') {
        if (pdfCompress.compressItems.length === 0) {
          throw new Error('Debes seleccionar al menos un archivo PDF para comprimir.');
        }
        const filesToCompress = pdfCompress.compressItems.map((item) => item.file);
        const res = await compressPdfFilesDirectIndividual(
          filesToCompress,
          pdfCompress.compressionOptions,
          updateProgress
        );
        if (cancelRef.current) return;
        if (res.length === 1) {
          const baseName = getCleanBaseName(filesToCompress[0]?.name);
          setResult({
            pdfBytes: res[0].pdfBytes,
            originalSize: res[0].originalSize,
            compressedSize: res[0].compressedSize,
            outputFileName: `${baseName}_trapumpdf.pdf`,
          });
        } else {
          setResult({
            multipleResults: res,
            originalSize: res.reduce((a, b) => a + b.originalSize, 0),
            compressedSize: res.reduce((a, b) => a + b.compressedSize, 0),
          });
        }
      } else if (activeTool === 'edit') {
        if (pdfEdit.editGroups.length === 0) {
          throw new Error('Debes cargar al menos un documento para organizar.');
        }
        if (pdfEdit.editGroups.length === 1) {
          const group = pdfEdit.editGroups[0];
          const activePages = group.pages.filter((p) => !p.excluded);
          if (activePages.length === 0) {
            throw new Error('Debes mantener al menos una página activa para organizar.');
          }
          const { pdfBytes, originalSizeBytes } = await mergeAndCompressPages(activePages, undefined, updateProgress);
          if (cancelRef.current) return;
          const baseName = getCleanBaseName(group.fileName);
          setResult({
            pdfBytes,
            originalSize: originalSizeBytes,
            compressedSize: pdfBytes.byteLength,
            outputFileName: `${baseName}_trapumpdf.pdf`,
          });
        } else {
          const zipRes = await exportEditGroupsAsZip(pdfEdit.editGroups, updateProgress);
          if (cancelRef.current) return;
          setResult({
            zipResult: { blob: zipRes.zipBlob, fileName: zipRes.zipFileName },
            multipleResults: zipRes.compressedResults,
            originalSize: zipRes.compressedResults.reduce((acc, item) => acc + item.originalSize, 0),
            compressedSize: zipRes.compressedResults.reduce((acc, item) => acc + item.compressedSize, 0),
          });
        }
      } else if (activeTool === 'split') {
        if (pdfSplit.pages.length === 0) {
          throw new Error('Debes cargar un archivo PDF para dividir.');
        }
        if (pdfSplit.splitMode === 'individual') {
          const selectedPages = pdfSplit.pages.filter((p) => pdfSplit.selectedPageIds.has(p.id));
          if (selectedPages.length === 0) {
            throw new Error('Debes seleccionar al menos una página para extraer.');
          }
          const res = await splitByPages(selectedPages, updateProgress);
          if (cancelRef.current) return;
          if (res.length === 1) {
            setResult({
              pdfBytes: res[0].pdfBytes,
              originalSize: res[0].originalSizeBytes || res[0].compressedSize,
              compressedSize: res[0].compressedSize,
              outputFileName: res[0].fileName,
            });
          } else {
            setResult({
              multipleResults: res.map((r, i) => ({
                id: `split-res-${i}-${Date.now()}`,
                fileName: r.fileName,
                originalSize: r.originalSizeBytes || r.compressedSize,
                compressedSize: r.compressedSize,
                pdfBytes: r.pdfBytes,
              })),
              originalSize: res.reduce((acc, r) => acc + (r.originalSizeBytes || r.compressedSize), 0),
              compressedSize: res.reduce((acc, r) => acc + r.compressedSize, 0),
            });
          }
        } else if (pdfSplit.splitMode === 'custom') {
          const validRanges = pdfSplit.customRanges.filter(
            (r) => r.start > 0 && r.end >= r.start && r.start <= pdfSplit.pages.length
          );
          if (validRanges.length === 0) {
            throw new Error('Debes ingresar al menos un rango de páginas válido.');
          }
          const res = await splitByRanges(pdfSplit.pages, validRanges, updateProgress);
          if (cancelRef.current) return;
          if (res.length === 1) {
            setResult({
              pdfBytes: res[0].pdfBytes,
              originalSize: res[0].originalSizeBytes || res[0].compressedSize,
              compressedSize: res[0].compressedSize,
              outputFileName: res[0].fileName,
            });
          } else {
            setResult({
              multipleResults: res.map((r, i) => ({
                id: `split-res-${i}-${Date.now()}`,
                fileName: r.fileName,
                originalSize: r.originalSizeBytes || r.compressedSize,
                compressedSize: r.compressedSize,
                pdfBytes: r.pdfBytes,
              })),
              originalSize: res.reduce((acc, r) => acc + (r.originalSizeBytes || r.compressedSize), 0),
              compressedSize: res.reduce((acc, r) => acc + r.compressedSize, 0),
            });
          }
        } else if (pdfSplit.splitMode === 'fixed') {
          if (pdfSplit.fixedSize <= 0) {
            throw new Error('El tamaño de rango debe ser mayor a 0.');
          }
          const res = await splitByFixedRange(pdfSplit.pages, pdfSplit.fixedSize, updateProgress);
          if (cancelRef.current) return;
          if (res.length === 1) {
            setResult({
              pdfBytes: res[0].pdfBytes,
              originalSize: res[0].originalSizeBytes || res[0].compressedSize,
              compressedSize: res[0].compressedSize,
              outputFileName: res[0].fileName,
            });
          } else {
            setResult({
              multipleResults: res.map((r, i) => ({
                id: `split-res-${i}-${Date.now()}`,
                fileName: r.fileName,
                originalSize: r.originalSizeBytes || r.compressedSize,
                compressedSize: r.compressedSize,
                pdfBytes: r.pdfBytes,
              })),
              originalSize: res.reduce((acc, r) => acc + (r.originalSizeBytes || r.compressedSize), 0),
              compressedSize: res.reduce((acc, r) => acc + r.compressedSize, 0),
            });
          }
        }
      } else {
        if (pdfMerge.mergeFiles.length === 0) {
          throw new Error('Debes seleccionar al menos un archivo para unir.');
        }
        const res = await mergeAndCompressFileItems(pdfMerge.mergeFiles, updateProgress);
        if (cancelRef.current) return;
        const firstFileName = pdfMerge.mergeFiles[0]?.name || 'documento';
        const baseName = getCleanBaseName(firstFileName);
        setResult({
          ...res,
          outputFileName: `${baseName}_trapumpdf.pdf`,
        });
      }
    } catch (err: any) {
      if (err?.message === 'CANCELLED_BY_USER' || cancelRef.current) return;
      console.error('Error al procesar:', err);
      setErrorMessage(err?.message || 'Ocurrió un error inesperado durante el procesamiento.');
    } finally {
      setIsLoading(false);
      setProgress({ percent: 0, text: '' });
    }
  };

  // Lightbox Active Item resolution across tools
  const currentMergeItem =
    lightboxFileId === 'merge' && lightboxPageIdx !== null ? pdfMerge.mergeFiles[lightboxPageIdx] : null;

  const currentEditGroup =
    lightboxFileId === 'edit' && lightboxGroupId
      ? pdfEdit.editGroups.find((g) => g.id === lightboxGroupId)
      : null;

  const currentEditItem =
    currentEditGroup && lightboxPageIdx !== null ? currentEditGroup.pages[lightboxPageIdx] : null;

  const currentSplitItem =
    lightboxFileId === 'split' && lightboxPageIdx !== null ? pdfSplit.pages[lightboxPageIdx] : null;

  const currentCompressItem =
    lightboxFileId === 'compress' && lightboxPageIdx !== null ? pdfCompress.compressItems[lightboxPageIdx] : null;

  const activeLightboxItem = currentMergeItem
    ? { fileName: currentMergeItem.file.name, thumbnailUrl: currentMergeItem.thumbnailUrl, rotation: 0, id: currentMergeItem.id }
    : currentEditItem
    ? { fileName: currentEditItem.fileName, thumbnailUrl: currentEditItem.thumbnailUrl, rotation: currentEditItem.rotation, id: currentEditItem.id, excluded: currentEditItem.excluded }
    : currentSplitItem
    ? { fileName: currentSplitItem.fileName, thumbnailUrl: currentSplitItem.thumbnailUrl, rotation: currentSplitItem.rotation, id: currentSplitItem.id }
    : currentCompressItem
    ? { fileName: currentCompressItem.file.name, thumbnailUrl: currentCompressItem.thumbnailUrl, rotation: 0, id: currentCompressItem.id }
    : null;

  const lightboxTotalItems = (() => {
    if (lightboxFileId === 'merge') return pdfMerge.mergeFiles.length;
    if (lightboxFileId === 'edit' && currentEditGroup) return currentEditGroup.pages.length;
    if (lightboxFileId === 'split') return pdfSplit.pages.length;
    if (lightboxFileId === 'compress') return pdfCompress.compressItems.length;
    return 0;
  })();

  const openLightbox = (tool: string, pageIdx: number, groupId?: string) => {
    setLightboxFileId(tool);
    setLightboxPageIdx(pageIdx);
    if (groupId) setLightboxGroupId(groupId);
    setLightboxScale(1.0);
  };

  const handleChainToTool = async (
    targetTool: 'compress' | 'edit' | 'merge',
    bytes?: Uint8Array
  ) => {
    setActiveTool(targetTool);
    setResult(null);
    setErrorMessage(null);

    if (bytes) {
      const chainedFile = new File(
        [bytes as unknown as BlobPart],
        `documento_procesado_${Date.now()}.pdf`,
        { type: 'application/pdf' }
      );

      setIsLoading(true);
      setProgress({ percent: 0, text: 'Cargando archivo generado...' });
      try {
        if (targetTool === 'compress') {
          const { items: newItems } = await parseFilesToCompressItems([chainedFile], updateProgress);
          pdfCompress.setCompressItems((prev) => [...prev, ...newItems]);
        } else if (targetTool === 'edit') {
          const { items: newGroups } = await parseFilesToEditGroups([chainedFile], updateProgress);
          pdfEdit.setEditGroups((prev) => [...prev, ...newGroups]);
        } else if (targetTool === 'merge') {
          const { items: newItems } = await parseFilesToMergeItems([chainedFile], updateProgress);
          pdfMerge.setMergeFiles((prev) => [...prev, ...newItems]);
        }
      } catch (err: any) {
        console.error('Error al encadenar archivo:', err);
        setErrorMessage('Error al transferir el archivo a la herramienta destino.');
      } finally {
        setIsLoading(false);
        setProgress({ percent: 0, text: '' });
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <div className="h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-600 w-full" />

      <input
        ref={addFilesInputRef}
        type="file"
        multiple={activeTool !== 'split'}
        accept={activeTool === 'compress' ? '.pdf,application/pdf' : '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp'}
        className="hidden"
        onChange={handleAddFilesChange}
      />

      <Header
        activeTool={activeTool}
        onToolSwitch={handleToolSwitch}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      <main ref={mainRef} className="flex-1 overflow-y-auto w-full">
        <HeroBanner activeTool={activeTool} />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-10">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-bold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-xs underline hover:no-underline">
              Cerrar
            </button>
          </div>
        )}

        {result ? (
          <ResultCard
            originalSize={result.originalSize}
            compressedSize={result.compressedSize}
            pdfBytes={result.pdfBytes}
            multipleResults={result.multipleResults}
            zipResult={result.zipResult}
            outputFileName={result.outputFileName}
            showSavingsBadge={activeTool === 'compress'}
            onReset={handleStartNewProcess}
            onReconfigureCompress={activeTool === 'compress' ? () => setResult(null) : undefined}
            onContinueCompress={activeTool !== 'compress' ? (bytes) => handleChainToTool('compress', bytes) : undefined}
            onContinueEdit={activeTool !== 'edit' ? (bytes) => handleChainToTool('edit', bytes) : undefined}
            onContinueMerge={activeTool !== 'merge' ? (bytes) => handleChainToTool('merge', bytes) : undefined}
          />
        ) : activeTool === 'home' ? (
          <HomeView onSelectTool={handleToolSwitch} />
        ) : activeTool === 'merge' ? (
          <MergeView
            mergeFiles={pdfMerge.mergeFiles}
            mergeViewMode={pdfMerge.mergeViewMode}
            setMergeViewMode={pdfMerge.setMergeViewMode}
            onFilesSelected={handleFilesSelected}
            onAddFilesClick={() => addFilesInputRef.current?.click()}
            onMoveItem={pdfMerge.handleMoveMergeItem}
            onDropItem={pdfMerge.handleDropMerge}
            onRemoveItem={pdfMerge.handleRemoveMergeItem}
            onClearAll={handleClearAll}
            onProcess={() => handleProcess()}
            isLoading={isLoading}
            draggedMergeIdx={pdfMerge.draggedMergeIdx}
            setDraggedMergeIdx={pdfMerge.setDraggedMergeIdx}
            onPreview={(t, idx) => openLightbox(t, idx)}
            omittedFiles={omittedFiles}
            onSortAZ={pdfMerge.handleSortMergeFilesAZ}
            onSortZA={pdfMerge.handleSortMergeFilesZA}
            onResetOrder={pdfMerge.handleResetMergeFiles}
          />
        ) : activeTool === 'edit' ? (
          <EditView
            editGroups={pdfEdit.editGroups}
            editViewMode={pdfEdit.editViewMode}
            setEditViewMode={pdfEdit.setEditViewMode}
            onFilesSelected={handleFilesSelected}
            onAddFilesClick={() => addFilesInputRef.current?.click()}
            onRotatePage={pdfEdit.handleRotateEditPage}
            onToggleExcluded={pdfEdit.handleToggleEditPageExcluded}
            onMovePage={pdfEdit.handleMoveEditPage}
            onDropPage={pdfEdit.handleDropEditPage}
            onRemoveGroup={pdfEdit.handleRemoveGroup}
            onClearAll={handleClearAll}
            onProcess={handleProcess}
            isLoading={isLoading}
            onPreview={(t, gId, pIdx) => openLightbox(t, pIdx, gId)}
            omittedFiles={omittedFiles}
            onInvertOrder={pdfEdit.handleInvertEditPagesOrder}
            onResetOrder={pdfEdit.handleResetEditPagesOrder}
            onRemoveBlankPages={pdfEdit.handleRemoveBlankPages}
            onRestoreAllPages={pdfEdit.handleRestoreAllPages}
          />
        ) : activeTool === 'split' ? (
          <SplitView
            pages={pdfSplit.pages}
            splitMode={pdfSplit.splitMode}
            onSplitModeChange={pdfSplit.setSplitMode}
            splitViewMode={pdfSplit.splitViewMode}
            setSplitViewMode={pdfSplit.setSplitViewMode}
            customRanges={pdfSplit.customRanges}
            onAddRange={pdfSplit.handleAddRange}
            onRemoveRange={pdfSplit.handleRemoveRange}
            onUpdateRange={pdfSplit.handleUpdateRange}
            fixedSize={pdfSplit.fixedSize}
            onFixedSizeChange={(val) => {
              const n = parseInt(val, 10);
              if (!isNaN(n) && n > 0) pdfSplit.setFixedSize(n);
            }}
            selectedPageIds={pdfSplit.selectedPageIds}
            onTogglePageSelection={pdfSplit.handleTogglePageSelection}
            onSelectAllPages={pdfSplit.handleSelectAllPages}
            onDeselectAllPages={pdfSplit.handleDeselectAllPages}
            onSelectEvenPages={pdfSplit.handleSelectEvenPages}
            onSelectOddPages={pdfSplit.handleSelectOddPages}
            onMovePageItem={pdfSplit.handleMovePageItem}
            draggedPageIdx={pdfSplit.draggedPageIdx}
            setDraggedPageIdx={pdfSplit.setDraggedPageIdx}
            onDropPage={pdfSplit.handleDropPage}
            onFilesSelected={handleFilesSelected}
            onAddFilesClick={() => addFilesInputRef.current?.click()}
            onClearAll={handleClearAll}
            onProcess={() => handleProcess()}
            isLoading={isLoading}
            onPreview={(t, pIdx) => openLightbox(t, pIdx)}
            omittedFiles={omittedFiles}
          />
        ) : (
          <CompressView
            compressItems={pdfCompress.compressItems}
            compressViewMode={pdfCompress.compressViewMode}
            setCompressViewMode={pdfCompress.setCompressViewMode}
            compressionOptions={pdfCompress.compressionOptions}
            setCompressionOptions={pdfCompress.setCompressionOptions}
            onFilesSelected={handleFilesSelected}
            onAddFilesClick={() => addFilesInputRef.current?.click()}
            onMoveItem={pdfCompress.handleMoveCompressItem}
            onDropItem={pdfCompress.handleDropCompress}
            onRemoveItem={pdfCompress.handleRemoveCompressItem}
            onClearAll={handleClearAll}
            onProcess={() => handleProcess()}
            isLoading={isLoading}
            draggedCompressIdx={pdfCompress.draggedCompressIdx}
            setDraggedCompressIdx={pdfCompress.setDraggedCompressIdx}
            onPreview={(t, idx) => openLightbox(t, idx)}
            omittedFiles={omittedFiles}
          />
        )}
        </div>
      </main>

      <Footer onOpenAbout={() => setShowAboutModal(true)} />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      <ProgressModal
        isOpen={isLoading}
        progressPercent={progress.percent}
        progressText={progress.text}
        onCancel={handleCancelProcessing}
      />

      <LightboxModal
        isOpen={lightboxPageIdx !== null && Boolean(activeLightboxItem)}
        onClose={() => { setLightboxPageIdx(null); setLightboxScale(1.0); }}
        activeItem={activeLightboxItem}
        pageIndex={lightboxPageIdx}
        totalItems={lightboxTotalItems}
        scale={lightboxScale}
        onScaleChange={setLightboxScale}
        onNavigate={(dir) => {
          setLightboxPageIdx((prev) => {
            if (prev === null) return 0;
            if (dir === 'prev') return prev > 0 ? prev - 1 : 0;
            return prev < lightboxTotalItems - 1 ? prev + 1 : prev;
          });
        }}
        showExclusionToggle={
          activeTool === 'edit' || (activeTool === 'split' && pdfSplit.splitMode === 'individual')
        }
        isIncluded={
          activeTool === 'edit'
            ? (currentEditItem ? !currentEditItem.excluded : true)
            : activeTool === 'split' && activeLightboxItem?.id
            ? pdfSplit.selectedPageIds.has(activeLightboxItem.id)
            : true
        }
        onToggleExclusion={() => {
          if (activeTool === 'edit' && lightboxGroupId && currentEditItem?.id) {
            pdfEdit.handleToggleEditPageExcluded(lightboxGroupId, currentEditItem.id);
          } else if (activeTool === 'split' && activeLightboxItem?.id) {
            pdfSplit.handleTogglePageSelection(activeLightboxItem.id);
          }
        }}
      />

      {pendingToolSwitch && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={handleCancelToolSwitch}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-muted transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-border/60 pb-3 pr-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">¿Cambiar de herramienta?</h3>
                <p className="text-xs text-muted-foreground">Tienes archivos cargados en memoria.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Si cambias de herramienta ahora, los archivos de la tarea actual se descartarán para liberar memoria RAM. ¿Deseas continuar?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCancelToolSwitch}>
                Permanecer aquí
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => handleConfirmToolSwitch(pendingToolSwitch)}>
                Descartar y cambiar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
