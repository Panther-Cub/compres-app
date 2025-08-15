import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './ui/button';

const CustomPresetModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  advancedSettings 
}) => {
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const handleSave = () => {
    if (!presetName.trim()) return;
    
    const customPreset = {
      name: presetName.trim(),
      description: presetDescription.trim() || 'Custom preset with advanced settings',
      settings: {
        videoCodec: 'libx264',
        videoBitrate: advancedSettings.videoBitrate,
        audioCodec: 'aac',
        audioBitrate: advancedSettings.audioBitrate,
        resolution: advancedSettings.resolution,
        fps: advancedSettings.fps,
        crf: advancedSettings.crf,
        preset: 'medium'
      }
    };
    
    onSave(customPreset);
    setPresetName('');
    setPresetDescription('');
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border/20 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Save Custom Preset</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="preset-name" className="text-sm font-medium">
              Preset Name *
            </label>
            <input
              id="preset-name"
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="e.g., My Web Optimized"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="preset-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="preset-description"
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe what this preset is optimized for..."
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
            />
          </div>

          {/* Settings Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Settings Preview</label>
            <div className="bg-muted/20 rounded-md p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Quality (CRF):</span>
                <span className="text-muted-foreground">{advancedSettings.crf}</span>
              </div>
              <div className="flex justify-between">
                <span>Video Bitrate:</span>
                <span className="text-muted-foreground">{advancedSettings.videoBitrate}</span>
              </div>
              <div className="flex justify-between">
                <span>Audio Bitrate:</span>
                <span className="text-muted-foreground">{advancedSettings.audioBitrate}</span>
              </div>
              <div className="flex justify-between">
                <span>Resolution:</span>
                <span className="text-muted-foreground">{advancedSettings.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span>Frame Rate:</span>
                <span className="text-muted-foreground">{advancedSettings.fps} FPS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!presetName.trim()}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomPresetModal;
