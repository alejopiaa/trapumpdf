import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Link as LinkIcon, Wrench, Scissors, Zap, ArrowRight } from 'lucide-react';

interface HomeViewProps {
  onSelectTool: (tool: 'merge' | 'edit' | 'split' | 'compress') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTool }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pb-6">
      {/* Card 1: Unir PDF */}
      <Card
        className="p-6 flex flex-col justify-between h-[240px] cursor-pointer rounded-3xl border border-border hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 group bg-card"
        onClick={() => onSelectTool('merge')}
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
          <LinkIcon className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-extrabold text-foreground">Unir PDF</h2>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Une y combina múltiples documentos PDF e imágenes en un solo archivo directo.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="font-bold text-xs gap-1.5 text-blue-600 dark:text-blue-400 p-0 hover:bg-transparent group-hover:translate-x-1 transition-transform self-start">
          Comenzar <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>

      {/* Card 2: Organizar PDF */}
      <Card
        className="p-6 flex flex-col justify-between h-[240px] cursor-pointer rounded-3xl border border-border hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1.5 transition-all duration-300 group bg-card"
        onClick={() => onSelectTool('edit')}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
          <Wrench className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-extrabold text-foreground">Organizar PDF</h2>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Reordena, gira y quita páginas. Descarga en 1 solo PDF o en archivos separados (.ZIP).
          </p>
        </div>
        <Button variant="ghost" size="sm" className="font-bold text-xs gap-1.5 text-amber-600 dark:text-amber-400 p-0 hover:bg-transparent group-hover:translate-x-1 transition-transform self-start">
          Comenzar <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>

      {/* Card 3: Dividir PDF */}
      <Card
        className="p-6 flex flex-col justify-between h-[240px] cursor-pointer rounded-3xl border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 group bg-card"
        onClick={() => onSelectTool('split')}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
          <Scissors className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-extrabold text-foreground">Dividir PDF</h2>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Extrae páginas individuales o divide tu documento en rangos personalizados o fijos.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="font-bold text-xs gap-1.5 text-primary p-0 hover:bg-transparent group-hover:translate-x-1 transition-transform self-start">
          Comenzar <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>

      {/* Card 4: Comprimir PDF */}
      <Card
        className="p-6 flex flex-col justify-between h-[240px] cursor-pointer rounded-3xl border border-border hover:border-[#00a3e0]/50 hover:shadow-2xl hover:shadow-[#00a3e0]/10 hover:-translate-y-1.5 transition-all duration-300 group bg-card"
        onClick={() => onSelectTool('compress')}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#00a3e0]/20 text-[#00a3e0] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
          <Zap className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-extrabold text-foreground">Comprimir PDF</h2>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Reduce de forma inteligente el peso en MB de tus archivos PDF de forma limpia.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="font-bold text-xs gap-1.5 text-[#00a3e0] p-0 hover:bg-transparent group-hover:translate-x-1 transition-transform self-start">
          Comenzar <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
};
