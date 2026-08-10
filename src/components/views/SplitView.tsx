import React from 'react';
import type { PageItem, OmittedFileItem } from '../../services/pdfService';
import { DropZone } from '../DropZone';
import { PageCard } from '../PageCard';
import SplitControlsSidebar from '../SplitControlsSidebar';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Scissors, Trash2 } from 'lucide-react';
import { ToolCanvasLayout } from '../common/ToolCanvasLayout';

interface SplitViewProps {
  pages: PageItem[];
  splitMode: 'individual' | 'custom' | 'fixed';
  onSplitModeChange: (mode: string) => void;
  splitViewMode: 'grid' | 'list';
  setSplitViewMode: (mode: 'grid' | 'list') => void;
  customRanges: Array<{ start: number; end: number }>;
  onAddRange: (range: { start: number; end: number }) => void;
  onRemoveRange: (idx: number) => void;
  onUpdateRange: (idx: number, range: { start: number; end: number }) => void;
  fixedSize: number;
  onFixedSizeChange: (val: string) => void;
  selectedPageIds: Set<string>;
  onTogglePageSelection: (id: string) => void;
  onSelectAllPages: () => void;
  onDeselectAllPages: () => void;
  onSelectEvenPages?: () => void;
  onSelectOddPages?: () => void;
  onMovePageItem: (idx: number, direction: 'left' | 'right') => void;
  draggedPageIdx: number | null;
  setDraggedPageIdx: (idx: number | null) => void;
  onDropPage: (idx: number) => void;
  onFilesSelected: (files: File[]) => void;
  onAddFilesClick: () => void;
  onClearAll: () => void;
  onProcess: () => void;
  isLoading: boolean;
  onPreview: (tool: 'split', pageIdx: number) => void;
  omittedFiles?: OmittedFileItem[];
}

export const SplitView: React.FC<SplitViewProps> = ({
  pages,
  splitMode,
  onSplitModeChange,
  splitViewMode,
  setSplitViewMode,
  customRanges,
  onAddRange,
  onRemoveRange,
  onUpdateRange,
  fixedSize,
  onFixedSizeChange,
  selectedPageIds,
  onTogglePageSelection,
  onSelectAllPages,
  onDeselectAllPages,
  onSelectEvenPages,
  onSelectOddPages,
  onMovePageItem,
  draggedPageIdx,
  setDraggedPageIdx,
  onDropPage,
  onFilesSelected,
  onAddFilesClick,
  onClearAll,
  onProcess,
  isLoading,
  onPreview,
  omittedFiles = [],
}) => {
  if (pages.length === 0) {
    return <DropZone onFilesSelected={onFilesSelected} omittedFiles={omittedFiles} multiple={false} accept=".pdf,application/pdf" isLoading={isLoading} />;
  }

  const selectedCount = selectedPageIds.size;
  const isSplitButtonDisabled =
    isLoading ||
    pages.length === 0 ||
    (splitMode === 'individual' && selectedCount === 0) ||
    (splitMode === 'custom' && customRanges.length === 0);

  const isInitialRangeSetOnly = customRanges.length === 1 && customRanges[0].start === 1 && customRanges[0].end === pages.length;

  const extraSelectionButtons = splitMode === 'individual' ? (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={onSelectAllPages}
        className="h-7 text-xs px-2.5 font-bold"
      >
        Todas
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDeselectAllPages}
        className="h-7 text-xs px-2.5 font-bold"
      >
        Ninguna
      </Button>
    </div>
  ) : null;

  const sidebarContent = (
    <SplitControlsSidebar
      mode={splitMode}
      onModeChange={onSplitModeChange}
      ranges={customRanges}
      onAddRange={onAddRange}
      onRemoveRange={onRemoveRange}
      onUpdateRange={onUpdateRange}
      fixedSize={fixedSize}
      onFixedSizeChange={onFixedSizeChange}
      totalPages={pages.length}
      selectedCount={selectedCount}
      onSelectEvenPages={onSelectEvenPages}
      onSelectOddPages={onSelectOddPages}
    />
  );

  return (
    <ToolCanvasLayout
      badgeText={`${pages.length} págs`}
      onAddFilesClick={onAddFilesClick}
      viewMode={splitViewMode}
      onViewModeChange={setSplitViewMode}
      onClearAll={onClearAll}
      clearAllLabel="Limpiar todo"
      actionSubtitle="Define los rangos y divide tu archivo."
      processButtonLabel={
        isInitialRangeSetOnly && splitMode === 'custom'
          ? 'Ajusta o añade un rango'
          : 'Procesar archivos'
      }
      processIcon={<Scissors className="w-4 h-4" />}
      onProcess={onProcess}
      isProcessDisabled={isSplitButtonDisabled}
      extraHeaderButtons={extraSelectionButtons}
      omittedFiles={omittedFiles}
      sidebar={sidebarContent}
    >
      {splitMode === 'individual' && (
        <div className={splitViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center' : 'flex flex-col gap-2'}>
          {pages.map((page, idx) => {
            const isSelected = selectedPageIds.has(page.id);
            return (
              <PageCard
                key={page.id}
                page={{ ...page, excluded: !isSelected }}
                index={idx}
                totalCount={pages.length}
                viewMode={splitViewMode}
                onDelete={() => onTogglePageSelection(page.id)}
                onRestore={() => onTogglePageSelection(page.id)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(idx));
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedPageIdx(idx);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDropPage(idx);
                }}
                onPreview={() => onPreview('split', idx)}
              />
            );
          })}
        </div>
      )}

      {splitMode === 'custom' && (
        <div className="flex flex-col gap-4">
          {customRanges.map((range, rIdx) => {
            const rangePages = pages.filter(
              (p) => p.pageIndex + 1 >= range.start && p.pageIndex + 1 <= range.end
            );

            return (
              <Card key={rIdx} className="p-4 border-2 border-dashed border-primary/40 bg-card flex flex-col gap-3 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <Badge variant="default" className="font-extrabold bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs">
                    Rango {rIdx + 1}: Páginas {range.start} a {range.end} ({rangePages.length} pág(s))
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveRange(rIdx)}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar Rango
                  </Button>
                </div>

                <div className={splitViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center pt-1' : 'flex flex-col gap-2 pt-1'}>
                  {rangePages.map((page) => {
                    const globalIdx = pages.findIndex((p) => p.id === page.id);
                    return (
                      <PageCard
                        key={page.id}
                        page={{ ...page, excluded: false }}
                        index={globalIdx}
                        totalCount={pages.length}
                        viewMode={splitViewMode}
                        onMove={(i, dir) => onMovePageItem(i, dir)}
                        onDragStart={() => setDraggedPageIdx(globalIdx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDropPage(globalIdx)}
                        onPreview={() => onPreview('split', globalIdx)}
                      />
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {splitMode === 'fixed' && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: Math.ceil(pages.length / Math.max(1, fixedSize)) }).map((_, blockIdx) => {
            const startIdx = blockIdx * fixedSize;
            const blockPages = pages.slice(startIdx, startIdx + fixedSize);

            return (
              <Card key={blockIdx} className="p-4 border border-border bg-card flex flex-col gap-3 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <Badge variant="secondary" className="font-extrabold text-xs px-3 py-1 rounded-full">
                    Archivo {blockIdx + 1}: Páginas {startIdx + 1} a {startIdx + blockPages.length}
                  </Badge>
                </div>

                <div className={splitViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center pt-1' : 'flex flex-col gap-2 pt-1'}>
                  {blockPages.map((page) => {
                    const globalIdx = pages.findIndex((p) => p.id === page.id);
                    return (
                      <PageCard
                        key={page.id}
                        page={{ ...page, excluded: false }}
                        index={globalIdx}
                        totalCount={pages.length}
                        viewMode={splitViewMode}
                        onMove={(i, dir) => onMovePageItem(i, dir)}
                        onDragStart={() => setDraggedPageIdx(globalIdx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDropPage(globalIdx)}
                        onPreview={() => onPreview('split', globalIdx)}
                      />
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </ToolCanvasLayout>
  );
};


