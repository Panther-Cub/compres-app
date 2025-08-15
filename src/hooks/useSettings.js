import { useState, useEffect, useCallback } from 'react';

export const useSettings = () => {
  const [selectedPresets, setSelectedPresets] = useState(['web-hero', 'web-standard']);
  const [keepAudio, setKeepAudio] = useState(false);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [presets, setPresets] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomPresetModal, setShowCustomPresetModal] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
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
    const loadPresets = async () => {
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
          'web-hero': { name: 'Web Hero', description: 'High quality for hero sections and main content' },
          'web-standard': { name: 'Web Standard', description: 'Balanced quality and file size for web pages' },
          'web-mobile': { name: 'Web Mobile', description: 'Optimized for mobile devices and slower connections' },
          'social-instagram': { name: 'Instagram', description: 'Optimized for Instagram feed and stories' },
          'social-tiktok': { name: 'TikTok', description: 'Optimized for TikTok and vertical video platforms' },
          'webm-modern': { name: 'WebM Modern', description: 'Modern WebM format with VP9 for better compression' },
          'hevc-efficient': { name: 'HEVC Efficient', description: 'H.265/HEVC for maximum compression efficiency' },
          'thumbnail-preview': { name: 'Thumbnail', description: 'Small file size for thumbnails and previews' },
          'ultra-compressed': { name: 'Ultra Compressed', description: 'Maximum compression for minimal file size' }
        });
      }
    };
    loadPresets();
  }, []);

  const handlePresetToggle = useCallback((presetKey) => {
    setSelectedPresets(prev => 
      prev.includes(presetKey) 
        ? prev.filter(p => p !== presetKey)
        : [...prev, presetKey]
    );
  }, []);

  const handleSelectOutputDirectory = useCallback(async () => {
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

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  const handleAdvancedSettingsChange = useCallback((settings) => {
    setAdvancedSettings(settings);
  }, []);

  const handleSaveCustomPreset = useCallback(() => {
    setShowCustomPresetModal(true);
  }, []);

  const handleCustomPresetSave = useCallback((customPreset) => {
    const presetKey = `custom-${Date.now()}`;
    setPresets(prev => ({
      ...prev,
      [presetKey]: customPreset
    }));
    // Auto-select the new custom preset
    setSelectedPresets(prev => [...prev, presetKey]);
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
