import { useState, useCallback } from 'react';
import { FileInfo } from '../types';

export const useFileHandling = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileInfos, setFileInfos] = useState<Record<string, FileInfo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (files: string[]) => {
    if (!files || files.length === 0) {
      setError('No files selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newFileInfos: Record<string, FileInfo> = {};
      const validFiles: string[] = [];

      for (const file of files) {
        try {
          // Validate file path
          if (!file || typeof file !== 'string') {
            console.warn('Invalid file path:', file);
            continue;
          }

          // Check if file already exists in current selection
          if (selectedFiles.includes(file)) {
            console.warn('File already selected:', file);
            continue;
          }

          // Get file info from main process
          const fileInfo = await window.electronAPI.getFileInfo(file);
          
          // Validate file info
          if (!fileInfo) {
            console.warn('No file info returned for:', file);
            continue;
          }

          if (fileInfo.duration <= 0) {
            console.warn('Invalid video duration for:', file);
            continue;
          }

          if (fileInfo.size <= 0) {
            console.warn('Invalid file size for:', file);
            continue;
          }

          if (fileInfo.width <= 0 || fileInfo.height <= 0) {
            console.warn('Invalid video dimensions for:', file);
            continue;
          }

          newFileInfos[file] = fileInfo;
          validFiles.push(file);

        } catch (fileError) {
          console.error(`Error processing file ${file}:`, fileError);
          // Continue with other files instead of failing completely
        }
      }

      if (validFiles.length === 0) {
        setError('No valid video files could be processed');
        setLoading(false);
        return;
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);
      setFileInfos(prev => ({ ...prev, ...newFileInfos }));

      if (validFiles.length < files.length) {
        setError(`Processed ${validFiles.length} of ${files.length} files. Some files were skipped due to errors.`);
      }

    } catch (error) {
      console.error('Error in handleFileSelect:', error);
      setError(error instanceof Error ? error.message : 'Failed to process selected files');
    } finally {
      setLoading(false);
    }
  }, [selectedFiles]);

  const removeFile = useCallback((fileToRemove: string) => {
    if (!fileToRemove) {
      console.warn('Attempted to remove file with invalid path');
      return;
    }

    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
    setFileInfos(prev => {
      const newInfos = { ...prev };
      delete newInfos[fileToRemove];
      return newInfos;
    });
    setError(null); // Clear any previous errors when removing files
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setFileInfos({});
    setError(null);
  }, []);

  const updateFilePaths = useCallback((newPaths: Record<string, string>) => {
    if (!newPaths || typeof newPaths !== 'object') {
      console.error('Invalid new paths object provided to updateFilePaths');
      return;
    }

    const updatedFiles: string[] = [];
    const updatedInfos: Record<string, FileInfo> = {};

    for (const [oldPath, newPath] of Object.entries(newPaths)) {
      if (!oldPath || !newPath) {
        console.warn('Invalid path mapping:', { oldPath, newPath });
        continue;
      }

      // Update file path in selectedFiles
      if (selectedFiles.includes(oldPath)) {
        updatedFiles.push(newPath);
        // Preserve file info for the new path
        if (fileInfos[oldPath]) {
          updatedInfos[newPath] = fileInfos[oldPath];
        }
      }
    }

    // Add files that weren't renamed
    for (const file of selectedFiles) {
      if (!newPaths[file]) {
        updatedFiles.push(file);
        if (fileInfos[file]) {
          updatedInfos[file] = fileInfos[file];
        }
      }
    }

    setSelectedFiles(updatedFiles);
    setFileInfos(updatedInfos);
  }, [selectedFiles, fileInfos]);

  return {
    selectedFiles,
    fileInfos,
    loading,
    error,
    handleFileSelect,
    removeFile,
    clearFiles,
    updateFilePaths,
    setError
  };
};
