import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, FileVideo, Play } from 'lucide-react';
import { Button } from './ui';

interface VideoThumbnailProps {
  filePath: string;
  fileName: string;
  thumbnail?: string;
  onGenerateThumbnail: (filePath: string) => Promise<string>;
  onGetThumbnailDataUrl?: (filePath: string) => Promise<string>;
  onPlay?: (filePath: string) => Promise<void>;
  size?: 'small' | 'medium' | 'large' | 'responsive';
  className?: string;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  filePath,
  fileName,
  thumbnail,
  onGenerateThumbnail,
  onGetThumbnailDataUrl,
  onPlay,
  size = 'medium',
  className = ''
}) => {
  const [currentThumbnail, setCurrentThumbnail] = useState<string | undefined>(thumbnail);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Square sizing for simple thumbnails
  const sizeClasses = {
    small: 'w-8 h-8', // 32x32px for list view (super compact)
    medium: 'w-32 h-32', // 128x128px for grid view
    large: 'w-48 h-48', // 192x192px for larger grid
    responsive: 'w-full aspect-square' // Responsive to container width
  };

  const iconSizes = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    responsive: 'w-8 h-8' // Default icon size for responsive
  };

  useEffect(() => {
    if (thumbnail && !currentThumbnail) {
      setCurrentThumbnail(thumbnail);
    }
  }, [thumbnail, currentThumbnail]);

  // Convert thumbnail path to data URL when thumbnail changes
  useEffect(() => {
    const convertThumbnailToDataUrl = async () => {
      if (currentThumbnail && onGetThumbnailDataUrl) {
        try {
          const dataUrl = await onGetThumbnailDataUrl(currentThumbnail);
          setThumbnailDataUrl(dataUrl);
        } catch (error) {
          setThumbnailDataUrl(undefined);
        }
      }
    };

    convertThumbnailToDataUrl();
  }, [currentThumbnail, onGetThumbnailDataUrl]);

  const handleGenerateThumbnail = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const thumbnailPath = await onGenerateThumbnail(filePath);
      setCurrentThumbnail(thumbnailPath);
    } catch (error) {
      // Failed to generate thumbnail
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = async () => {
    if (onPlay) {
      try {
        await onPlay(filePath);
          } catch (error) {
      // Failed to play file
    }
    }
  };

  return (
    <motion.div
      className={`relative group ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {thumbnailDataUrl ? (
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-muted/20 cursor-pointer" onClick={handlePlay}>
          <img
            src={thumbnailDataUrl}
            alt={fileName}
            className="w-full h-full object-cover"
            onError={() => setThumbnailDataUrl(undefined)}
          />
          {/* Play button overlay */}
          <motion.div 
            className="absolute inset-0 bg-black/30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="relative w-full h-full bg-foreground/10 rounded-lg flex items-center justify-center border border-border/20">
          <FileVideo className={`${iconSizes[size]} text-foreground/70`} />
          
          {/* Generate thumbnail button */}
          <motion.div
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              onClick={handleGenerateThumbnail}
              disabled={isGenerating}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      )}
      
      {/* Loading indicator */}
      {isGenerating && (
        <motion.div
          className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoThumbnail;
