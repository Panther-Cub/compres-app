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

      // Load presets
      if (window.electronAPI) {
        try {
          if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }
    const presetsData = await window.electronAPI.getPresets();
          setPresets(presetsData);
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
    setSelectedPresets(prev => 
      prev.includes(presetKey) 
        ? prev.filter(p => p !== presetKey)
        : [...prev, presetKey]
    );
  }, []);

  const handlePresetSettingsChange = useCallback((presetId: string, settings: PresetSettings): void => {
    setPresetSettings(prev => ({
      ...prev,
      [presetId]: settings
    }));
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

  const handleCustomPresetSave = useCallback((): void => {
    // This will be handled by the modal component
    setShowCustomPresetModal(false);
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
    setShowCustomPresetModal,
    // New persistent settings methods
    defaultPresets,
    setDefaultPresets,
    defaultPresetSettings,
    setDefaultPresetSettings,
    defaultAdvancedSettings,
    setDefaultAdvancedSettings,
    saveUserDefaults,
    resetToDefaults
  };
};
