import React from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Sun, Moon } from 'lucide-react';

const MonogramTIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8.5C20 9.32843 19.3284 10 18.5 10H14.5V18C14.5 19.1046 13.6046 20 12.5 20H11.5C10.3954 20 9.5 19.1046 9.5 18V10H5.5C4.67157 10 4 9.32843 4 8.5V6Z"
      fill="currentColor"
    />
  </svg>
);

interface HeaderProps {
  activeTool: 'home' | 'merge' | 'edit' | 'split' | 'compress';
  onToolSwitch: (tool: 'home' | 'merge' | 'edit' | 'split' | 'compress') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  onToolSwitch,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-8 relative">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onToolSwitch('home')}
          title="Ir al inicio"
        >
          {/* Squircle Isotipo con Micro-Movimiento Periódico Sutil (100% Tailwind v4) */}
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20 animate-logo-nod group-hover:scale-105 transition-transform duration-200">
            <MonogramTIcon className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground whitespace-nowrap">
            TRAPÜM<span className="text-primary">PDF</span>
          </span>
        </div>

        {/* Navigation Tabs (Native iOS Segmented Control - Strictly Centered with Symmetrical Padding) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center">
          <Tabs value={activeTool} onValueChange={(val) => onToolSwitch(val as any)}>
            <TabsList className="bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-full border border-border/60 shadow-inner h-10 gap-1">
              <TabsTrigger value="merge" className="rounded-full px-4 py-1 text-xs font-extrabold tracking-wide">
                UNIR PDF
              </TabsTrigger>
              <TabsTrigger value="edit" className="rounded-full px-4 py-1 text-xs font-extrabold tracking-wide">
                ORGANIZAR PDF
              </TabsTrigger>
              <TabsTrigger value="split" className="rounded-full px-4 py-1 text-xs font-extrabold tracking-wide">
                DIVIDIR PDF
              </TabsTrigger>
              <TabsTrigger value="compress" className="rounded-full px-4 py-1 text-xs font-extrabold tracking-wide">
                COMPRIMIR PDF
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Theme Toggle Button */}
        <div className="md:absolute md:right-4 sm:md:right-6 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleTheme}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className="rounded-xl h-9 w-9 border-border hover:bg-muted"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-secondary" />}
          </Button>
        </div>
      </div>
    </header>
  );
};
