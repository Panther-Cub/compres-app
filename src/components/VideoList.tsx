import React, { useState } from 'react';
import { Grid, List, X, Play, FolderOpen, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import VideoThumbnail from './VideoThumbnail';
import { containerVariants, macAnimations } from '../lib/animations';
import type { VideoListProps } from '../types';

const VideoList: React.FC<VideoListProps> = ({ 
  selectedFiles, 
  fileInfos, 
  viewMode, 
  onViewModeChange, 
  onRemoveFile,
  formatFileSize,
  formatDuration,
  onGenerateThumbnail,
  onShowInFinder,
  onOpenFile
}) => {
  const [gridZoom, setGridZoom] = useState(200); // Default minimum column width
  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <motion.div 
        className="flex items-center justify-between p-4 border-b border-border/20 flex-shrink-0"
        variants={macAnimations.slideUp}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="non-draggable text-sm"
            >
              <Grid className="w-3 h-3" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="non-draggable text-sm"
            >
              <List className="w-3 h-3" />
            </Button>
          </motion.div>
          
          {/* Grid Zoom Controls - only show in grid view */}
          {viewMode === 'grid' && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border/20">
              <ZoomOut className="w-3 h-3 text-muted-foreground" />
              <input
                type="range"
                min="120"
                max="400"
                value={gridZoom}
                onChange={(e) => setGridZoom(Number(e.target.value))}
                className="w-20 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <ZoomIn className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div 
              key="grid"
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${gridZoom}px, 1fr))` }}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {selectedFiles.map((file, index) => {
                  const info = fileInfos[file] || {};
                  return (
                    <motion.div
                      key={file}
                      className="file-card p-3 rounded-lg group"
                      variants={macAnimations.fileCard}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="whileHover"
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex flex-col space-y-3">
                        <div className="flex justify-center">
                                                  <VideoThumbnail
                          filePath={file}
                          fileName={file.split('/').pop() || ''}
                          thumbnail={info.thumbnail}
                          onGenerateThumbnail={onGenerateThumbnail}
                          onPlay={onOpenFile}
                          size="responsive"
                        />
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{file.split('/').pop()}</h4>
                            <div className="space-y-1 mt-1">
                              {info.size && (
                                <p className="text-xs text-muted-foreground">
                                  Size: {formatFileSize(info.size)}
                                </p>
                              )}
                              {info.duration && (
                                <p className="text-xs text-muted-foreground">
                                  Duration: {formatDuration(info.duration)}
                                </p>
                              )}
                            </div>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveFile(file)}
                              className="non-draggable opacity-60 hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </motion.div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenFile(file)}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onShowInFinder(file)}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <FolderOpen className="w-3 h-3 mr-1" />
                            Show
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              className="space-y-1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {selectedFiles.map((file, index) => {
                  const info = fileInfos[file] || {};
                  return (
                    <motion.div
                      key={file}
                      className="file-card py-1 px-2 rounded-lg group"
                      variants={macAnimations.listItem}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover={{ x: 5 }}
                      transition={{ delay: index * 0.05 }}
                    >
                                              <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                                      <VideoThumbnail
                            filePath={file}
                            fileName={file.split('/').pop() || ''}
                            thumbnail={info.thumbnail}
                            onGenerateThumbnail={onGenerateThumbnail}
                            onPlay={onOpenFile}
                            size="small"
                          />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <h4 className="text-sm font-medium truncate">{file.split('/').pop()}</h4>
                                {info.size && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(info.size)}
                                  </span>
                                )}
                                {info.duration && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDuration(info.duration)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenFile(file)}
                              className="text-xs px-1.5 py-0.5 h-6"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Play
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onShowInFinder(file)}
                              className="text-xs px-1.5 py-0.5 h-6"
                            >
                              <FolderOpen className="w-3 h-3 mr-1" />
                              Show
                            </Button>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveFile(file)}
                                className="non-draggable opacity-60 hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoList;
