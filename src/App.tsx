import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useVideoCompression } from './hooks/useVideoCompression';
import { useSettings } from './hooks/useSettings';
import { useFileHandling } from './hooks/useFileHandling';
import { useTheme } from './hooks/useTheme';
import AppHeader from './components/AppHeader';
import VideoDropZone from './components/VideoDropZone';
import VideoWorkspace from './components/VideoWorkspace';
import ProgressOverlay from './components/ProgressOverlay';
import CompressionNotification from './components/CompressionNotification';
import AboutModal from './components/AboutModal';
import CustomPresetModal from './components/CustomPresetModal';

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showProgressOverlay, setShowProgressOverlay] = useState(true);
  
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
    keepAudio,
    setKeepAudio,
    outputDirectory,
    presets,
    drawerOpen,
    showAdvanced,
    showCustomPresetModal,
    advancedSettings,
    handlePresetToggle,
    handleSelectOutputDirectory,
    toggleDrawer,
    toggleAdvanced,
    handleAdvancedSettingsChange,
    handleSaveCustomPreset,
    handleCustomPresetSave,
    setShowCustomPresetModal
  } = useSettings();

  const {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSelectFiles
  } = useFileHandling(handleFileSelect);

  const { theme, toggleTheme } = useTheme();

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
    // Pass advanced settings if they're being used
    const shouldUseAdvanced = showAdvanced && Object.keys(advancedSettings).length > 0;
    compressVideos(selectedPresets, keepAudio, outputDirectory, shouldUseAdvanced ? advancedSettings : undefined);
  };

  const handleBuyCoffee = () => {
    // Open Buy Me a Coffee link
    window.open('https://buymeacoffee.com/pantherandcub', '_blank');
  };

  const settings = {
    presets,
    selectedPresets,
    onPresetToggle: handlePresetToggle,
    keepAudio,
    onKeepAudioChange: setKeepAudio,
    outputDirectory,
    onSelectOutputDirectory: handleSelectOutputDirectory,
    advancedSettings,
    onAdvancedSettingsChange: handleAdvancedSettingsChange,
    showAdvanced,
    onToggleAdvanced: toggleAdvanced,
    onSaveCustomPreset: handleSaveCustomPreset,
    selectedFiles,
    fileInfos
  };

  return (
    <div className="h-full w-full bg-background text-foreground overflow-hidden">
      <AppHeader 
        selectedFilesCount={selectedFiles.length} 
        onBuyCoffee={handleBuyCoffee}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowAbout={() => setShowAbout(true)}
      />
      
      <main className="h-full pt-10 overflow-hidden">
        {selectedFiles.length === 0 ? (
          <VideoDropZone
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSelectFiles={handleSelectFiles}
          />
        ) : (
          <VideoWorkspace
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
          />
        )}

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

        <CompressionNotification
          isVisible={(isCompressing || compressionComplete) && !showProgressOverlay}
          isCompressing={isCompressing}
          compressionComplete={compressionComplete}
          error={error}
          totalProgress={getTotalProgress()}
          onShowProgress={() => setShowProgressOverlay(true)}
        />

        {/* Bottom Right Controls - Removed, moved to header */}

        {error && (
          <div className="fixed bottom-4 left-4 w-80 p-4 bg-destructive/10 border border-destructive/20 rounded-lg z-50">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </main>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* Custom Preset Modal */}
      <CustomPresetModal
        isOpen={showCustomPresetModal}
        onClose={() => setShowCustomPresetModal(false)}
        onSave={handleCustomPresetSave}
        advancedSettings={advancedSettings}
      />
    </div>
  );
}

export default App; 