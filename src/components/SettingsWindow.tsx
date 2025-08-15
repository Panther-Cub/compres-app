import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Monitor, Zap, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { macAnimations } from '../lib/animations';

interface SettingsWindowProps {
  onClose: () => void;
}

const SettingsWindow: React.FC<SettingsWindowProps> = ({ onClose }) => {
  const [startupSettings, setStartupSettings] = useState({
    openAtLogin: false,
    defaultWindow: 'overlay' as 'overlay' | 'main'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Auto-updater state
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateError, setUpdateError] = useState<string>('');

  useEffect(() => {
    loadSettings();
    
    // Set up auto-updater event listeners
    if (window.electronAPI) {
      window.electronAPI.onUpdateStatus((data: any) => {
        console.log('Update status received:', data);
        setUpdateStatus(data.status);
        
        if (data.status === 'downloading' && data.progress) {
          setUpdateProgress(data.progress);
        } else if (data.status === 'available') {
          setUpdateInfo(data);
        } else if (data.status === 'error') {
          setUpdateError(data.error || 'Update check failed');
        }
      });
    }
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getStartupSettings();
        setStartupSettings({
          openAtLogin: settings.openAtLogin,
          defaultWindow: settings.defaultWindow as 'overlay' | 'main'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveStartupSettings(startupSettings);
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

  // Auto-updater functions
  const handleCheckForUpdates = async () => {
    try {
      setUpdateStatus('checking');
      setUpdateError('');
      if (window.electronAPI) {
        await window.electronAPI.checkForUpdates();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateStatus('error');
      setUpdateError('Failed to check for updates');
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      setUpdateStatus('downloading');
      if (window.electronAPI) {
        await window.electronAPI.downloadUpdate();
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateStatus('error');
      setUpdateError('Failed to download update');
    }
  };

  const handleInstallUpdate = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.installUpdate();
      }
    } catch (error) {
      console.error('Error installing update:', error);
      setUpdateError('Failed to install update');
    }
  };

  return (
    <motion.div 
      className="h-full w-full bg-background text-foreground flex flex-col overflow-hidden"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      {/* Draggable Title Bar */}
      <div className="draggable-region fixed top-0 left-0 right-0 z-50 h-10 glass border-b border-border/20 flex items-center justify-between px-4 select-none flex-shrink-0">
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
                    Automatically start Compress when you log in to your Mac
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

          {/* Auto-Updater */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4" />
                App Updates
              </CardTitle>
              <CardDescription className="text-xs">
                Keep your app up to date with the latest features and improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {updateStatus === 'idle' && (
                  <Button 
                    onClick={handleCheckForUpdates}
                    className="w-full"
                    variant="outline"
                  >
                    Check for Updates
                  </Button>
                )}
                
                {updateStatus === 'checking' && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Checking for updates...
                  </div>
                )}
                
                {updateStatus === 'available' && updateInfo && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Update Available</span>
                        <span className="text-xs text-muted-foreground">v{updateInfo.version}</span>
                      </div>
                      {updateInfo.releaseNotes && (
                        <p className="text-xs text-muted-foreground mb-3">
                          {updateInfo.releaseNotes}
                        </p>
                      )}
                      <Button 
                        onClick={handleDownloadUpdate}
                        className="w-full"
                        size="sm"
                      >
                        Download Update
                      </Button>
                    </div>
                  </div>
                )}
                
                {updateStatus === 'downloading' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Downloading update...</span>
                      <span>{Math.round(updateProgress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${updateProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {updateStatus === 'downloaded' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          Update Downloaded
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        The update will be installed when you restart the app.
                      </p>
                      <Button 
                        onClick={handleInstallUpdate}
                        className="w-full"
                        size="sm"
                        variant="outline"
                      >
                        Restart & Install
                      </Button>
                    </div>
                  </div>
                )}
                
                {updateStatus === 'error' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">
                        Update Error
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {updateError}
                    </p>
                    <Button 
                      onClick={handleCheckForUpdates}
                      className="w-full"
                      size="sm"
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
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
      <div className="border-t border-border/50 p-4 bg-background/80 backdrop-blur-sm flex-shrink-0">
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
