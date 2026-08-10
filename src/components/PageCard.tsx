import React, { useState } from 'react';
import type { PageItem } from '../services/pdfService';
import { RotateCw, Trash2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, GripVertical, RotateCcw, ZoomIn } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface PageCardProps {
  page: PageItem;
  index: number;
  totalCount: number;
  viewMode?: 'grid' | 'list';
  badgePrefix?: string;
  onRotate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMove: (index: number, direction: 'left' | 'right') => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging?: boolean;
  onRestore?: (id: string) => void;
  onPreview?: (page: PageItem) => void;
}

const PageCardComponent: React.FC<PageCardProps> = ({
  page,
  index,
  totalCount,
  viewMode = 'grid',
  badgePrefix = 'Pág.',
  onRotate,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  onRestore,
  onPreview,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExcluded = page.excluded;

  if (viewMode === 'list') {
    return (
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className={`flex items-center gap-3 p-3 transition-all cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-40 scale-98 border-dashed border-primary' : ''
        } ${isExcluded ? 'opacity-50 bg-destructive/5 border-destructive/30' : 'hover:border-primary/50'}`}
      >
        <div className="text-muted-foreground hover:text-foreground p-1" title="Arrastra para reordenar">
          <GripVertical className="w-4 h-4" />
        </div>

        <Badge
          className={
            isExcluded
              ? 'bg-destructive text-destructive-foreground font-bold shrink-0'
              : 'bg-primary text-primary-foreground font-extrabold shrink-0 shadow-sm border border-background/20'
          }
        >
          {badgePrefix} {index + 1}
        </Badge>

        <div
          className="w-12 h-14 bg-muted rounded-md overflow-hidden shrink-0 cursor-pointer border hover:ring-2 hover:ring-primary/50 transition-all flex items-center justify-center relative"
          onClick={(e) => { e.stopPropagation(); onPreview && onPreview(page); }}
          title="Haz clic para ver en grande"
        >
          <img
            src={page.thumbnailUrl}
            alt={`${badgePrefix} ${index + 1}`}
            draggable={false}
            className="w-full h-full object-contain transition-transform duration-200 pointer-events-none select-none"
            style={{ transform: `rotate(${page.rotation}deg)` }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-foreground truncate" title={page.fileName}>
              {page.fileName}
            </p>
            {page.isBlank && !isExcluded && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                ⚠️ En blanco
              </span>
            )}
          </div>
          {isExcluded && (
            <span className="text-[11px] font-bold text-destructive">Página Excluida</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 border-r pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === 0}
              onClick={(e) => { e.stopPropagation(); onMove(index, 'left'); }}
              className="h-7 w-7 text-muted-foreground"
              title="Mover arriba"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === totalCount - 1}
              onClick={(e) => { e.stopPropagation(); onMove(index, 'right'); }}
              className="h-7 w-7 text-muted-foreground"
              title="Mover abajo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          </div>

          {onRotate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
              className="h-7 text-xs gap-1 font-semibold"
              title="Rotar esta página 90°"
            >
              <RotateCw className="w-3 h-3" /> Rotar
            </Button>
          )}

          {isExcluded ? (
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRestore && onRestore(page.id); }}
              className="h-7 text-xs gap-1 font-semibold"
              title="Restaurar página"
            >
              <RotateCcw className="w-3 h-3" /> Restaurar
            </Button>
          ) : onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              title="Quitar página"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden flex flex-col w-full max-w-[200px] mx-auto rounded-2xl border border-border/80 bg-card shadow-xs hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 scale-95 border-dashed border-primary' : ''
      } ${isExcluded ? 'opacity-60 bg-destructive/5 border-destructive/30' : 'hover:border-primary/50'}`}
    >
      {/* Thumbnail Area */}
      <div
        className="relative aspect-[3/4] w-full bg-muted/30 flex items-center justify-center p-2 cursor-pointer overflow-hidden group"
        onClick={() => onPreview && onPreview(page)}
        title="Haz clic para ver en grande (Lightbox)"
      >
        <img
          src={page.thumbnailUrl}
          alt={`${badgePrefix} ${index + 1}`}
          draggable={false}
          className="max-h-full max-w-full object-contain shadow-xs transition-transform duration-200 pointer-events-none select-none"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        />

        {/* Position Badge */}
        <Badge
          className={
            isExcluded
              ? 'absolute top-2 left-2 font-bold shadow-xs border border-background bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-lg z-20 max-w-[80%] truncate'
              : 'absolute top-2 left-2 font-extrabold shadow-xs border border-background bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-lg z-20 max-w-[80%] truncate'
          }
        >
          {badgePrefix} {index + 1}
        </Badge>

        {/* Blank Page Badge */}
        {page.isBlank && !isExcluded && (
          <span className="absolute top-2 right-2 font-bold shadow-xs border bg-amber-500/90 text-white border-amber-400 text-[9px] px-1.5 py-0.5 rounded-md z-20">
            ⚠️ Blanco
          </span>
        )}

        {/* Soft deletion overlay */}
        {isExcluded && (
          <div className="absolute inset-0 bg-destructive/80 text-destructive-foreground backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center gap-2 z-30 animate-in fade-in-0">
            <span className="text-xs font-bold">Página Excluida</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRestore && onRestore(page.id); }}
              className="h-7 text-xs font-bold gap-1 shadow-sm"
            >
              <RotateCcw className="w-3 h-3" /> Restaurar
            </Button>
          </div>
        )}

        {/* Clean Hover Overlay Actions */}
        {isHovered && !isExcluded && !isDragging && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center gap-2 z-20 animate-in fade-in-0">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform"
              onClick={(e) => { e.stopPropagation(); onPreview && onPreview(page); }}
              title="Ver en grande"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform"
                onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
                title="Quitar página"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="px-3 py-1.5 border-t bg-card">
        <p className="text-[11px] font-semibold text-muted-foreground truncate text-center" title={page.fileName}>
          {page.fileName}
        </p>
      </div>

      {/* Actions Bar */}
      <div className="p-1.5 border-t bg-muted/20 flex items-center justify-between gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); onMove(index, 'left'); }}
          className="h-7 w-7 text-muted-foreground"
          title="Mover hacia la izquierda"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>

        {onRotate ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRotate(page.id); }}
            className="h-7 px-2 text-[11px] font-semibold gap-1"
            title="Rotar esta página 90°"
          >
            <RotateCw className="w-3 h-3" /> Rotar
          </Button>
        ) : (
          <span className="text-[10px] text-muted-foreground font-medium px-2">
            #{index + 1}
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index === totalCount - 1}
          onClick={(e) => { e.stopPropagation(); onMove(index, 'right'); }}
          className="h-7 w-7 text-muted-foreground"
          title="Mover hacia la derecha"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
};

export const PageCard = React.memo(PageCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.page.id === nextProps.page.id &&
    prevProps.page.rotation === nextProps.page.rotation &&
    prevProps.page.excluded === nextProps.page.excluded &&
    prevProps.index === nextProps.index &&
    prevProps.totalCount === nextProps.totalCount &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isDragging === nextProps.isDragging
  );
});
