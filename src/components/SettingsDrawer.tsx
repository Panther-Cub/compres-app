import React, { useState } from 'react';
import { Settings, Zap, FolderOpen, Sliders, X, Globe, Share2, Monitor, Palette, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Tooltip } from './ui';
import { PresetRecommendations } from './PresetRecommendations';
import AdvancedSettings from './AdvancedSettings';
import DefaultsDrawer from './DefaultsDrawer';
import { useStartupSettings } from '../hooks/useStartupSettings';
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
  resetToDefaults
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [showDefaultsDrawer, setShowDefaultsDrawer] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('web');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    activePresets: false,
    webPresets: false,
    recommendations: false
  });
  const isUsingDefault = outputDirectory === defaultOutputDirectory;
  
  // Get startup settings to check if recommended presets should be shown
  const { settings: startupSettings } = useStartupSettings();

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
      <div className={`absolute top-0 right-0 h-full w-80 drawer bg-background shadow-none transition-transform duration-150 ease-out z-10 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/20 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
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
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Tooltip key={tab.id} id={`${tab.id}-tab-tooltip`} content={tab.label}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                          onClick={() => setShowDefaultsDrawer(true)}
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
                              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                      
                      // Special handling for Web category to make it collapsible
                      const isWebCategory = categoryKey === 'web';
                      const sectionKey = isWebCategory ? 'webPresets' : categoryKey;
                      const isCollapsed = collapsedSections[sectionKey];
                      
                      return (
                        <div key={categoryKey} className="space-y-2">
                          <button
                            onClick={() => isWebCategory ? toggleSection('webPresets') : undefined}
                            className={`flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-md p-2 transition-colors ${
                              isWebCategory ? 'cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            {isWebCategory && (
                              <>
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </>
                            )}
                            <category.icon className="w-4 h-4 text-muted-foreground" />
                            <h4 className="text-sm font-medium">
                              {category.name} Presets {isWebCategory && `(${categoryPresets.length})`}
                            </h4>
                          </button>
                          
                          {!isWebCategory && (
                            <p className="text-xs text-muted-foreground px-2">{category.description}</p>
                          )}
                          
                          <AnimatePresence>
                            {(!isWebCategory || !isCollapsed) && (
                                                             <motion.div
                                 initial={isWebCategory ? { height: 0, opacity: 0 } : undefined}
                                 animate={isWebCategory ? { height: 'auto', opacity: 1 } : undefined}
                                 exit={isWebCategory ? { height: 0, opacity: 0 } : undefined}
                                 transition={isWebCategory ? { duration: 0.2 } : undefined}
                                 className="space-y-2 overflow-hidden"
                               >
                                {isWebCategory && (
                                  <p className="text-xs text-muted-foreground px-2">{category.description}</p>
                                )}
                                
                                <div className="space-y-2">
                                  {categoryPresets.map(([key, preset]) => {
                                    const isSelected = selectedPresets.includes(key);
                                    const audioSettings = presetSettings[key] || { keepAudio: true };
                                    
                                    return (
                                      <motion.div
                                        key={key}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                          isSelected 
                                            ? 'border-primary/20 bg-primary/5 hover:bg-primary/10' 
                                            : 'border-border hover:border-border/60 bg-background hover:bg-muted/20'
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
                                                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40' 
                                                          : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
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
                                                   className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                 >
                                                   <X className="w-3 h-3 text-red-500" />
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
                    <div className="space-y-2 pt-4 border-t border-border/20">
                      <button
                        onClick={() => toggleSection('activePresets')}
                        className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-md p-2 transition-colors"
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
                                  className="p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer"
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
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40' 
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
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

      {/* Defaults Drawer */}
      <AnimatePresence>
        {showDefaultsDrawer && (
          <DefaultsDrawer
            isOpen={showDefaultsDrawer}
            onClose={() => setShowDefaultsDrawer(false)}
            presets={presets}
            selectedPresets={selectedPresets}
            presetSettings={presetSettings}
            advancedSettings={advancedSettings}
            defaultPresets={defaultPresets}
            setDefaultPresets={setDefaultPresets}
            defaultPresetSettings={defaultPresetSettings}
            setDefaultPresetSettings={setDefaultPresetSettings}
            defaultAdvancedSettings={defaultAdvancedSettings}
            setDefaultAdvancedSettings={setDefaultAdvancedSettings}
            saveUserDefaults={saveUserDefaults}
            resetToDefaults={resetToDefaults}
            defaultOutputDirectory={defaultOutputDirectory}
            onSetDefaultOutputDirectory={onSetDefaultOutputDirectory}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsDrawer;
