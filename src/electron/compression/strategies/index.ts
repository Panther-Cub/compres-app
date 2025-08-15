// Export all compression strategies
export { compressFileWithPreset, getActiveCompressions as getBasicActiveCompressions } from './basic';
export { compressWithSinglePass, getActiveCompressions as getSinglePassActiveCompressions } from './single-pass';
export { compressWithTwoPass, getActiveCompressions as getTwoPassActiveCompressions } from './two-pass';
