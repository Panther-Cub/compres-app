

import { ElectronAPI } from '../electron/preload/api-interface';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
