import React from 'react';
import { X, Check } from 'lucide-react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import type { ProgressOverlayProps } from '../types';

const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  isCompressing,
  compressionComplete,
  compressionProgress,
  outputPaths,
  presets,
  getTotalProgress,
  onClose,
  onCancel
}) => {
  if (!isCompressing && !compressionComplete) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      {/* Allow clicking outside to minimize */}
      <div className="absolute inset-0" onClick={() => !isCompressing && onClose?.()} />
      <div className="w-full max-w-md p-6 space-y-6 relative bg-background border border-border/20 rounded-lg transition-all duration-100 ease-out" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {(compressionComplete || !isCompressing) && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {compressionComplete && <Check className="w-4 h-4 text-green-500" />}
            {isCompressing && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            <h3 className="text-base font-light">
              {isCompressing ? 'Compressing videos...' : 'Complete!'}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground/60">
            {isCompressing ? `${getTotalProgress()}% complete` : 'All videos have been compressed'}
          </p>
          {isCompressing && (
            <p className="text-xs text-muted-foreground/40">
              Processing {Object.keys(compressionProgress).length} files in parallel
            </p>
          )}
        </div>
        
        <Progress value={getTotalProgress()} className="w-full" />
        
        {/* Individual Progress */}
        {Object.keys(compressionProgress).length > 0 && (
          <div className="space-y-2 max-h-48 overflow-auto">
            <div className="text-xs text-muted-foreground/60 mb-2">
              {Object.values(compressionProgress).filter(p => p === 100).length} of {Object.keys(compressionProgress).length} completed
            </div>
            {Object.entries(compressionProgress).map(([key, progress]) => {
              const [fileName, presetKey] = key.split('-');
              const preset = presetKey ? (presets as Record<string, any>)[presetKey] : undefined;
              
              return (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-20 truncate font-light">{fileName}</span>
                  <span className="w-16 text-muted-foreground/60">{preset?.name}</span>
                  <Progress value={progress} className="flex-1 h-1" />
                  <span className="w-8 text-right font-light">{progress}%</span>
                </div>
              );
            })}
          </div>
        )}
        
        {compressionComplete && outputPaths.length > 0 && (
          <div className="p-3 bg-accent/20 rounded-lg border border-border/20">
            <p className="text-sm font-light mb-2">Output saved to:</p>
            <div className="space-y-1">
              {outputPaths.map((path, index) => (
                <p key={index} className="text-sm text-muted-foreground/60 break-all">{path}</p>
              ))}
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2">
          {isCompressing && onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              size="sm"
            >
              Cancel
            </Button>
          )}
          {compressionComplete && onClose && (
            <Button
              onClick={onClose}
              className="flex-1 mac-button"
              size="sm"
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressOverlay;
