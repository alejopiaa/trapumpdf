import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, ArrowLeft, ArrowRight, Trash2, RotateCcw } from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: {
    fileName?: string;
    thumbnailUrl?: string;
    rotation?: number;
    id?: string;
    excluded?: boolean;
  } | null;
  pageIndex: number | null;
  totalItems: number;
  scale: number;
  onScaleChange: (scale: number | ((prev: number) => number)) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  activeTool?: 'home' | 'merge' | 'edit' | 'split' | 'compress';
  splitMode?: 'individual' | 'custom' | 'fixed';
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  showExclusionToggle?: boolean;
  isIncluded?: boolean;
  onToggleExclusion?: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  activeItem,
  pageIndex,
  totalItems,
  scale,
  onScaleChange,
  onNavigate,
  activeTool,
  splitMode,
  isSelected,
  onToggleSelection,
  showExclusionToggle,
  isIncluded,
  onToggleExclusion,
}) => {
  if (!isOpen || !activeItem) return null;

  const canToggle =
    showExclusionToggle ??
    (activeTool === 'split' && splitMode === 'individual' && Boolean(activeItem.id));

  const pageIncluded = isIncluded ?? (isSelected ?? true);

  const handleToggle = () => {
    if (onToggleExclusion) {
      onToggleExclusion();
    } else if (activeItem.id && onToggleSelection) {
      onToggleSelection(activeItem.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-4 flex flex-col gap-3 rounded-3xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-2 flex-wrap gap-2">
          <DialogTitle className="text-sm font-bold truncate text-foreground pr-4">
            {activeItem.fileName || 'Previsualización de Página'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {canToggle && (
              <Badge
                variant={pageIncluded ? 'default' : 'destructive'}
                className={pageIncluded ? 'bg-emerald-600 text-white font-bold' : 'font-bold'}
              >
                {pageIncluded ? '🟢 Página Incluida' : '🔴 Página Excluida'}
              </Badge>
            )}
            <Badge variant="secondary" className="shrink-0 gap-1.5 text-xs shadow-xs font-semibold">
              <ZoomIn className="w-3.5 h-3.5 text-primary" /> Haz clic para alternar Zoom
            </Badge>
          </div>
        </DialogHeader>

        {/* Clean Scrollable Document Verification Container */}
        <div
          className={`relative max-h-[65vh] h-[65vh] w-full bg-muted/30 rounded-2xl overflow-y-auto overflow-x-hidden flex ${
            scale > 1.0 ? 'items-start justify-center p-4 cursor-zoom-out' : 'items-center justify-center p-3 cursor-zoom-in'
          } border select-none transition-all`}
          onClick={() => onScaleChange((prev) => (prev === 1.0 ? 1.3 : 1.0))}
        >
          {activeItem.thumbnailUrl && (
            <img
              src={activeItem.thumbnailUrl}
              alt="Vista previa"
              className="shadow-md rounded-xl transition-all duration-200"
              style={{
                width: scale > 1.0 ? '100%' : 'auto',
                maxWidth: '100%',
                maxHeight: scale === 1.0 ? '100%' : 'none',
                objectFit: 'contain',
                transform: `rotate(${activeItem.rotation || 0}deg)`,
              }}
            />
          )}
        </div>

        <DialogFooter className="flex items-center justify-between w-full flex-wrap gap-2 pt-1">
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex === 0}
              onClick={() => onNavigate('prev')}
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <span className="text-xs font-bold text-muted-foreground">
              Página {(pageIndex || 0) + 1} de {totalItems}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex === null || pageIndex >= totalItems - 1}
              onClick={() => onNavigate('next')}
              className="rounded-xl"
            >
              Siguiente <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Direct Page Inclusion / Exclusion Toggle Button */}
          {canToggle && (
            <Button
              type="button"
              variant={pageIncluded ? 'destructive' : 'default'}
              size="sm"
              onClick={handleToggle}
              className={`rounded-xl font-bold text-xs gap-1.5 shadow-sm ${
                !pageIncluded ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
              }`}
            >
              {pageIncluded ? (
                <>
                  <Trash2 className="w-4 h-4" /> Excluir esta página
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" /> Incluir esta página
                </>
              )}
            </Button>
          )}

          {/* Document Verification Zoom Level Toolbar */}
          <div className="flex items-center gap-1.5 border border-border rounded-xl p-1 bg-muted">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={scale <= 1.0}
              onClick={(e) => { e.stopPropagation(); onScaleChange(1.0); }}
              className="h-7 w-7 rounded-lg"
              title="Zoom 100% (Verificación completa)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-mono font-bold w-12 text-center text-foreground select-none">
              {Math.round(scale * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={scale >= 1.3}
              onClick={(e) => { e.stopPropagation(); onScaleChange(1.3); }}
              className="h-7 w-7 rounded-lg"
              title="Zoom 130% (Verificación de título)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onScaleChange(1.0); }}
              className="h-7 text-xs font-bold px-2 rounded-lg"
              title="Restablecer a 100%"
            >
              Restablecer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
