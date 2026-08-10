import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { OmittedFileItem } from '../services/pdfService';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
  multiple?: boolean;
  accept?: string;
  omittedFiles?: OmittedFileItem[];
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  isLoading,
  accept = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*',
  omittedFiles = [],
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (omittedFiles && omittedFiles.length > 0) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [omittedFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto py-6 sm:py-8">
        <Card
          className={`p-10 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[380px] group ${
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg'
              : 'border-slate-300 dark:border-slate-700 hover:border-primary/60 hover:bg-muted/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-200">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1">
            Arrastra y suelta tus archivos aquí
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            o haz clic para seleccionar documentos de tu equipo
          </p>

          <Button type="button" size="lg" className="font-bold shadow-md">
            Seleccionar Archivos
          </Button>

          <div className="flex items-center gap-2 mt-6 flex-wrap justify-center">
            <Badge variant="secondary" className="gap-1 font-medium">
              <FileText className="w-3 h-3" /> PDF
            </Badge>
            <Badge variant="secondary" className="gap-1 font-medium">
              <ImageIcon className="w-3 h-3" /> JPG
            </Badge>
            <Badge variant="secondary" className="gap-1 font-medium">
              <ImageIcon className="w-3 h-3" /> PNG
            </Badge>
            <Badge variant="secondary" className="gap-1 font-medium">
              <ImageIcon className="w-3 h-3" /> WEBP
            </Badge>
          </div>
        </Card>
      </div>

      {/* Toast Flotante Auto-desaparecible a los 5 segundos */}
      {showToast && omittedFiles && omittedFiles.length > 0 && (
        <div className="fixed bottom-10 right-6 z-50 flex items-center gap-3 bg-card/95 backdrop-blur-md border border-amber-500/40 text-foreground p-3.5 px-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-amber-500 text-sm shrink-0">⚠️</span>
            <span>Se {omittedFiles.length === 1 ? 'omitió 1 archivo' : `omitieron ${omittedFiles.length} archivos`}.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowModal(true);
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
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal Desplegable de Detalle (Bajo Demanda) */}
      {showModal && omittedFiles && omittedFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Archivos no agregados ({omittedFiles.length})</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1"
              >
                ✕
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {omittedFiles.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col text-xs bg-muted/40 p-2.5 rounded-xl border border-border/40 gap-0.5"
                >
                  <span className="font-bold text-foreground truncate" title={item.name}>
                    📄 {item.name}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                    {item.reason}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setShowModal(false)} className="font-bold rounded-xl text-xs">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
