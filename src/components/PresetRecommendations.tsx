import React from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import type { PresetRecommendationsProps } from '../types';

const PresetRecommendations: React.FC<PresetRecommendationsProps> = ({ 
  selectedFiles, 
  fileInfos, 
  presets, 
  selectedPresets, 
  onPresetToggle 
}) => {
  const getRecommendations = (): string[] => {
    if (selectedFiles.length === 0) return [];

    const recommendations: string[] = [];
    const fileInfo = fileInfos[selectedFiles[0]]; // Use first file for analysis

    // Check if fileInfo exists and has the required properties
    if (!fileInfo || !fileInfo.width || !fileInfo.height) {
      // Return basic recommendations if we don't have file info
      return ['web-optimized', 'mac-hardware', 'thumbnail-preview'];
    }

    // Analyze video characteristics
    const { width, height, duration, size } = fileInfo;
    const aspectRatio = width && height ? width / height : 1;
    const isVertical = aspectRatio < 0.8;
    const isSquare = aspectRatio > 0.8 && aspectRatio < 1.2;
    // const isWide = aspectRatio > 1.5; // Future use for wide video optimization
    const isHighRes = width > 1920 || height > 1080;
    const isLongVideo = duration > 300; // 5 minutes
    const isLargeFile = size > 100 * 1024 * 1024; // 100MB

    // Base recommendations
    recommendations.push('web-optimized');

    // Resolution-based recommendations
    if (isHighRes) {
      recommendations.push('mac-hevc');
    }

    // Aspect ratio recommendations - using available presets
    if (isVertical) {
      recommendations.push('web-optimized'); // Use web-optimized for vertical videos
    } else if (isSquare) {
      recommendations.push('web-optimized'); // Use web-optimized for square videos
    }

    // File size recommendations
    if (isLargeFile || isLongVideo) {
      recommendations.push('mac-hardware');
      recommendations.push('hevc-efficient');
    }

    // Modern format recommendations
    recommendations.push('webm-modern');

    // Remove duplicates and limit to 4 recommendations
    return Array.from(new Set(recommendations)).slice(0, 4);
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
        <Sparkles className="w-3 h-3 text-purple-500" />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {unselectedRecommendations.map((presetKey) => {
          const preset = presets[presetKey];
          if (!preset) return null;
          
          return (
            <Button
              key={presetKey}
              variant="outline"
              size="sm"
              onClick={() => onPresetToggle(presetKey)}
              className="text-xs bg-white/50 dark:bg-black/20 border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-50/80 dark:hover:bg-blue-950/40"
            >
              {preset.name}
            </Button>
          );
        })}
      </div>
      
      <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-2">
        Based on your video characteristics, these presets will give you the best results for web optimization.
      </p>
    </div>
  );
};

export default PresetRecommendations;
