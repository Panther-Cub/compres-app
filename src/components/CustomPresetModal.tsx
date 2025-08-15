import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { macAnimations, overlayVariants } from '../lib/animations';
import type { CustomPresetModalProps } from '../types';

const CustomPresetModal: React.FC<CustomPresetModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  advancedSettings 
}) => {
  const [presetName, setPresetName] = useState<string>('');
  const [presetDescription, setPresetDescription] = useState<string>('');

  const handleSave = (): void => {
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

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
          <motion.div 
            className="glass-modal rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            variants={macAnimations.modal}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Save Custom Preset</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <motion.div 
              className="space-y-4"
              variants={macAnimations.slideUp}
            >
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
                    <span className="text-muted-foreground">Video Bitrate:</span>
                    <span>{advancedSettings.videoBitrate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audio Bitrate:</span>
                    <span>{advancedSettings.audioBitrate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution:</span>
                    <span>{advancedSettings.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FPS:</span>
                    <span>{advancedSettings.fps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CRF:</span>
                    <span>{advancedSettings.crf}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <motion.div 
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSave}
                    disabled={!presetName.trim()}
                    className="w-full"
                    size="sm"
                  >
                    <Save className="w-3 h-3 mr-2" />
                    Save Preset
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="text-sm"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
  );
};

export default CustomPresetModal;
