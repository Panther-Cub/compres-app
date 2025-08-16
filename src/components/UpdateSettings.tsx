import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Download, RefreshCw, Info, FolderOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  progress?: number;
  version?: string;
  releaseNotes?: string;
  error?: string;
  currentVersion?: string;
  downloadPath?: string;
}

const UpdateSettings: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);

  useEffect(() => {
    loadUpdateStatus();
    loadUpdateSettings();
    
    // Set up update status listener
    if (window.electronAPI) {
      const handleUpdateStatus = (data: UpdateStatus) => {
        setStatus(data);
      };

      window.electronAPI.onUpdateStatus(handleUpdateStatus);
      
      return () => {
        window.electronAPI.removeAllListeners('update-status');
      };
    }
  }, []);

  const loadUpdateSettings = async () => {
    try {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getUpdateSettings();
        setAutoUpdateEnabled(settings.autoUpdateEnabled);
      }
    } catch (error) {
      console.error('Error loading update settings:', error);
    }
  };

  const handleAutoUpdateToggle = async (enabled: boolean) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveUpdateSettings({ autoUpdateEnabled: enabled });
        setAutoUpdateEnabled(enabled);
      }
    } catch (error) {
      console.error('Error saving update settings:', error);
    }
  };

  const loadUpdateStatus = async () => {
    try {
      if (window.electronAPI) {
        const updateStatus = await window.electronAPI.getUpdateStatus();
        setStatus(updateStatus as UpdateStatus);
      }
    } catch (error) {
      console.error('Error loading update status:', error);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsLoading(true);
    try {
      console.log('Checking for updates...');
      if (window.electronAPI) {
        const result = await window.electronAPI.checkForUpdates();
        console.log('Update check result:', result);
        
        if (!result.success && result.error) {
          // Show error message to user
          alert(`Update check failed:\n\n${result.error}\n\nIf the GitHub releases page opened, you can manually check for updates there.`);
        }
        
        // Update the status immediately after checking
        await loadUpdateStatus();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      alert(`Error checking for updates: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.downloadUpdate();
      }
    } catch (error) {
      console.error('Error downloading update:', error);
    }
  };

  const handleInstallUpdate = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.installUpdate();
        
        if (result.success) {
          // The dialog will handle the installation instructions and app quit
          console.log('Installation dialog shown successfully');
        } else {
          alert(`Installation failed: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('Error installing update:', error);
      alert(`Installation failed: ${error.message || 'Unknown error'}`);
    }
  };





  const getStatusIcon = () => {
    if (!status) return <Info className="h-4 w-4 text-muted-foreground" />;
    
    switch (status.status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'available':
        return <Download className="h-4 w-4 text-green-500" />;
      case 'downloading':
        return <Download className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'downloaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'not-available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    if (!status) return 'Never checked';
    
    switch (status.status) {
      case 'checking':
        return 'Checking for updates...';
      case 'available':
        return `Update available: ${status.version}`;
      case 'downloading':
        return `Downloading update... ${status.progress ? Math.round(status.progress) : 0}%`;
      case 'downloaded':
        return `Update ready: ${status.version}`;
      case 'error':
        return `Error: ${status.error}`;
      case 'not-available':
        return 'Up to date';
      default:
        return 'Ready to check';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Update Status
          </CardTitle>
          <CardDescription>
            Current version: {status?.currentVersion || 'Unknown'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          
          {status?.status === 'downloading' && status.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Download Progress</span>
                <span>{Math.round(status.progress)}%</span>
              </div>
              <Progress value={status.progress} className="h-2" />
            </div>
          )}
          
          {status?.status === 'downloaded' && status.downloadPath && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Update Downloaded Successfully
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    The update has been downloaded to your Downloads folder. Click "Quit & Install" to quit the app and start the installer.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleCheckForUpdates} 
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check for Updates
            </Button>
            

            
            {status?.status === 'available' && (
              <Button onClick={handleDownloadUpdate} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Update
              </Button>
            )}
            
            {status?.status === 'downloaded' && (
              <Button onClick={handleInstallUpdate} size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Quit & Install
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Update Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Auto-Update Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-update" className="text-sm font-medium">
                Automatic Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically check for updates when the app starts
              </p>
            </div>
            <Switch
              id="auto-update"
              checked={autoUpdateEnabled}
              onCheckedChange={handleAutoUpdateToggle}
            />
          </div>
          
          {!autoUpdateEnabled && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <p>Automatic updates are disabled. You can still manually check for updates using the button above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Update Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Updates are automatically checked when the app starts (if enabled)</p>
            <p>• You'll be notified when updates are available</p>
            <p>• You can manually check for updates anytime</p>
            <p>• Updates are downloaded from GitHub releases to your Downloads folder</p>
            <p>• Since this is an unsigned app, you'll need to manually install updates</p>
            <p>• Installation involves replacing the app in your Applications folder</p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Manual Installation Required
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  This app is not code-signed, so updates must be installed manually. When you click "Quit & Install", 
                the app will quit and the installer will open automatically to replace the app in your Applications folder.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateSettings;
