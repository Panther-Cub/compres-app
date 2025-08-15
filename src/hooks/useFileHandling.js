import { useState, useCallback } from 'react';

export const useFileHandling = (onFileSelect) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length > 0) {
      const filePaths = videoFiles.map(file => file.path);
      onFileSelect(filePaths);
    } else {
      throw new Error('Please select video files');
    }
  }, [onFileSelect]);

  const handleSelectFiles = useCallback(async () => {
    try {
      // Check if we're in Electron environment
      if (!window.electronAPI) {
        console.warn('Electron API not available - running in browser mode');
        return;
      }
      
      const filePaths = await window.electronAPI.selectFiles();
      if (filePaths.length > 0) {
        onFileSelect(filePaths);
      }
    } catch (err) {
      console.error('Error selecting files:', err);
      throw err;
    }
  }, [onFileSelect]);

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSelectFiles
  };
};
