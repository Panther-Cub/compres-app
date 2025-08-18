import React, { useEffect, useState } from 'react';
import { Lightbulb, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui';
import { simplePresets } from '../types/presets';
import { motion, AnimatePresence } from 'framer-motion';

interface PresetRecommendationsProps {
  onPresetSelect: (presetId: string) => void;
  selectedPresets: string[];
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export const PresetRecommendations: React.FC<PresetRecommendationsProps> = ({
  onPresetSelect,
  selectedPresets,
  isCollapsed: externalIsCollapsed,
  onToggleCollapsed
}) => {
  const [isMac, setIsMac] = useState(false);
  const [hasHardwareAcceleration, setHasHardwareAcceleration] = useState(false);
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const setIsCollapsed = onToggleCollapsed || setInternalIsCollapsed;

  useEffect(() => {
    // Detect if we're on Mac
    const platform = navigator.platform.toLowerCase();
    setIsMac(platform.includes('mac'));
    setHasHardwareAcceleration(isMac);
  }, [isMac]);

  const getRecommendations = (): string[] => {
    const recommendations: string[] = [];

    // Start with hardware-optimized presets for Mac
    if (isMac && hasHardwareAcceleration) {
      recommendations.push('mac-fast', 'mac-efficient');
    } else {
      recommendations.push('web-hero', 'web-standard');
    }

    // Add quality-focused options
    recommendations.push('web-light', 'social-horizontal');

    // Add utility presets
    recommendations.push('social-vertical');

    return recommendations;
  };

  const recommendations = getRecommendations();
  const unselectedRecommendations = recommendations.filter(rec => !selectedPresets.includes(rec));

  if (unselectedRecommendations.length === 0) return null;

  return (
    <div className="p-4 bg-primary/3 border border-border rounded-lg">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 w-full text-left hover:bg-primary/10 rounded-full p-1 transition-colors cursor-pointer"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
        <Lightbulb className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          Recommended Presets ({unselectedRecommendations.length})
        </h3>
        {isMac && hasHardwareAcceleration && (
          <Sparkles className="w-3 h-3 text-info" />
        )}
      </button>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={hasAnimated ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            onAnimationComplete={() => setHasAnimated(true)}
          >
            <div className="flex flex-wrap gap-2 mt-3">
              {unselectedRecommendations.map((presetKey) => {
                const preset = simplePresets[presetKey];
                if (!preset) return null;
                
                return (
                  <Button
                    key={presetKey}
                    variant="outline"
                    size="sm"
                    onClick={() => onPresetSelect(presetKey)}
                    className="text-xs bg-transparent border-border hover:bg-primary/5"
                  >
                    {preset.name}
                  </Button>
                );
              })}
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              {isMac && hasHardwareAcceleration 
                ? "Hardware-accelerated presets for optimal Mac performance."
                : "Optimized presets for web and general use."
              }
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
