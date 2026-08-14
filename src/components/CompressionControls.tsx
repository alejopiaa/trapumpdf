import React from 'react';
import type { CompressionOptions } from '../services/pdfService';
import { Feather, Zap, ShieldCheck, Sliders } from 'lucide-react';
import { Card } from './ui/card';

interface CompressionControlsProps {
  options: CompressionOptions;
  onChange: (options: CompressionOptions) => void;
}

export const CompressionControls: React.FC<CompressionControlsProps> = ({ options, onChange }) => {
  const selectPreset = (level: CompressionOptions['level']) => {
    switch (level) {
      case 'none':
        onChange({ level: 'none', jpegQuality: 1.0, scaleFactor: 1.0 });
        break;
      case 'recommended':
        onChange({ level: 'recommended', jpegQuality: 0.70, scaleFactor: 0.85 });
        break;
      case 'high':
        onChange({ level: 'high', jpegQuality: 0.45, scaleFactor: 0.65 });
        break;
      case 'custom':
        onChange({ level: 'custom', jpegQuality: options.jpegQuality || 0.60, scaleFactor: options.scaleFactor || 0.75 });
        break;
    }
  };

  const presets = [
    {
      level: 'recommended' as const,
      title: 'Recomendada',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      desc: 'Balance ideal (nitidez vs tamaño).',
    },
    {
      level: 'high' as const,
      title: 'Alta Compresión',
      icon: Zap,
      iconColor: 'text-amber-500',
      desc: 'Máxima reducción para emails.',
    },
    {
      level: 'none' as const,
      title: 'Sin Compresión',
      icon: Feather,
      iconColor: 'text-sky-500',
      desc: 'Calidad original intacta.',
    },
    {
      level: 'custom' as const,
      title: 'Personalizada',
      icon: Sliders,
      iconColor: 'text-primary',
      desc: 'Ajustes manuales.',
    },
  ];

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          Nivel de Compresión
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {presets.map((p) => {
          const isSelected = options.level === p.level;
          const Icon = p.icon;
          return (
            <Card
              key={p.level}
              onClick={() => selectPreset(p.level)}
              className={`p-2.5 cursor-pointer transition-all duration-150 hover:border-primary/50 ${
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-xs'
                  : 'bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-foreground dark:text-slate-100">
                  <Icon className={`w-4 h-4 ${p.iconColor}`} />
                  {p.title}
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-primary bg-primary' : 'border-input'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</p>
            </Card>
          );
        })}
      </div>

      {options.level === 'custom' && (
        <Card className="p-3 mt-1 flex flex-col gap-3 bg-muted/40">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium">
              <span>Calidad JPEG</span>
              <span className="font-bold">{Math.round((options.jpegQuality ?? 0.8) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.95"
              step="0.05"
              value={options.jpegQuality ?? 0.8}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              onChange={(e) =>
                onChange({ ...options, jpegQuality: parseFloat(e.target.value) })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium">
              <span>Escala</span>
              <span className="font-bold">{Math.round((options.scaleFactor ?? 0.85) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={options.scaleFactor ?? 0.85}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              onChange={(e) =>
                onChange({ ...options, scaleFactor: parseFloat(e.target.value) })
              }
            />
          </div>
        </Card>
      )}
    </Card>
  );
};
