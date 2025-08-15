import { useState, useEffect, useCallback } from 'react';
import type { UseSettingsReturn, Preset, AdvancedSettings } from '../types';

export const useSettings = (): UseSettingsReturn => {
  const [selectedPresets, setSelectedPresets] = useState<string[]>(['web-hero', 'web-standard']);
  const [keepAudio, setKeepAudio] = useState<boolean>(false);
  const [outputDirectory, setOutputDirectory] = useState<string>('');
  const [presets, setPresets] = useState<Record<string, Preset>>({});
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showCustomPresetModal, setShowCustomPresetModal] = useState<boolean>(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    crf: 25,
    videoBitrate: '1500k',
    audioBitrate: '96k',
    fps: 30,
    resolution: '1280x720',
    preserveAspectRatio: true,
    twoPass: false,
    fastStart: true,
    optimizeForWeb: true
  });

  // Load presets on mount
  useEffect(() => {
    const loadPresets = async (): Promise<void> => {
      if (window.electronAPI) {
        try {
          const presetsData = await window.electronAPI.getPresets();
          setPresets(presetsData);
        } catch (err) {
          console.error('Error loading presets:', err);
        }
      } else {
        console.warn('Electron API not available - using default presets');
        // Set some default presets for browser mode
        setPresets({
          'web-hero': { 
            id: 'web-hero',
            name: 'Web Hero', 
            description: 'High quality for hero sections and main content',
            crf: 20,
            videoBitrate: '2000k',
            audioBitrate: '128k',
            fps: 30,
            resolution: '1920x1080',
            keepAudio: true
          },
          'web-standard': { 
            id: 'web-standard',
            name: 'Web Standard', 
            description: 'Balanced quality and file size for web pages',
            crf: 25,
            videoBitrate: '1500k',
            audioBitrate: '96k',
            fps: 30,
            resolution: '1280x720',
            keepAudio: true
          },
          'web-mobile': { 
            id: 'web-mobile',
            name: 'Web Mobile', 
            description: 'Optimized for mobile devices and slower connections',
            crf: 28,
            videoBitrate: '800k',
            audioBitrate: '64k',
            fps: 24,
            resolution: '854x480',
            keepAudio: true
          },
          'social-instagram': { 
            id: 'social-instagram',
            name: 'Instagram', 
            description: 'Optimized for Instagram feed and stories',
            crf: 23,
            videoBitrate: '1200k',
            audioBitrate: '96k',
            fps: 30,
            resolution: '1080x1080',
            keepAudio: true
          },
          'social-tiktok': { 
            id: 'social-tiktok',
            name: 'TikTok', 
            description: 'Optimized for TikTok and vertical video platforms',
            crf: 25,
            videoBitrate: '1000k',
            audioBitrate: '96k',
            fps: 30,
            resolution: '1080x1920',
            keepAudio: true
          },
          'webm-modern': { 
            id: 'webm-modern',
            name: 'WebM Modern', 
            description: 'Modern WebM format with VP9 for better compression',
            crf: 30,
            videoBitrate: '1000k',
            audioBitrate: '96k',
            fps: 30,
            resolution: '1280x720',
            keepAudio: true
          },
          'hevc-efficient': { 
            id: 'hevc-efficient',
            name: 'HEVC Efficient', 
            description: 'H.265/HEVC for maximum compression efficiency',
            crf: 28,
            videoBitrate: '800k',
            audioBitrate: '64k',
            fps: 30,
            resolution: '1280x720',
            keepAudio: true
          },
          'thumbnail-preview': { 
            id: 'thumbnail-preview',
            name: 'Thumbnail', 
            description: 'Small file size for thumbnails and previews',
            crf: 35,
            videoBitrate: '400k',
            audioBitrate: '32k',
            fps: 15,
            resolution: '640x360',
            keepAudio: false
          },
          'ultra-compressed': { 
            id: 'ultra-compressed',
            name: 'Ultra Compressed', 
            description: 'Maximum compression for minimal file size',
            crf: 35,
            videoBitrate: '500k',
            audioBitrate: '48k',
            fps: 24,
            resolution: '854x480',
            keepAudio: false
          }
        });
      }
    };
    loadPresets();
  }, []);

  const handlePresetToggle = useCallback((presetKey: string): void => {
    setSelectedPresets(prev => 
      prev.includes(presetKey) 
        ? prev.filter(p => p !== presetKey)
        : [...prev, presetKey]
    );
  }, []);

  const handleSelectOutputDirectory = useCallback(async (): Promise<void> => {
    try {
      // Check if we're in Electron environment
      if (!window.electronAPI) {
        console.warn('Electron API not available - cannot select output directory');
        return;
      }
      
      const directory = await window.electronAPI.selectOutputDirectory();
      if (directory) {
        setOutputDirectory(directory);
      }
    } catch (err) {
      console.error('Error selecting output directory:', err);
      throw err;
    }
  }, []);

  const toggleDrawer = useCallback((): void => {
    setDrawerOpen(prev => !prev);
  }, []);

  const toggleAdvanced = useCallback((): void => {
    setShowAdvanced(prev => !prev);
  }, []);

  const handleAdvancedSettingsChange = useCallback((settings: AdvancedSettings): void => {
    setAdvancedSettings(settings);
  }, []);

  const handleSaveCustomPreset = useCallback((): void => {
    setShowCustomPresetModal(true);
  }, []);

  const handleCustomPresetSave = useCallback((): void => {
    // This will be handled by the modal component
    setShowCustomPresetModal(false);
  }, []);

  return {
    selectedPresets,
    keepAudio,
    setKeepAudio,
    outputDirectory,
    presets,
    drawerOpen,
    showAdvanced,
    showCustomPresetModal,
    advancedSettings,
    handlePresetToggle,
    handleSelectOutputDirectory,
    toggleDrawer,
    toggleAdvanced,
    handleAdvancedSettingsChange,
    handleSaveCustomPreset,
    handleCustomPresetSave,
    setShowCustomPresetModal
  };
};
