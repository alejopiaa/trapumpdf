import React from 'react';
import type { MergeFileItem, OmittedFileItem } from '../../services/pdfService';
import { DropZone } from '../DropZone';
import { PageCard } from '../PageCard';
import { ToolCanvasLayout } from '../common/ToolCanvasLayout';

interface MergeViewProps {
  mergeFiles: MergeFileItem[];
  mergeViewMode: 'grid' | 'list';
  setMergeViewMode: (mode: 'grid' | 'list') => void;
  onFilesSelected: (files: File[]) => void;
  onAddFilesClick: () => void;
  onMoveItem: (idx: number, direction: 'left' | 'right') => void;
  onDropItem: (fromIdx: number, toIdx: number) => void;
  onRemoveItem: (idx: number) => void;
  onClearAll: () => void;
  onProcess: () => void;
  isLoading: boolean;
  draggedMergeIdx: number | null;
  setDraggedMergeIdx: (idx: number | null) => void;
  onPreview: (tool: 'merge', idx: number) => void;
  omittedFiles?: OmittedFileItem[];
  onSortAZ?: () => void;
  onSortZA?: () => void;
  onResetOrder?: () => void;
}

export const MergeView: React.FC<MergeViewProps> = ({
  mergeFiles,
  mergeViewMode,
  setMergeViewMode,
  onFilesSelected,
  onAddFilesClick,
  onMoveItem,
  onDropItem,
  onRemoveItem,
  onClearAll,
  onProcess,
  isLoading,
  draggedMergeIdx,
  setDraggedMergeIdx,
  onPreview,
  omittedFiles = [],
  onSortAZ,
  onSortZA,
  onResetOrder,
}) => {
  if (mergeFiles.length === 0) {
    return <DropZone onFilesSelected={onFilesSelected} omittedFiles={omittedFiles} multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*" isLoading={isLoading} />;
  }

  const badgeText = `${mergeFiles.length} ${mergeFiles.length === 1 ? 'archivo' : 'archivos'}`;

  const handleDrop = (targetIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rawData = e.dataTransfer.getData('text/plain');
    const sourceIdx = rawData ? parseInt(rawData, 10) : (draggedMergeIdx !== null ? draggedMergeIdx : -1);
    if (sourceIdx >= 0 && sourceIdx !== targetIdx) {
      onDropItem(sourceIdx, targetIdx);
    }
  };

  return (
    <ToolCanvasLayout
      badgeText={badgeText}
      onAddFilesClick={onAddFilesClick}
      viewMode={mergeViewMode}
      onViewModeChange={setMergeViewMode}
      onClearAll={onClearAll}
      actionSubtitle="Combina tus archivos en un solo documento ordenado."
      processButtonLabel="Procesar archivos"
      onProcess={onProcess}
      isProcessDisabled={isLoading || mergeFiles.length === 0}
      omittedFiles={omittedFiles}
      onSortAZ={onSortAZ}
      onSortZA={onSortZA}
      onResetOrder={onResetOrder}
    >
      {mergeViewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 justify-items-center">
          {mergeFiles.map((fileItem, idx) => (
            <PageCard
              key={fileItem.id}
              page={{
                id: fileItem.id,
                fileId: fileItem.id,
                fileName: fileItem.fileName || fileItem.file.name,
                fileType: fileItem.file.type.startsWith('image') ? 'image' : 'pdf',
                pageIndex: 0,
                originalIndex: idx,
                totalPagesInFile: fileItem.pageCount,
                rotation: 0,
                thumbnailUrl: fileItem.thumbnailUrl || '',
                width: 595,
                height: 842,
              }}
              index={idx}
              totalCount={mergeFiles.length}
              viewMode="grid"
              badgePrefix="Archivo"
              isDragging={draggedMergeIdx === idx}
              onRotate={() => {}}
              onDelete={() => onRemoveItem(idx)}
              onMove={(i, dir) => onMoveItem(i, dir)}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(idx));
                e.dataTransfer.effectAllowed = 'move';
                setDraggedMergeIdx(idx);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => handleDrop(idx, e)}
              onPreview={() => onPreview('merge', idx)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mergeFiles.map((fileItem, idx) => (
            <PageCard
              key={fileItem.id}
              page={{
                id: fileItem.id,
                fileId: fileItem.id,
                fileName: fileItem.fileName || fileItem.file.name,
                fileType: fileItem.file.type.startsWith('image') ? 'image' : 'pdf',
                pageIndex: 0,
                originalIndex: idx,
                totalPagesInFile: fileItem.pageCount,
                rotation: 0,
                thumbnailUrl: fileItem.thumbnailUrl || '',
                width: 595,
                height: 842,
              }}
              index={idx}
              totalCount={mergeFiles.length}
              viewMode="list"
              badgePrefix="Archivo"
              isDragging={draggedMergeIdx === idx}
              onRotate={() => {}}
              onDelete={() => onRemoveItem(idx)}
              onMove={(i, dir) => onMoveItem(i, dir)}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(idx));
                e.dataTransfer.effectAllowed = 'move';
                setDraggedMergeIdx(idx);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => handleDrop(idx, e)}
              onPreview={() => onPreview('merge', idx)}
            />
          ))}
        </div>
      )}
    </ToolCanvasLayout>
  );
};

