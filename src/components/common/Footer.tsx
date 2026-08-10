import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  onOpenAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  return (
    <footer className="w-full border-t border-border/60 bg-background/80 backdrop-blur-sm mt-auto py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6">
        {/* Izquierda: Enlace 'Acerca de TrapümPDF' (Reemplaza al logo estático) */}
        <button
          onClick={onOpenAbout}
          className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-2 decoration-muted-foreground/40 hover:decoration-primary select-none"
          title="Ver información sobre TrapümPDF y Ley 21.719"
        >
          Acerca de TrapümPDF
        </button>

        {/* Derecha: Crédito de autor */}
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
      </div>
    </footer>
  );
};
