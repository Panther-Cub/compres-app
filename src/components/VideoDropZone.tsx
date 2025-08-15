import React from 'react';
import { Upload, Video } from 'lucide-react';
import { Button } from './ui/button';
import type { VideoDropZoneProps } from '../types';

const VideoDropZone: React.FC<VideoDropZoneProps> = ({ 
  isDragOver, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onSelectFiles
}) => {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div
        className={`drop-zone w-full max-w-md p-12 rounded-2xl text-center transition-all duration-300 ${
          isDragOver ? 'drag-over' : ''
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="w-12 h-12 mx-auto bg-foreground/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Upload className="w-6 h-6 text-foreground/70" />
        </div>
        <h3 className="text-xl font-light mt-6 mb-2">Drop your videos here</h3>
        <p className="text-base text-muted-foreground mb-6 leading-relaxed">
          Drag and drop video files to compress them for web optimization
        </p>
        <Button
          onClick={onSelectFiles}
          className="btn text-sm"
          size="sm"
        >
          <Video className="w-3 h-3 mr-2" />
          Select Videos
        </Button>
      </div>
    </div>
  );
};

export default VideoDropZone;
