export class ProgressHandler {
  private lastProgressTime = Date.now();
  private lastProgressPercent = 0;
  private lastUpdateTime = 0;
  private readonly MIN_UPDATE_INTERVAL = 50; // Minimum 50ms between updates for smooth UI

  /**
   * Calculate fluid progress with minimal smoothing
   */
  calculateAdjustedProgress(rawPercent: number): number {
    const currentTime = Date.now();
    let adjustedPercent = Math.max(0, Math.min(100, rawPercent));
    
    // Only apply minimal smoothing to prevent UI jitter
    // Allow much smaller changes to pass through
    const changeThreshold = 0.1; // Much smaller threshold for fluid updates
    
    if (Math.abs(adjustedPercent - this.lastProgressPercent) >= changeThreshold) {
      this.lastProgressPercent = adjustedPercent;
      this.lastProgressTime = currentTime;
    }
    
    return adjustedPercent; // Return raw value for maximum fluidity
  }

  /**
   * Check if we should update the UI (throttled for performance)
   */
  shouldUpdateUI(currentPercent: number): boolean {
    const currentTime = Date.now();
    
    // Always update if enough time has passed (prevents UI freezing)
    if (currentTime - this.lastUpdateTime >= this.MIN_UPDATE_INTERVAL) {
      this.lastUpdateTime = currentTime;
      return true;
    }
    
    // Also update if there's a significant change (prevents missing important updates)
    const significantChange = Math.abs(currentPercent - this.lastProgressPercent) >= 1.0;
    if (significantChange) {
      this.lastUpdateTime = currentTime;
      return true;
    }
    
    return false;
  }

  /**
   * Reset the progress handler state
   */
  reset(): void {
    this.lastProgressTime = Date.now();
    this.lastProgressPercent = 0;
    this.lastUpdateTime = 0;
  }

  /**
   * Set initial progress for two-pass encoding (second pass starts at 50%)
   */
  setTwoPassProgress(progress: number): number {
    // Second pass is the remaining 50% of total work (50-100%)
    const adjustedPercent = Math.max(50, Math.min(100, 50 + progress * 0.5));
    
    // Use the same fluid logic for two-pass
    return this.calculateAdjustedProgress(adjustedPercent);
  }

  /**
   * Get smooth progress for display (with minimal rounding)
   */
  getDisplayProgress(rawPercent: number): number {
    const adjusted = this.calculateAdjustedProgress(rawPercent);
    // Round to 1 decimal place for smooth display
    return Math.round(adjusted * 10) / 10;
  }
}
