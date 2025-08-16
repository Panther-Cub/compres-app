import React, { useState } from 'react';
import { Star, Save, RotateCcw, X, Settings, Monitor, Smartphone, Apple, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui';
import { macAnimations, drawerVariants } from '../lib/animations';
import type { SettingsDrawerProps } from '../types';
import { Preset } from '../types';

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

type TabType = 'presets' | 'folder';

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
  const [activeTab, setActiveTab] = useState<TabType>('presets');

  // Group presets by category
  const categorizedPresets = Object.entries(presets).reduce((acc, [key, preset]) => {
    let category = preset.category || 'other';
    
    // Check if this is a custom preset
    if (key.startsWith('custom-')) {
      category = 'custom';
    }
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push([key, preset]);
    return acc;
  }, {} as Record<string, [string, Preset][]>);

  // Sort categories to show custom first, then others in alphabetical order
  const sortedCategories = Object.keys(categorizedPresets).sort((a, b) => {
    if (a === 'custom') return -1; // Custom always first
    if (b === 'custom') return 1;
    return a.localeCompare(b); // Alphabetical for others
  });

  const categoryIcons = {
    web: Monitor,
    social: Smartphone,
    mac: Apple,
    custom: Settings,
    other: Settings
  };

  const categoryNames = {
    web: 'Web',
    social: 'Social Media',
    mac: 'Mac Optimized',
    custom: 'Custom Presets',
    other: 'Other'
  };

  const tabs = [
    { id: 'presets' as TabType, label: 'Presets', icon: Settings },
    { id: 'folder' as TabType, label: 'Default Folder', icon: FolderOpen }
  ];

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
    <motion.div 
      className="absolute top-10 right-0 h-[calc(100vh-40px)] w-80 drawer glass border-l border-border/20 z-10"
      variants={drawerVariants}
      initial="closed"
      animate="open"
      exit="closed"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <motion.div 
          className="p-4 border-b border-border/20 flex-shrink-0"
          variants={macAnimations.slideUp}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Star className="w-4 h-4" />
              </motion.div>
              <h2 className="text-base font-medium">Startup Defaults</h2>
              <p className="text-xs text-muted-foreground">Control which presets are selected when the app starts</p>
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
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/20 flex-shrink-0">
          <div className="flex w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <motion.div 
            className="p-4 space-y-6"
            variants={macAnimations.slideUp}
            initial="initial"
            animate="animate"
          >
            {/* Presets Tab */}
            {activeTab === 'presets' && (
                              <motion.div 
                  className="space-y-6"
                  variants={macAnimations.slideUp}
                >
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Presets</h3>
                    <p className="text-xs text-muted-foreground">Select which presets should be automatically selected when you start the app.</p>
                  </div>
                  
                  {/* Categories */}
                {sortedCategories.map((category) => {
                  const categoryPresets = categorizedPresets[category];
                  const Icon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                  const categoryName = categoryNames[category as keyof typeof categoryNames] || 'Other';
                  
                  return (
                    <motion.div key={category} className="space-y-3" variants={macAnimations.slideUp}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {categoryName}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        <AnimatePresence>
                          {categoryPresets.map(([key, preset], index) => {
                            const isDefault = defaultPresets.includes(key);
                            const defaultSettings = defaultPresetSettings[key] || { keepAudio: true };
                            
                            return (
                              <motion.div
                                key={key}
                                className={`p-3 rounded-lg border ${
                                  isDefault ? 'border-primary/20 bg-primary/5' : 'border-border hover:border-border/60'
                                }`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05, duration: 0.2 }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-medium">{preset.name}</h4>
                                      <AnimatePresence>
                                        {isDefault && (
                                          <motion.button
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.95 }}
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
                                          </motion.button>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {preset.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    <motion.div 
                                      className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-colors ${
                                        isDefault
                                          ? 'bg-foreground border-foreground'
                                          : 'border-border'
                                      }`}
                                      onClick={() => handleDefaultPresetToggle(key)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.95 }}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Default Folder Tab */}
            {activeTab === 'folder' && (
              <motion.div 
                className="space-y-3"
                variants={macAnimations.slideUp}
              >
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Output Directory</h3>
                <p className="text-xs text-muted-foreground">Set the default folder where compressed videos will be saved.</p>
                
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                  </motion.div>
                  
                  <AnimatePresence>
                    {defaultOutputDirectory && (
                      <motion.div 
                        className="space-y-2 p-3 bg-muted/30 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-xs text-muted-foreground/70 font-medium">Default Location:</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {defaultOutputDirectory}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/20 space-y-3 flex-shrink-0">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Use the checkboxes above to set which presets are selected on startup
            </p>
            <div className="flex gap-2">
              <motion.div 
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveCurrentAsDefaults}
                  className="w-full text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save Current Session as Defaults
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToDefaults}
                  className="text-xs"
                  title="Reset to empty selection"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DefaultsDrawer;
