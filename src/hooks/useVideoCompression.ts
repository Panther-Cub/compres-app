import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  UseVideoCompressionReturn, 
  FileInfo, 
  AdvancedSettings
} from '../types';
import { getFileName } from '../utils/formatters';

interface CompressionTask {
  file: string;
  preset: string;
  status: 'pending' | 'compressing' | 'completed' | 'error';
  progress: number;
  outputPath?: string;
  error?: string;
}

export const useVideoCompression = (): UseVideoCompressionReturn => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileInfos, setFileInfos] = useState<Record<string, FileInfo>>({});
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionProgress, setCompressionProgress] = useState<Record<string, number>>({});
  const [compressionComplete, setCompressionComplete] = useState<boolean>(false);
  const [outputPaths, setOutputPaths] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  
  // Track all compression tasks
  const compressionTasksRef = useRef<Map<string, CompressionTask>>(new Map());
  const totalTasksRef = useRef<number>(0);
  const completedTasksRef = useRef<number>(0);
  const lastProgressLogRef = useRef<number>(0);

  // Helper function to get task key - use consistent file naming
  const getTaskKey = useCallback((file: string, preset: string): string => {
    // Use the same file naming logic as the manager
    const fileName = getFileName(file);
    return `${fileName}::${preset}`;
  }, []);

  // Helper function to check if all tasks are complete
  const checkAllTasksComplete = useCallback((): boolean => {
    return completedTasksRef.current === totalTasksRef.current && totalTasksRef.current > 0;
  }, []);

  // Helper function to mark task as complete
  const markTaskComplete = useCallback((taskKey: string, outputPath?: string, error?: string): void => {
    const task = compressionTasksRef.current.get(taskKey);
    if (task) {
      task.status = error ? 'error' : 'completed';
      task.progress = 100;
      task.outputPath = outputPath;
      task.error = error;
      completedTasksRef.current++;
      
      // Remove from progress state since task is complete
      setCompressionProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[taskKey];
        return newProgress;
      });
      
      // Add to output paths if successful
      if (outputPath) {
        setOutputPaths(prev => [...prev, outputPath]);
      }
      
      // Check if all tasks are complete
      if (checkAllTasksComplete()) {
        setIsCompressing(false);
        setCompressionComplete(true);
        
        // Check for any errors
        const hasErrors = Array.from(compressionTasksRef.current.values()).some(task => task.status === 'error');
        if (hasErrors) {
          const errorMessages = Array.from(compressionTasksRef.current.values())
            .filter(task => task.error)
            .map(task => `${task.file} (${task.preset}): ${task.error}`)
            .join(', ');
          setError(`Some compressions failed: ${errorMessages}`);
        }
      }
    }
  }, [checkAllTasksComplete]);

  // Listen for compression events
  useEffect(() => {
    const handleCompressionProgress = (data: any) => {
      console.log('Received compression progress:', data);
      const { file, preset, percent } = data;
      if (!file || !preset || typeof percent !== 'number') {
        console.warn('Invalid compression progress data:', data);
        return;
      }

      const taskKey = getTaskKey(file, preset);
      console.log(`Setting progress for ${taskKey}: ${percent}%`);
      setCompressionProgress(prev => ({
        ...prev,
        [taskKey]: Math.max(0, Math.min(100, percent)) // Removed Math.round for fluid progress
      }));
    };

    const handleCompressionComplete = (data: any) => {
      const { file, preset } = data;
      if (!file || !preset) {
        console.warn('Invalid compression complete data:', data);
        return;
      }

      const taskKey = getTaskKey(file, preset);
      markTaskComplete(taskKey);
    };

    // Add event listeners
    if (window.electronAPI) {
      window.electronAPI.onCompressionProgress(handleCompressionProgress);
      window.electronAPI.onCompressionComplete(handleCompressionComplete);

      // Cleanup
      return () => {
        window.electronAPI.removeAllListeners('compression-progress');
        window.electronAPI.removeAllListeners('compression-complete');
      };
    }
    
    // Return empty cleanup if electronAPI is not available
    return () => {};
  }, [getTaskKey, markTaskComplete]);

  const handleFileSelect = useCallback(async (files: string[], addToExisting: boolean = false): Promise<void> => {
    setError('');
    
    // Either replace or add to existing files
    if (addToExisting) {
      setSelectedFiles(prev => {
        const newFiles = [...prev];
        for (const file of files) {
          if (!newFiles.includes(file)) {
            newFiles.push(file);
          }
        }
        return newFiles;
      });
    } else {
      setSelectedFiles(files);
      setCompressionComplete(false);
      setCompressionProgress({});
      setOutputPaths([]);
      
      // Reset compression tracking
      compressionTasksRef.current.clear();
      totalTasksRef.current = 0;
      completedTasksRef.current = 0;
    }
    
    // In browser mode, we can't get file info, so we'll just use basic info
    // Handle case where electronAPI is not available
    if (!window.electronAPI) {
      console.warn('Electron API not available - using basic file info');
      const newFileInfos: Record<string, FileInfo> = {};
      for (const file of files) {
        newFileInfos[file] = {
          size: 0,
          duration: 0,
          width: 0,
          height: 0
        };
      }
      setFileInfos(prev => addToExisting ? { ...prev, ...newFileInfos } : newFileInfos);
      return;
    }
    
    const newFileInfos: Record<string, FileInfo> = {};
    for (const file of files) {
      try {
        if (!window.electronAPI) {
          console.warn('Electron API not available - using basic file info');
          newFileInfos[file] = {
            size: 0,
            duration: 0,
            width: 0,
            height: 0
          };
          continue;
        }
        
        const info = await window.electronAPI.getFileInfo(file);
        
        // Try to generate thumbnail for the file
        try {
          const thumbnail = await window.electronAPI.generateThumbnail(file);
          newFileInfos[file] = { ...info, thumbnail };
        } catch (thumbnailErr) {
          console.warn('Could not generate thumbnail for:', file, thumbnailErr);
          newFileInfos[file] = info;
        }
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
    setFileInfos(prev => addToExisting ? { ...prev, ...newFileInfos } : newFileInfos);
  }, []);

  const removeFile = useCallback((filePath: string): void => {
    setSelectedFiles(prev => prev.filter(f => f !== filePath));
    setFileInfos(prev => {
      const newInfos = { ...prev };
      delete newInfos[filePath];
      return newInfos;
    });
    
    // Remove any pending compression tasks for this file
    Array.from(compressionTasksRef.current.entries()).forEach(([taskKey, task]) => {
      if (task.file === filePath && task.status === 'pending') {
        compressionTasksRef.current.delete(taskKey);
        totalTasksRef.current--;
      }
    });
  }, []);

  const compressVideos = useCallback(async (
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>, 
    outputDirectory: string, 
    advancedSettings?: AdvancedSettings
  ): Promise<void> => {
    if (selectedFiles.length === 0 || presetConfigs.length === 0) {
      setError('No files or presets selected');
      return;
    }
    
    if (!outputDirectory) {
      setError('No output directory selected');
      return;
    }
    
    setIsCompressing(true);
    setCompressionComplete(false);
    setError('');
    setOutputPaths([]);
    
    // Reset compression tracking
    compressionTasksRef.current.clear();
    totalTasksRef.current = 0;
    completedTasksRef.current = 0;
    lastProgressLogRef.current = 0;
    
    // Create compression tasks and initialize progress state
    const tasks: CompressionTask[] = [];
    const initialProgress: Record<string, number> = {};
    
    for (const file of selectedFiles) {
      for (const presetConfig of presetConfigs) {
        // Use consistent file naming with the manager
        const fileName = getFileName(file);
        const taskKey = getTaskKey(fileName, presetConfig.presetId);
        const task: CompressionTask = {
          file: fileName,
          preset: presetConfig.presetId,
          status: 'pending',
          progress: 0
        };
        tasks.push(task);
        compressionTasksRef.current.set(taskKey, task);
        initialProgress[taskKey] = 0;
        totalTasksRef.current++;
      }
    }
    
    // Set initial progress state for all tasks
    setCompressionProgress(initialProgress);
    
    try {
      if (window.electronAPI) {
        if (advancedSettings) {
          if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      await window.electronAPI.compressVideosAdvanced({
            files: selectedFiles,
            presetConfigs,
            outputDirectory,
            advancedSettings
          });
        } else {
          if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }
        await window.electronAPI.compressVideos({
            files: selectedFiles,
            presetConfigs,
            outputDirectory,
            advancedSettings: undefined
          });
        }
      } else {
        throw new Error('Electron API not available');
      }
    } catch (err) {
      console.error('Compression error:', err);
      setError(err instanceof Error ? err.message : 'Compression failed');
      setIsCompressing(false);
      
      // Mark all pending tasks as failed
      for (const task of tasks) {
        if (task.status === 'pending') {
          const taskKey = getTaskKey(task.file, task.preset);
          markTaskComplete(taskKey, undefined, 'Compression failed');
        }
      }
    }
  }, [selectedFiles, markTaskComplete, getTaskKey]);

  const reset = useCallback((): void => {
    setSelectedFiles([]);
    setFileInfos({});
    setCompressionProgress({});
    setCompressionComplete(false);
    setOutputPaths([]);
    setError('');
    setIsCompressing(false);
    
    // Reset compression tracking
    compressionTasksRef.current.clear();
    totalTasksRef.current = 0;
    completedTasksRef.current = 0;
  }, []);

  const getTotalProgress = useCallback((): number => {
    if (totalTasksRef.current === 0) return 0;
    
    // Calculate total progress across all tasks
    const progressEntries = Object.entries(compressionProgress);
    const totalProgress = progressEntries.reduce((sum, [_, progress]) => sum + progress, 0);
    
    // Add completed tasks (each counts as 100%)
    const completedProgress = completedTasksRef.current * 100;
    const totalProgressWithCompleted = totalProgress + completedProgress;
    
    // Calculate percentage based on total tasks
    const percentage = (totalProgressWithCompleted / totalTasksRef.current) / 100 * 100;
    
    return Math.max(0, Math.min(100, percentage)); // Removed Math.round for fluid progress
  }, [compressionProgress]);

  const closeProgress = useCallback((): void => {
    setCompressionComplete(false);
    setOutputPaths([]);
    setError('');
  }, []);

  const cancelCompression = useCallback(async (): Promise<void> => {
    if (!isCompressing) {
      console.warn('Attempted to cancel compression when not compressing');
      return;
    }

    try {
      if (window.electronAPI) {
        if (!window.electronAPI) {
        console.warn('Electron API not available');
        return;
      }
      await window.electronAPI.cancelCompression();
      }
      console.log('Compression cancellation requested');
    } catch (error) {
      console.error('Error canceling compression:', error);
      throw error;
    } finally {
      setIsCompressing(false);
      setCompressionProgress({});
      setCompressionComplete(false);
      setOutputPaths([]);
      setError('');
      
      // Reset compression tracking
      compressionTasksRef.current.clear();
      totalTasksRef.current = 0;
      completedTasksRef.current = 0;
    }
  }, [isCompressing]);

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
