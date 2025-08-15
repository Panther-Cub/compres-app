import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  UseVideoCompressionReturn, 
  FileInfo, 
  AdvancedSettings, 
  CompressionData 
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
  const getTaskKey = (file: string, preset: string): string => {
    // Use the same file naming logic as the manager
    const fileName = getFileName(file);
    return `${fileName}-${preset}`;
  };

  // Helper function to check if all tasks are complete
  const checkAllTasksComplete = useCallback((): boolean => {
    return completedTasksRef.current === totalTasksRef.current && totalTasksRef.current > 0;
  }, []);

  // Helper function to update progress
  const updateProgress = useCallback((taskKey: string, progress: number): void => {
    setCompressionProgress(prev => ({
      ...prev,
      [taskKey]: progress
    }));
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
      
      // Update progress
      updateProgress(taskKey, 100);
      
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
  }, [updateProgress, checkAllTasksComplete]);

  // Set up event listeners for compression events
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onCompressionStarted((data: CompressionData) => {
        const taskKey = getTaskKey(data.file, data.preset);
        const task = compressionTasksRef.current.get(taskKey);
        if (task) {
          task.status = 'compressing';
          task.progress = 0;
          updateProgress(taskKey, 0);
        }
      });

      window.electronAPI.onCompressionProgress((data: CompressionData) => {
        const taskKey = getTaskKey(data.file, data.preset);
        const progress = Math.max(0, Math.min(100, Math.round(data.percent || 0)));
        
        updateProgress(taskKey, progress);
        
        const task = compressionTasksRef.current.get(taskKey);
        if (task) {
          task.progress = progress;
        }
      });

      window.electronAPI.onCompressionComplete((data: CompressionData) => {
        const taskKey = getTaskKey(data.file, data.preset);
        markTaskComplete(taskKey, data.outputPath);
      });

      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners('compression-started');
          window.electronAPI.removeAllListeners('compression-progress');
          window.electronAPI.removeAllListeners('compression-complete');
        }
      };
    }
  }, [updateProgress, markTaskComplete]);

  const handleFileSelect = useCallback(async (files: string[]): Promise<void> => {
    setError('');
    setSelectedFiles(files);
    setCompressionComplete(false);
    setCompressionProgress({});
    setOutputPaths([]);
    
    // Reset compression tracking
    compressionTasksRef.current.clear();
    totalTasksRef.current = 0;
    completedTasksRef.current = 0;
    
    // In browser mode, we can't get file info, so we'll just use basic info
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
      setFileInfos(newFileInfos);
      return;
    }
    
    const newFileInfos: Record<string, FileInfo> = {};
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
    selectedPresets: string[], 
    keepAudio: boolean, 
    outputDirectory: string, 
    advancedSettings?: AdvancedSettings
  ): Promise<void> => {
    if (selectedFiles.length === 0 || selectedPresets.length === 0) {
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
      for (const preset of selectedPresets) {
        // Use consistent file naming with the manager
        const fileName = getFileName(file);
        const taskKey = getTaskKey(fileName, preset);
        const task: CompressionTask = {
          file: fileName,
          preset,
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
          await window.electronAPI.compressVideosAdvanced({
            files: selectedFiles,
            presets: selectedPresets,
            keepAudio,
            outputDirectory,
            advancedSettings
          });
        } else {
          await window.electronAPI.compressVideos({
            files: selectedFiles,
            presets: selectedPresets,
            keepAudio,
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
  }, [selectedFiles, markTaskComplete]);

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
    lastProgressLogRef.current = 0;
  }, []);

  const getTotalProgress = useCallback((): number => {
    if (totalTasksRef.current === 0) return 0;
    
    // Calculate total progress based on actual compression progress state
    const progressEntries = Object.entries(compressionProgress);
    if (progressEntries.length === 0) return 0;
    
    // Calculate total progress as sum of all progress values
    const totalProgress = progressEntries.reduce((sum, [_, progress]) => sum + progress, 0);
    
    // Calculate percentage based on total possible progress (100% per task)
    const totalPossibleProgress = totalTasksRef.current * 100;
    const percentage = (totalProgress / totalPossibleProgress) * 100;
    
    const finalProgress = Math.max(0, Math.min(100, Math.round(percentage)));
    
    // Only log progress changes to reduce console spam
    if (Math.abs(finalProgress - lastProgressLogRef.current) >= 5) {
      console.log(`Total Progress: ${finalProgress}% (${completedTasksRef.current}/${totalTasksRef.current} tasks complete)`);
      lastProgressLogRef.current = finalProgress;
    }
    
    return finalProgress;
  }, [compressionProgress]);

  const closeProgress = useCallback((): void => {
    if (compressionComplete) {
      reset();
    }
  }, [compressionComplete, reset]);

  const cancelCompression = useCallback((): void => {
    if (window.electronAPI) {
      window.electronAPI.cancelCompression();
    }
    setIsCompressing(false);
    setCompressionComplete(false);
    
    // Mark all pending and compressing tasks as cancelled
    Array.from(compressionTasksRef.current.entries()).forEach(([taskKey, task]) => {
      if (task.status === 'pending' || task.status === 'compressing') {
        markTaskComplete(taskKey, undefined, 'Cancelled');
      }
    });
  }, [markTaskComplete]);

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
