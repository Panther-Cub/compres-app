import React, { useState, useEffect } from 'react';
import { Settings, Zap, FolderOpen, Sliders, X, Globe, Share2, Monitor, Palette, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Tooltip, Input } from './ui';
import { PresetRecommendations } from './PresetRecommendations';
import AdvancedSettings from './AdvancedSettings';

import { useStartupSettings } from '../hooks/useStartupSettings';
import { themeManager } from '../lib/theme';
import type { SettingsDrawerProps } from '../types';

type TabType = 'presets' | 'output' | 'advanced';

// Category configuration with icons and display names
const presetCategories = {
  web: { name: 'Web', icon: Globe, description: 'Optimized for web streaming and embedding' },
  social: { name: 'Social', icon: Share2, description: 'Perfect for social media platforms' },
  mac: { name: 'Mac', icon: Monitor, description: 'Hardware accelerated for Mac users' },
  custom: { name: 'Custom', icon: Palette, description: 'Your custom compression presets' }
};

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
  outputFolderName,
  onOutputFolderNameChange,
  defaultOutputFolderName,
  onSetDefaultOutputFolderName,
  drawerOpen,
  onToggleDrawer,
  advancedSettings,
  onAdvancedSettingsChange,
  showAdvanced,
  onToggleAdvanced,
  onSaveCustomPreset,
  handleCustomPresetRemove,
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
  resetToDefaults,
  getFinalOutputPath
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('presets');

  const [activeCategory, setActiveCategory] = useState<string>('web');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    activePresets: false,
    webPresets: false,
    recommendations: false
  });
  const isUsingDefault = outputDirectory === defaultOutputDirectory;
  
  // Get startup settings to check if recommended presets should be shown
  const { settings: startupSettings } = useStartupSettings();

  // Force theme refresh when drawer opens to ensure proper theming
  useEffect(() => {
    if (drawerOpen) {
      // Force theme application to ensure SettingsDrawer gets the correct theme
      themeManager.forceApplyTheme();
      
      // Also force a re-render by updating a state
      const timer = setTimeout(() => {
        themeManager.forceApplyTheme();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [drawerOpen]);

  // Listen for theme changes and force refresh
  useEffect(() => {
    const unsubscribe = themeManager.subscribe(() => {
      if (drawerOpen) {
        // Force re-application of theme when it changes
        setTimeout(() => {
          themeManager.forceApplyTheme();
        }, 50);
      }
    });
    
    return unsubscribe;
  }, [drawerOpen]);

  const handlePresetAudioToggle = (presetId: string) => {
    const currentSettings = presetSettings[presetId] || { keepAudio: true };
    onPresetSettingsChange(presetId, {
      ...currentSettings,
      keepAudio: !currentSettings.keepAudio
    });
  };

  const handleRemovePreset = (presetId: string) => {
    // Remove from current session by toggling it off
    onPresetToggle(presetId);
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Group presets by category
  const presetsByCategory = Object.entries(presets).reduce((acc, [key, preset]) => {
    const category = preset.category || 'custom';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push([key, preset]);
    return acc;
  }, {} as Record<string, [string, any][]>);

  // Filter presets to show only active ones (those in selectedPresets)
  const activePresets = Object.entries(presets).filter(([key]) => selectedPresets.includes(key));

  const tabs = [
    { id: 'presets' as TabType, label: 'Presets', icon: Zap },
    { id: 'output' as TabType, label: 'Output', icon: FolderOpen },
    { id: 'advanced' as TabType, label: 'Custom', icon: Sliders }
  ];

  return (
    <>
      <div 
        className="absolute top-0 right-0 h-full w-80 drawer native-vibrancy text-foreground shadow-none z-10" 
        data-theme="auto"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <h2 className="text-base font-medium">Settings</h2>
              </div>
              <Tooltip id="close-settings-tooltip" content="Close settings">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleDrawer}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Tooltip>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 mt-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Tooltip key={tab.id} id={`${tab.id}-tab-tooltip`} content={tab.label}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-button flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-secondary text-secondary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-6">
              {/* Presets Tab - Categorized Presets */}
              {activeTab === 'presets' && (
                <div className="space-y-4">
                                {/* Preset Recommendations */}
              {startupSettings.showRecommendedPresets && (
                <PresetRecommendations
                  selectedPresets={selectedPresets}
                  onPresetSelect={onPresetToggle}
                  isCollapsed={collapsedSections.recommendations}
                  onToggleCollapsed={() => toggleSection('recommendations')}
                />
              )}

                  {/* Category Tabs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Preset Categories</h3>
                      <Tooltip id="defaults-settings-tooltip" content="Set default settings">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.electronAPI && window.electronAPI.createDefaultsWindow) {
                              window.electronAPI.createDefaultsWindow();
                            }
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Defaults
                        </Button>
                      </Tooltip>
                    </div>
                    
                    {/* Category Navigation */}
                    <div className="flex space-x-1">
                      {Object.entries(presetCategories).map(([categoryKey, category]) => {
                        const Icon = category.icon;
                        const isActive = activeCategory === categoryKey;
                        const hasPresets = presetsByCategory[categoryKey]?.length > 0;
                        
                        if (!hasPresets) return null;
                        
                        return (
                          <Tooltip key={categoryKey} id={`${categoryKey}-category-tooltip`} content={category.description}>
                            <button
                              onClick={() => setActiveCategory(categoryKey)}
                              className={`tab-button flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                                isActive
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {category.name}
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>

                                    {/* Category Content */}
                  <div className="space-y-3">
                    {Object.entries(presetCategories).map(([categoryKey, category]) => {
                      const categoryPresets = presetsByCategory[categoryKey] || [];
                      const isActiveCategory = activeCategory === categoryKey;
                      
                      if (!isActiveCategory || categoryPresets.length === 0) return null;
                      
                      // Make all categories collapsible for consistency
                      const sectionKey = categoryKey;
                      const isCollapsed = collapsedSections[sectionKey];
                      
                      return (
                        <div key={categoryKey} className="space-y-2">
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-lg p-3 transition-colors border border-border cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                            <category.icon className="w-4 h-4 text-muted-foreground" />
                            <h4 className="text-sm font-medium">
                              {category.name} Presets ({categoryPresets.length})
                            </h4>
                          </button>
                          
                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2 overflow-hidden"
                              >
                                <p className="text-xs text-muted-foreground px-2">{category.description}</p>
                                
                                <div className="space-y-2">
                                  {categoryPresets.map(([key, preset]) => {
                                    const isSelected = selectedPresets.includes(key);
                                    const audioSettings = presetSettings[key] || { keepAudio: true };
                                    
                                    return (
                                      <motion.div
                                        key={key}
                                                                                  className={`preset-item p-3 rounded-lg border cursor-pointer transition-all ${
                                                                                      isSelected 
                                              ? 'border-border bg-primary/5' 
                                              : 'border-border hover:bg-primary/5'
                                        }`}
                                        onClick={() => onPresetToggle(key)}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h5 className="text-sm font-medium">{preset.name}</h5>
                                              <div className="h-6 flex items-center">
                                                {isSelected && (
                                                  <Tooltip id={`audio-${key}-tooltip`} content={audioSettings.keepAudio ? 'Audio enabled - click to disable' : 'Audio disabled - click to enable'}>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePresetAudioToggle(key);
                                                      }}
                                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                                        audioSettings.keepAudio 
                                                          ? 'bg-success/10 text-success hover:bg-success/20' 
                                                          : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                                      }`}
                                                    >
                                                      {audioSettings.keepAudio ? 'AUDIO' : 'MUTED'}
                                                    </button>
                                                  </Tooltip>
                                                )}
                                              </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                              {preset.description}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 ml-3">
                                             <div 
                                               className={`w-3 h-3 rounded-full border-2 transition-colors ${
                                                 isSelected
                                                   ? 'bg-foreground border-foreground'
                                                   : 'border-border'
                                               }`}
                                             />
                                             {preset.category === 'custom' && (
                                               <Tooltip id={`delete-${key}-tooltip`} content="Delete custom preset">
                                                 <button
                                                   onClick={(e) => {
                                                     e.stopPropagation();
                                                     handleCustomPresetRemove(key);
                                                   }}
                                                   className="p-1 hover:bg-destructive/10 rounded transition-colors"
                                                 >
                                                   <X className="w-3 h-3 text-destructive" />
                                                 </button>
                                               </Tooltip>
                                             )}
                                           </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Presets Section */}
                  {activePresets.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <button
                        onClick={() => toggleSection('activePresets')}
                        className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-full p-2 transition-colors"
                      >
                        {collapsedSections.activePresets ? (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Active Presets ({activePresets.length})
                        </h3>
                      </button>
                      
                      <AnimatePresence>
                        {!collapsedSections.activePresets && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {activePresets.map(([key, preset]) => {
                              const audioSettings = presetSettings[key] || { keepAudio: true };
                              return (
                                <motion.div
                                  key={key}
                                  className="p-3 rounded-lg border border-border bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-sm font-medium">{preset.name}</h4>
                                          <div className="h-6 flex items-center">
                                            <Tooltip id={`active-audio-${key}-tooltip`} content={audioSettings.keepAudio ? 'Audio enabled - click to disable' : 'Audio disabled - click to enable'}>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handlePresetAudioToggle(key);
                                                }}
                                                className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                                                  audioSettings.keepAudio 
                                                    ? 'bg-success/10 text-success hover:bg-success/20' 
                                                    : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                                }`}
                                              >
                                                {audioSettings.keepAudio ? 'AUDIO' : 'MUTED'}
                                              </button>
                                            </Tooltip>
                                          </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                          {preset.description}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 ml-3">
                                        <Tooltip id={`remove-active-${key}-tooltip`} content="Remove from active presets">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemovePreset(key);
                                            }}
                                            className="p-1 hover:bg-muted rounded transition-colors cursor-pointer"
                                          >
                                            <X className="w-3 h-3 text-muted-foreground" />
                                          </button>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                </div>
              )}

              {/* Output Tab - Current Session Output Only */}
              {activeTab === 'output' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Output Directory</h3>
                    <p className="text-xs text-muted-foreground">Where compressed videos will be saved for this session.</p>
                    
                    <div className="space-y-3">
                      <Tooltip id="output-directory-tooltip" content="Select output directory for compressed videos">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onSelectOutputDirectory}
                          className="w-full justify-start"
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          {outputDirectory || 'Select output directory...'}
                        </Button>
                      </Tooltip>
                      
                      {isUsingDefault && (
                        <p className="text-xs text-muted-foreground">
                          Using default directory: {defaultOutputDirectory}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Output Folder Name</h3>
                    <p className="text-xs text-muted-foreground">Customize the name of the folder where compressed videos will be saved.</p>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label htmlFor="folder-name-input" className="text-xs font-medium text-muted-foreground">
                          Folder Name
                        </label>
                        <Input
                          id="folder-name-input"
                          type="text"
                          value={outputFolderName}
                          onChange={(e) => onOutputFolderNameChange(e.target.value).catch(console.error)}
                          placeholder="Enter folder name..."
                        />
                      </div>
                      
                      {/* Show the final output path */}
                      <div className="p-2 bg-muted/20 rounded text-xs text-muted-foreground">
                        <span className="font-medium">Final path:</span> {getFinalOutputPath?.() || 'No path available'}
                      </div>
                      
                      {outputFolderName === defaultOutputFolderName && (
                        <p className="text-xs text-muted-foreground">
                          Using default folder name: {defaultOutputFolderName}
                        </p>
                      )}
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
                      onToggleAdvanced={() => {}}
                      onSaveCustomPreset={onSaveCustomPreset}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </>
  );
};

export default SettingsDrawer;
