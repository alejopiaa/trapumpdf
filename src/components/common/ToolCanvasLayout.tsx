import React, { useState } from 'react';
import { LayoutGrid, List, Trash2, ArrowRight, AlertTriangle, X, ArrowDownAZ, ArrowUpAZ, ArrowLeftRight, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface ToolCanvasLayoutProps {
  /** Texto del badge superior (ej: "1 archivo", "3 archivos (12 págs)") */
  badgeText: string;
  /** Handler para botón "+ Añadir archivos" */
  onAddFilesClick?: () => void;
  /** Etiqueta personalizada del botón añadir (opcional) */
  addFilesLabel?: string;
  /** Modo de vista activo ('grid' | 'list') */
  viewMode?: 'grid' | 'list';
  /** Callback al cambiar de modo de vista */
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  /** Callback para limpiar o quitar archivo */
  onClearAll?: () => void;
  /** Etiqueta del botón de limpiar (ej: "Limpiar todo" o "Quitar archivo") */
  clearAllLabel?: string;
  /** Subtítulo explicativo en la barra flotante inferior */
  actionSubtitle: string;
  /** Texto del botón principal de procesamiento (ej: "Procesar archivos") */
  processButtonLabel: string;
  /** Callback al presionar el botón de procesamiento */
  onProcess: () => void;
  /** Deshabilitar el botón de procesamiento */
  isProcessDisabled: boolean;
  /** Ícono personalizado para el botón de proceso (por defecto ArrowRight) */
  processIcon?: React.ReactNode;
  /** Botones extra en la cabecera izquierda (ej: Seleccionar todo en SplitView) */
  extraHeaderButtons?: React.ReactNode;
  /** Lista de archivos omitidos por error/contraseña (opcional) */
  omittedFiles?: Array<{ name: string; reason: string }>;
  /** Componente de controles lateral (Sidebar flotante a la derecha en DIVIDIR y COMPRIMIR) */
  sidebar?: React.ReactNode;
  /** Controles de ordenamiento opcionales (A-Z, Z-A, Invertir, Restaurar) */
  onSortAZ?: () => void;
  onSortZA?: () => void;
  onInvertOrder?: () => void;
  onResetOrder?: () => void;
  /** Handler para quitar páginas en blanco */
  onRemoveBlankPages?: () => void;
  /** Indica si hay páginas en blanco detectadas */
  hasBlankPages?: boolean;
  /** Contenido interno del canvas (lista o cuadrícula de miniaturas) */
  children: React.ReactNode;
}

export const ToolCanvasLayout: React.FC<ToolCanvasLayoutProps> = ({
  badgeText,
  onAddFilesClick,
  addFilesLabel = '+ Añadir archivos',
  viewMode = 'grid',
  onViewModeChange,
  onClearAll,
  clearAllLabel = 'Limpiar todo',
  actionSubtitle,
  processButtonLabel,
  onProcess,
  isProcessDisabled,
  processIcon = <ArrowRight className="w-4 h-4" />,
  extraHeaderButtons,
  omittedFiles = [],
  sidebar,
  onSortAZ,
  onSortZA,
  onInvertOrder,
  onResetOrder,
  onRemoveBlankPages,
  hasBlankPages = false,
  children,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Auto-switch to list view on narrow windows (< 640px) for optimal readability
  const [isNarrowWindow, setIsNarrowWindow] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );

  React.useEffect(() => {
    const handleResize = () => {
      const narrow = window.innerWidth < 640;
      setIsNarrowWindow(narrow);
      if (narrow && viewMode !== 'list' && onViewModeChange) {
        onViewModeChange('list');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, onViewModeChange]);

  // Trigger 5-second auto-dismissing toast when omittedFiles arrives
  React.useEffect(() => {
    if (omittedFiles && omittedFiles.length > 0) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [omittedFiles]);

  return (
    /* Contenedor Principal: Ancho máximo uniforme max-w-6xl para evitar saltos o desplazamientos de layout */
    <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-6 pb-6 sm:pb-8">
      
      {/* ── Fila 1: Cabecera Superior del Canvas (Top Toolbar) ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 py-1">
        {/* Izquierda: Badge de información y botón Añadir */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant="secondary"
            className="font-extrabold text-xs px-3.5 py-1.5 rounded-full shrink-0 min-w-[100px] text-center inline-flex items-center justify-center"
          >
            {badgeText}
          </Badge>

          {/* Pastilla no bloqueante de archivos omitidos con clic/hover */}
          {omittedFiles && omittedFiles.length > 0 && (
            <div className="relative inline-block">
              <Badge
                onClick={() => setShowPopover(!showPopover)}
                className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-amber-500/25 transition-all flex items-center gap-1.5 shadow-xs select-none"
              >
                <span>⚠️ {omittedFiles.length} {omittedFiles.length === 1 ? 'omitido' : 'omitidos'}</span>
              </Badge>

              {/* Popover desplegable bajo demanda */}
              {showPopover && (
                <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-popover border border-border p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 animate-in fade-in-0 duration-150">
                  <div className="font-extrabold text-foreground border-b border-border/60 pb-2 flex items-center justify-between">
                    <span>Archivos omitidos ({omittedFiles.length})</span>
                    <button
                      onClick={() => setShowPopover(false)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {omittedFiles.map((file, i) => (
                      <div key={i} className="flex flex-col text-[11px] bg-muted/40 p-2 rounded-xl border border-border/40 gap-0.5">
                        <span className="font-bold truncate text-foreground" title={file.name}>
                          📄 {file.name}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                          {file.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {onAddFilesClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddFilesClick}
              className="rounded-xl text-xs font-bold"
            >
              {addFilesLabel}
            </Button>
          )}

          {/* Grupo de Botones de Ordenamiento */}
          {(onSortAZ || onSortZA || onInvertOrder || onResetOrder) && (
            <div className="flex items-center gap-1 border border-border/80 rounded-xl p-1 bg-muted/60">
              {onSortAZ && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSortAZ}
                  className="h-7 px-2.5 text-xs font-black rounded-lg hover:bg-background text-foreground tracking-wide"
                  title="Ordenar de A a Z"
                >
                  A → Z
                </Button>
              )}
              {onSortZA && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSortZA}
                  className="h-7 px-2.5 text-xs font-black rounded-lg hover:bg-background text-foreground tracking-wide"
                  title="Ordenar de Z a A"
                >
                  Z → A
                </Button>
              )}
              {onInvertOrder && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onInvertOrder}
                  className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg hover:bg-background text-foreground"
                  title="Invertir secuencia de páginas (N → 1)"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Invertir
                </Button>
              )}
              {onResetOrder && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onResetOrder}
                  className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg hover:bg-background text-muted-foreground"
                  title="Restaurar orden inicial"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                </Button>
              )}
            </div>
          )}

          {/* Botón Detección y Quitado de Páginas en Blanco */}
          {onRemoveBlankPages && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemoveBlankPages}
              className={`rounded-xl text-xs font-bold gap-1.5 transition-colors ${
                hasBlankPages
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'text-muted-foreground'
              }`}
              title="Detectar y excluir páginas en blanco automáticamente"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quitar en blanco
            </Button>
          )}

          {extraHeaderButtons}
        </div>

        {/* Derecha: Selector de Cuadrícula/Lista y Botón Limpiar */}
        <div className="flex items-center gap-2">
          {onViewModeChange && (
            <div className="flex items-center border border-border rounded-xl p-1 bg-muted">
              {!isNarrowWindow && (
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="h-7 px-2 rounded-lg"
                  title="Vista de Cuadrícula"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="h-7 px-2 rounded-lg"
                title={isNarrowWindow ? 'Vista de Lista (Activa para ventana estrecha)' : 'Vista de Lista'}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-destructive hover:bg-destructive/10 rounded-xl text-xs font-bold"
            >
              <Trash2 className="w-4 h-4 mr-1" /> {clearAllLabel}
            </Button>
          )}
        </div>
      </div>

      {/* ── Fila 2: Cuerpo Principal (Caja de Scroll del Canvas + Sidebar al lado horizontalmente) ── */}
      {sidebar ? (
        <div className="relative w-full flex flex-row items-start gap-6">
          {/* Canvas Scrollbox */}
          <div className="flex-1 min-w-0 max-h-[60vh] overflow-y-auto p-4 border border-border/60 rounded-2xl bg-muted/10 shadow-xs">
            {children}
          </div>

          {/* Sidebar Flotante (Lado a lado en el mismo flujo del layout) */}
          <div className="w-80 shrink-0">
            {sidebar}
          </div>
        </div>
      ) : (
        <div className="relative w-full flex flex-col gap-6">
          {/* Canvas Scrollbox sin Sidebar */}
          <div className="w-full max-h-[60vh] overflow-y-auto p-4 border border-border/60 rounded-2xl bg-muted/10 shadow-xs">
            {children}
          </div>
        </div>
      )}

      {/* ── Barra Flotante Inferior de Acción ── */}
      <div className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-6 z-50 mx-auto max-w-6xl bg-card/95 backdrop-blur-md border-2 border-primary/20 p-3 sm:p-3.5 px-4 sm:px-6 rounded-2xl shadow-2xl flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Badge
            variant="default"
            className="bg-primary text-primary-foreground font-extrabold text-xs px-3.5 py-1.5 rounded-full shrink-0 min-w-[100px] text-center inline-flex items-center justify-center shadow-xs"
          >
            {badgeText}
          </Badge>
          <span className="text-xs text-muted-foreground font-semibold hidden sm:inline">
            {actionSubtitle}
          </span>
        </div>
        <Button
          onClick={onProcess}
          disabled={isProcessDisabled}
          className="h-11 px-7 rounded-xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all gap-2"
        >
          {processButtonLabel} {processIcon}
        </Button>
      </div>

      {/* ── Modal de Confirmación para Limpiar Todo ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-extrabold text-foreground">
                  ¿Limpiar todos los archivos?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Esta acción quitará todos los documentos cargados de esta herramienta. Tendrás que volver a seleccionarlos si deseas procesarlos.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl font-bold text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearAll && onClearAll();
                }}
                className="rounded-xl font-bold text-xs gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" /> Sí, limpiar todo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Flotante Auto-desaparecible a los 5 segundos ── */}
      {showToast && omittedFiles && omittedFiles.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-card/95 backdrop-blur-md border border-amber-500/40 text-foreground p-3.5 px-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-amber-500 text-sm shrink-0">⚠️</span>
            <span>Se {omittedFiles.length === 1 ? 'omitió 1 archivo' : `omitieron ${omittedFiles.length} archivos`}.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowPopover(true);
              setShowToast(false);
            }}
            className="text-xs font-extrabold text-amber-600 dark:text-amber-400 underline hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            Ver detalle
          </button>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
