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
  onAddFilesClick: () => void;
  onRotatePage: (groupId: string, pageId: string) => void;
  onToggleExcluded: (groupId: string, pageId: string) => void;
  onMovePage?: (groupId: string, pageIdx: number, direction: 'left' | 'right') => void;
  onDropPage?: (groupId: string, sourceIdx: number, targetIdx: number) => void;
  onRemoveGroup: (groupId: string) => void;
  onClearAll: () => void;
  onProcess: () => void;
  isLoading: boolean;
  onPreview: (tool: 'edit', groupIdx: string, pageIdx: number) => void;
  omittedFiles?: OmittedFileItem[];
  onInvertOrder?: () => void;
  onResetOrder?: () => void;
  onRemoveBlankPages?: () => void;
}

export const EditView: React.FC<EditViewProps> = ({
  editGroups,
  editViewMode,
  setEditViewMode,
  onFilesSelected,
  onAddFilesClick,
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
}) => {
  const [draggedItem, setDraggedItem] = React.useState<{ groupId: string; index: number } | null>(null);

  if (editGroups.length === 0) {
    return <DropZone onFilesSelected={onFilesSelected} omittedFiles={omittedFiles} multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*" isLoading={isLoading} />;
  }

  const totalPages = editGroups.reduce((acc, g) => acc + g.pages.length, 0);
  const badgeText = `${editGroups.length} ${editGroups.length === 1 ? 'archivo' : 'archivos'} (${totalPages} págs)`;
  const hasBlankPages = editGroups.some((g) => g.pages.some((p) => p.isBlank && !p.excluded));

  return (
    <ToolCanvasLayout
      badgeText={badgeText}
      onAddFilesClick={onAddFilesClick}
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
    >
      <div className="flex flex-col gap-6">
        {editGroups.map((group) => (
          <Card key={group.id} className="p-4 border border-border bg-card flex flex-col gap-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
              <span className="font-extrabold text-sm text-foreground truncate max-w-md">
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
              className={editViewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center p-2 min-h-[120px]' : 'flex flex-col gap-2 p-2 min-h-[120px]'}
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
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDraggedItem(null);
                    try {
                      const raw = e.dataTransfer.getData('text/plain');
                      if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed.groupId === group.id && typeof parsed.index === 'number' && onDropPage) {
                          onDropPage(group.id, parsed.index, pIdx);
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

