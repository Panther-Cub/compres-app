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
    console.log('MemoryManager: Starting cleanup...');
    
    // Log memory stats before cleanup
    const stats = this.getMemoryStats();
    console.log('MemoryManager: Memory stats before cleanup:', stats);

    try {
      // Clear all active compressions
      this.activeCompressions.clear();
      console.log('MemoryManager: Cleared active compressions');

      // Clear all progress intervals
      this.progressIntervals.forEach(interval => {
        try {
          clearInterval(interval);
        } catch (error) {
          console.warn('Error clearing progress interval:', error);
        }
      });
      this.progressIntervals.clear();
      console.log('MemoryManager: Cleared progress intervals');

      // Clear all event listeners
      this.eventListeners.clear();
      console.log('MemoryManager: Cleared event listeners');

      // Force garbage collection if available (development only)
      if (global.gc) {
        try {
          global.gc();
          console.log('MemoryManager: Forced garbage collection');
        } catch (error) {
          console.warn('Error during garbage collection:', error);
        }
      }

      console.log('MemoryManager: Cleanup completed');
    } catch (error) {
      console.error('Error during memory manager cleanup:', error);
    }
  }

  /**
   * Clean up compression-specific resources
   */
  cleanupCompression(): void {
    console.log('MemoryManager: Cleaning up compression resources...');
    
    try {
      // Clear active compressions
      this.activeCompressions.clear();
      
      // Clear progress intervals
      this.progressIntervals.forEach(interval => {
        try {
          clearInterval(interval);
        } catch (error) {
          console.warn('Error clearing progress interval during compression cleanup:', error);
        }
      });
      this.progressIntervals.clear();
      
      // Clear event listeners
      this.eventListeners.clear();
      
      // Force garbage collection if available
      if (global.gc) {
        try {
          global.gc();
          console.log('MemoryManager: Forced garbage collection during compression cleanup');
        } catch (error) {
          console.warn('Error during garbage collection:', error);
        }
      }
      
      // Log memory usage after cleanup
      const stats = this.getMemoryStats();
      console.log('MemoryManager: Memory stats after compression cleanup:', stats);
      
      console.log('MemoryManager: Compression cleanup completed');
    } catch (error) {
      console.error('Error during compression cleanup:', error);
    }
  }

  /**
   * Check for memory leaks and log warnings
   */
  checkForLeaks(): void {
    const stats = this.getMemoryStats();
    
    if (stats.activeCompressions > 0) {
      console.warn(`MemoryManager: Potential leak - ${stats.activeCompressions} active compressions not cleaned up`);
    }
    
    if (stats.progressIntervals > 0) {
      console.warn(`MemoryManager: Potential leak - ${stats.progressIntervals} progress intervals not cleaned up`);
    }
    
    if (stats.totalEvents > 0) {
      console.warn(`MemoryManager: Potential leak - ${stats.totalEvents} event listeners not cleaned up`);
    }
    
    // Check memory usage and warn if high
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    if (heapUsedMB > 1500) { // Warn if using more than 1.5GB
      console.warn(`MemoryManager: High memory usage detected - Heap: ${heapUsedMB}MB/${heapTotalMB}MB`);
      
      // Force garbage collection if available
      if (global.gc) {
        try {
          global.gc();
          console.log('MemoryManager: Forced garbage collection due to high memory usage');
        } catch (error) {
          console.warn('Error during emergency garbage collection:', error);
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
    const size = map.size;
    map.clear();
    if (size > 0) {
      console.log(`MemoryUtils: Cleared ${size} items from ${name}`);
    }
  }

  /**
   * Safely clear an array and log the operation
   */
  static clearArray<T>(array: T[], name: string): void {
    const size = array.length;
    array.length = 0;
    if (size > 0) {
      console.log(`MemoryUtils: Cleared ${size} items from ${name}`);
    }
  }

  /**
   * Safely clear a Set and log the operation
   */
  static clearSet<T>(set: Set<T>, name: string): void {
    const size = set.size;
    set.clear();
    if (size > 0) {
      console.log(`MemoryUtils: Cleared ${size} items from ${name}`);
    }
  }

  /**
   * Safely clear intervals and log the operation
   */
  static clearIntervals(intervals: Set<NodeJS.Timeout>, name: string): void {
    const size = intervals.size;
    intervals.forEach(interval => {
      clearInterval(interval);
    });
    intervals.clear();
    if (size > 0) {
      console.log(`MemoryUtils: Cleared ${size} intervals from ${name}`);
    }
  }

  /**
   * Force garbage collection if available
   */
  static forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      console.log('MemoryUtils: Forced garbage collection');
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
    const usage = this.getMemoryUsage();
    console.log(`MemoryUtils: ${context} - Heap: ${usage.heapUsed}MB/${usage.heapTotal}MB, External: ${usage.external}MB, RSS: ${usage.rss}MB`);
  }
}
