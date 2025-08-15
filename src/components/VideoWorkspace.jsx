import React, { useState } from 'react';
import { Play, ArrowLeft, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import VideoList from './VideoList';
import SettingsDrawer from './SettingsDrawer';
import { formatFileSize, formatDuration } from '../utils/formatters';

const VideoWorkspace = ({
  selectedFiles,
  fileInfos,
  onRemoveFile,
  onReset,
  onCompress,
  isCompressing,
  selectedPresets,
  drawerOpen,
  onToggleDrawer,
  settings
}) => {
  const [viewMode, setViewMode] = useState('list');

  return (
    <div className="relative h-full w-full">
      {/* Main Content Area */}
      <div className={cn(
        "h-full flex flex-col transition-all duration-150 ease-out",
        drawerOpen ? "pr-80" : "pr-0"
      )}>
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onReset}
              className="non-draggable text-sm"
            >
              <ArrowLeft className="w-3 h-3 mr-2" />
              Back
            </Button>
            <div className="h-4 w-px bg-border/30"></div>
            <span className="text-sm text-muted-foreground/70">
              {selectedFiles.length} video{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Settings button removed - use bottom bar button instead */}
          </div>
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-hidden">
          <VideoList
            selectedFiles={selectedFiles}
            fileInfos={fileInfos}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRemoveFile={onRemoveFile}
            formatFileSize={formatFileSize}
            formatDuration={formatDuration}
          />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-border/20 flex-shrink-0">
          <div className="flex gap-3">
            <Button 
              onClick={onCompress}
              disabled={isCompressing || selectedFiles.length === 0 || selectedPresets.length === 0 || !settings.outputDirectory}
              className="mac-button flex-1 non-draggable text-sm"
              size="sm"
            >
              <Play className="w-3 h-3 mr-2" />
              {isCompressing ? 'Compressing...' : 
               !settings.outputDirectory ? 'Select Output Folder' :
               `Compress ${selectedFiles.length} video${selectedFiles.length > 1 ? 's' : ''}`}
            </Button>
            <Button 
              variant="outline"
              onClick={onToggleDrawer}
              className="mac-button non-draggable text-sm"
              size="sm"
            >
              <Settings className="w-3 h-3 mr-2" />
              {drawerOpen ? 'Hide' : 'Show'} Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Drawer - Fixed Position */}
      <div className={cn(
        "absolute top-0 right-0 h-full w-80 drawer border-l border-border/20 transition-transform duration-150 ease-out z-10",
        drawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <SettingsDrawer
          drawerOpen={drawerOpen}
          onClose={() => onToggleDrawer()}
          presets={settings.presets}
          selectedPresets={settings.selectedPresets}
          onPresetToggle={settings.onPresetToggle}
          keepAudio={settings.keepAudio}
          onKeepAudioChange={settings.onKeepAudioChange}
          outputDirectory={settings.outputDirectory}
          onSelectOutputDirectory={settings.onSelectOutputDirectory}
          advancedSettings={settings.advancedSettings}
          onAdvancedSettingsChange={settings.onAdvancedSettingsChange}
          showAdvanced={settings.showAdvanced}
          onToggleAdvanced={settings.onToggleAdvanced}
          onSaveCustomPreset={settings.onSaveCustomPreset}
          selectedFiles={settings.selectedFiles}
          fileInfos={settings.fileInfos}
        />
      </div>
    </div>
  );
};

export default VideoWorkspace;
