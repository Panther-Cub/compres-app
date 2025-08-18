import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { VideoPreset } from './types';
import { addCustomPreset, removeCustomPreset, loadCustomPresetsFromData } from './presets';

// Get the path to the custom presets file
const getCustomPresetsPath = (): string => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'custom-presets.json');
};

// Load custom presets from file
export const loadCustomPresetsFromFile = (): Record<string, VideoPreset> => {
  try {
    const customPresetsPath = getCustomPresetsPath();
    
    if (fs.existsSync(customPresetsPath)) {
      const data = fs.readFileSync(customPresetsPath, 'utf8');
      const loadedPresets = JSON.parse(data);
      
      // Validate and return custom presets
      const validPresets: Record<string, VideoPreset> = {};
      Object.entries(loadedPresets).forEach(([presetId, preset]) => {
        if (presetId.startsWith('custom-') && typeof preset === 'object' && preset !== null) {
          // Ensure the preset has the custom category
          const customPresetWithCategory = {
            ...preset as VideoPreset,
            category: 'custom' as const
          };
          
          validPresets[presetId] = customPresetWithCategory;
        }
      });
      
      // Loaded custom presets from file
      return validPresets;
    }
  } catch (error) {
    console.error('Error loading custom presets:', error);
  }
  
  return {};
};

// Save custom presets to file
export const saveCustomPresetsToFile = (customPresets: Record<string, VideoPreset>): void => {
  try {
    const customPresetsPath = getCustomPresetsPath();
    const data = JSON.stringify(customPresets, null, 2);
    fs.writeFileSync(customPresetsPath, data, 'utf8');
    // Saved custom presets to file
  } catch (error) {
    console.error('Error saving custom presets:', error);
  }
};

// Initialize custom presets on first load
export const initializeCustomPresets = (): void => {
  const customPresetsData = loadCustomPresetsFromFile();
  loadCustomPresetsFromData(customPresetsData);
};

// Add custom preset with file persistence
export const addCustomPresetWithPersistence = (presetId: string, preset: VideoPreset): void => {
  // Add to memory
  addCustomPreset(presetId, preset);
  
  // Get current custom presets and save to file
  const { getCustomPresets } = require('./presets');
  const currentCustomPresets = getCustomPresets();
  saveCustomPresetsToFile(currentCustomPresets);
};

// Remove custom preset with file persistence
export const removeCustomPresetWithPersistence = (presetId: string): void => {
  // Remove from memory
  removeCustomPreset(presetId);
  
  // Get current custom presets and save to file
  const { getCustomPresets } = require('./presets');
  const currentCustomPresets = getCustomPresets();
  saveCustomPresetsToFile(currentCustomPresets);
};
