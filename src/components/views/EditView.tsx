import React from 'react';
import type { EditFileGroup, OmittedFileItem } from '../../services/pdfService';
import { DropZone } from '../DropZone';
import { PageCard } from '../PageCard';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { ToolCanvasLayout } from '../common/ToolCanvasLayout';

interface EditViewProps {
  editGroups: EditFileGroup[];
  editViewMode: 'grid' | 'list';
  setEditViewMode: (mode: 'grid' | 'list') => void;
  onFilesSelected: (files: File[]) => void;
  onRotatePage: (groupId: string, pageId: string) => void;
  onToggleExcluded: (groupId: string, pageId: string) => void;
  onMovePage?: (groupId: string, pageIdx: number, direction: 'left' | 'right') => void;
  onDropPage?: (groupId: string, sourceIdx: number, targetIdx: number, position?: 'before' | 'after') => void;
  onRemoveGroup: (groupId: string) => void;
  onClearAll: () => void;
  onProcess: () => void;
  isLoading: boolean;
  onPreview: (tool: 'edit', groupIdx: string, pageIdx: number) => void;
  omittedFiles?: OmittedFileItem[];
  onInvertOrder?: () => void;
  onResetOrder?: () => void;
  onRemoveBlankPages?: () => void;
  onRestoreAllPages?: () => void;
}

export const EditView: React.FC<EditViewProps> = ({
  editGroups,
  editViewMode,
  setEditViewMode,
  onFilesSelected,
  onRotatePage,
  onToggleExcluded,
  onMovePage,
  onDropPage,
  onRemoveGroup,
  onClearAll,
  onProcess,
  isLoading,
  onPreview,
  omittedFiles = [],
  onInvertOrder,
  onResetOrder,
  onRemoveBlankPages,
  onRestoreAllPages,
}) => {
  const [draggedItem, setDraggedItem] = React.useState<{ groupId: string; index: number } | null>(null);

  if (editGroups.length === 0) {
    return <DropZone onFilesSelected={onFilesSelected} omittedFiles={omittedFiles} multiple={false} accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*" isLoading={isLoading} />;
  }

  const totalPages = editGroups.reduce((acc, g) => acc + g.pages.length, 0);
  const badgeText = `${totalPages} ${totalPages === 1 ? 'página' : 'páginas'}`;
  const hasBlankPages = editGroups.some((g) => g.pages.some((p) => p.isBlank && !p.excluded));
  const hasExcludedPages = editGroups.some((g) => g.pages.some((p) => p.excluded));

  return (
    <ToolCanvasLayout
      badgeText={badgeText}
      onAddFilesClick={undefined}
      viewMode={editViewMode}
      onViewModeChange={setEditViewMode}
      onClearAll={onClearAll}
      actionSubtitle="Reordena o excluye páginas para exportar."
      processButtonLabel="Procesar archivos"
      onProcess={onProcess}
      isProcessDisabled={isLoading || editGroups.length === 0}
      omittedFiles={omittedFiles}
      onInvertOrder={onInvertOrder}
      onResetOrder={onResetOrder}
      onRemoveBlankPages={onRemoveBlankPages}
      hasBlankPages={hasBlankPages}
      onRestoreAllPages={onRestoreAllPages}
      hasExcludedPages={hasExcludedPages}
    >
      <div className="flex flex-col gap-5">
        {editGroups.map((group) => (
          <Card key={group.id} className="p-3 sm:p-4 border border-border/80 bg-card/60 flex flex-col gap-3 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5 flex-wrap gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-foreground truncate max-w-md">
                📄 {group.fileName} ({group.pages.length} páginas)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveGroup(group.id)}
                className="h-7 text-xs text-destructive hover:bg-destructive/10 font-bold"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Quitar archivo
              </Button>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setDraggedItem(null);
                try {
                  const raw = e.dataTransfer.getData('text/plain');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed.groupId === group.id && typeof parsed.index === 'number' && onDropPage) {
                      onDropPage(group.id, parsed.index, group.pages.length - 1);
                    }
                  }
                } catch (err) {
                  console.error('Error on container drop:', err);
                }
              }}
              className={editViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 justify-items-center p-1 min-h-[100px]' : 'flex flex-col gap-2 p-1 min-h-[100px]'}
            >
              {group.pages.map((page, pIdx) => (
                <PageCard
                  key={page.id}
                  page={page}
                  index={pIdx}
                  totalCount={group.pages.length}
                  viewMode={editViewMode}
                  isDragging={draggedItem?.groupId === group.id && draggedItem?.index === pIdx}
                  onRotate={() => onRotatePage(group.id, page.id)}
                  onDelete={() => onToggleExcluded(group.id, page.id)}
                  onRestore={() => onToggleExcluded(group.id, page.id)}
                  onMove={(i, dir) => onMovePage && onMovePage(group.id, i, dir)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId: group.id, index: pIdx }));
                    setDraggedItem({ groupId: group.id, index: pIdx });
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e, _targetIdx, position) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDraggedItem(null);
                    try {
                      const raw = e.dataTransfer.getData('text/plain');
                      if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed.groupId === group.id && typeof parsed.index === 'number' && onDropPage) {
                          onDropPage(group.id, parsed.index, pIdx, position);
                        }
                      }
                    } catch (err) {
                      console.error('Error on drop:', err);
                    }
                  }}
                  onPreview={() => onPreview('edit', group.id, pIdx)}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </ToolCanvasLayout>
  );
};

