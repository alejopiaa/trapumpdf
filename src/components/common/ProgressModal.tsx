import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { X, FileText, Loader2 } from 'lucide-react';

const MonogramTIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8.5C20 9.32843 19.3284 10 18.5 10H14.5V18C14.5 19.1046 13.6046 20 12.5 20H11.5C10.3954 20 9.5 19.1046 9.5 18V10H5.5C4.67157 10 4 9.32843 4 8.5V6Z"
      fill="currentColor"
    />
  </svg>
);

interface ProgressModalProps {
  isOpen: boolean;
  progressPercent: number;
  progressText: string;
  onCancel: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  progressPercent,
  progressText,
  onCancel,
}) => {
  const percent = Math.min(100, Math.max(0, Math.round(progressPercent)));

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="w-[420px] max-w-[92vw] sm:w-[420px] p-0 overflow-hidden border border-border/80 rounded-3xl bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-200"
      >
        {/* Glow de fondo superior */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent pointer-events-none" />

        <div className="relative p-7 flex flex-col items-center text-center gap-5">
          {/* Animación central con Isotipo T y Anillos orbitales */}
          <div className="relative my-2 flex items-center justify-center">
            {/* Anillo de pulso exterior */}
            <div className="absolute w-20 h-20 rounded-2xl bg-primary/20 animate-ping opacity-30" />
            
            {/* Anillo de rotación orbital */}
            <div className="absolute w-20 h-20 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin duration-1000" />
            
            {/* Contenedor central con isotipo MonogramT */}
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 relative z-10">
              <MonogramTIcon className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Títulos y Subtítulos con altura y ancho estrictamente fijos (0% salto visual) */}
          <div className="flex flex-col gap-1.5 w-full items-center">
            <h3 className="text-xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
              Procesando Documentos
            </h3>
            <div className="h-10 w-full flex items-center justify-center gap-1.5 px-3 text-xs text-muted-foreground font-semibold">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
              <span
                className="truncate max-w-[320px] inline-block"
                title={progressText || 'Optimizando y organizando archivos en RAM local...'}
              >
                {progressText || 'Optimizando y organizando archivos en RAM local...'}
              </span>
            </div>
          </div>

          {/* Barra de Progreso Neomórfica con Shimmer & Porcentaje Flotante */}
          <div className="w-full flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
              <span className="text-[11px] tracking-wider font-mono text-muted-foreground/80 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-primary" /> PROCESANDO
              </span>
              <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                {percent}%
              </span>
            </div>

            {/* Contenedor de la barra de progreso */}
            <div className="relative w-full h-3.5 bg-muted/60 rounded-full overflow-hidden p-0.5 border border-border/40 shadow-inner">
              {/* Relleno con Gradiente y Brillo Shimmer */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-sky-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(2,132,199,0.4)] relative overflow-hidden"
                style={{ width: `${percent}%` }}
              >
                {/* Animación Shimmer en movimiento */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Botón de Cancelación elegante */}
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all px-4 py-1.5"
            >
              <X className="w-3.5 h-3.5 mr-1.5" /> Cancelar proceso
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
