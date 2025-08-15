import React from 'react';
import { Grid, List, X, FileVideo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { containerVariants, macAnimations } from '../lib/animations';
import type { VideoListProps } from '../types';

const VideoList: React.FC<VideoListProps> = ({ 
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
                      className="file-card p-4 rounded-lg group"
                      variants={macAnimations.fileCard}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="whileHover"
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <motion.div 
                          className="w-8 h-8 bg-foreground/10 rounded-lg flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FileVideo className="w-4 h-4 text-foreground/70" />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveFile(file)}
                              className="non-draggable opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </motion.div>
                        </motion.div>
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              className="space-y-2"
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
                      variants={macAnimations.listItem}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover={{ x: 5 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <motion.div 
                            className="w-6 h-6 bg-foreground/10 rounded-md flex items-center justify-center flex-shrink-0"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <FileVideo className="w-3 h-3 text-foreground/70" />
                          </motion.div>
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
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveFile(file)}
                              className="non-draggable opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </motion.div>
                        </motion.div>
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
