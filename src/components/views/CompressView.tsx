import React from 'react';
import type { CompressFileItem, CompressionOptions, OmittedFileItem } from '../../services/pdfService';
import { DropZone } from '../DropZone';
import { PageCard } from '../PageCard';
import { CompressionControls } from '../CompressionControls';
import { Zap } from 'lucide-react';
import { ToolCanvasLayout } from '../common/ToolCanvasLayout';

interface CompressViewProps {
  compressItems: CompressFileItem[];
  compressViewMode: 'grid' | 'list';
  setCompressViewMode: (mode: 'grid' | 'list') => void;
  compressionOptions: CompressionOptions;
  setCompressionOptions: (opts: CompressionOptions) => void;
  onFilesSelected: (files: File[]) => void;
  onAddFilesClick: () => void;
  onMoveItem: (idx: number, direction: 'left' | 'right') => void;
  onDropItem: (targetIdx: number) => void;
  onRemoveItem: (idx: number) => void;
  onClearAll: () => void;
  onProcess: () => void;
  isLoading: boolean;
  draggedCompressIdx: number | null;
  setDraggedCompressIdx: (idx: number | null) => void;
  onPreview: (tool: 'compress', idx: number) => void;
  omittedFiles?: OmittedFileItem[];
}

export const CompressView: React.FC<CompressViewProps> = ({
  compressItems,
  compressViewMode,
  setCompressViewMode,
  compressionOptions,
  setCompressionOptions,
  onFilesSelected,
  onAddFilesClick,
  onMoveItem,
  onDropItem,
  onRemoveItem,
  onClearAll,
  onProcess,
  isLoading,
  draggedCompressIdx,
  setDraggedCompressIdx,
  onPreview,
  omittedFiles = [],
}) => {
  if (compressItems.length === 0) {
    return <DropZone onFilesSelected={onFilesSelected} omittedFiles={omittedFiles} multiple accept=".pdf,application/pdf" isLoading={isLoading} />;
  }

  const badgeText = `${compressItems.length} ${compressItems.length === 1 ? 'archivo' : 'archivos'}`;

  const sidebarContent = (
    <CompressionControls options={compressionOptions} onChange={setCompressionOptions} />
  );

  return (
    <ToolCanvasLayout
      badgeText={badgeText}
      onAddFilesClick={onAddFilesClick}
      viewMode={compressViewMode}
      onViewModeChange={setCompressViewMode}
      onClearAll={onClearAll}
      actionSubtitle="Selecciona el nivel de compresión a aplicar."
      processButtonLabel="Procesar archivos"
      processIcon={<Zap className="w-4 h-4" />}
      onProcess={onProcess}
      isProcessDisabled={isLoading || compressItems.length === 0}
      omittedFiles={omittedFiles}
      sidebar={sidebarContent}
    >
      {compressViewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
          {compressItems.map((item, idx) => (
            <PageCard
              key={item.id}
              page={{
                id: item.id,
                pageIndex: 0,
                thumbnailUrl: item.thumbnailUrl,
                rotation: 0,
                fileName: item.file.name,
              }}
              index={idx}
              totalCount={compressItems.length}
              viewMode="grid"
              badgePrefix="Archivo"
              isDragging={draggedCompressIdx === idx}
              onRotate={() => {}}
              onDelete={() => onRemoveItem(idx)}
              onMove={(i, dir) => onMoveItem(i, dir)}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(idx));
                e.dataTransfer.effectAllowed = 'move';
                setDraggedCompressIdx(idx);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDropItem(idx);
              }}
              onPreview={() => onPreview('compress', idx)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {compressItems.map((item, idx) => (
            <PageCard
              key={item.id}
              page={{
                id: item.id,
                pageIndex: 0,
                thumbnailUrl: item.thumbnailUrl,
                rotation: 0,
                fileName: item.file.name,
              }}
              index={idx}
              totalCount={compressItems.length}
              viewMode="list"
              badgePrefix="Archivo"
              isDragging={draggedCompressIdx === idx}
              onRotate={() => {}}
              onDelete={() => onRemoveItem(idx)}
              onMove={(i, dir) => onMoveItem(i, dir)}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(idx));
                e.dataTransfer.effectAllowed = 'move';
                setDraggedCompressIdx(idx);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDropItem(idx);
              }}
              onPreview={() => onPreview('compress', idx)}
            />
          ))}
        </div>
      )}
    </ToolCanvasLayout>
  );
};


