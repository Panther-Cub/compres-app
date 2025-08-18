import React, { useState, useEffect, useCallback } from 'react';
import { FileVideo } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Label, RadioGroup, RadioGroupItem } from './ui';
import { getFileName } from '../utils/formatters';
import { macAnimations } from '../lib/animations';
import type { CompressionOutputNaming } from '../types';

interface CompressionOutputNamingWindowProps {
  onClose: () => void;
}

interface NamingPattern {
  id: string;
  name: string;
  description: string;
  template: string;
  example: string;
}

const CompressionOutputNamingWindow: React.FC<CompressionOutputNamingWindowProps> = ({ onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string>('custom');
  const [customPrefix, setCustomPrefix] = useState<string>('Video');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [previewNames, setPreviewNames] = useState<Record<string, string>>({});

  const namingPatterns: NamingPattern[] = [
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
        if (window.electronAPI && window.electronAPI.getSelectedFiles) {
          const files = await window.electronAPI.getSelectedFiles();
          console.log('Loaded selected files:', files);
          setSelectedFiles(files);
        }
      } catch (error) {
        console.error('Error loading selected files:', error);
        setSelectedFiles([]);
      }
    };
    
    loadSelectedFiles();
  }, []);

  const generatePreviewNames = useCallback(() => {
    const newNames: Record<string, string> = {};
    const today = new Date().toISOString().split('T')[0];

    selectedFiles.forEach((file, index) => {
      const originalName = getFileName(file);
      const extension = 'mp4'; // Always mp4 for compressed output
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

  const handleSaveNaming = async () => {
    try {
      // Store the naming preferences directly in the main window
      if (!(window as any).compressionOutputNaming) {
        (window as any).compressionOutputNaming = {};
      }
      
      // Store each custom name
      selectedFiles.forEach(file => {
        (window as any).compressionOutputNaming[file] = previewNames[file];
      });
      
      // Try to save via API as well
      if (window.electronAPI && window.electronAPI.saveCompressionOutputNaming) {
        // Convert to CompressionOutputNaming format
        const outputNaming: CompressionOutputNaming[] = selectedFiles.map(file => ({
          filePath: file,
          customOutputName: previewNames[file]
        }));
        
        // Save the naming preferences
        const results = await window.electronAPI.saveCompressionOutputNaming(outputNaming);
        
        // Send results back to main window
        if (window.electronAPI.sendCompressionNamingResults) {
          await window.electronAPI.sendCompressionNamingResults(results);
        }
      }
      
      onClose();
    } catch (error) {
      // swallow
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
          <span className="text-[0.625rem] font-normal text-foreground/70">Compression Output Naming</span>
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
              <h2 className="text-lg font-medium">Compression Output Naming</h2>
              <p className="text-sm text-muted-foreground">
                Set custom names for {selectedFiles.length} compressed output files
              </p>
              <p className="text-xs text-muted-foreground">
                This only affects the compressed file names, not your original files
              </p>
            </div>

            {/* Naming Pattern Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Naming Pattern</Label>
              <RadioGroup value={selectedPattern} onValueChange={setSelectedPattern}>
                {namingPatterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={pattern.id} id={pattern.id} />
                    <Label htmlFor={pattern.id} className="text-sm">
                      <div className="font-medium">{pattern.name}</div>
                      <div className="text-muted-foreground">{pattern.description}</div>
                      <div className="text-xs text-muted-foreground">Example: {pattern.example}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Custom Prefix Input */}
            {selectedPattern === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customPrefix" className="text-sm font-medium">Custom Prefix</Label>
                <Input
                  id="customPrefix"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder="Enter custom prefix"
                />
              </div>
            )}

            {/* Start Number Input */}
            {(selectedPattern === 'custom' || selectedPattern === 'date') && (
              <div className="space-y-2">
                <Label htmlFor="startNumber" className="text-sm font-medium">Start Number</Label>
                <Input
                  id="startNumber"
                  type="number"
                  value={startNumber}
                  onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                  min={1}
                  placeholder="1"
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
                          Original: {getFileName(file)}
                        </p>
                        <p className="text-sm font-medium truncate">
                          Compressed: {previewNames[file] || getFileName(file)}
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
                onClick={handleSaveNaming}
                disabled={selectedFiles.length === 0}
                className="flex-1"
              >
                Save Naming
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompressionOutputNamingWindow;
