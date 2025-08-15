import React from 'react';
import { Upload, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { macAnimations } from '../lib/animations';
import type { VideoDropZoneProps } from '../types';

const VideoDropZone: React.FC<VideoDropZoneProps> = ({ 
  isDragOver, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onSelectFiles
}) => {
  return (
    <motion.div 
      className="h-full flex items-center justify-center p-8"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        className={`drop-zone w-full max-w-md p-12 rounded-2xl text-center transition-all duration-300 ${
          isDragOver ? 'drag-over' : ''
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        variants={macAnimations.dropZone}
        whileHover="whileHover"
        whileDrag="whileDrag"
      >
        <motion.div 
          className="w-12 h-12 mx-auto bg-foreground/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Upload className="w-6 h-6 text-foreground/70" />
        </motion.div>
        <motion.h3 
          className="text-xl font-light mt-6 mb-2"
          variants={macAnimations.slideUp}
        >
          Drop your videos here
        </motion.h3>
        <motion.p 
          className="text-base text-muted-foreground mb-6 leading-relaxed"
          variants={macAnimations.slideUp}
        >
          Drag and drop video files to compress them for web optimization
        </motion.p>
        <motion.div
          variants={macAnimations.slideUp}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={onSelectFiles}
            className="btn text-sm"
            size="sm"
          >
            <Video className="w-3 h-3 mr-2" />
            Select Videos
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default VideoDropZone;
