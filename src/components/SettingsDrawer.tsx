import React from 'react';
import { Settings, FolderOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import AdvancedSettings from './AdvancedSettings';
import PresetRecommendations from './PresetRecommendations';
import type { SettingsDrawerProps } from '../types';

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ 
  presets, 
  selectedPresets, 
  onPresetToggle, 
  keepAudio, 
  onKeepAudioChange, 
  outputDirectory, 
  onSelectOutputDirectory,
  drawerOpen,
  onToggleDrawer,
  advancedSettings,
  onAdvancedSettingsChange,
  showAdvanced,
  onToggleAdvanced,
  onSaveCustomPreset,
  selectedFiles,
  fileInfos
}) => {
  return (
    <div className={`absolute top-0 right-0 h-full w-80 drawer bg-background border-l border-border/20 transition-transform duration-150 ease-out z-10 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <h2 className="text-base font-medium">Settings</h2>
            </div>
          </div>

          {/* Output Directory */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Output</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectOutputDirectory}
                  className="flex-1 justify-start text-sm"
                >
                  <FolderOpen className="w-3 h-3 mr-2" />
                  {outputDirectory ? outputDirectory.split('/').pop() : 'Select folder'}
                </Button>
              </div>
              {outputDirectory && (
                <p className="text-sm text-muted-foreground truncate">
                  {outputDirectory}
                </p>
              )}
            </div>
          </div>

          {/* Preset Recommendations */}
          {selectedFiles.length > 0 && (
            <PresetRecommendations
              selectedFiles={selectedFiles}
              fileInfos={fileInfos}
              presets={presets}
              selectedPresets={selectedPresets}
              onPresetToggle={onPresetToggle}
            />
          )}

          {/* Audio Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Audio</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keep-audio"
                checked={keepAudio}
                onCheckedChange={onKeepAudioChange}
              />
              <label
                htmlFor="keep-audio"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Keep audio track
              </label>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Presets</h3>
            <div className="space-y-2">
              {Object.entries(presets).map(([key, preset]) => (
                <div
                  key={key}
                  className={`preset-item p-3 rounded-lg cursor-pointer transition-all ${
                    selectedPresets.includes(key) ? 'selected' : ''
                  }`}
                  onClick={() => onPresetToggle(key)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">{preset.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full border-2 ml-3 transition-colors ${
                      selectedPresets.includes(key)
                        ? 'bg-foreground border-foreground'
                        : 'border-border'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <AdvancedSettings
            advancedSettings={advancedSettings}
            onAdvancedSettingsChange={onAdvancedSettingsChange}
            showAdvanced={showAdvanced}
            onToggleAdvanced={onToggleAdvanced}
            onSaveCustomPreset={onSaveCustomPreset}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;
