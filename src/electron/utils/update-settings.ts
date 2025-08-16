import { Settings } from './settings';

/**
 * Simple update tracking
 */
export interface UpdateTracking {
  lastCheckTime?: number;
  lastCheckVersion?: string;
}

/**
 * Default update tracking
 */
const DEFAULT_UPDATE_TRACKING: UpdateTracking = {};

/**
 * Simple update tracking management
 */
export class UpdateSettings {
  private static readonly UPDATE_TRACKING_KEY = 'updateTracking';
  
  /**
   * Get the current update tracking
   */
  static getUpdateTracking(): UpdateTracking {
    const savedTracking = Settings.getSetting(this.UPDATE_TRACKING_KEY, DEFAULT_UPDATE_TRACKING);
    return { ...DEFAULT_UPDATE_TRACKING, ...savedTracking };
  }
  
  /**
   * Save update tracking
   */
  static saveUpdateTracking(tracking: Partial<UpdateTracking>): void {
    const currentTracking = this.getUpdateTracking();
    const newTracking = { ...currentTracking, ...tracking };
    Settings.setSetting(this.UPDATE_TRACKING_KEY, newTracking);
  }
  
  /**
   * Mark that an update check was performed
   */
  static markUpdateCheck(version?: string): void {
    this.saveUpdateTracking({
      lastCheckTime: Date.now(),
      lastCheckVersion: version
    });
  }
  
  /**
   * Get time since last update check
   */
  static getTimeSinceLastCheck(): number | null {
    const tracking = this.getUpdateTracking();
    if (!tracking.lastCheckTime) {
      return null;
    }
    return Date.now() - tracking.lastCheckTime;
  }
  
  /**
   * Get formatted time since last check
   */
  static getFormattedTimeSinceLastCheck(): string {
    const timeSince = this.getTimeSinceLastCheck();
    if (!timeSince) {
      return 'Never';
    }
    
    const hours = Math.floor(timeSince / (1000 * 60 * 60));
    const minutes = Math.floor((timeSince % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    } else {
      return `${minutes}m ago`;
    }
  }
}
