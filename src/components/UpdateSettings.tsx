import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Download, RefreshCw, Info } from 'lucide-react';
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
        
        // Update the status immediately after checking
        await loadUpdateStatus();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
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
          // Show restart confirmation
          if (window.confirm('Update installed successfully! The app will restart to apply the changes. Click OK to restart now, or Cancel to restart later.')) {
            // The app should restart automatically
            await window.electronAPI.installUpdate();
          }
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
                Download
              </Button>
            )}
            
            {status?.status === 'downloaded' && (
              <Button onClick={handleInstallUpdate} size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Install & Restart
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
            <p>• Updates are downloaded from GitHub releases</p>
            <p>• You'll be notified when automatic updates are applied on startup</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateSettings;
