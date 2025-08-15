import { useState, useEffect, useCallback } from 'react';

export const useVideoCompression = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileInfos, setFileInfos] = useState({});
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState({});
  const [compressionComplete, setCompressionComplete] = useState(false);
  const [outputPaths, setOutputPaths] = useState([]);
  const [error, setError] = useState('');

  // Set up event listeners for compression events
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onCompressionStarted((data) => {
        setIsCompressing(true);
        setCompressionProgress(prev => ({
          ...prev,
          [`${data.file}-${data.preset}`]: 0
        }));
        setCompressionComplete(false);
      });

      window.electronAPI.onCompressionProgress((data) => {
        setCompressionProgress(prev => ({
          ...prev,
          [`${data.file}-${data.preset}`]: Math.round(data.percent || 0)
        }));
      });

      window.electronAPI.onCompressionComplete((data) => {
        setOutputPaths(prev => [...prev, data.outputPath]);
        setCompressionProgress(prev => ({
          ...prev,
          [`${data.file}-${data.preset}`]: 100
        }));
      });

      return () => {
        window.electronAPI.removeAllListeners('compression-started');
        window.electronAPI.removeAllListeners('compression-progress');
        window.electronAPI.removeAllListeners('compression-complete');
      };
    }
  }, []);

  const handleFileSelect = useCallback(async (files) => {
    setError('');
    setSelectedFiles(files);
    setCompressionComplete(false);
    setCompressionProgress({});
    setOutputPaths([]);
    
    // In browser mode, we can't get file info, so we'll just use basic info
    if (!window.electronAPI) {
      console.warn('Electron API not available - using basic file info');
      const newFileInfos = {};
      for (const file of files) {
        newFileInfos[file] = {
          size: 0,
          duration: 0,
          width: 0,
          height: 0
        };
      }
      setFileInfos(newFileInfos);
      return;
    }
    
    const newFileInfos = {};
    for (const file of files) {
      try {
        const info = await window.electronAPI.getFileInfo(file);
        newFileInfos[file] = info;
      } catch (err) {
        console.error('Error reading file info for:', file, err);
        // Use basic info if we can't get detailed info
        newFileInfos[file] = {
          size: 0,
          duration: 0,
          width: 0,
          height: 0
        };
      }
    }
    setFileInfos(newFileInfos);
  }, []);

  const removeFile = useCallback((filePath) => {
    setSelectedFiles(prev => prev.filter(f => f !== filePath));
    setFileInfos(prev => {
      const newInfos = { ...prev };
      delete newInfos[filePath];
      return newInfos;
    });
  }, []);

  const compressVideos = useCallback(async (selectedPresets, keepAudio, outputDirectory, advancedSettings = null) => {
    if (selectedFiles.length === 0 || selectedPresets.length === 0) return;
    
    // Check if we're in Electron environment
    if (!window.electronAPI) {
      setError('Video compression is only available in the desktop app');
      return;
    }
    
    setError('');
    setIsCompressing(true);
    setCompressionProgress({});
    setOutputPaths([]);
    
    try {
      const data = {
        files: selectedFiles,
        presets: selectedPresets,
        keepAudio: keepAudio,
        outputDirectory: outputDirectory,
        ...(advancedSettings && { advancedSettings })
      };
      
      // Use advanced compression if advanced settings are provided
      if (advancedSettings) {
        await window.electronAPI.compressVideosAdvanced(data);
      } else {
        await window.electronAPI.compressVideos(data);
      }
      setCompressionComplete(true);
    } catch (err) {
      setError('Error compressing videos: ' + err.message);
      console.error(err);
    } finally {
      setIsCompressing(false);
    }
  }, [selectedFiles]);

  const reset = useCallback(() => {
    setSelectedFiles([]);
    setFileInfos({});
    setCompressionProgress({});
    setCompressionComplete(false);
    setOutputPaths([]);
    setError('');
  }, []);

  const getTotalProgress = useCallback(() => {
    const progressValues = Object.values(compressionProgress);
    if (progressValues.length === 0) return 0;
    
    // Calculate total progress as average of all active compressions
    const totalProgress = progressValues.reduce((sum, val) => sum + val, 0);
    const averageProgress = totalProgress / progressValues.length;
    
    return Math.round(averageProgress);
  }, [compressionProgress]);

  const closeProgress = useCallback(() => {
    setCompressionComplete(false);
    setCompressionProgress({});
    setOutputPaths([]);
  }, []);

  const cancelCompression = useCallback(() => {
    setIsCompressing(false);
    setCompressionProgress({});
    setError('Compression cancelled by user');
  }, []);

  return {
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
  };
};
