import React, { useState, useEffect } from 'react';
import { Star, Save, RotateCcw, Settings, Monitor, Smartphone, Apple, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui';
import { macAnimations } from '../lib/animations';
import { Preset } from '../types';

interface DefaultsWindowProps {
  onClose: () => void;
}

type TabType = 'presets' | 'folder';

const DefaultsWindow: React.FC<DefaultsWindowProps> = ({ onClose }) => {
  const [presets, setPresets] = useState<Record<string, Preset>>({});
  const [defaultPresets, setDefaultPresets] = useState<string[]>([]);
  const [defaultOutputDirectory, setDefaultOutputDirectory] = useState<string>('');
  const [defaultOutputFolderName, setDefaultOutputFolderName] = useState<string>('Compressed Videos');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<TabType>('presets');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.electronAPI) {
          const allPresets = await window.electronAPI.getAllPresets();
          setPresets(allPresets);
          
          // Get the Desktop directory as the ultimate default
          const homeDir = await window.electronAPI.getDefaultOutputDirectory();
          
          // Load saved defaults from localStorage
          const savedDefaults = localStorage.getItem('compres-user-defaults');
          if (savedDefaults) {
            const parsed = JSON.parse(savedDefaults);
            setDefaultPresets(parsed.defaultPresets || []);
            setDefaultOutputDirectory(parsed.defaultOutputDirectory || homeDir);
            setDefaultOutputFolderName(parsed.defaultOutputFolderName || 'Compressed Videos');
          } else {
            // No saved defaults, use Desktop as the ultimate default
            setDefaultOutputDirectory(homeDir);
          }
        }
      } catch (error) {
        console.error('Error loading defaults data:', error);
      }
    };
    
    loadData();
  }, []);

  const handleSaveDefaults = async () => {
    try {
      setSaveStatus('saving');
      
      // Save defaults to localStorage
      const defaults = {
        defaultPresets,
        defaultOutputDirectory,
        defaultOutputFolderName
      };
      localStorage.setItem('compres-user-defaults', JSON.stringify(defaults));
      
      // Notify other windows
      if (window.electronAPI && window.electronAPI.notifyUserDefaultsUpdated) {
        window.electronAPI.notifyUserDefaultsUpdated(defaults);
      }
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      // Reset to ultimate defaults
      setDefaultPresets([]);
      
      // Get Desktop as the ultimate default
      if (window.electronAPI) {
        const homeDir = await window.electronAPI.getDefaultOutputDirectory();
        setDefaultOutputDirectory(homeDir);
      }
      setDefaultOutputFolderName('Compressed Videos');
      
      // Persist and notify
      const defaults = {
        defaultPresets: [],
        defaultOutputDirectory,
        defaultOutputFolderName: 'Compressed Videos'
      };
      localStorage.setItem('compres-user-defaults', JSON.stringify(defaults));
      if (window.electronAPI && window.electronAPI.notifyUserDefaultsUpdated) {
        window.electronAPI.notifyUserDefaultsUpdated(defaults);
      }
    } catch (error) {
      // ignore
    }
  };

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
    // This function would need to get current values from the main app
    // For now, just save the current defaults
    handleSaveDefaults();
  };



  const handleDefaultPresetToggle = (presetId: string) => {
    const newDefaultPresets = defaultPresets.includes(presetId) 
      ? defaultPresets.filter(p => p !== presetId)
      : [...defaultPresets, presetId];
    setDefaultPresets(newDefaultPresets);
  };

  return (
    <motion.div 
      className="h-full flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Draggable Title Bar */}
      <div className="draggable-region fixed top-0 left-0 right-0 z-50 h-10 border-b border-border/20 flex items-center justify-between px-4 select-none flex-shrink-0">
        <div className="flex items-center gap-3 pl-20">
          <Star className="w-3 h-3 text-foreground/70" />
          <span className="text-[0.625rem] font-normal text-foreground/70">Startup Defaults</span>
        </div>
      </div>

      {/* Content with top padding for fixed header */}
      <div className="flex-1 overflow-y-auto pt-10">
        <div className="p-6 space-y-6">
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

          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <motion.div 
              className="space-y-6"
              variants={macAnimations.slideUp}
              initial="initial"
              animate="animate"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Presets</h3>
                <p className="text-xs text-muted-foreground">Select which presets should be automatically selected when you start the app.</p>
              </div>
              
              {/* Categories */}
              {sortedCategories.map((category) => {
                const categoryPresets = categorizedPresets[category];
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                const categoryName = categoryNames[category as keyof typeof categoryNames] || category;

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium">{categoryName}</h4>
                    </div>
                    
                    <div className="space-y-2">
                      {categoryPresets.map(([presetId, preset]) => (
                        <label
                          key={presetId}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/20 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={defaultPresets.includes(presetId)}
                            onChange={() => handleDefaultPresetToggle(presetId)}
                            className="rounded border-border"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{preset.name}</p>
                            <p className="text-xs text-muted-foreground">{preset.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Default Output Directory Tab */}
          {activeTab === 'folder' && (
            <motion.div 
              className="space-y-6"
              variants={macAnimations.slideUp}
              initial="initial"
              animate="animate"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Output Directory</h3>
                <p className="text-xs text-muted-foreground">Set the default location where compressed videos will be saved.</p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="default-output-directory-input" className="text-xs font-medium text-muted-foreground">
                    Default Output Directory
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="default-output-directory-input"
                      type="text"
                      value={defaultOutputDirectory}
                      onChange={(e) => setDefaultOutputDirectory(e.target.value)}
                      placeholder="Enter default output directory..."
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          if (window.electronAPI && window.electronAPI.selectOutputDirectory) {
                            const directory = await window.electronAPI.selectOutputDirectory();
                            if (directory) {
                              setDefaultOutputDirectory(directory);
                            }
                          }
                        } catch (error) {
                          console.error('Error selecting default output directory:', error);
                        }
                      }}
                      className="text-xs"
                    >
                      Browse
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground/70 font-medium">Default Location:</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {defaultOutputDirectory}
                  </p>
                </div>
              </div>

              {/* Default Folder Name Tab */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Folder Name</h3>
                <p className="text-xs text-muted-foreground">Set the default name for the compressed videos folder.</p>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label htmlFor="default-folder-name-input" className="text-xs font-medium text-muted-foreground">
                      Default Folder Name
                    </label>
                    <input
                      id="default-folder-name-input"
                      type="text"
                      value={defaultOutputFolderName}
                      onChange={(e) => setDefaultOutputFolderName(e.target.value)}
                      placeholder="Enter default folder name..."
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground/70 font-medium">Default Folder Name:</p>
                    <p className="text-sm text-muted-foreground">
                      {defaultOutputFolderName}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/20 p-4 space-y-3 flex-shrink-0">
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
                onClick={handleSaveDefaults}
                disabled={saveStatus === 'saving'}
                className="w-full text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                {saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'saved' ? 'Saved!' : 
                 saveStatus === 'error' ? 'Error!' : 
                 'Save Defaults'}
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
    </motion.div>
  );
};

export default DefaultsWindow;
