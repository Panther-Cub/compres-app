import { useState, useEffect, useCallback } from 'react';
import type { UseSettingsReturn, Preset, AdvancedSettings, UserDefaults, PresetSettings } from '../types';
import { getDefaultPresets, PRESET_REGISTRY } from '../shared/presetRegistry';

// Default settings that will be used if no user preferences are saved
const DEFAULT_USER_SETTINGS: UserDefaults = {
  defaultPresets: getDefaultPresets(),
  defaultOutputDirectory: '',
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
  USER_DEFAULTS: 'compress-user-defaults',
  CURRENT_SETTINGS: 'compress-current-settings'
};

export const useSettings = (): UseSettingsReturn => {
  // Current session settings
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [presetSettings, setPresetSettings] = useState<Record<string, PresetSettings>>({});
  const [outputDirectory, setOutputDirectory] = useState<string>('');
  const [defaultOutputDirectory, setDefaultOutputDirectory] = useState<string>('');
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
        console.log('Loaded user defaults:', parsed);
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_USER_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Error loading user defaults:', error);
    }
    console.log('Using default user settings:', DEFAULT_USER_SETTINGS);
    return DEFAULT_USER_SETTINGS;
  }, []);

  // Save user defaults to localStorage
  const saveUserDefaults = useCallback((): void => {
    try {
      // Only save if user has actually set defaults (not just system defaults)
      const hasUserSetDefaults = defaultPresets.length > 0 || defaultOutputDirectory !== '';
      
      if (!hasUserSetDefaults) {
        console.log('No user defaults to save - skipping save operation');
        return;
      }
      
      const userDefaults: UserDefaults = {
        defaultPresets,
        defaultOutputDirectory,
        defaultPresetSettings,
        defaultAdvancedSettings,
        drawerOpen
      };
      console.log('Saving user defaults:', userDefaults);
      localStorage.setItem(STORAGE_KEYS.USER_DEFAULTS, JSON.stringify(userDefaults));
    } catch (error) {
      console.error('Error saving user defaults:', error);
    }
  }, [defaultPresets, defaultOutputDirectory, defaultPresetSettings, defaultAdvancedSettings, drawerOpen]);

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
      console.log('Applying user defaults to current session:', {
        defaultPresets: userDefaults.defaultPresets,
        defaultPresetSettings: userDefaults.defaultPresetSettings,
        defaultOutputDirectory: userDefaults.defaultOutputDirectory
      });
      setDefaultPresets(userDefaults.defaultPresets);
      setDefaultPresetSettings(userDefaults.defaultPresetSettings);
      setDefaultAdvancedSettings(userDefaults.defaultAdvancedSettings);
      setDrawerOpen(userDefaults.drawerOpen);

      // Only apply user defaults to current session if user has actually set them
      // Check if user has made any custom selections (not just system defaults)
      const hasUserSetDefaults = userDefaults.defaultPresets.length > 0 || userDefaults.defaultOutputDirectory !== '';
      
      if (hasUserSetDefaults) {
        console.log('User has set defaults - applying to current session');
        console.log('Default presets to apply:', userDefaults.defaultPresets);
        console.log('Default preset settings to apply:', userDefaults.defaultPresetSettings);
        setSelectedPresets(userDefaults.defaultPresets);
        setPresetSettings(userDefaults.defaultPresetSettings);
        setAdvancedSettings(userDefaults.defaultAdvancedSettings);
      } else {
        console.log('Fresh install or no user defaults set - starting with empty selection');
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
            console.log('Ensuring all selected presets have default settings');
            const updatedPresetSettings = { ...userDefaults.defaultPresetSettings };
            
            // Add default settings for any selected presets that don't have them
            userDefaults.defaultPresets.forEach(presetId => {
              if (!updatedPresetSettings[presetId]) {
                updatedPresetSettings[presetId] = { keepAudio: true };
                console.log('Added default settings for preset:', presetId);
              }
            });
            
            setPresetSettings(updatedPresetSettings);
          }
        } catch (err) {
          console.error('Error loading presets:', err);
        }
        
        // Set default output directory - use saved default if available, otherwise get from API
        if (userDefaults.defaultOutputDirectory) {
          setDefaultOutputDirectory(userDefaults.defaultOutputDirectory);
          setOutputDirectory(userDefaults.defaultOutputDirectory);
        } else {
          try {
            if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }
    const defaultDir = await window.electronAPI.getDefaultOutputDirectory();
            setDefaultOutputDirectory(defaultDir);
            setOutputDirectory(defaultDir);
          } catch (err) {
            console.error('Error getting default output directory:', err);
          }
        }
      } else {
        console.warn('Electron API not available - using default presets');
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
  }, [defaultPresets, defaultPresetSettings, defaultAdvancedSettings, defaultOutputDirectory, saveUserDefaults]);

  const handlePresetToggle = useCallback((presetKey: string): void => {
    console.log('Preset toggle called for:', presetKey);
    setSelectedPresets(prev => {
      const newSelection = prev.includes(presetKey) 
        ? prev.filter(p => p !== presetKey)
        : [...prev, presetKey];
      console.log('New preset selection:', newSelection);
      
      // If adding a preset, ensure it has default settings
      if (!prev.includes(presetKey) && newSelection.includes(presetKey)) {
        setPresetSettings(currentSettings => {
          if (!currentSettings[presetKey]) {
            console.log('Adding default settings for newly selected preset:', presetKey);
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
    console.log('Preset settings change for:', presetId, settings);
    setPresetSettings(prev => {
      const newSettings = {
        ...prev,
        [presetId]: settings
      };
      console.log('New preset settings:', newSettings);
      return newSettings;
    });
  }, []);

  const handleSelectOutputDirectory = useCallback(async (): Promise<void> => {
    try {
      // Check if we're in Electron environment
      if (!window.electronAPI) {
        console.warn('Electron API not available - cannot select output directory');
        return;
      }
      
      if (!window.electronAPI) {
      console.warn('Electron API not available');
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

  const handleCustomPresetSave = useCallback(async (customPreset: any): Promise<void> => {
    try {
      if (window.electronAPI) {
        // Save the custom preset via the API
        await window.electronAPI.addCustomPreset(customPreset.id, customPreset);
        
        // Reload all presets to include the new custom preset
        const updatedPresets = await window.electronAPI.getAllPresets();
        setPresets(updatedPresets);
        
        console.log('Custom preset saved successfully:', customPreset.id);
      }
    } catch (error) {
      console.error('Error saving custom preset:', error);
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
        
        console.log('Custom preset removed successfully:', presetId);
      }
    } catch (error) {
      console.error('Error removing custom preset:', error);
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
    presets,
    drawerOpen,
    showAdvanced,
    showCustomPresetModal,
    advancedSettings,
    handlePresetToggle,
    handleSelectOutputDirectory,
    setDefaultOutputDirectory: handleSetDefaultOutputDirectory,
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
