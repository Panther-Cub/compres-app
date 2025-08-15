import React, { useState, useEffect, useCallback } from 'react';
import { X, FileVideo } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { getFileName } from '../utils/formatters';
import { macAnimations, overlayVariants } from '../lib/animations';

interface BatchRenameModalProps {
  selectedFiles: string[];
  onRename: (newNames: Record<string, string>) => void;
  onClose: () => void;
}

interface RenamePattern {
  id: string;
  name: string;
  description: string;
  template: string;
  example: string;
}

const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  selectedFiles,
  onRename,
  onClose
}) => {
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
  }, [selectedPattern, customPrefix, startNumber, selectedFiles]);

  useEffect(() => {
    generatePreviewNames();
  }, [generatePreviewNames]);

  const handleRename = () => {
    onRename(previewNames);
    onClose();
  };

  return (
    <motion.div 
      className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div 
        className="glass-modal rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        variants={macAnimations.modal}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between p-6 border-b border-border/20"
          variants={macAnimations.slideUp}
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <FileVideo className="w-5 h-5 text-blue-500" />
            </motion.div>
            <div>
              <h2 className="text-lg font-semibold">Batch Rename Files</h2>
              <p className="text-sm text-muted-foreground">
                Rename {selectedFiles.length} video file{selectedFiles.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Naming Pattern Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Naming Pattern</Label>
            <RadioGroup value={selectedPattern} onValueChange={setSelectedPattern}>
              {renamePatterns.map((pattern) => (
                <div key={pattern.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={pattern.id} id={pattern.id} />
                  <Label htmlFor={pattern.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{pattern.name}</div>
                        <div className="text-sm text-muted-foreground">{pattern.description}</div>
                      </div>
                      <div className="text-xs text-muted-foreground/70 bg-muted px-2 py-1 rounded">
                        {pattern.example}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Options */}
          {selectedPattern === 'custom' && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix" className="text-sm font-medium">Prefix</Label>
                  <Input
                    id="prefix"
                    value={customPrefix}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomPrefix(e.target.value)}
                    placeholder="Video"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startNumber" className="text-sm font-medium">Start Number</Label>
                  <Input
                    id="startNumber"
                    type="number"
                    value={startNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartNumber(parseInt(e.target.value) || 1)}
                    min="1"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => {
                const originalName = getFileName(file);
                const newName = previewNames[file] || originalName;
                const hasChanged = originalName !== getFileName(newName);

                return (
                  <div
                    key={file}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      hasChanged ? 'border-blue-200 bg-blue-50/20' : 'border-border/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {hasChanged ? (
                              <span className="text-blue-600">{getFileName(newName)}</span>
                            ) : (
                              <span className="text-muted-foreground">{originalName}</span>
                            )}
                          </div>
                          {hasChanged && (
                            <div className="text-xs text-muted-foreground line-through">
                              {originalName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      #{index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div 
          className="flex items-center justify-end gap-3 p-6 border-t border-border/20"
          variants={macAnimations.slideUp}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleRename}>
              Rename Files
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default BatchRenameModal;
