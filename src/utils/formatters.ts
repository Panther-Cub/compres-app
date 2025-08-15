export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getFileName = (filePath: string): string => {
  // Extract just the filename without path - cross-platform compatible
  const fileName = filePath.split(/[/\\]/).pop() || filePath;
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
};

export const getPresetFileName = (originalFileName: string, presetId: string, keepAudio: boolean): string => {
  const audioSuffix = keepAudio ? 'audio' : 'muted';
  return `${originalFileName}_${presetId}-${audioSuffix}`;
};
