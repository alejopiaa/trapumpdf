import React, { useState } from 'react';
import { LayoutGrid, List, Trash2, ArrowRight, AlertTriangle, X, ArrowLeftRight, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

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
  /** Subtítulo explicativo en la barra lateral */
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
  /** Componente de controles lateral personalizado (DIVIDIR y COMPRIMIR) */
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
  /** Handler para restaurar todas las páginas excluidas y su estado */
  onRestoreAllPages?: () => void;
  /** Indica si hay páginas excluidas en este momento */
  hasExcludedPages?: boolean;
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
  onRestoreAllPages,
  hasExcludedPages = false,
  children,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Auto-switch to list view on narrow windows (< 640px)
  React.useEffect(() => {
    const handleResize = () => {
      const narrow = window.innerWidth < 640;
      if (narrow && viewMode !== 'list' && onViewModeChange) {
        onViewModeChange('list');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, onViewModeChange]);

  // Toast for omitted files
  React.useEffect(() => {
    if (omittedFiles && omittedFiles.length > 0) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [omittedFiles]);

  return (
    <div className="relative w-full flex flex-col gap-3 min-h-[calc(100vh-140px)]">
      
      {/* ── Top Slim Toolbar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        {/* Left Side: Badge & Add Files */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border border-primary/30 font-extrabold text-xs px-3 py-1 rounded-full shadow-xs"
          >
            {badgeText}
          </Badge>

          {onAddFilesClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddFilesClick}
              className="text-xs font-bold gap-1.5 rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
            >
              {addFilesLabel}
            </Button>
          )}

          {extraHeaderButtons}

          {/* Omitted Files Popover Trigger */}
          {omittedFiles && omittedFiles.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPopover(!showPopover)}
                className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{omittedFiles.length} {omittedFiles.length === 1 ? 'omitido' : 'omitidos'}</span>
              </Button>

              {showPopover && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-card border border-border/80 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Archivos No Procesados
                    </span>
                    <button
                      onClick={() => setShowPopover(false)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 max-h-48 overflow-y-auto">
                    {omittedFiles.map((file, idx) => (
                      <div key={idx} className="flex flex-col gap-0.5 text-xs bg-muted/40 p-2 rounded-xl">
                        <span className="font-semibold text-foreground truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-muted-foreground text-[11px]">{file.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: View Mode Switch & Clear All */}
        <div className="flex items-center gap-2">
          {onViewModeChange && (
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewModeChange('grid')}
                className="h-7 w-7 rounded-lg text-xs"
                title="Vista de cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => onViewModeChange('list')}
                className="h-7 w-7 rounded-lg text-xs"
                title="Vista de lista"
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
              className="text-destructive hover:bg-destructive/10 rounded-xl text-xs font-bold h-8 px-2.5"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> {clearAllLabel}
            </Button>
          )}
        </div>
      </div>

      {/* ── Main Workspace: 2-Column CSS Grid (minmax(0, 1fr) + 320px Sidebar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 w-full flex-1 items-start min-h-0">
        
        {/* Left Column: Expansive Canvas with dedicated scroll */}
        <div className="w-full h-full min-w-0 max-h-[calc(100vh-170px)] overflow-y-auto p-4 sm:p-5 border border-border/80 rounded-2xl bg-muted/10 shadow-xs">
          {children}
        </div>

        {/* Right Column: Unified Action Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {sidebar ? (
            /* Custom Sidebar for Split / Compress */
            <div className="flex flex-col gap-4">
              {sidebar}
              <Button
                onClick={onProcess}
                disabled={isProcessDisabled}
                className="w-full h-12 rounded-xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all gap-2"
              >
                {processButtonLabel} {processIcon}
              </Button>
            </div>
          ) : (
            /* Default Smart Sidebar for Edit / Merge */
            <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Acciones Rápidas
                </h3>
              </div>

              {/* Action Buttons Grid */}
              <div className="flex flex-col gap-2">
                {onInvertOrder && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onInvertOrder}
                    className="w-full justify-start text-xs font-bold rounded-xl gap-2 h-9"
                    title="Invertir el orden de las páginas"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
                    Invertir Orden
                  </Button>
                )}

                {onSortAZ && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSortAZ}
                    className="w-full justify-start text-xs font-bold rounded-xl gap-2 h-9"
                    title="Ordenar de la A a la Z"
                  >
                    <span className="text-xs font-black text-primary">A-Z</span>
                    Ordenar A → Z
                  </Button>
                )}

                {onSortZA && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSortZA}
                    className="w-full justify-start text-xs font-bold rounded-xl gap-2 h-9"
                    title="Ordenar de la Z a la A"
                  >
                    <span className="text-xs font-black text-primary">Z-A</span>
                    Ordenar Z → A
                  </Button>
                )}

                {onRemoveBlankPages && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onRemoveBlankPages}
                    disabled={!hasBlankPages}
                    className="w-full justify-start text-xs font-bold rounded-xl gap-2 h-9 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 disabled:opacity-50"
                    title={hasBlankPages ? 'Excluir páginas en blanco detectadas' : 'No se detectaron páginas en blanco'}
                  >
                    <span>⚠️</span>
                    Quitar en blanco
                  </Button>
                )}

                {onRestoreAllPages && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRestoreConfirm(true)}
                    disabled={!hasExcludedPages}
                    className="w-full justify-start text-xs font-bold rounded-xl gap-2 h-9 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 disabled:opacity-50"
                    title="Restaurar todas las páginas excluidas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar Páginas
                  </Button>
                )}

                {onResetOrder && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onResetOrder}
                    className="w-full justify-start text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground h-8"
                  >
                    Restablecer orden original
                  </Button>
                )}
              </div>

              {/* Subtitle / Tip Box */}
              <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground leading-relaxed">
                {actionSubtitle}
              </div>

              {/* Prominent CTA Process Button */}
              <Button
                onClick={onProcess}
                disabled={isProcessDisabled}
                className="w-full h-12 rounded-xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all gap-2 mt-2"
              >
                {processButtonLabel} {processIcon}
              </Button>
            </Card>
          )}
        </div>
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
                  Esta acción quitará todos los documentos cargados de esta herramienta.
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

      {/* ── Modal de Confirmación para Restaurar Páginas ── */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowRestoreConfirm(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-extrabold text-foreground">
                  ¿Restaurar todas las páginas?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Se volverán a incluir todas las páginas excluidas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRestoreConfirm(false)}
                className="rounded-xl font-bold text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setShowRestoreConfirm(false);
                  onRestoreAllPages && onRestoreAllPages();
                }}
                className="rounded-xl font-bold text-xs gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Sí, restaurar páginas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Flotante ── */}
      {showToast && omittedFiles && omittedFiles.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-card/95 backdrop-blur-md border border-amber-500/40 text-foreground p-3 px-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
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
            className="text-xs font-extrabold text-amber-600 dark:text-amber-400 underline hover:opacity-80 transition-opacity"
          >
            Detalle
          </button>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
