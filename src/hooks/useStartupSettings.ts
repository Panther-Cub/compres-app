import { useState, useEffect } from 'react';

interface StartupSettings {
  openAtLogin: boolean;
  defaultWindow: 'overlay' | 'main';
  performanceSettings?: {
    maxConcurrentCompressions: number;
  };
  showRecommendedPresets: boolean;
}

export const useStartupSettings = () => {
  const [settings, setSettings] = useState<StartupSettings>({
    openAtLogin: false,
    defaultWindow: 'overlay',
    performanceSettings: {
      maxConcurrentCompressions: 2
    },
    showRecommendedPresets: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.electronAPI) {
          const startupSettings = await window.electronAPI.getStartupSettings();
          setSettings({
            ...startupSettings,
            defaultWindow: startupSettings.defaultWindow as 'overlay' | 'main'
          });
        }
      } catch (error) {
        console.error('Error loading startup settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading };
};
