import React, { useState } from 'react';
import { Layers, Scissors, Grid3X3, Plus, Trash2, Info, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface SplitControlsSidebarProps {
  mode: 'individual' | 'custom' | 'fixed';
  onModeChange: (mode: string) => void;
  ranges: Array<{ start: number; end: number }>;
  onAddRange: (range: { start: number; end: number }) => void;
  onRemoveRange: (idx: number) => void;
  onUpdateRange?: (idx: number, range: { start: number; end: number }) => void;
  fixedSize: number;
  onFixedSizeChange: (val: string) => void;
  totalPages: number;
  selectedCount: number;
}

const SplitControlsSidebar: React.FC<SplitControlsSidebarProps> = ({
  mode,
  onModeChange,
  ranges,
  onAddRange,
  onRemoveRange,
  onUpdateRange,
  fixedSize,
  onFixedSizeChange,
  totalPages,
  selectedCount,
}) => {
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');

  const isRangeMode = mode === 'custom' || mode === 'fixed';
  const lastEnd = ranges.length > 0 ? ranges[ranges.length - 1].end : 0;
  const defaultStartHint = lastEnd > 0 && lastEnd < totalPages ? lastEnd + 1 : 1;
  const defaultEndHint = totalPages > 0 ? totalPages : '';

  const handleAddRange = () => {
    let start = parseInt(startPage, 10);
    let end = parseInt(endPage, 10);

    if (isNaN(start)) start = defaultStartHint;
    if (isNaN(end)) end = totalPages > 0 ? totalPages : start;

    if (start < 1) start = 1;
    if (totalPages > 0 && start > totalPages) start = totalPages;
    if (totalPages > 0 && end > totalPages) end = totalPages;
    if (end < start) end = start;

    onAddRange({ start, end });
    setStartPage('');
    setEndPage('');
  };

  const handleRangeInputChange = (idx: number, field: 'start' | 'end', val: string) => {
    if (!onUpdateRange) return;
    const num = parseInt(val, 10);
    const curr = ranges[idx];
    if (!curr) return;

    if (isNaN(num)) {
      onUpdateRange(idx, { ...curr, [field]: 0 });
      return;
    }

    let newStart = field === 'start' ? num : curr.start;
    let newEnd = field === 'end' ? num : curr.end;

    if (newStart < 1) newStart = 1;
    if (totalPages > 0 && newStart > totalPages) newStart = totalPages;

    if (field === 'start' && newEnd > 0 && newStart > newEnd) {
      newEnd = newStart;
    }

    if (field === 'end') {
      if (newStart > 0 && newEnd < newStart) {
        newEnd = newStart;
      }
      if (totalPages > 0 && newEnd > totalPages) {
        newEnd = totalPages;
      }
    }

    onUpdateRange(idx, { start: newStart, end: newEnd });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddRange();
  };

  const generatedPdfsFixed =
    totalPages > 0 && fixedSize > 0 ? Math.ceil(totalPages / fixedSize) : 0;

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary" />
          Rangos de División
        </h3>
      </div>

      {/* ── Top Header Tabs (Clean 2-Tab Layout: Por Rango vs Extraer Págs) ── */}
      <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-xl border border-border">
        {/* Tab 1: Por Rango */}
        <Button
          type="button"
          variant={isRangeMode ? 'default' : 'ghost'}
          onClick={() => onModeChange(mode === 'fixed' ? 'fixed' : 'custom')}
          className="flex-col h-auto py-2.5 px-1 relative gap-1 text-xs font-semibold"
        >
          {isRangeMode && (
            <CheckCircle2 className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-emerald-400" />
          )}
          <Scissors className="w-5 h-5" />
          <span>Por Rango</span>
        </Button>

        {/* Tab 2: Extraer Páginas */}
        <Button
          type="button"
          variant={mode === 'individual' ? 'default' : 'ghost'}
          onClick={() => onModeChange('individual')}
          className="flex-col h-auto py-2.5 px-1 relative gap-1 text-xs font-semibold"
        >
          {mode === 'individual' && (
            <CheckCircle2 className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-emerald-400" />
          )}
          <Layers className="w-5 h-5" />
          <span>Extraer Págs</span>
        </Button>
      </div>

      {/* ── Sub-modo Selector Pills ── */}
      {isRangeMode && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Modo de rango:</span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === 'custom' ? 'default' : 'outline'}
              onClick={() => onModeChange('custom')}
              className={`h-9 text-xs font-semibold ${mode === 'custom' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Personalizado
            </Button>
            <Button
              type="button"
              variant={mode === 'fixed' ? 'default' : 'outline'}
              onClick={() => onModeChange('fixed')}
              className={`h-9 text-xs font-semibold ${mode === 'fixed' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Fijo
            </Button>
          </div>
        </div>
      )}

      {/* ── MODO PERSONALIZADO ── */}
      {mode === 'custom' && (
        <div className="flex flex-col gap-3">
          {ranges.map((r, idx) => (
            <Card key={idx} className="p-3 flex flex-col gap-2 shadow-xs border border-border">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="font-bold">
                  Rango {idx + 1}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRange(idx)}
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  title="Eliminar rango"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>de la página</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages || 999}
                  placeholder=""
                  value={r.start === 0 ? '' : r.start}
                  onChange={(e) => handleRangeInputChange(idx, 'start', e.target.value)}
                  className="w-14 h-7 text-center font-bold bg-background text-xs px-1"
                />
                <span>a</span>
                <Input
                  type="number"
                  min={r.start > 0 ? r.start : 1}
                  max={totalPages || 999}
                  placeholder=""
                  value={r.end === 0 ? '' : r.end}
                  onChange={(e) => handleRangeInputChange(idx, 'end', e.target.value)}
                  className="w-14 h-7 text-center font-bold bg-background text-xs px-1"
                />
                <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                  ({r.start > 0 && r.end >= r.start ? r.end - r.start + 1 : 0} pág.)
                </span>
              </div>
            </Card>
          ))}

          {/* Botón único Añadir Rango */}
          <Button
            type="button"
            variant="outline"
            onClick={() => onAddRange({ start: 0, end: 0 })}
            className="w-full h-10 text-xs font-bold gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Añadir Rango
          </Button>
        </div>
      )}

      {/* ── MODO FIJO ── */}
      {mode === 'fixed' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Dividir en rangos de página de:
            </label>
            <Input
              type="number"
              min="1"
              max={totalPages || 999}
              value={fixedSize}
              onChange={(e) => onFixedSizeChange(e.target.value)}
              className="h-10 text-sm font-bold"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-sky-800 dark:text-sky-300 text-xs leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Este PDF se dividirá en archivos de <strong>{fixedSize}</strong> páginas. Se generarán <strong>{generatedPdfsFixed}</strong> PDFs.
            </span>
          </div>
        </div>
      )}

      {/* ── MODO EXTRAER PÁGINAS INDIVIDUALES ── */}
      {mode === 'individual' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-sky-800 dark:text-sky-300 text-xs leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Las páginas seleccionadas se convertirán en diferentes archivos PDF. Se crearán <strong>{selectedCount}</strong> PDFs.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SplitControlsSidebar;
