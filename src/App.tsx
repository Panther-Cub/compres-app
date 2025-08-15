import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoCompression } from './hooks/useVideoCompression';
import { useSettings } from './hooks/useSettings';
import { useTheme } from './hooks/useTheme';
import { macAnimations } from './lib/animations';
import AppHeader from './components/AppHeader';
import VideoDropZone from './components/VideoDropZone';
import VideoWorkspace from './components/VideoWorkspace';
import ProgressOverlay from './components/ProgressOverlay';
import CompressionNotification from './components/CompressionNotification';
import AboutModal from './components/AboutModal';
import CustomPresetModal from './components/CustomPresetModal';
import DefaultsDrawer from './components/DefaultsDrawer';

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showProgressOverlay, setShowProgressOverlay] = useState(true);
  const [totalProgress, setTotalProgress] = useState(0);
  const [showDefaultsDrawer, setShowDefaultsDrawer] = useState(false);
  
  const {
    selectedFiles,
    fileInfos,
    isCompressing,
    compressionProgress,
    compressionComplete,
    outputPaths,
    error,
    handleFileSelect,
    removeFile,
    compressVideos,
    reset,
    getTotalProgress,
    closeProgress,
    cancelCompression
  } = useVideoCompression();

  const {
    selectedPresets,
    presetSettings,
    setPresetSettings,
    outputDirectory,
    defaultOutputDirectory,
    presets,
    drawerOpen,
    showAdvanced,
    showCustomPresetModal,
    advancedSettings,
    handlePresetToggle,
    handleSelectOutputDirectory,
    setDefaultOutputDirectory,
    toggleDrawer,
    toggleAdvanced,
    handleAdvancedSettingsChange,
    handleSaveCustomPreset,
    handleCustomPresetSave,
    setShowCustomPresetModal,
    // New default settings methods
    defaultPresets,
    setDefaultPresets,
    defaultPresetSettings,
    setDefaultPresetSettings,
    defaultAdvancedSettings,
    setDefaultAdvancedSettings,
    saveUserDefaults,
    resetToDefaults
  } = useSettings();

  const { theme, toggleTheme } = useTheme();

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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const filePaths = files.map(file => file.path);
    
    if (filePaths.length > 0) {
      handleFileSelect(filePaths);
    }
  }, [handleFileSelect]);

  const handleSelectFiles = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const filePaths = await window.electronAPI.selectFiles();
        if (filePaths && filePaths.length > 0) {
          handleFileSelect(filePaths);
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  }, [handleFileSelect]);

  // Update total progress when compression progress changes
  useEffect(() => {
    if (isCompressing) {
      const progress = getTotalProgress();
      setTotalProgress(progress);
    } else if (compressionComplete) {
      setTotalProgress(100);
    } else {
      setTotalProgress(0);
    }
  }, [compressionProgress, isCompressing, compressionComplete, getTotalProgress]);

  // Handle menu events
  useEffect(() => {
    // Only set up menu events if we're in Electron
    if (window.electronAPI) {
      // About modal from menu
      window.electronAPI.onShowAboutModal(() => {
        setShowAbout(true);
      });

      // File selection from menu
      window.electronAPI.onTriggerFileSelect(() => {
        handleSelectFiles();
      });

      // Output directory selection from menu
      window.electronAPI.onTriggerOutputSelect(() => {
        handleSelectOutputDirectory();
      });

      // Cleanup listeners
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners('show-about-modal');
          window.electronAPI.removeAllListeners('trigger-file-select');
          window.electronAPI.removeAllListeners('trigger-output-select');
        }
      };
    }
  }, [handleSelectFiles, handleSelectOutputDirectory]);

  const handleCompress = (): void => {
    setShowProgressOverlay(true);
    
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
    
    compressVideos(
      presetConfigs, 
      outputDirectory, 
      hasCustomAdvancedSettings ? advancedSettings : undefined
    );
  };

  const handleBatchRename = async (newNames: Record<string, string>): Promise<void> => {
    try {
      if (!window.electronAPI) {
        console.warn('Electron API not available - cannot rename files');
        return;
      }
      
      const results = await window.electronAPI.batchRenameFiles({
        files: selectedFiles,
        newNames
      });
      
      // Check for any errors
      const errors = results.filter(r => !r.success);
      if (errors.length > 0) {
        console.error('Some files could not be renamed:', errors);
        // You could show a notification here
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
      console.error('Error during batch rename:', error);
    }
  };

  const handleBuyCoffee = () => {
    // Open Buy Me a Coffee link
    window.open('https://buymeacoffee.com/pantherandcub', '_blank');
  };

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
    drawerOpen,
    onToggleDrawer: toggleDrawer,
    advancedSettings,
    onAdvancedSettingsChange: handleAdvancedSettingsChange,
    showAdvanced,
    onToggleAdvanced: toggleAdvanced,
    onSaveCustomPreset: handleSaveCustomPreset,
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
  };

  return (
    <motion.div 
      className="h-full w-full bg-background text-foreground overflow-hidden"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      <AppHeader 
        selectedFilesCount={selectedFiles.length} 
        onBuyCoffee={handleBuyCoffee}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowAbout={() => setShowAbout(true)}
        onShowDefaults={() => setShowDefaultsDrawer(true)}
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
              onReset={reset}
              onCompress={handleCompress}
              isCompressing={isCompressing}
              selectedPresets={selectedPresets}
              drawerOpen={drawerOpen}
              onToggleDrawer={toggleDrawer}
              settings={settings}
              onBatchRename={handleBatchRename}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showProgressOverlay && (
            <ProgressOverlay
              isCompressing={isCompressing}
              compressionComplete={compressionComplete}
              compressionProgress={compressionProgress}
              outputPaths={outputPaths}
              presets={presets}
              getTotalProgress={getTotalProgress}
              onClose={() => {
                closeProgress();
                setShowProgressOverlay(false);
              }}
              onCancel={cancelCompression}
            />
          )}
        </AnimatePresence>

        <CompressionNotification
          isVisible={(isCompressing || compressionComplete) && !showProgressOverlay}
          isCompressing={isCompressing}
          compressionComplete={compressionComplete}
          error={error}
          totalProgress={totalProgress}
          onShowProgress={() => setShowProgressOverlay(true)}
        />

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
      </main>

      <AnimatePresence>
        {showAbout && (
          <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
        )}
      </AnimatePresence>

      {/* Custom Preset Modal */}
      <AnimatePresence>
        {showCustomPresetModal && (
          <CustomPresetModal
            isOpen={showCustomPresetModal}
            onClose={() => setShowCustomPresetModal(false)}
            onSave={handleCustomPresetSave}
            advancedSettings={advancedSettings}
          />
        )}
      </AnimatePresence>

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
            onSetDefaultOutputDirectory={setDefaultOutputDirectory}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default App; 