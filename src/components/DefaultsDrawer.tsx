import React from 'react';
import { Star, Save, RotateCcw, X } from 'lucide-react';
import { Button } from './ui/button';
import type { SettingsDrawerProps } from '../types';

interface DefaultsDrawerProps extends Pick<SettingsDrawerProps, 
  | 'defaultPresets'
  | 'setDefaultPresets'
  | 'defaultPresetSettings'
  | 'setDefaultPresetSettings'
  | 'defaultAdvancedSettings'
  | 'setDefaultAdvancedSettings'
  | 'saveUserDefaults'
  | 'resetToDefaults'
  | 'presets'
  | 'selectedPresets'
  | 'presetSettings'
  | 'advancedSettings'
  | 'defaultOutputDirectory'
  | 'onSetDefaultOutputDirectory'
> {
  isOpen: boolean;
  onClose: () => void;
}

const DefaultsDrawer: React.FC<DefaultsDrawerProps> = ({
  isOpen,
  onClose,
  presets,
  selectedPresets,
  presetSettings,
  advancedSettings,
  defaultPresets,
  setDefaultPresets,
  defaultPresetSettings,
  setDefaultPresetSettings,
  defaultAdvancedSettings,
  setDefaultAdvancedSettings,
  saveUserDefaults,
  resetToDefaults,
  defaultOutputDirectory,
  onSetDefaultOutputDirectory
}) => {
  const handleSaveCurrentAsDefaults = () => {
    setDefaultPresets(selectedPresets);
    setDefaultPresetSettings(presetSettings);
    setDefaultAdvancedSettings(advancedSettings);
    saveUserDefaults();
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
  };

  const handleDefaultPresetToggle = (presetId: string) => {
    const newDefaultPresets = defaultPresets.includes(presetId) 
      ? defaultPresets.filter(p => p !== presetId)
      : [...defaultPresets, presetId];
    setDefaultPresets(newDefaultPresets);
  };

  return (
    <div className={`absolute top-10 right-0 h-[calc(100vh-40px)] w-80 drawer bg-background border-l border-border/20 transition-transform duration-150 ease-out z-10 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <h2 className="text-base font-medium">Default Settings</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-6">
            {/* Default Presets */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Presets</h3>
              <p className="text-xs text-muted-foreground">Select which presets should be automatically selected when you start the app.</p>
              
              <div className="space-y-2">
                {Object.entries(presets).map(([key, preset]) => {
                  const isDefault = defaultPresets.includes(key);
                  const defaultSettings = defaultPresetSettings[key] || { keepAudio: true };
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border ${
                        isDefault ? 'border-primary/20 bg-primary/5' : 'border-border hover:border-border/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium">{preset.name}</h4>
                            {isDefault && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentSettings = defaultPresetSettings[key] || { keepAudio: true };
                                  setDefaultPresetSettings({
                                    ...defaultPresetSettings,
                                    [key]: { ...currentSettings, keepAudio: !currentSettings.keepAudio }
                                  });
                                }}
                                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                  defaultSettings?.keepAudio 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30' 
                                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                                }`}
                              >
                                {defaultSettings?.keepAudio ? 'AUDIO' : 'MUTED'}
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <div 
                            className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-colors ${
                              isDefault
                                ? 'bg-foreground border-foreground'
                                : 'border-border'
                            }`}
                            onClick={() => handleDefaultPresetToggle(key)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Default Output Directory */}
            <div className="space-y-3 pt-4 border-t border-border/20">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Output Directory</h3>
              <p className="text-xs text-muted-foreground">Set the default folder where compressed videos will be saved.</p>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetDefaultOutputDirectory(defaultOutputDirectory || '')}
                  className="w-full justify-start text-sm"
                >
                  <Star className="w-3 h-3 mr-2" />
                  {defaultOutputDirectory ? (
                    defaultOutputDirectory.includes('Compressed Videos') ? 
                      'Compressed Videos (Desktop)' : 
                      defaultOutputDirectory.split('/').pop()
                  ) : 'Set default folder'}
                </Button>
                
                {defaultOutputDirectory && (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground/70 font-medium">Default Location:</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {defaultOutputDirectory}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Current as Defaults */}
            <div className="space-y-3 pt-4 border-t border-border/20">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Save Current Settings</h3>
              <p className="text-xs text-muted-foreground">Save your current session settings as the new defaults.</p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveCurrentAsDefaults}
                  className="flex-1 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save Current as Defaults
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToDefaults}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultsDrawer;
