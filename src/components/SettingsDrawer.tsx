import React, { useState } from 'react';
import { Settings, FolderOpen, Star, Save, RotateCcw, Sliders, Zap } from 'lucide-react';
import { Button } from './ui/button';
import AdvancedSettings from './AdvancedSettings';
import PresetRecommendations from './PresetRecommendations';
import type { SettingsDrawerProps } from '../types';

type TabType = 'presets' | 'output' | 'defaults' | 'advanced';

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ 
  presets, 
  selectedPresets, 
  onPresetToggle, 
  presetSettings,
  onPresetSettingsChange,
  outputDirectory, 
  onSelectOutputDirectory,
  defaultOutputDirectory,
  onSetDefaultOutputDirectory,
  drawerOpen,
  onToggleDrawer,
  advancedSettings,
  onAdvancedSettingsChange,
  showAdvanced,
  onToggleAdvanced,
  onSaveCustomPreset,
  selectedFiles,
  fileInfos,
  // New default settings props
  defaultPresets,
  setDefaultPresets,
  defaultPresetSettings,
  setDefaultPresetSettings,
  defaultAdvancedSettings,
  setDefaultAdvancedSettings,
  saveUserDefaults,
  resetToDefaults
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const isUsingDefault = outputDirectory === defaultOutputDirectory;

  const handleSaveCurrentAsDefaults = () => {
    setDefaultPresets(selectedPresets);
    setDefaultPresetSettings(presetSettings);
    setDefaultAdvancedSettings(advancedSettings);
    saveUserDefaults();
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
  };

  const handlePresetAudioToggle = (presetId: string) => {
    const currentSettings = presetSettings[presetId] || { keepAudio: true };
    onPresetSettingsChange(presetId, {
      ...currentSettings,
      keepAudio: !currentSettings.keepAudio
    });
  };

  const handleDefaultPresetToggle = (presetId: string) => {
    const newDefaultPresets = defaultPresets.includes(presetId) 
      ? defaultPresets.filter(p => p !== presetId)
      : [...defaultPresets, presetId];
    setDefaultPresets(newDefaultPresets);
  };

  const tabs = [
    { id: 'presets' as TabType, label: 'Presets', icon: Zap },
    { id: 'output' as TabType, label: 'Output', icon: FolderOpen },
    { id: 'defaults' as TabType, label: 'Defaults', icon: Star },
    { id: 'advanced' as TabType, label: 'Custom', icon: Sliders }
  ];

  return (
    <div className={`absolute top-0 right-0 h-full w-80 drawer bg-background border-l border-border/20 transition-transform duration-150 ease-out z-10 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4" />
            <h2 className="text-base font-medium">Settings</h2>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-6">
            {/* Presets Tab - Current Session Presets */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
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

                {/* Current Session Presets */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Session</h3>
                  <div className="space-y-2">
                    {Object.entries(presets).map(([key, preset]) => {
                      const isSelected = selectedPresets.includes(key);
                      const audioSettings = presetSettings[key] || { keepAudio: true };
                      return (
                        <div
                          key={key}
                          className={`preset-item p-3 rounded-lg cursor-pointer transition-all ${
                            isSelected ? 'selected' : ''
                          }`}
                          onClick={() => onPresetToggle(key)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium">{preset.name}</h4>
                                {isSelected && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePresetAudioToggle(key);
                                    }}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      audioSettings.keepAudio 
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40' 
                                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                                    }`}
                                    title={audioSettings.keepAudio ? 'Audio enabled - click to disable' : 'Audio disabled - click to enable'}
                                  >
                                    {audioSettings.keepAudio ? 'AUDIO' : 'MUTED'}
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {preset.description}
                              </p>
                            </div>
                            <div className={`w-3 h-3 rounded-full border-2 ml-3 transition-colors ${
                              isSelected
                                ? 'bg-foreground border-foreground'
                                : 'border-border'
                            }`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Output Tab - Current Session Output Only */}
            {activeTab === 'output' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Session Output</h3>
                  <p className="text-xs text-muted-foreground">Choose where to save compressed videos for this session.</p>
                  
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSelectOutputDirectory}
                      className="w-full justify-start text-sm"
                    >
                      <FolderOpen className="w-3 h-3 mr-2" />
                      {outputDirectory ? (
                        outputDirectory.includes('Compressed Videos') ? 
                          'Compressed Videos (Desktop)' : 
                          outputDirectory.split('/').pop()
                      ) : 'Select folder'}
                    </Button>
                    
                    {outputDirectory && (
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground/70 font-medium">Current Location:</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {outputDirectory}
                        </p>
                        {outputDirectory.includes('Compressed Videos') && (
                          <p className="text-xs text-green-600/70">
                            ✓ Organized by preset in separate folders
                          </p>
                        )}
                        {isUsingDefault && (
                          <p className="text-xs text-blue-600/70">
                            Using default directory
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Defaults Tab - Manage Default Presets and Output */}
            {activeTab === 'defaults' && (
              <div className="space-y-6">
                {/* Default Presets */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Presets</h3>
                  <p className="text-xs text-muted-foreground">Choose which presets are enabled by default when the app starts.</p>
                  
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
            )}

            {/* Advanced Tab - Custom Preset Creation */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Custom Preset</h3>
                  <p className="text-xs text-muted-foreground">Create a custom compression preset with advanced settings.</p>
                  
                  <AdvancedSettings
                    advancedSettings={advancedSettings}
                    onAdvancedSettingsChange={onAdvancedSettingsChange}
                    showAdvanced={true}
                    onToggleAdvanced={() => {}} // Always show in this tab
                    onSaveCustomPreset={onSaveCustomPreset}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;
