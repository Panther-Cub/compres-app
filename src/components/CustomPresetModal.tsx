import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui';
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
    
    // Generate a clean preset ID based on the name (no timestamp)
    const cleanName = presetName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const presetId = `custom-${cleanName}`;
    
    const customPreset = {
      id: presetId,
      name: presetName.trim(),
      description: presetDescription.trim() || 'Custom preset with advanced settings',
      category: 'custom' as const,
      crf: advancedSettings.crf,
      videoBitrate: advancedSettings.videoBitrate,
      audioBitrate: advancedSettings.audioBitrate,
      fps: advancedSettings.fps,
      resolution: advancedSettings.resolution,
      keepAudio: true
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
      className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      variants={overlayVariants}
      initial="hidden"
      animate={isOpen ? 'visible' : 'hidden'}
    >
      <motion.div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        className="relative w-full max-w-md mx-4 bg-background border border-border rounded-lg shadow-lg"
        variants={macAnimations.modal}
        initial="hidden"
        animate={isOpen ? 'visible' : 'hidden'}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Save Custom Preset</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
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
              placeholder="Enter preset name..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              placeholder="Enter description (optional)..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Current Settings</h3>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Video Bitrate: {advancedSettings.videoBitrate}</div>
              <div>Audio Bitrate: {advancedSettings.audioBitrate}</div>
              <div>Resolution: {advancedSettings.resolution}</div>
              <div>FPS: {advancedSettings.fps}</div>
              <div>CRF: {advancedSettings.crf}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!presetName.trim()}
            className="text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomPresetModal;
