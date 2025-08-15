import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './ui/button';

const ThemeToggle = ({ theme, onToggle }) => {
  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return <Sun className="w-3 h-3" />;
      case 'light':
        return <Moon className="w-3 h-3" />;
      case 'auto':
        return <Monitor className="w-3 h-3" />;
      default:
        return <Monitor className="w-3 h-3" />;
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="non-draggable text-xs"
      title={`Theme: ${theme} (click to cycle)`}
    >
      {getIcon()}
    </Button>
  );
};

export default ThemeToggle;
