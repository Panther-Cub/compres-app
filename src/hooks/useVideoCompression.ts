import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  UseVideoCompressionReturn, 
  FileInfo, 
  AdvancedSettings,
  CompressionStatus,
  OverwriteConfirmation,
  BatchOverwriteConfirmation
} from '../types';
import type { CompressionProgressData, CompressionCompleteData } from '../types/shared';
import { getFileName } from '../utils/formatters';
import { getPresetFolderName, getPresetSuffix } from '../shared/presetRegistry';

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
  
  // New compression status tracking
  const [compressionStatuses, setCompressionStatuses] = useState<Record<string, CompressionStatus>>({});
  const [overwriteConfirmation, setOverwriteConfirmation] = useState<OverwriteConfirmation | null>(null);
  const [batchOverwriteConfirmation, setBatchOverwriteConfirmation] = useState<BatchOverwriteConfirmation | null>(null);
  const [pendingCompressionParams, setPendingCompressionParams] = useState<{
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
    outputDirectory: string;
    advancedSettings?: AdvancedSettings;
    existingFilesToRemove: string[];
  } | null>(null);
  
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
    try {
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
      } else {
        console.warn(`Task not found for completion: ${taskKey}`);
      }
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  }, [checkAllTasksComplete]);

  // Listen for compression events
  useEffect(() => {
    // Initialize compression manager on mount
    const initializeManager = async () => {
      try {
        await window.electronAPI.initializeCompressionManager();
        // Compression manager initialized
      } catch (error) {
        console.error('Failed to initialize compression manager:', error);
      }
    };
    
    initializeManager();
    
    const handleCompressionProgress = (data: CompressionProgressData) => {
      try {
        
        // Handle both old and new data structures
        let file: string, preset: string, progress: number;
        
        if (data.taskKey && typeof data.progress === 'number') {
          // New structure: { taskKey, progress, file, preset }
          file = data.file;
          preset = data.preset;
          progress = data.progress;
        } else if (data.file && data.preset && typeof data.percent === 'number') {
          // Old structure: { file, preset, percent }
          file = data.file;
          preset = data.preset;
          progress = data.percent;
        } else {
          console.warn('Invalid compression progress data:', data);
          return;
        }

        if (!file || !preset || typeof progress !== 'number') {
          console.warn('Invalid compression progress data:', data);
          return;
        }

        const taskKey = getTaskKey(file, preset);
        // Progress updated for ${taskKey}
        setCompressionProgress(prev => ({
          ...prev,
          [taskKey]: Math.max(0, Math.min(100, progress)) // Removed Math.round for fluid progress
        }));

        // Update compression status - find the full file path that matches the filename
        const fullFilePath = Object.keys(compressionStatuses).find(key => {
          const status = compressionStatuses[key];
          const fileName = getFileName(status.filePath);
          return fileName === file;
        })?.split('::')[0];

        if (fullFilePath) {
          const statusKey = `${fullFilePath}::${preset}`;
          setCompressionStatuses(prev => ({
            ...prev,
            [statusKey]: {
              filePath: fullFilePath,
              presetId: preset,
              status: 'compressing',
              progress: Math.max(0, Math.min(100, progress))
            }
          }));
        } else {
          // If we can't find the full path, try to find it in selectedFiles
          const matchingFile = selectedFiles.find(selectedFile => {
            const fileName = getFileName(selectedFile);
            return fileName === file;
          });
          
          if (matchingFile) {
            const statusKey = `${matchingFile}::${preset}`;
            setCompressionStatuses(prev => ({
              ...prev,
              [statusKey]: {
                filePath: matchingFile,
                presetId: preset,
                status: 'compressing',
                progress: Math.max(0, Math.min(100, progress))
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error handling compression progress:', error);
      }
    };

    const handleCompressionComplete = (data: CompressionCompleteData) => {
      try {
        const { file, preset, taskKey, success, outputPath, error } = data;
        if (!file || !preset) {
          console.warn('Invalid compression complete data:', data);
          return;
        }

        // Use provided taskKey or generate one
        const finalTaskKey = taskKey || getTaskKey(file, preset);
        markTaskComplete(finalTaskKey, outputPath, error);

        // Update compression status - find the full file path that matches the filename
        const fullFilePath = Object.keys(compressionStatuses).find(key => {
          const status = compressionStatuses[key];
          const fileName = getFileName(status.filePath);
          return fileName === file;
        })?.split('::')[0];

        if (fullFilePath) {
          const statusKey = `${fullFilePath}::${preset}`;
          setCompressionStatuses(prev => ({
            ...prev,
            [statusKey]: {
              filePath: fullFilePath,
              presetId: preset,
              status: success ? 'completed' : 'failed',
              progress: success ? 100 : 0,
              outputPath: success ? outputPath : undefined,
              error: success ? undefined : error,
              completedAt: success ? Date.now() : undefined
            }
          }));
        } else {
          // If we can't find the full path, try to find it in selectedFiles
          const matchingFile = selectedFiles.find(selectedFile => {
            const fileName = getFileName(selectedFile);
            return fileName === file;
          });
          
          if (matchingFile) {
            const statusKey = `${matchingFile}::${preset}`;
            setCompressionStatuses(prev => ({
              ...prev,
              [statusKey]: {
                filePath: matchingFile,
                presetId: preset,
                status: success ? 'completed' : 'failed',
                progress: success ? 100 : 0,
                outputPath: success ? outputPath : undefined,
                error: success ? undefined : error,
                completedAt: success ? Date.now() : undefined
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error handling compression complete:', error);
      }
    };

    // Add event listeners
    if (window.electronAPI) {
      try {
        window.electronAPI.onCompressionProgress(handleCompressionProgress);
        window.electronAPI.onCompressionComplete(handleCompressionComplete);
      } catch (error) {
        console.error('Error setting up compression event listeners:', error);
      }

      // Cleanup
      return () => {
        try {
          window.electronAPI.removeAllListeners('compression-progress');
          window.electronAPI.removeAllListeners('compression-complete');
        } catch (error) {
          console.error('Error cleaning up compression event listeners:', error);
        }
      };
    }
    
    // Return empty cleanup if electronAPI is not available
    return () => {};
  }, [getTaskKey, markTaskComplete, selectedFiles, compressionStatuses]);

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
      setCompressionStatuses({}); // Clear compression statuses when replacing files
      
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

  // Helper function to construct expected output path using the same logic as compression process
  const constructExpectedOutputPath = useCallback(async (
    file: string,
    presetConfig: { presetId: string; keepAudio: boolean },
    outputDirectory: string,
    customOutputName?: string
  ): Promise<string> => {
    // Get preset metadata for proper naming - prefer IPC, fallback to shared registry helpers
    let folderName = getPresetFolderName(presetConfig.presetId);
    let fileSuffix = getPresetSuffix(presetConfig.presetId);
    
    try {
      const presetMetadata = await window.electronAPI?.getPresetMetadata?.(presetConfig.presetId);
      if (presetMetadata) {
        folderName = presetMetadata.folderName || folderName;
        fileSuffix = presetMetadata.fileSuffix || fileSuffix;
      }
    } catch (error) {
      console.warn('Could not get preset metadata, using fallback:', error);
    }
    
    const audioSuffix = presetConfig.keepAudio ? ' - audio' : ' - muted';
    const presetFolder = `${outputDirectory}/${folderName}`;
    
    let outputFileName: string;
    if (customOutputName) {
      const cleanCustomName = customOutputName.replace(/\.[^/.]+$/, '');
      outputFileName = `${cleanCustomName}${fileSuffix}${audioSuffix}.mp4`;
    } else {
      const fileName = getFileName(file);
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      outputFileName = `${baseName}${fileSuffix}${audioSuffix}.mp4`;
    }
    
    return `${presetFolder}/${outputFileName}`;
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
    
    // Check for existing output files in the output directory before starting compression
    const existingOutputFiles: Array<{ filePath: string; presetId: string; existingOutputPath: string }> = [];
    
    // Checking for existing output files
    
          for (const file of selectedFiles) {
        for (const presetConfig of presetConfigs) {
          // Check for custom output naming preferences
          let customOutputName = null;
          if ((window as any).compressionOutputNaming && (window as any).compressionOutputNaming[file]) {
            customOutputName = (window as any).compressionOutputNaming[file];
            // Using custom output name
          }
          
          // Construct the expected path using the same logic as the compression process
          const expectedOutputPath = await constructExpectedOutputPath(file, presetConfig, outputDirectory, customOutputName);
          
          // File path construction completed
          
          try {
          // Check if the output file already exists using Electron API
          // Checking file existence
          
          if (window.electronAPI) {
            // Try using getFileInfo as a way to check if file exists
            try {
              // Checking file existence via getFileInfo
              await window.electronAPI.getFileInfo(expectedOutputPath);
              // File exists
              existingOutputFiles.push({
                filePath: file,
                presetId: presetConfig.presetId,
                existingOutputPath: expectedOutputPath
              });
            } catch (fileError) {
              // File does not exist
            }
          } else {
            console.warn('window.electronAPI not available');
          }
        } catch (error) {
          console.warn('Could not check file existence:', error);
        }
      }
    }
    
    // Found existing output files
    
    // If there are existing output files, show batch overwrite confirmation
    if (existingOutputFiles.length > 0) {
      // Showing batch overwrite confirmation
      
      // Prepare batch confirmation data
      const batchFiles = existingOutputFiles.map(existing => {
        const fileName = getFileName(existing.filePath);
        const existingFileName = existing.existingOutputPath.split('/').pop() || '';
        const newFileName = existing.existingOutputPath.split('/').pop() || '';
        
        return {
          filePath: existing.filePath,
          presetId: existing.presetId,
          existingOutputPath: existing.existingOutputPath,
          newOutputPath: existing.existingOutputPath, // Same path since we're overwriting
          fileName,
          existingFileName,
          newFileName
        };
      });
      
      setBatchOverwriteConfirmation({
        files: batchFiles,
        onConfirm: (filesToOverwrite: string[]) => {
          // User confirmed overwrite
          setBatchOverwriteConfirmation(null);
          // Continue with compression, excluding files that weren't selected for overwrite
          const filesToRemove = existingOutputFiles
            .filter(f => !filesToOverwrite.includes(`${f.filePath}::${f.presetId}`))
            .map(f => `${f.filePath}::${f.presetId}`);
          
          setPendingCompressionParams({
            presetConfigs,
            outputDirectory,
            advancedSettings,
            existingFilesToRemove: filesToRemove
          });
          
          // Start compression with the updated parameters
          startCompressionWithParams(presetConfigs, outputDirectory, advancedSettings, filesToRemove);
        },
        onCancel: () => {
          // User cancelled batch overwrite
          setBatchOverwriteConfirmation(null);
          setPendingCompressionParams(null);
        },
        onClose: () => {
          // User closed batch overwrite dialog
          setBatchOverwriteConfirmation(null);
          setPendingCompressionParams(null);
        }
      });
      
      return; // Stop here and wait for user confirmation
    }
    
    // Validate that all files still exist before starting compression
    // Note: File validation is handled by the backend
    for (const file of selectedFiles) {
      try {
        // In browser environment, we can't check file existence, so we'll rely on the backend validation
        if (window.electronAPI) {
          // We could add a file existence check here if needed
          // For now, we'll let the backend handle this validation
        }
      } catch (error) {
        console.warn('Could not validate file existence:', file, error);
      }
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
    const initialStatuses: Record<string, CompressionStatus> = {};
    
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

        // Initialize compression status - use full file path for consistency
        const statusKey = `${file}::${presetConfig.presetId}`;
        initialStatuses[statusKey] = {
          filePath: file,
          presetId: presetConfig.presetId,
          status: 'pending',
          progress: 0
        };
      }
    }
    
    // Set initial progress state for all tasks
    setCompressionProgress(initialProgress);
    setCompressionStatuses(initialStatuses);
    
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles, markTaskComplete, getTaskKey]);

  const reset = useCallback((): void => {
    setSelectedFiles([]);
    setFileInfos({});
    setCompressionProgress({});
    setCompressionComplete(false);
    setOutputPaths([]);
    setError('');
    setIsCompressing(false);
    setCompressionStatuses({});
    setOverwriteConfirmation(null);
    setBatchOverwriteConfirmation(null);
    
    // Reset compression tracking
    compressionTasksRef.current.clear();
    totalTasksRef.current = 0;
    completedTasksRef.current = 0;
  }, []);

  // Function to start compression with given parameters
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startCompressionWithParams = useCallback(async (
    presetConfigs: Array<{ presetId: string; keepAudio: boolean }>,
    outputDirectory: string,
    advancedSettings?: AdvancedSettings,
    existingFilesToRemove: string[] = []
  ): Promise<void> => {
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
    const initialStatuses: Record<string, CompressionStatus> = {};
    
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

        // Initialize compression status - use full file path for consistency
        const statusKey = `${file}::${presetConfig.presetId}`;
        initialStatuses[statusKey] = {
          filePath: file,
          presetId: presetConfig.presetId,
          status: 'pending',
          progress: 0
        };
      }
    }
    
    // Set initial progress state for all tasks
    setCompressionProgress(initialProgress);
    setCompressionStatuses(initialStatuses);
    
    try {
      if (window.electronAPI) {
        if (advancedSettings) {
          await window.electronAPI.compressVideosAdvanced({
            files: selectedFiles,
            presetConfigs,
            outputDirectory,
            advancedSettings
          });
        } else {
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

  // Function to compress a single file
  const compressSingleFile = useCallback(async (filePath: string, presetId: string): Promise<void> => {
    try {
      const statusKey = `${filePath}::${presetId}`;
      
      // Update status to pending
      setCompressionStatuses(prev => ({
        ...prev,
        [statusKey]: {
          filePath,
          presetId,
          status: 'pending',
          progress: 0
        }
      }));

      // Get output directory and compress
      const outputDirectory = await window.electronAPI.getDefaultOutputDirectory();
      const result = await window.electronAPI.compressVideos({
        files: [filePath],
        presetConfigs: [{ presetId, keepAudio: true }],
        outputDirectory
      });

      if (result && result.length > 0 && result[0].success) {
        // Update status to completed
        setCompressionStatuses(prev => ({
          ...prev,
          [statusKey]: {
            filePath,
            presetId,
            status: 'completed',
            progress: 100,
            outputPath: result[0].outputPath,
            completedAt: Date.now()
          }
        }));
      } else {
        // Update status to failed
        setCompressionStatuses(prev => ({
          ...prev,
          [statusKey]: {
            filePath,
            presetId,
            status: 'failed',
            progress: 0,
            error: result?.[0]?.error || 'Compression failed'
          }
        }));
      }
    } catch (error) {
      console.error('Error compressing single file:', error);
      const statusKey = `${filePath}::${presetId}`;
      setCompressionStatuses(prev => ({
        ...prev,
        [statusKey]: {
          filePath,
          presetId,
          status: 'failed',
          progress: 0,
          error: error instanceof Error ? error.message : 'Compression failed'
        }
      }));
    }
  }, []);

  // New function to handle re-compression with overwrite confirmation
  const handleRecompressFile = useCallback(async (filePath: string, presetId: string): Promise<void> => {
    try {
      // Check if this file/preset combination has already been compressed
      const statusKey = `${filePath}::${presetId}`;
      const existingStatus = compressionStatuses[statusKey];
      
      // handleRecompressFile called
      
      if (existingStatus && existingStatus.status === 'completed' && existingStatus.outputPath) {
        // Found completed compression, showing overwrite dialog
        // File already compressed, show overwrite confirmation
        const newOutputPath = await window.electronAPI.getDefaultOutputDirectory();
        setOverwriteConfirmation({
          filePath,
          presetId,
          existingOutputPath: existingStatus.outputPath,
          newOutputPath: `${newOutputPath}/${filePath.split('/').pop()?.replace(/\.[^/.]+$/, '')}_${presetId}.mp4`
        });
      } else {
        // No existing compression found, proceeding with single file compression
        // No existing compression, proceed normally
        await compressSingleFile(filePath, presetId);
      }
    } catch (error) {
      console.error('Error handling re-compression:', error);
    }
  }, [compressionStatuses, compressSingleFile]);

  // Function to confirm overwrite and proceed with compression
  const confirmOverwrite = useCallback(async (): Promise<void> => {
    if (!overwriteConfirmation) return;

    // confirmOverwrite called

    try {
      // Close confirmation dialog first
      setOverwriteConfirmation(null);

      // Check if this was triggered from main compression flow or individual recompress
      if (pendingCompressionParams) {
        // Continuing with main compression flow
        // This was triggered from main compression flow, continue with the full batch
        const { existingFilesToRemove } = pendingCompressionParams;
        setPendingCompressionParams(null);
        
        // Removing existing files
        
        // Remove all existing compression statuses for files that will be recompressed
        setCompressionStatuses(prev => {
          const newStatuses = { ...prev };
          existingFilesToRemove.forEach(statusKey => {
            delete newStatuses[statusKey];
          });
          // Updated compressionStatuses
          return newStatuses;
        });
        
        // Don't reset compression state since we want to continue the existing process
        // The compression is already running, we just need to let it continue
        // Letting existing compression continue
        return; // Don't call compressVideos again since it's already running
      } else {
        // This was triggered from individual recompress button, compress single file
        const statusKey = `${overwriteConfirmation.filePath}::${overwriteConfirmation.presetId}`;
        setCompressionStatuses(prev => {
          const newStatuses = { ...prev };
          delete newStatuses[statusKey];
          return newStatuses;
        });
        
        await compressSingleFile(overwriteConfirmation.filePath, overwriteConfirmation.presetId);
      }
    } catch (error) {
      console.error('Error confirming overwrite:', error);
    }
  }, [overwriteConfirmation, compressSingleFile, pendingCompressionParams]);

  // Function to cancel overwrite
  const cancelOverwrite = useCallback((): void => {
    setOverwriteConfirmation(null);
    setPendingCompressionParams(null);
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
      // Compression cancellation requested
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
    setSelectedFiles,
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
    cancelCompression,
    // New compression status tracking
    compressionStatuses,
    overwriteConfirmation,
    batchOverwriteConfirmation,
    handleRecompressFile,
    confirmOverwrite,
    cancelOverwrite
  };
};
