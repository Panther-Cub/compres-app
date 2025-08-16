import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface HardwareCapabilities {
  hasVideoToolbox: boolean;
  hasHEVC: boolean;
  hasH264: boolean;
  chipType: 'Apple Silicon' | 'Intel' | 'Unknown';
  recommendedCodec: string;
  fallbackCodec: string;
}

export class HardwareDetection {
  private static capabilities: HardwareCapabilities | null = null;

  /**
   * Detect hardware acceleration capabilities on Mac
   */
  static async detectCapabilities(): Promise<HardwareCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const chipType = this.detectChipType();
    let hasVideoToolbox = false;
    let hasHEVC = false;
    let hasH264 = false;

    try {
      // Check if we're on macOS
      if (os.platform() === 'darwin') {
        // Check VideoToolbox availability using FFmpeg
        const { stdout: encoders } = await execAsync('ffmpeg -encoders | grep videotoolbox');
        hasVideoToolbox = encoders.includes('videotoolbox');
        
        // Check specific codec support
        const { stdout: h264Support } = await execAsync('ffmpeg -encoders | grep h264_videotoolbox');
        hasH264 = h264Support.includes('h264_videotoolbox');
        
        const { stdout: hevcSupport } = await execAsync('ffmpeg -encoders | grep hevc_videotoolbox');
        hasHEVC = hevcSupport.includes('hevc_videotoolbox');
      }
    } catch (error) {
      console.warn('Hardware detection failed, using software fallback:', error);
    }

    // Determine recommended codec based on capabilities
    let recommendedCodec = 'libx264';
    let fallbackCodec = 'libx264';

    if (hasVideoToolbox) {
      if (hasHEVC) {
        recommendedCodec = 'hevc_videotoolbox';
        fallbackCodec = 'h264_videotoolbox';
      } else if (hasH264) {
        recommendedCodec = 'h264_videotoolbox';
        fallbackCodec = 'libx264';
      }
    }

    this.capabilities = {
      hasVideoToolbox,
      hasHEVC,
      hasH264,
      chipType,
      recommendedCodec,
      fallbackCodec
    };

    console.log('Hardware capabilities detected:', this.capabilities);
    return this.capabilities;
  }

  /**
   * Detect the chip type (Apple Silicon vs Intel)
   */
  private static detectChipType(): 'Apple Silicon' | 'Intel' | 'Unknown' {
    try {
      const arch = os.arch();
      const platform = os.platform();
      
      if (platform === 'darwin') {
        if (arch === 'arm64') {
          return 'Apple Silicon';
        } else if (arch === 'x64') {
          return 'Intel';
        }
      }
    } catch (error) {
      console.warn('Could not detect chip type:', error);
    }
    
    return 'Unknown';
  }

  /**
   * Get optimal preset based on hardware capabilities
   */
  static async getOptimalPreset(): Promise<string> {
    const capabilities = await this.detectCapabilities();
    
    if (capabilities.hasVideoToolbox) {
      if (capabilities.hasHEVC) {
        return 'mac-hevc';
      } else if (capabilities.hasH264) {
        return 'mac-hardware';
      }
    }
    
    return 'web-optimized';
  }

  /**
   * Check if hardware acceleration is recommended for the current system
   */
  static async isHardwareAccelerationRecommended(): Promise<boolean> {
    const capabilities = await this.detectCapabilities();
    return capabilities.hasVideoToolbox;
  }

  /**
   * Get recommended concurrent compression limit based on hardware
   */
  static async getRecommendedConcurrency(): Promise<number> {
    const capabilities = await this.detectCapabilities();
    const cpuCount = os.cpus().length;
    
    if (capabilities.hasVideoToolbox) {
      // Hardware acceleration can handle more concurrent tasks
      return Math.max(2, Math.min(6, cpuCount));
    } else {
      // Software encoding is more CPU intensive
      return Math.max(1, Math.min(3, Math.floor(cpuCount / 2)));
    }
  }

  /**
   * Validate if a codec is supported on the current system
   */
  static async isCodecSupported(codec: string): Promise<boolean> {
    const capabilities = await this.detectCapabilities();
    
    switch (codec) {
      case 'h264_videotoolbox':
        return capabilities.hasH264;
      case 'hevc_videotoolbox':
        return capabilities.hasHEVC;
      case 'libx264':
      case 'libx265':
      case 'libvpx-vp9':
        return true; // Software codecs are always available
      default:
        return false;
    }
  }

  /**
   * Get fallback codec if the requested one is not supported
   */
  static async getFallbackCodec(requestedCodec: string): Promise<string> {
    const capabilities = await this.detectCapabilities();
    
    if (requestedCodec === 'hevc_videotoolbox' && !capabilities.hasHEVC) {
      return capabilities.hasH264 ? 'h264_videotoolbox' : 'libx264';
    }
    
    if (requestedCodec === 'h264_videotoolbox' && !capabilities.hasH264) {
      return 'libx264';
    }
    
    return 'libx264'; // Default fallback
  }
}
