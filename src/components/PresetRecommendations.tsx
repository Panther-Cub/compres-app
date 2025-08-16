import React, { useEffect, useState } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { Button } from './ui';
import { videoPresets } from '../electron/compression/presets';

interface PresetRecommendationsProps {
  onPresetSelect: (presetId: string) => void;
  selectedPresets: string[];
}

export const PresetRecommendations: React.FC<PresetRecommendationsProps> = ({
  onPresetSelect,
  selectedPresets
}) => {
  const [isMac, setIsMac] = useState(false);
  const [hasHardwareAcceleration, setHasHardwareAcceleration] = useState(false);

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
      recommendations.push('mac-hardware', 'mac-hevc');
    } else {
      recommendations.push('web-optimized');
    }

    // Add quality-focused options
    recommendations.push('hevc-efficient', 'webm-modern');

    // Add utility presets
    recommendations.push('thumbnail-preview');

    return recommendations;
  };

  const recommendations = getRecommendations();
  const unselectedRecommendations = recommendations.filter(rec => !selectedPresets.includes(rec));

  if (unselectedRecommendations.length === 0) return null;

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/30 dark:border-blue-800/30 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Recommended Presets
        </h3>
        {isMac && hasHardwareAcceleration && (
          <Sparkles className="w-3 h-3 text-purple-500" />
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {unselectedRecommendations.map((presetKey) => {
          const preset = videoPresets[presetKey];
          if (!preset) return null;
          
          return (
            <Button
              key={presetKey}
              variant="outline"
              size="sm"
              onClick={() => onPresetSelect(presetKey)}
              className="text-xs bg-white/50 dark:bg-black/20 border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-50/80 dark:hover:bg-blue-950/40"
            >
              {preset.name}
            </Button>
          );
        })}
      </div>
      
      <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-2">
        {isMac && hasHardwareAcceleration 
          ? "Hardware-accelerated presets for optimal Mac performance."
          : "Optimized presets for web and general use."
        }
      </p>
    </div>
  );
};
