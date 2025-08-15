

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
      getPresets: () => Promise<Record<string, any>>;
      
      // Compression operations
      compressVideos: (data: {
        files: string[];
        presets: string[];
        keepAudio: boolean;
        outputDirectory: string;
      }) => Promise<any[]>;
      compressVideosAdvanced: (data: {
        files: string[];
        presets: string[];
        keepAudio: boolean;
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
