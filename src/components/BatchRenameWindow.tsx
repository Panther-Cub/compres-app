import React, { useState, useEffect, useCallback } from 'react';
import { FileVideo } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Label, RadioGroup, RadioGroupItem } from './ui';
import { getFileName } from '../utils/formatters';
import { macAnimations } from '../lib/animations';

interface BatchRenameWindowProps {
  onClose: () => void;
}

interface RenamePattern {
  id: string;
  name: string;
  description: string;
  template: string;
  example: string;
}

const BatchRenameWindow: React.FC<BatchRenameWindowProps> = ({ onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string>('custom');
  const [customPrefix, setCustomPrefix] = useState<string>('Video');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [previewNames, setPreviewNames] = useState<Record<string, string>>({});

  const renamePatterns: RenamePattern[] = [
    {
      id: 'custom',
      name: 'Custom Prefix',
      description: 'Use a custom prefix with numbers',
      template: '{prefix} {number}',
      example: 'Video 1, Video 2, Video 3'
    },
    {
      id: 'date',
      name: 'Date Based',
      description: 'Use current date with numbers',
      template: '{date} {number}',
      example: '2024-01-15 1, 2024-01-15 2'
    },
    {
      id: 'original',
      name: 'Keep Original',
      description: 'Keep original filenames',
      template: '{original}',
      example: 'Original filename'
    },
    {
      id: 'clean',
      name: 'Clean Names',
      description: 'Clean up original names',
      template: '{clean}',
      example: 'Cleaned filename'
    }
  ];

  // Load selected files from main window
  useEffect(() => {
    const loadSelectedFiles = async () => {
      try {
        if (window.electronAPI) {
          // This would need to be implemented to get files from main window
          // For now, we'll use a placeholder
          setSelectedFiles([]);
        }
      } catch (error) {
        console.error('Error loading selected files:', error);
      }
    };
    
    loadSelectedFiles();
  }, []);

  const generatePreviewNames = useCallback(() => {
    const newNames: Record<string, string> = {};
    const today = new Date().toISOString().split('T')[0];

    selectedFiles.forEach((file, index) => {
      const originalName = getFileName(file);
      const extension = file.split('.').pop() || 'mp4';
      const number = startNumber + index;

      let newName = '';

      switch (selectedPattern) {
        case 'custom':
          newName = `${customPrefix} ${number}`;
          break;
        case 'date':
          newName = `${today} ${number}`;
          break;
        case 'original':
          newName = originalName;
          break;
        case 'clean':
          newName = originalName
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          break;
        default:
          newName = `${customPrefix} ${number}`;
      }

      // Ensure unique names
      if (Object.values(newNames).includes(newName)) {
        newName = `${newName} (${index + 1})`;
      }

      newNames[file] = `${newName}.${extension}`;
    });

    setPreviewNames(newNames);
  }, [selectedFiles, selectedPattern, customPrefix, startNumber]);

  useEffect(() => {
    generatePreviewNames();
  }, [generatePreviewNames]);

  const handleRename = async () => {
    try {
      if (window.electronAPI) {
        // This would need to be implemented to send rename data back to main window
        console.log('Renaming files:', previewNames);
        onClose();
      }
    } catch (error) {
      console.error('Error renaming files:', error);
    }
  };

  return (
    <motion.div 
      className="h-full flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Draggable Title Bar */}
      <div className="draggable-region fixed top-0 left-0 right-0 z-50 h-10 border-b border-border/20 flex items-center justify-between px-4 select-none flex-shrink-0">
        <div className="flex items-center gap-3 pl-20">
          <FileVideo className="w-3 h-3 text-foreground/70" />
          <span className="text-[0.625rem] font-normal text-foreground/70">Batch Rename</span>
        </div>
      </div>

      {/* Content with top padding for fixed header */}
      <div className="flex-1 overflow-y-auto pt-10">
        <div className="p-6 space-y-6">
          <motion.div 
            className="space-y-6"
            variants={macAnimations.slideUp}
            initial="initial"
            animate="animate"
          >
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Batch Rename Files</h2>
              <p className="text-sm text-muted-foreground">
                Rename {selectedFiles.length} selected video files
              </p>
            </div>

            {/* Rename Pattern Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Rename Pattern</h3>
              <RadioGroup
                value={selectedPattern}
                onValueChange={setSelectedPattern}
                className="space-y-3"
              >
                {renamePatterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={pattern.id} id={pattern.id} />
                    <Label htmlFor={pattern.id} className="flex-1">
                      <div>
                        <div className="font-medium text-sm">{pattern.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {pattern.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Custom Prefix Input */}
            {selectedPattern === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-prefix" className="text-sm font-medium">
                  Custom Prefix
                </Label>
                <Input
                  id="custom-prefix"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder="Enter prefix..."
                  className="w-full"
                />
              </div>
            )}

            {/* Start Number Input */}
            {(selectedPattern === 'custom' || selectedPattern === 'date') && (
              <div className="space-y-2">
                <Label htmlFor="start-number" className="text-sm font-medium">
                  Start Number
                </Label>
                <Input
                  id="start-number"
                  type="number"
                  value={startNumber}
                  onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full"
                />
              </div>
            )}

            {/* Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Preview</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={file} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">
                          {getFileName(file)}
                        </p>
                        <p className="text-sm font-medium truncate">
                          {previewNames[file] || getFileName(file)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={selectedFiles.length === 0}
                className="flex-1"
              >
                Rename Files
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default BatchRenameWindow;
