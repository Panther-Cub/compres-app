import { useState, useEffect, useCallback } from 'react';
import type { UseSettingsReturn, Preset, AdvancedSettings, UserDefaults, PresetSettings } from '../types';
import { getDefaultPresets, PRESET_REGISTRY } from '../shared/presetRegistry';

// Default settings that will be used if no user preferences are saved
const DEFAULT_USER_SETTINGS: UserDefaults = {
  defaultPresets: getDefaultPresets(),
  defaultOutputDirectory: '',
  defaultOutputFolderName: 'Compressed Videos',
  defaultPresetSettings: {},
  defaultAdvancedSettings: {
    crf: 25,
    videoBitrate: '1500k',
    audioBitrate: '96k',
    fps: 30,
    resolution: '1280x720',
    preserveAspectRatio: true,
    twoPass: false,
    fastStart: true,
    optimizeForWeb: true
  },
  drawerOpen: true
};

// Storage keys for localStorage
const STORAGE_KEYS = {
  USER_DEFAULTS: 'compres-user-defaults',
  CURRENT_SETTINGS: 'compres-current-settings'
};

export const useSettings = (): UseSettingsReturn => {
  // Current session settings
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [presetSettings, setPresetSettings] = useState<Record<string, PresetSettings>>({});
  const [outputDirectory, setOutputDirectory] = useState<string>('');
  const [defaultOutputDirectory, setDefaultOutputDirectory] = useState<string>('');
  const [outputFolderName, setOutputFolderName] = useState<string>(DEFAULT_USER_SETTINGS.defaultOutputFolderName);
  const [defaultOutputFolderName, setDefaultOutputFolderName] = useState<string>(DEFAULT_USER_SETTINGS.defaultOutputFolderName);
  const [presets, setPresets] = useState<Record<string, Preset>>({});
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showCustomPresetModal, setShowCustomPresetModal] = useState<boolean>(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(DEFAULT_USER_SETTINGS.defaultAdvancedSettings);

  // User default settings (persistent)
  const [defaultPresets, setDefaultPresets] = useState<string[]>(DEFAULT_USER_SETTINGS.defaultPresets);
  const [defaultPresetSettings, setDefaultPresetSettings] = useState<Record<string, PresetSettings>>(DEFAULT_USER_SETTINGS.defaultPresetSettings);
  const [defaultAdvancedSettings, setDefaultAdvancedSettings] = useState<AdvancedSettings>(DEFAULT_USER_SETTINGS.defaultAdvancedSettings);

  // Load user defaults from localStorage
  const loadUserDefaults = useCallback((): UserDefaults => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_DEFAULTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_USER_SETTINGS, ...parsed };
      }
    } catch (error) {
      // Error loading user defaults
    }
    return DEFAULT_USER_SETTINGS;
  }, []);

  // Save user defaults to localStorage
  const saveUserDefaults = useCallback((): void => {
    try {
      // Only save if user has actually set defaults (not just system defaults)
      const hasUserSetDefaults = defaultPresets.length > 0 || defaultOutputDirectory !== '';
      
      if (!hasUserSetDefaults) {
        return;
      }
      
      const userDefaults: UserDefaults = {
        defaultPresets,
        defaultOutputDirectory,
        defaultOutputFolderName,
        defaultPresetSettings,
        defaultAdvancedSettings,
        drawerOpen
      };
      localStorage.setItem(STORAGE_KEYS.USER_DEFAULTS, JSON.stringify(userDefaults));
    } catch (error) {
      // Error saving user defaults
    }
  }, [defaultPresets, defaultOutputDirectory, defaultOutputFolderName, defaultPresetSettings, defaultAdvancedSettings, drawerOpen]);

  // Reset to default settings
  const resetToDefaults = useCallback((): void => {
    // Check if user has actually set defaults
    const hasUserSetDefaults = defaultPresets.length > 0 || defaultOutputDirectory !== '';
    
    if (hasUserSetDefaults) {
      // Reset to user's saved defaults
      setSelectedPresets(defaultPresets);
      setPresetSettings(defaultPresetSettings);
      setAdvancedSettings(defaultAdvancedSettings);
    } else {
      // Reset to empty selection (no user defaults set)
      setSelectedPresets([]);
      setPresetSettings({});
      setAdvancedSettings(DEFAULT_USER_SETTINGS.defaultAdvancedSettings);
    }
    setDrawerOpen(DEFAULT_USER_SETTINGS.drawerOpen);
  }, [defaultPresets, defaultPresetSettings, defaultAdvancedSettings, defaultOutputDirectory]);

  // Initialize settings on mount
  useEffect(() => {
    const initializeSettings = async (): Promise<void> => {
      // Load user defaults
      const userDefaults = loadUserDefaults();
      setDefaultPresets(userDefaults.defaultPresets);
      setDefaultPresetSettings(userDefaults.defaultPresetSettings);
      setDefaultAdvancedSettings(userDefaults.defaultAdvancedSettings);
      setDefaultOutputFolderName(userDefaults.defaultOutputFolderName);
      setOutputFolderName(userDefaults.defaultOutputFolderName);
      setDrawerOpen(userDefaults.drawerOpen);

      // Only apply user defaults to current session if user has actually set them
      // Check if user has made any custom selections (not just system defaults)
      const hasUserSetDefaults = userDefaults.defaultPresets.length > 0 || userDefaults.defaultOutputDirectory !== '';
      
      if (hasUserSetDefaults) {
        setSelectedPresets(userDefaults.defaultPresets);
        setPresetSettings(userDefaults.defaultPresetSettings);
        setAdvancedSettings(userDefaults.defaultAdvancedSettings);
      } else {
        // Start with empty selection for fresh installs
        setSelectedPresets([]);
        setPresetSettings({});
        setAdvancedSettings(DEFAULT_USER_SETTINGS.defaultAdvancedSettings);
      }

      // Load presets first
      if (window.electronAPI) {
        try {
          if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }
    const presetsData = await window.electronAPI.getAllPresets();
          setPresets(presetsData);
          
          // After presets are loaded, ensure all selected presets have default settings
          if (hasUserSetDefaults) {
            // Ensuring all selected presets have default settings
            const updatedPresetSettings = { ...userDefaults.defaultPresetSettings };
            
            // Add default settings for any selected presets that don't have them
            userDefaults.defaultPresets.forEach(presetId => {
              if (!updatedPresetSettings[presetId]) {
                updatedPresetSettings[presetId] = { keepAudio: true };
              }
            });
            
            setPresetSettings(updatedPresetSettings);
          }
        } catch (err) {
          // Error loading presets
        }
        
        // Set default output directory - use saved default if available, otherwise get from API
        if (userDefaults.defaultOutputDirectory) {
          setDefaultOutputDirectory(userDefaults.defaultOutputDirectory);
          setOutputDirectory(userDefaults.defaultOutputDirectory);
        } else {
          try {
            if (!window.electronAPI) {
      return;
    }
    const defaultDir = await window.electronAPI.getDefaultOutputDirectory(userDefaults.defaultOutputFolderName);
            setDefaultOutputDirectory(defaultDir);
            setOutputDirectory(defaultDir);
          } catch (err) {
            // Error getting default output directory
          }
        }
      } else {
        // Using default presets for browser mode
        // Set some default presets for browser mode using the registry
        const browserPresets: Record<string, Preset> = {};
        Object.entries(PRESET_REGISTRY).forEach(([key, metadata]) => {
          browserPresets[key] = {
            id: key,
            name: metadata.name,
            description: metadata.description,
            crf: 25, // Default CRF value
            videoBitrate: '1500k', // Default bitrate
            audioBitrate: '96k', // Default audio bitrate
            fps: 30, // Default FPS
            resolution: '1280x720', // Default resolution
            keepAudio: metadata.defaultKeepAudio
          };
        });
        setPresets(browserPresets);
      }
    };
    initializeSettings();
  }, [loadUserDefaults]);

  // Auto-save user defaults when they change
  useEffect(() => {
    // Only save if user has actually set defaults (not just system defaults)
    const hasUserSetDefaults = defaultPresets.length > 0 || defaultOutputDirectory !== '';
    
    if (hasUserSetDefaults) {
      saveUserDefaults();
    }
  }, [defaultPresets, defaultPresetSettings, defaultAdvancedSettings, defaultOutputDirectory, defaultOutputFolderName, saveUserDefaults]);

  const handlePresetToggle = useCallback((presetKey: string): void => {
    setSelectedPresets(prev => {
      const newSelection = prev.includes(presetKey) 
        ? prev.filter(p => p !== presetKey)
        : [...prev, presetKey];
      
      // If adding a preset, ensure it has default settings
      if (!prev.includes(presetKey) && newSelection.includes(presetKey)) {
        setPresetSettings(currentSettings => {
          if (!currentSettings[presetKey]) {
            return {
              ...currentSettings,
              [presetKey]: { keepAudio: true }
            };
          }
          return currentSettings;
        });
      }
      
      return newSelection;
    });
  }, []);

  const handlePresetSettingsChange = useCallback((presetId: string, settings: PresetSettings): void => {
    setPresetSettings(prev => {
      const newSettings = {
        ...prev,
        [presetId]: settings
      };
      return newSettings;
    });
  }, []);

  const handleSelectOutputDirectory = useCallback(async (): Promise<void> => {
    try {
      // Check if we're in Electron environment
      if (!window.electronAPI) {
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

  const handleSetDefaultOutputDirectory = useCallback((directory: string): void => {
    setDefaultOutputDirectory(directory);
    setOutputDirectory(directory);
  }, []);

  const handleOutputFolderNameChange = useCallback(async (name: string): Promise<void> => {
    setOutputFolderName(name);
    
    // Update the output directory to use the new folder name
    if (window.electronAPI && name.trim()) {
      try {
        const newOutputDir = await window.electronAPI.getDefaultOutputDirectory(name.trim());
        setOutputDirectory(newOutputDir);
      } catch (error) {
        console.error('Error updating output directory with new folder name:', error);
      }
    }
  }, []);

  const handleSetDefaultOutputFolderName = useCallback((name: string): void => {
    setDefaultOutputFolderName(name);
    setOutputFolderName(name);
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

  const handleCustomPresetSave = useCallback(async (customPreset: Preset): Promise<void> => {
    try {
      if (window.electronAPI) {
        // Save the custom preset via the API
        await window.electronAPI.addCustomPreset(customPreset.id, customPreset);
        
        // Reload all presets to include the new custom preset
        const updatedPresets = await window.electronAPI.getAllPresets();
        setPresets(updatedPresets);
        
        // Custom preset saved successfully
      }
    } catch (error) {
      // Error saving custom preset
    }
    
    setShowCustomPresetModal(false);
  }, []);

  const handleCustomPresetRemove = useCallback(async (presetId: string): Promise<void> => {
    try {
      if (window.electronAPI) {
        // Remove the custom preset via the API
        await window.electronAPI.removeCustomPreset(presetId);
        
        // Reload all presets to reflect the removal
        const updatedPresets = await window.electronAPI.getAllPresets();
        setPresets(updatedPresets);
        
        // Remove from selected presets if it was selected
        setSelectedPresets(prev => prev.filter(p => p !== presetId));
        
        // Custom preset removed successfully
      }
    } catch (error) {
      // Error removing custom preset
    }
  }, []);

  const handleReorderPresets = useCallback((newOrder: string[]): void => {
    // Update the selected presets order
    setSelectedPresets(newOrder);
  }, []);

  return {
    selectedPresets,
    presetSettings,
    setPresetSettings: handlePresetSettingsChange,
    outputDirectory,
    defaultOutputDirectory,
    outputFolderName,
    defaultOutputFolderName,
    presets,
    drawerOpen,
    showAdvanced,
    showCustomPresetModal,
    advancedSettings,
    handlePresetToggle,
    handleSelectOutputDirectory,
    setDefaultOutputDirectory: handleSetDefaultOutputDirectory,
    handleOutputFolderNameChange,
    setDefaultOutputFolderName: handleSetDefaultOutputFolderName,
    toggleDrawer,
    toggleAdvanced,
    handleAdvancedSettingsChange,
    handleSaveCustomPreset,
    handleCustomPresetSave,
    handleCustomPresetRemove,
    setShowCustomPresetModal,
    // New persistent settings methods
    defaultPresets,
    setDefaultPresets,
    defaultPresetSettings,
    setDefaultPresetSettings,
    defaultAdvancedSettings,
    setDefaultAdvancedSettings,
    saveUserDefaults,
    resetToDefaults,
    handleReorderPresets
  };
};
