import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Monitor, Zap, Save, Cpu, Download } from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Label,
  Switch,
  RadioGroup,
  RadioGroupItem
} from './ui';

import { macAnimations } from '../lib/animations';
import { themeManager } from '../lib/theme';
import type { Theme } from '../types';

interface SettingsWindowProps {
  onClose: () => void;
}

const SettingsWindow: React.FC<SettingsWindowProps> = ({ onClose }) => {
  const [startupSettings, setStartupSettings] = useState({
    openAtLogin: false,
    defaultWindow: 'overlay' as 'overlay' | 'main',
    showRecommendedPresets: true
  });
  const [performanceSettings, setPerformanceSettings] = useState({
    maxConcurrentCompressions: 2,
    enableThermalThrottling: true,
    thermalThrottleThreshold: 85,
    adaptiveConcurrency: true,
    hardwareAccelerationPriority: 'thermal' as 'thermal' | 'speed' | 'balanced',
    maxCpuUsage: 70,
    enablePauseOnOverheat: true
  });
  const [updateSettings, setUpdateSettings] = useState({
    autoUpdateEnabled: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  


  useEffect(() => {
    loadSettings();
  }, []);

  // Force theme application when SettingsWindow loads
  useEffect(() => {
    // Force apply theme immediately to ensure it's correct
    themeManager.forceApplyTheme();
    
    // Expose themeManager globally for IPC access
    (window as any).themeManager = themeManager;
    
    // Also get the current theme from the main window if available
    const getCurrentTheme = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getCurrentTheme) {
          const currentTheme = await window.electronAPI.getCurrentTheme();
          if (currentTheme && ['light', 'dark', 'system'].includes(currentTheme)) {
            themeManager.setTheme(currentTheme as Theme);
          }
        }
      } catch (error) {
        console.error('Failed to get current theme:', error);
      }
    };
    
    getCurrentTheme();
    
    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe(() => {
      // Force re-application of theme when it changes
      setTimeout(() => {
        themeManager.forceApplyTheme();
      }, 50);
    });
    
    return unsubscribe;
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getStartupSettings();
        setStartupSettings({
          openAtLogin: settings.openAtLogin,
          defaultWindow: settings.defaultWindow as 'overlay' | 'main',
          showRecommendedPresets: settings.showRecommendedPresets ?? true
        });
        
        // Load performance settings if available
        if (settings.performanceSettings) {
          setPerformanceSettings({
            maxConcurrentCompressions: settings.performanceSettings.maxConcurrentCompressions ?? 2,
            enableThermalThrottling: (settings.performanceSettings as any).enableThermalThrottling ?? true,
            thermalThrottleThreshold: (settings.performanceSettings as any).thermalThrottleThreshold ?? 85,
            adaptiveConcurrency: (settings.performanceSettings as any).adaptiveConcurrency ?? true,
            hardwareAccelerationPriority: (settings.performanceSettings as any).hardwareAccelerationPriority ?? 'thermal',
            maxCpuUsage: (settings.performanceSettings as any).maxCpuUsage ?? 70,
            enablePauseOnOverheat: (settings.performanceSettings as any).enablePauseOnOverheat ?? true
          });
        }
        
        // Load update settings if available
        if (window.electronAPI && window.electronAPI.getUpdateSettings) {
          try {
            const updateSettingsData = await window.electronAPI.getUpdateSettings();
            setUpdateSettings({
              autoUpdateEnabled: updateSettingsData.autoUpdateEnabled ?? true
            });
          } catch (error) {
            console.error('Error loading update settings:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveStartupSettings({
          ...startupSettings,
          performanceSettings
        });
        
        // Save update settings
        if (window.electronAPI && window.electronAPI.saveUpdateSettings) {
          await window.electronAPI.saveUpdateSettings(updateSettings);
        }
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: keyof typeof startupSettings, value: any) => {
    setStartupSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleStartupToggle = (checked: boolean) => {
    handleSettingChange('openAtLogin', checked);
  };

  const handleDefaultWindowChange = (value: string) => {
    handleSettingChange('defaultWindow', value as 'overlay' | 'main');
  };

  const handlePerformanceSettingChange = (key: keyof typeof performanceSettings, value: any) => {
    setPerformanceSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleRecommendedPresetsToggle = (checked: boolean) => {
    handleSettingChange('showRecommendedPresets', checked);
  };

  const handleUpdateSettingChange = (key: keyof typeof updateSettings, value: any) => {
    setUpdateSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleAutoUpdateToggle = (checked: boolean) => {
    handleUpdateSettingChange('autoUpdateEnabled', checked);
  };



  return (
    <motion.div 
      className="h-full w-full native-vibrancy text-foreground flex flex-col overflow-hidden"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      {/* Draggable Title Bar */}
              <div className="draggable-region sticky top-0 z-50 h-10 border-b border-border flex items-center justify-between px-4 select-none flex-shrink-0">
        <div className="flex items-center gap-3 pl-20">
          <Settings className="w-3 h-3 text-foreground/70" />
          <span className="text-[0.625rem] font-normal text-foreground/70">Settings</span>
        </div>
      </div>

      {/* Content with top padding for fixed header */}
      <div className="flex-1 overflow-y-auto pt-10">
        <div className="p-6 space-y-6">
          {/* Startup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4" />
                Startup Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Configure how the app behaves when your Mac starts up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="startup-toggle" className="text-sm">Open at Login</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically start Compres when you log in to your Mac
                  </p>
                </div>
                <Switch
                  id="startup-toggle"
                  checked={startupSettings.openAtLogin}
                  onCheckedChange={handleStartupToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Cpu className="w-4 h-4" />
                Performance Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Configure how the app uses your system resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <Label htmlFor="concurrency-slider">Max Concurrent Compressions</Label>
                  <span className="text-muted-foreground">{performanceSettings.maxConcurrentCompressions}</span>
                </div>
                <input
                  id="concurrency-slider"
                  type="range"
                  min="1"
                  max="6"
                  value={performanceSettings.maxConcurrentCompressions}
                  onChange={(e) => handlePerformanceSettingChange('maxConcurrentCompressions', parseInt(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 (Conservative)</span>
                  <span>6 (Aggressive)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher values compress more videos simultaneously but use more system resources
                </p>
              </div>

              {/* Thermal Management */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="thermal-throttling" className="text-sm">Enable Thermal Throttling</Label>
                  <Switch
                    id="thermal-throttling"
                    checked={performanceSettings.enableThermalThrottling}
                    onCheckedChange={(checked) => handlePerformanceSettingChange('enableThermalThrottling', checked)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically reduce compression load when system temperature is high
                </p>

                {performanceSettings.enableThermalThrottling && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Label htmlFor="thermal-threshold">Thermal Threshold (°C)</Label>
                        <span className="text-muted-foreground">{performanceSettings.thermalThrottleThreshold}°C</span>
                      </div>
                      <input
                        id="thermal-threshold"
                        type="range"
                        min="70"
                        max="95"
                        value={performanceSettings.thermalThrottleThreshold}
                        onChange={(e) => handlePerformanceSettingChange('thermalThrottleThreshold', parseInt(e.target.value))}
                        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>70°C (Safe)</span>
                        <span>95°C (Hot)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Label htmlFor="cpu-usage">Max CPU Usage (%)</Label>
                        <span className="text-muted-foreground">{performanceSettings.maxCpuUsage}%</span>
                      </div>
                      <input
                        id="cpu-usage"
                        type="range"
                        min="50"
                        max="90"
                        value={performanceSettings.maxCpuUsage}
                        onChange={(e) => handlePerformanceSettingChange('maxCpuUsage', parseInt(e.target.value))}
                        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>50% (Conservative)</span>
                        <span>90% (Aggressive)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="adaptive-concurrency" className="text-sm">Adaptive Concurrency</Label>
                      <Switch
                        id="adaptive-concurrency"
                        checked={performanceSettings.adaptiveConcurrency}
                        onCheckedChange={(checked) => handlePerformanceSettingChange('adaptiveConcurrency', checked)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically adjust concurrent compressions based on system load
                    </p>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="pause-overheat" className="text-sm">Pause on Overheat</Label>
                      <Switch
                        id="pause-overheat"
                        checked={performanceSettings.enablePauseOnOverheat}
                        onCheckedChange={(checked) => handlePerformanceSettingChange('enablePauseOnOverheat', checked)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pause compression when system temperature is critically high
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interface Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Settings className="w-4 h-4" />
                Interface Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Customize the app interface and user experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recommended-presets-toggle" className="text-sm">Show Recommended Presets</Label>
                  <p className="text-xs text-muted-foreground">
                    Display AI-powered preset recommendations in the settings sidebar
                  </p>
                </div>
                <Switch
                  id="recommended-presets-toggle"
                  checked={startupSettings.showRecommendedPresets}
                  onCheckedChange={handleRecommendedPresetsToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Update Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Download className="w-4 h-4" />
                Update Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Configure how the app handles software updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-update-toggle" className="text-sm">Automatic Update Checks</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically check for updates when the app starts
                  </p>
                </div>
                <Switch
                  id="auto-update-toggle"
                  checked={updateSettings.autoUpdateEnabled}
                  onCheckedChange={handleAutoUpdateToggle}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Manual Update Check</Label>
                    <p className="text-xs text-muted-foreground">
                      Check for updates now
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      setIsCheckingUpdates(true);
                      setUpdateCheckResult(null);
                      try {
                        if (window.electronAPI && window.electronAPI.checkForUpdates) {
                          const result = await window.electronAPI.checkForUpdates();
                          if (result.success) {
                            if (result.data) {
                              setUpdateCheckResult({
                                type: 'success',
                                message: `Update available: Version ${result.data.version}`
                              });
                            } else {
                              setUpdateCheckResult({
                                type: 'info',
                                message: 'You have the latest version'
                              });
                            }
                          } else {
                            setUpdateCheckResult({
                              type: 'error',
                              message: result.error || 'Failed to check for updates'
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error checking for updates:', error);
                        setUpdateCheckResult({
                          type: 'error',
                          message: 'Failed to check for updates'
                        });
                                              } finally {
                          setIsCheckingUpdates(false);
                          // Clear the result after 5 seconds
                          setTimeout(() => {
                            setUpdateCheckResult(null);
                          }, 5000);
                        }
                    }}
                    disabled={isCheckingUpdates}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                    {isCheckingUpdates ? 'Checking...' : 'Check Now'}
                  </Button>
                </div>

                {/* Update check result */}
                {updateCheckResult && (
                  <div className={`p-2 rounded text-xs ${
                    updateCheckResult.type === 'success' 
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                      : updateCheckResult.type === 'error'
                      ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                      : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}>
                    {updateCheckResult.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Default Window */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Monitor className="w-4 h-4" />
                Default Window
              </CardTitle>
              <CardDescription className="text-xs">
                Choose which window appears when you start the app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={startupSettings.defaultWindow}
                onValueChange={handleDefaultWindowChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overlay" id="overlay" />
                  <Label htmlFor="overlay" className="flex-1">
                    <div>
                      <div className="font-medium text-sm">Overlay Drop Zone</div>
                      <div className="text-xs text-muted-foreground">
                        Quick access to drop videos for compression
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="main" id="main" />
                  <Label htmlFor="main" className="flex-1">
                    <div>
                      <div className="font-medium text-sm">Main Window</div>
                      <div className="text-xs text-muted-foreground">
                        Full interface with all compression options
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>



          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">About Settings</p>
                  <p className="text-xs text-muted-foreground">
                    These settings are saved locally on your Mac and will persist between app launches. 
                    You can access settings anytime from the tray menu.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
              <div className="border-t border-border p-4 modal flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsWindow;
