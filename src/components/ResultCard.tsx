import JSZip from 'jszip';
import { formatBytes } from '../services/pdfService';
import type { CompressedResultItem } from '../services/pdfService';
import { Download, Sparkles, RefreshCw, Zap, Link as LinkIcon, FileText, Wrench, FolderArchive, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface ResultCardProps {
  originalSize?: number;
  compressedSize?: number;
  pdfBytes?: Uint8Array;
  multipleResults?: CompressedResultItem[];
  zipResult?: { blob: Blob; fileName: string };
  outputFileName?: string;
  showSavingsBadge?: boolean;
  onReset: () => void;
  onContinueCompress?: (bytes?: Uint8Array) => void;
  onContinueEdit?: (bytes?: Uint8Array) => void;
  onContinueMerge?: (bytes?: Uint8Array) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  originalSize = 0,
  compressedSize = 0,
  pdfBytes,
  multipleResults,
  zipResult,
  outputFileName,
  showSavingsBadge = false,
  onReset,
  onContinueCompress,
  onContinueEdit,
  onContinueMerge,
}) => {
  const isMultiple = Boolean((multipleResults && multipleResults.length > 0) || zipResult);

  const totalOrig = isMultiple
    ? multipleResults ? multipleResults.reduce((acc, item) => acc + item.originalSize, 0) : originalSize
    : originalSize;

  const totalComp = isMultiple
    ? multipleResults ? multipleResults.reduce((acc, item) => acc + item.compressedSize, 0) : compressedSize
    : compressedSize;

  const savingsBytes = Math.max(0, totalOrig - totalComp);
  const savingsPercent = totalOrig > 0 ? ((savingsBytes / totalOrig) * 100).toFixed(1) : '0';

  const downloadSinglePdf = (bytes: Uint8Array, fileName: string) => {
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (zipResult) {
      downloadBlob(zipResult.blob, zipResult.fileName);
      return;
    }

    if (multipleResults && multipleResults.length > 0) {
      const zip = new JSZip();
      multipleResults.forEach((item) => {
        zip.file(item.fileName, item.pdfBytes);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const firstBase = outputFileName ? outputFileName.replace(/\.[^/.]+$/, "") : 'archivos_procesados';
      downloadBlob(zipBlob, `${firstBase}_trapumpdf.zip`);
    }
  };

  const handleDownloadSeparated = () => {
    if (!multipleResults || multipleResults.length === 0) return;
    multipleResults.forEach((item, idx) => {
      setTimeout(() => {
        downloadSinglePdf(item.pdfBytes, item.fileName);
      }, idx * 300);
    });
  };

  const finalSingleName = outputFileName || `documento_trapumpdf_${Date.now()}.pdf`;

  return (
    <Card className="p-8 max-w-2xl mx-auto flex flex-col items-center gap-6 shadow-xl border-primary/20 bg-gradient-to-b from-card to-muted/20">
      <Badge variant="success" className="px-4 py-1.5 text-sm gap-2 font-bold shadow-xs">
        <Sparkles className="w-4 h-4 text-emerald-500" /> ¡Proceso completado con éxito!
      </Badge>

      <div className="flex items-center justify-center gap-6 w-full p-4 rounded-xl bg-muted/40 border border-border/60">
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tamaño Original</span>
          <span className="text-lg font-bold text-foreground mt-0.5">{formatBytes(totalOrig)}</span>
        </div>

        <ArrowRight className="w-5 h-5 text-muted-foreground" />

        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tamaño Final</span>
          <span className={`text-lg font-bold mt-0.5 ${totalComp < totalOrig ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
            {formatBytes(totalComp)}
          </span>
        </div>

        {showSavingsBadge && (
          savingsBytes > 0 ? (
            <Badge variant="destructive" className="ml-2 font-bold">
              -{savingsPercent}% Ahorro
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-2 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
              ⚡ Tamaño óptimo alcanzado
            </Badge>
          )
        )}
      </div>

      {isMultiple ? (
        <div className="w-full flex flex-col gap-3 items-center">
          <Button
            size="lg"
            className="w-full h-12 text-base font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleDownloadZip}
          >
            <FolderArchive className="w-5 h-5 mr-2" /> Descargar Paquete (.ZIP)
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 text-base font-bold shadow-md"
            onClick={handleDownloadSeparated}
          >
            <Download className="w-5 h-5 mr-2" /> Descargar Archivos Separados
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          className="w-full h-12 text-base font-bold shadow-md"
          onClick={() => pdfBytes && downloadSinglePdf(pdfBytes, finalSingleName)}
        >
          <Download className="w-5 h-5 mr-2" /> Descargar PDF Final
        </Button>
      )}

      {/* Connected Action Shortcuts (solo visibles para 1 solo archivo individual) */}
      <div className="w-full border-t border-border pt-6 mt-2 flex flex-col items-center">
        {!isMultiple && (onContinueEdit || onContinueCompress || onContinueMerge) && (
          <>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              ¿Qué deseas hacer a continuación con este resultado?
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {onContinueEdit && (
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1 text-left items-start justify-start border-border hover:border-primary/50"
                  onClick={() => onContinueEdit(pdfBytes)}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Wrench className="w-4 h-4 text-primary" /> Organizar este PDF
                  </div>
                  <span className="text-[11px] text-muted-foreground font-normal">Reordena o quita págs.</span>
                </Button>
              )}

              {onContinueCompress && (
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1 text-left items-start justify-start border-border hover:border-primary/50"
                  onClick={() => onContinueCompress(pdfBytes)}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Zap className="w-4 h-4 text-amber-500" /> Comprimir este PDF
                  </div>
                  <span className="text-[11px] text-muted-foreground font-normal">Reduce peso en MB</span>
                </Button>
              )}

              {onContinueMerge && (
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1 text-left items-start justify-start border-border hover:border-primary/50"
                  onClick={() => onContinueMerge(pdfBytes)}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <LinkIcon className="w-4 h-4 text-sky-500" /> Unir con otro PDF
                  </div>
                  <span className="text-[11px] text-muted-foreground font-normal">Agrega otros PDF</span>
                </Button>
              )}
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={`${!isMultiple && (onContinueEdit || onContinueCompress || onContinueMerge) ? 'mt-6' : 'mt-2'} text-xs text-muted-foreground hover:text-foreground`}
          onClick={onReset}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Comenzar un nuevo proceso desde cero
        </Button>
      </div>
    </Card>
  );
};
