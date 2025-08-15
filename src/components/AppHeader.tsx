import React from 'react';
import { Zap, Coffee, Info, Star } from 'lucide-react';
import { Button } from './ui/button';
import ThemeToggle from './ThemeToggle';
import type { AppHeaderProps } from '../types';

const AppHeader: React.FC<AppHeaderProps> = ({ 
  selectedFilesCount, 
  onBuyCoffee, 
  theme, 
  onToggleTheme, 
  onShowAbout,
  onShowDefaults
}) => {
  return (
    <header className="draggable-region fixed top-0 left-0 right-0 z-50 h-10 glass border-b border-border/20 flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-3 pl-20">
        <div className="w-6 h-6 bg-foreground/10 rounded-md flex items-center justify-center">
          <Zap className="w-3 h-3 text-foreground/70" />
        </div>
        <span className="text-xs font-light text-foreground/70">Compress</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/60">
          {selectedFilesCount > 0 ? `${selectedFilesCount} file${selectedFilesCount > 1 ? 's' : ''}` : 'Drop videos'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowDefaults}
          className="non-draggable text-xs"
        >
          <Star className="w-3 h-3" />
        </Button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowAbout}
          className="non-draggable text-xs"
        >
          <Info className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBuyCoffee}
          className="non-draggable text-xs"
        >
          <Coffee className="w-3 h-3 mr-1" />
          Buy Coffee
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
