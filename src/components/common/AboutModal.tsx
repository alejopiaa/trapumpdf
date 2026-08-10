import React from 'react';
import { X, ShieldCheck, Cpu, Code2, Lock, Heart } from 'lucide-react';
import { Button } from '../ui/button';

const MonogramTIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8.5C20 9.32843 19.3284 10 18.5 10H14.5V18C14.5 19.1046 13.6046 20 12.5 20H11.5C10.3954 20 9.5 19.1046 9.5 18V10H5.5C4.67157 10 4 9.32843 4 8.5V6Z"
      fill="currentColor"
    />
  </svg>
);

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
      <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-5 relative animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground rounded-xl p-1.5 hover:bg-muted transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera con Isotipo Oficial de la App */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
            <MonogramTIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-foreground tracking-tight">
                TRAPÜM<span className="text-primary">PDF</span>
              </h2>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              Trapüm (del mapudungun <span className="italic">Trapümün</span>: "unir", "juntar" o "enlazar")
            </p>
          </div>
        </div>

        {/* Cuerpo Explicativo Ancho y Compacto */}
        <div className="flex flex-col gap-4 text-xs text-muted-foreground leading-relaxed">
          <p className="text-xs text-foreground/90 font-medium leading-relaxed">
            TrapümPDF es una aplicación de código abierto ejecutable directamente en el navegador del usuario, diseñada para el procesamiento 100% local y seguro de documentos PDF sin requerir conexión a internet ni servidores externos.
          </p>

          {/* Sección Ley 21.719 */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>🛡️ Marco Legal: Ley N.º 21.719 sobre Protección de Datos Personales</span>
            </div>
            <p className="text-[11px] text-foreground/80 leading-relaxed font-medium">
              Con la entrada en vigencia de la Ley N.º 21.719 en Chile, las instituciones deben implementar medidas técnicas estrictas para resguardar la información. <strong>TrapümPDF</strong> da cumplimiento directo a los siguientes preceptos legales:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
              <div className="p-2.5 rounded-xl bg-background/80 border border-primary/10 flex flex-col gap-0.5">
                <span className="font-bold text-foreground text-[11px]">
                  • Confidencialidad (Art. 3 y 14)
                </span>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  Procesamiento 100% en RAM local (<em>Client-Side / Air-Gapped</em>). Ningún dato sale del equipo.
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-background/80 border border-primary/10 flex flex-col gap-0.5">
                <span className="font-bold text-foreground text-[11px]">
                  • Transferencia Int. (Art. 26)
                </span>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  Sin envío de antecedentes a servidores externos en el extranjero.
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-background/80 border border-primary/10 flex flex-col gap-0.5">
                <span className="font-bold text-foreground text-[11px]">
                  • Medidas Técnicas (Art. 14)
                </span>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  Software estático portable sin uso de APIs externas de terceros.
                </span>
              </div>
            </div>
          </div>

          {/* Sección Alineación Gobierno Digital con texto explicativo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 flex flex-col items-center text-center gap-1">
              <Cpu className="w-4 h-4 text-primary shrink-0 mb-0.5" />
              <span className="font-extrabold text-foreground text-xs">Procesamiento Aislado</span>
              <span className="text-[10px] text-muted-foreground leading-snug">Sin uso de APIs ni dependencias de red externas.</span>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 flex flex-col items-center text-center gap-1">
              <Code2 className="w-4 h-4 text-primary shrink-0 mb-0.5" />
              <span className="font-extrabold text-foreground text-xs">Código Abierto</span>
              <span className="text-[10px] text-muted-foreground leading-snug">Código abierto ejecutable como archivo estático.</span>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 flex flex-col items-center text-center gap-1">
              <Lock className="w-4 h-4 text-primary shrink-0 mb-0.5" />
              <span className="font-extrabold text-foreground text-xs">Soberanía de Datos</span>
              <span className="text-[10px] text-muted-foreground leading-snug">Eliminación de riesgos de filtración en la nube.</span>
            </div>
          </div>
        </div>

        {/* Footer del Modal con Credito Identico al Footer de la App */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            Desarrollado con{' '}
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />{' '}
            por{' '}
            <a
              href="https://alejopia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline underline-offset-2 transition-colors"
            >
              alejopia.com
            </a>
          </span>
          <Button onClick={onClose} size="sm" className="font-bold rounded-xl text-xs px-5">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
};
