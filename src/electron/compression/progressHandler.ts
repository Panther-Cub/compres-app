export class ProgressHandler {
  private lastProgressTime = Date.now();
  private lastProgressPercent = 0;

  /**
   * Calculate adjusted progress with smoothing and stuck detection
   */
  calculateAdjustedProgress(rawPercent: number): number {
    const currentTime = Date.now();
    let adjustedPercent = Math.max(0, Math.min(100, rawPercent));
    
    // Handle the 99% stuck issue by smoothing progress
    if (adjustedPercent >= 99 && this.lastProgressPercent >= 99) {
      const timeStuck = currentTime - this.lastProgressTime;
      if (timeStuck > 5000) {
        // Gradually increase to 99.5% to show activity
        const additionalProgress = Math.min(0.5, (timeStuck - 5000) / 10000);
        adjustedPercent = 99 + additionalProgress;
      }
    } else if (adjustedPercent < 99) {
      // Reset stuck timer if we're not at 99%
      this.lastProgressTime = currentTime;
    }
    
    this.lastProgressPercent = adjustedPercent;
    return Math.round(adjustedPercent);
  }

  /**
   * Check if progress has changed meaningfully (≥0.5% difference)
   */
  hasMeaningfulChange(currentPercent: number): boolean {
    return Math.abs(currentPercent - this.lastProgressPercent) >= 0.5;
  }

  /**
   * Reset the progress handler state
   */
  reset(): void {
    this.lastProgressTime = Date.now();
    this.lastProgressPercent = 0;
  }

  /**
   * Set initial progress for two-pass encoding (second pass starts at 50%)
   */
  setTwoPassProgress(progress: number): number {
    // Second pass is the remaining 50% of total work (50-100%)
    let adjustedPercent = Math.max(50, Math.min(100, 50 + progress * 0.5));
    
    // Handle the 99% stuck issue in second pass
    if (adjustedPercent >= 99 && this.lastProgressPercent >= 99) {
      const timeStuck = Date.now() - this.lastProgressTime;
      if (timeStuck > 5000) {
        const additionalProgress = Math.min(0.5, (timeStuck - 5000) / 10000);
        adjustedPercent = 99 + additionalProgress;
      }
    } else if (adjustedPercent < 99) {
      this.lastProgressTime = Date.now();
    }
    
    this.lastProgressPercent = adjustedPercent;
    return Math.round(adjustedPercent);
  }
}
