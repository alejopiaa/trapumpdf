import React from 'react';

interface HeroBannerProps {
  activeTool: 'home' | 'merge' | 'edit' | 'split' | 'compress';
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ activeTool }) => {
  return (
    <section className="bg-gradient-to-b from-secondary/5 via-background to-background border-b border-border/40 h-[200px] min-h-[200px] max-h-[200px] flex items-center justify-center px-4 text-center relative overflow-hidden shrink-0">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center gap-3 relative z-10 w-full">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground h-10 flex items-center justify-center">
          {activeTool === 'home' && 'Herramientas de Procesamiento PDF'}
          {activeTool === 'merge' && 'Unir Archivos PDF'}
          {activeTool === 'edit' && 'Organizar Archivos PDF'}
          {activeTool === 'split' && 'Dividir & Extraer Páginas de PDF'}
          {activeTool === 'compress' && 'Comprimir Documentos PDF'}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed font-medium h-14 flex items-center justify-center text-center">
          {activeTool === 'home' &&
            'Herramienta libre y privada de alta velocidad para unir, organizar, dividir y comprimir PDFs 100% en tu equipo.'}
          {activeTool === 'merge' &&
            'Combina múltiples documentos PDF e imágenes en un solo archivo directo de forma limpia.'}
          {activeTool === 'edit' &&
            'Reordena, rota y excluye páginas individuales. Descarga en un solo PDF unificado o ZIP.'}
          {activeTool === 'split' &&
            'Extrae páginas individuales o divide tu documento en bloques por rango de forma rápida.'}
          {activeTool === 'compress' &&
            'Reduce de forma inteligente el peso en MB de tus archivos PDF manteniendo descargas independientes.'}
        </p>
      </div>
    </section>
  );
};
