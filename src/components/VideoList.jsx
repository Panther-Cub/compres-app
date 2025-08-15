import React from 'react';
import { Grid, List, X, FileVideo, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

const VideoList = ({ 
  selectedFiles, 
  fileInfos, 
  viewMode, 
  onViewModeChange, 
  onRemoveFile,
  formatFileSize,
  formatDuration 
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="non-draggable text-sm"
          >
            <Grid className="w-3 h-3" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="non-draggable text-sm"
          >
            <List className="w-3 h-3" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => {
              const info = fileInfos[file] || {};
              return (
                <div key={file} className="file-card p-4 rounded-lg group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 bg-foreground/10 rounded-lg flex items-center justify-center">
                      <FileVideo className="w-4 h-4 text-foreground/70" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(file)}
                      className="non-draggable opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium truncate">{file.split('/').pop()}</h4>
                    <div className="space-y-1">
                      {info.size && (
                        <p className="text-sm text-muted-foreground">
                          Size: {formatFileSize(info.size)}
                        </p>
                      )}
                      {info.duration && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {formatDuration(info.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const info = fileInfos[file] || {};
              return (
                <div key={file} className="file-card p-3 rounded-lg group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-6 h-6 bg-foreground/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <FileVideo className="w-3 h-3 text-foreground/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{file.split('/').pop()}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          {info.size && (
                            <span className="text-sm text-muted-foreground">
                              {formatFileSize(info.size)}
                            </span>
                          )}
                          {info.duration && (
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(info.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(file)}
                      className="non-draggable opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoList;
