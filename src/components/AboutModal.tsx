import React from 'react';
import { X, Zap, Heart } from 'lucide-react';
import { Button } from './ui/button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-6 glass-card border border-border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-foreground/70" />
            </div>
            <h2 className="text-lg font-light">About Compress</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="non-draggable"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Version</h3>
            <p className="text-xs text-muted-foreground">1.0.0</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-xs text-muted-foreground">
              A minimalistic video compression app designed for web optimization. 
              Batch process multiple videos with different presets for various use cases.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Developer</h3>
            <p className="text-xs text-muted-foreground">Panther & Cub</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Credits</h3>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Built with React, Electron, and FFmpeg
              </p>
              <p className="text-xs text-muted-foreground">
                UI components by Radix UI
              </p>
              <p className="text-xs text-muted-foreground">
                Icons by Lucide React
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Heart className="w-4 h-4 text-red-500" />
            <p className="text-xs text-muted-foreground">
              Made with love for the web community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
