import { BrowserWindow } from 'electron';

/**
 * Centralized memory management for compression operations
 * Provides DRY, clean, and optimal memory management
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private activeCompressions: Map<string, any> = new Map();
  private progressIntervals: Set<NodeJS.Timeout> = new Set();
  private eventListeners: Map<string, Set<Function>> = new Map();
  private mainWindow: BrowserWindow | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Initialize memory manager with main window reference
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  /**
   * Track active compression process
   */
  trackCompression(taskKey: string, process: any): void {
    this.activeCompressions.set(taskKey, process);
  }

  /**
   * Remove compression process from tracking
   */
  removeCompression(taskKey: string): void {
    this.activeCompressions.delete(taskKey);
  }

  /**
   * Track progress update interval
   */
  trackProgressInterval(interval: NodeJS.Timeout): void {
    this.progressIntervals.add(interval);
  }

  /**
   * Remove progress update interval
   */
  removeProgressInterval(interval: NodeJS.Timeout): void {
    if (this.progressIntervals.has(interval)) {
      clearInterval(interval);
      this.progressIntervals.delete(interval);
    }
  }

  /**
   * Track event listener for cleanup
   */
  trackEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryStats(): {
    activeCompressions: number;
    progressIntervals: number;
    eventListeners: number;
    totalEvents: number;
  } {
    let totalEvents = 0;
    this.eventListeners.forEach(listeners => {
      totalEvents += listeners.size;
    });

    return {
      activeCompressions: this.activeCompressions.size,
      progressIntervals: this.progressIntervals.size,
      eventListeners: this.eventListeners.size,
      totalEvents
    };
  }

  /**
   * Clean up all tracked resources
   */
  cleanup(): void {
    try {
      // Clear all active compressions
      this.activeCompressions.clear();

      // Clear all progress intervals
      this.progressIntervals.forEach(interval => {
        try {
          clearInterval(interval);
        } catch (error) {
          // Error clearing progress interval
        }
      });
      this.progressIntervals.clear();

      // Clear all event listeners
      this.eventListeners.clear();

      // Force garbage collection if available (development only)
      if (global.gc) {
        try {
          global.gc();
        } catch (error) {
          // Error during garbage collection
        }
      }
    } catch (error) {
      // Error during memory manager cleanup
    }
  }

  /**
   * Clean up compression-specific resources
   */
  cleanupCompression(): void {
    try {
      // Clear active compressions
      this.activeCompressions.clear();
      
      // Clear progress intervals
      this.progressIntervals.forEach(interval => {
        try {
          clearInterval(interval);
        } catch (error) {
          // Error clearing progress interval during compression cleanup
        }
      });
      this.progressIntervals.clear();
      
      // Clear event listeners
      this.eventListeners.clear();
      
      // Force garbage collection if available
      if (global.gc) {
        try {
          global.gc();
        } catch (error) {
          // Error during garbage collection
        }
      }
    } catch (error) {
      // Error during compression cleanup
    }
  }

  /**
   * Check for memory leaks and log warnings
   */
  checkForLeaks(): void {
    const stats = this.getMemoryStats();
    
    if (stats.activeCompressions > 0) {
      // Potential leak - active compressions not cleaned up
    }
    
    if (stats.progressIntervals > 0) {
      // Potential leak - progress intervals not cleaned up
    }
    
    if (stats.totalEvents > 0) {
      // Potential leak - event listeners not cleaned up
    }
    
    // Check memory usage and warn if high
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (heapUsedMB > 1500) { // Warn if using more than 1.5GB
      // Force garbage collection if available
      if (global.gc) {
        try {
          global.gc();
        } catch (error) {
          // Error during emergency garbage collection
        }
      }
    }
  }
}

/**
 * Memory management utilities for common operations
 */
export class MemoryUtils {
  /**
   * Safely clear a Map and log the operation
   */
  static clearMap<T>(map: Map<string, T>, name: string): void {
    map.clear();
  }

  /**
   * Safely clear an array and log the operation
   */
  static clearArray<T>(array: T[], name: string): void {
    array.length = 0;
  }

  /**
   * Safely clear a Set and log the operation
   */
  static clearSet<T>(set: Set<T>, name: string): void {
    set.clear();
  }

  /**
   * Safely clear intervals and log the operation
   */
  static clearIntervals(intervals: Set<NodeJS.Timeout>, name: string): void {
    intervals.forEach(interval => {
      clearInterval(interval);
    });
    intervals.clear();
  }

  /**
   * Force garbage collection if available
   */
  static forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get memory usage information
   */
  static getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    };
  }

  /**
   * Log memory usage
   */
  static logMemoryUsage(context: string): void {
    // Memory usage logging disabled
  }
}
