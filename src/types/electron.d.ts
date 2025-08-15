

declare global {
  interface Window {
    electronAPI: {
      // Menu events
      onShowAboutModal: (callback: () => void) => void;
      onTriggerFileSelect: (callback: () => void) => void;
      onTriggerOutputSelect: (callback: () => void) => void;
      
      // Compression events
      onCompressionStarted: (callback: (data: any) => void) => void;
      onCompressionProgress: (callback: (data: any) => void) => void;
      onCompressionComplete: (callback: (data: any) => void) => void;
      
      // File operations
      getFileInfo: (filePath: string) => Promise<{
        duration: number;
        size: number;
        width: number;
        height: number;
        codec: string;
      }>;
      selectFiles: () => Promise<string[]>;
      selectOutputDirectory: () => Promise<string>;
      getDefaultOutputDirectory: () => Promise<string>;
      batchRenameFiles: (data: { files: string[]; newNames: Record<string, string> }) => Promise<Array<{
        success: boolean;
        oldPath: string;
        newPath?: string;
        error?: string;
      }>>;
      getPresets: () => Promise<Record<string, any>>;
      
      // Thumbnails and file operations
      generateThumbnail: (filePath: string) => Promise<string>;
      showInFinder: (filePath: string) => Promise<{ success: boolean }>;
      openFile: (filePath: string) => Promise<{ success: boolean }>;
      
      // Compression operations
      compressVideos: (data: {
        files: string[];
        presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
        outputDirectory: string;
        advancedSettings?: any;
      }) => Promise<any[]>;
      compressVideosAdvanced: (data: {
        files: string[];
        presetConfigs: Array<{ presetId: string; keepAudio: boolean }>;
        outputDirectory: string;
        advancedSettings: any;
      }) => Promise<any[]>;
      cancelCompression: () => Promise<{ success: boolean }>;
      
      // Utility
      removeAllListeners: (channel: string) => void;
    };
  }
}

export {};
