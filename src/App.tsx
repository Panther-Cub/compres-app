import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useVideoCompression } from './hooks/useVideoCompression';
import { useSettings } from './hooks/useSettings';
import { useTheme } from './hooks/useTheme';
import { macAnimations, themeManager } from './lib';
import {
  AppHeader,
  VideoDropZone,
  VideoWorkspace,
  OverwriteConfirmationWindow,
  BatchOverwriteConfirmationWindow,
  ThermalStatusIndicator
} from './components';

function App() {



  

  
  const [updateWindowOpen, setUpdateWindowOpen] = useState(false);

  const {
    selectedPresets,
    presetSettings,
    setPresetSettings,
    outputDirectory,
    defaultOutputDirectory,
    outputFolderName,
    defaultOutputFolderName,
    presets,
    drawerOpen,
    showAdvanced,
    advancedSettings,
    handlePresetToggle,
    handleSelectOutputDirectory,
    setDefaultOutputDirectory,
    handleOutputFolderNameChange,
    setDefaultOutputFolderName,
    toggleDrawer,
    toggleAdvanced,
    handleAdvancedSettingsChange,
    handleSaveCustomPreset,
    handleCustomPresetRemove,
    // New default settings methods
    defaultPresets,
    setDefaultPresets,
    defaultPresetSettings,
    setDefaultPresetSettings,
    defaultAdvancedSettings,
    setDefaultAdvancedSettings,
    saveUserDefaults,
    resetToDefaults,
    handleReorderPresets,
    getFinalOutputPath
  } = useSettings();

  const {
    selectedFiles,
    setSelectedFiles,
    fileInfos,
    isCompressing,
    error,
    handleFileSelect,
    removeFile,
    compressVideos,
    reset,
    // New compression status tracking
    compressionStatuses,
    overwriteConfirmation,
    batchOverwriteConfirmation,
    handleRecompressFile,
    confirmOverwrite,
    cancelOverwrite,
    // Thermal monitoring
    thermalStatus
  } = useVideoCompression(presetSettings);

  const { theme, toggleTheme } = useTheme();

  // Use the centralized theme system
  useEffect(() => {
    // Force apply theme immediately to ensure it's correct
    themeManager.forceApplyTheme();
    
    // Expose themeManager globally for IPC access
    (window as any).themeManager = themeManager;
  }, []);

  // Expose selected files to window object for batch rename window access
  useEffect(() => {
    (window as any).selectedFiles = selectedFiles;
  }, [selectedFiles]);

  // Listen for compression naming results
  useEffect(() => {
    const handleCompressionNamingResults = (results: any) => {
      // Check for any errors
      if (!results.success) {
        return;
      }

      // Force a re-render to update the UI with new custom output names
      // This will make the video list show the custom output names
      setSelectedFiles((prev: string[]) => [...prev]);
      
      // Also force a re-render by updating a state variable
      setTimeout(() => {
        setSelectedFiles((prev: string[]) => [...prev]);
      }, 100);
    };

    // Add event listener for compression naming results
    if (window.electronAPI && window.electronAPI.onCompressionNamingResults) {
      window.electronAPI.onCompressionNamingResults(handleCompressionNamingResults);
    }

    return () => {
      // Cleanup event listener if needed
    };
  }, [setSelectedFiles]);

  // Listen for batch rename window closed event
  useEffect(() => {
    const handleBatchRenameWindowClosed = () => {
      // Batch rename window closed, checking for custom names
      // Force a re-render to update the UI with any new custom output names
      setSelectedFiles((prev: string[]) => [...prev]);
    };

    // Add event listener for batch rename window closed
    if (window.electronAPI && window.electronAPI.onBatchRenameWindowClosed) {
      window.electronAPI.onBatchRenameWindowClosed(handleBatchRenameWindowClosed);
    }

    return () => {
      // Cleanup event listener if needed
    };
  }, [setSelectedFiles]);

  // Drag and drop handlers
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const ensureOverlayHidden = useCallback(async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.hideOverlay();
      }
    } catch (error) {
      // Error hiding overlay
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    // In Electron, File objects have a path property, but not in regular browsers
    const filePaths = files.map(file => (file as any).path).filter(Boolean);
    
    if (filePaths.length > 0) {
      handleFileSelect(filePaths);
      // Ensure overlay is hidden when files are dropped on main window
      await ensureOverlayHidden();
    }
  }, [handleFileSelect, ensureOverlayHidden]);

  const handleSelectFiles = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const filePaths = await window.electronAPI.selectFiles();
        if (filePaths && filePaths.length > 0) {
          handleFileSelect(filePaths);
          // Hide overlay when files are selected from main window
          await window.electronAPI.hideOverlay();
        }
      }
    } catch (error) {
      // Error selecting files
    }
  }, [handleFileSelect]);

  const handleAddMoreVideos = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const filePaths = await window.electronAPI.selectFiles();
        if (filePaths && filePaths.length > 0) {
          handleFileSelect(filePaths, true); // Add to existing files
        }
      }
    } catch (error) {
      // Error adding more videos
    }
  }, [handleFileSelect]);

  // Note: Total progress is calculated by getTotalProgress() function in useVideoCompression hook

  // Handle menu events and overlay communication
  useEffect(() => {
    // Only set up menu events if we're in Electron
    if (window.electronAPI) {


      // File selection from menu
      window.electronAPI.onTriggerFileSelect(() => {
        handleSelectFiles();
      });

      // Output directory selection from menu
      window.electronAPI.onTriggerOutputSelect(() => {
        handleSelectOutputDirectory();
      });

      // Overlay file drops
      window.electronAPI.onOverlayFilesDropped((filePaths: string[]) => {
        handleFileSelect(filePaths);
      });

      // Update status events
      window.electronAPI.onUpdateStatus((data: any) => {
        console.log('Update status received:', data);
        
        // Only create update window if it's not already open
        if (!updateWindowOpen) {
          if (data.status === 'available' || data.status === 'downloaded' || data.status === 'downloading' || data.status === 'checking') {
            if (window.electronAPI) {
              window.electronAPI.createUpdateWindow();
              setUpdateWindowOpen(true);
            }
          } else if (data.status === 'error') {
            // Show error in update window
            if (window.electronAPI) {
              window.electronAPI.createUpdateWindow();
              setUpdateWindowOpen(true);
            }
          } else if (data.status === 'not-available') {
            // Show "no updates" in update window briefly
            if (window.electronAPI) {
              window.electronAPI.createUpdateWindow();
              setUpdateWindowOpen(true);
              // Auto-close after 3 seconds
              setTimeout(() => {
                window.electronAPI?.closeUpdateWindow();
                setUpdateWindowOpen(false);
              }, 3000);
            }
          }
        }
      });

      // Listen for update window close events
      window.electronAPI.onUpdateWindowClosed(() => {
        setUpdateWindowOpen(false);
      });

      // Cleanup listeners
      return () => {
        if (window.electronAPI) {
  
          window.electronAPI.removeAllListeners('trigger-file-select');
          window.electronAPI.removeAllListeners('trigger-output-select');
          window.electronAPI.removeAllListeners('overlay-files-dropped');
          window.electronAPI.removeAllListeners('update-status');
          window.electronAPI.removeAllListeners('update-window-closed');
        }
      };
    }
  }, [handleSelectFiles, handleSelectOutputDirectory, handleFileSelect, updateWindowOpen]);

  // Ensure overlay is hidden when main window has files
  useEffect(() => {
    if (selectedFiles.length > 0) {
      ensureOverlayHidden();
    }
  }, [selectedFiles.length, ensureOverlayHidden]);

  const handleCompress = (): void => {
    console.log('handleCompress called');
    console.log('Selected presets:', selectedPresets);
    console.log('Selected files:', selectedFiles);
    console.log('Output path:', getFinalOutputPath());
    
    // Only use advanced settings if they're enabled AND have been modified from defaults
    const defaultAdvancedSettings = {
      crf: 25,
      videoBitrate: '1500k',
      audioBitrate: '96k',
      fps: 30,
      resolution: '1280x720',
      preserveAspectRatio: true,
      twoPass: false,
      fastStart: true,
      optimizeForWeb: true
    };
    
    const hasCustomAdvancedSettings = showAdvanced && 
      JSON.stringify(advancedSettings) !== JSON.stringify(defaultAdvancedSettings);
    
    // Create preset-specific settings for compression
    const presetConfigs = selectedPresets.map(presetId => ({
      presetId,
      keepAudio: presetSettings[presetId]?.keepAudio ?? true
    }));
    
    console.log('Calling compressVideos with:', { presetConfigs, outputPath: getFinalOutputPath(), advancedSettings: hasCustomAdvancedSettings ? advancedSettings : undefined });
    
    compressVideos(
      presetConfigs,
      getFinalOutputPath(),
      hasCustomAdvancedSettings ? advancedSettings : undefined
    );
  };

  const handleBatchRename = async (newNames: Record<string, string>): Promise<void> => {
    try {
      if (!window.electronAPI) {
        return;
      }
      
      const results = await window.electronAPI.batchRenameFiles({
        files: selectedFiles,
        newNames
      });
      
      // Check for any errors
      const errors = results.filter(r => !r.success);
      if (errors.length > 0) {
        // Some files could not be renamed
        return;
      }
      
      // Update the selected files with new paths
      const newFilePaths = selectedFiles.map(oldPath => {
        const result = results.find(r => r.oldPath === oldPath);
        return result?.newPath || oldPath;
      });
      
      // Re-select files with new paths
      await handleFileSelect(newFilePaths);
      
    } catch (error) {
      // Error during batch rename
    }
  };

  const handleGenerateThumbnail = async (filePath: string): Promise<string> => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      return await window.electronAPI.generateThumbnail(filePath);
    } catch (error) {
      throw error;
    }
  };

  const handleGetThumbnailDataUrl = async (filePath: string): Promise<string> => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      return await window.electronAPI.getThumbnailDataUrl(filePath);
    } catch (error) {
      throw error;
    }
  };

  const handleShowInFinder = async (filePath: string): Promise<void> => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      await window.electronAPI.showInFinder(filePath);
    } catch (error) {
      throw error;
    }
  };

  const handleOpenFile = async (filePath: string): Promise<void> => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      await window.electronAPI.openFile(filePath);
    } catch (error) {
      throw error;
    }
  };

  const handleBuyCoffee = () => {
    // Open Ko-fi link
    window.open('https://ko-fi.com/pantherandcub', '_blank');
  };




  // Removed handleToggleOverlay since we now use handleShowOverlay

  const handleShowOverlay = useCallback(async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.showOverlay();
        // Hide the main window when showing overlay
        if (window.electronAPI.hideMainWindow) {
          await window.electronAPI.hideMainWindow();
        }
      }
    } catch (error) {
      // Error showing overlay
    }
  }, []);

  const handleReset = useCallback(async () => {
    // First reset the compression state
    reset();
    // Then reset settings to user defaults
    resetToDefaults();
    // Then show the default window based on user settings
    try {
      if (window.electronAPI) {
        const defaultWindow = await window.electronAPI.getDefaultWindow();
        if (defaultWindow === 'main') {
          // Keep main window visible (it already is)
          if (window.electronAPI.hideOverlay) {
            await window.electronAPI.hideOverlay();
          }
        } else {
          // Show overlay (default behavior)
          await window.electronAPI.showOverlay();
          if (window.electronAPI.hideMainWindow) {
            await window.electronAPI.hideMainWindow();
          }
        }
      }
    } catch (error) {
      // Fallback to overlay if there's an error
      await handleShowOverlay();
    }
  }, [reset, resetToDefaults, handleShowOverlay]);

  const settings = {
    presets,
    selectedPresets,
    onPresetToggle: handlePresetToggle,
    presetSettings,
    onPresetSettingsChange: setPresetSettings,
    outputDirectory,
    onSelectOutputDirectory: handleSelectOutputDirectory,
    defaultOutputDirectory,
    onSetDefaultOutputDirectory: setDefaultOutputDirectory,
    outputFolderName,
    onOutputFolderNameChange: handleOutputFolderNameChange,
    defaultOutputFolderName,
    onSetDefaultOutputFolderName: setDefaultOutputFolderName,
    drawerOpen,
    onToggleDrawer: toggleDrawer,
    advancedSettings,
    onAdvancedSettingsChange: handleAdvancedSettingsChange,
    showAdvanced,
    onToggleAdvanced: toggleAdvanced,
    onSaveCustomPreset: handleSaveCustomPreset,
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
    handleReorderPresets,
    getFinalOutputPath
  };

  return (
    <motion.div 
      className="h-full w-full native-vibrancy text-foreground overflow-hidden"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      <AppHeader 
        selectedFilesCount={selectedFiles.length} 
        onBuyCoffee={handleBuyCoffee}
        theme={theme}
        onToggleTheme={toggleTheme}

        onShowDefaults={() => {
          if (window.electronAPI && window.electronAPI.createDefaultsWindow) {
            window.electronAPI.createDefaultsWindow().then(result => {
              // Defaults window created successfully
            }).catch(error => {
              // Error creating defaults window
            });
          }
        }}
        onToggleOverlay={handleShowOverlay}
      />
      
      <main className="h-full pt-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedFiles.length === 0 ? (
            <VideoDropZone
              key="dropzone"
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onSelectFiles={handleSelectFiles}
            />
          ) : (
            <VideoWorkspace
              key="workspace"
              selectedFiles={selectedFiles}
              fileInfos={fileInfos}
              onRemoveFile={removeFile}
              onReset={handleReset}
              onCompress={handleCompress}
              isCompressing={isCompressing}
              selectedPresets={selectedPresets}
              drawerOpen={drawerOpen}
              onToggleDrawer={toggleDrawer}
              settings={settings}
              onBatchRename={handleBatchRename}
              onGenerateThumbnail={handleGenerateThumbnail}
              onGetThumbnailDataUrl={handleGetThumbnailDataUrl}
              onShowInFinder={handleShowInFinder}
              onOpenFile={handleOpenFile}
              onAddMoreVideos={handleAddMoreVideos}
              compressionStatuses={compressionStatuses}
              onRecompressFile={handleRecompressFile}
            />
          )}
        </AnimatePresence>





        {/* Bottom Right Controls - Removed, moved to header */}

        <AnimatePresence>
          {error && (
            <motion.div 
              className="fixed bottom-4 left-4 w-80 p-4 bg-destructive/10 border border-destructive/20 rounded-lg z-50"
              variants={macAnimations.slideUp}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overwrite Confirmation Window */}
        <AnimatePresence>
          {overwriteConfirmation && (
            <OverwriteConfirmationWindow
              confirmation={overwriteConfirmation}
              onConfirm={confirmOverwrite}
              onCancel={cancelOverwrite}
              onClose={cancelOverwrite}
            />
          )}
        </AnimatePresence>

        {/* Batch Overwrite Confirmation Window */}
        <AnimatePresence>
          {batchOverwriteConfirmation && (
            <BatchOverwriteConfirmationWindow
              confirmation={batchOverwriteConfirmation}
              onConfirm={batchOverwriteConfirmation.onConfirm}
              onCancel={batchOverwriteConfirmation.onCancel}
              onClose={batchOverwriteConfirmation.onClose}
            />
          )}
        </AnimatePresence>

        {/* Thermal Status Indicator */}
        <ThermalStatusIndicator
          isVisible={isCompressing && thermalStatus !== null}
          thermalStatus={thermalStatus}
        />


      </main>








    </motion.div>
  );
}

export default App; 