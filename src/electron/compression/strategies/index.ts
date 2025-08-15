// Export all compression strategies
export { compressFileWithPreset } from './basic';
export { compressWithSinglePass } from './single-pass';
export { compressWithTwoPass } from './two-pass';

// Export the base class for new strategies
export { BaseCompressionStrategy } from './base';
export type { CompressionContext } from './base';
