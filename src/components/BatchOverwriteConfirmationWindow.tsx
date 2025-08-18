import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileVideo, Check } from 'lucide-react';
import { Button } from './ui';
import type { BatchOverwriteConfirmation } from '../types';

interface BatchOverwriteConfirmationWindowProps {
  confirmation: BatchOverwriteConfirmation;
  onConfirm: (filesToOverwrite: string[]) => void;
  onCancel: () => void;
  onClose: () => void;
}

const BatchOverwriteConfirmationWindow: React.FC<BatchOverwriteConfirmationWindowProps> = ({
  confirmation,
  onConfirm,
  onCancel,
  onClose
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Initialize with all files selected
  React.useEffect(() => {
    const allFileKeys = confirmation.files.map(f => `${f.filePath}::${f.presetId}`);
    setSelectedFiles(new Set(allFileKeys));
    setSelectAll(true);
  }, [confirmation.files]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFiles(new Set());
      setSelectAll(false);
    } else {
      const allFileKeys = confirmation.files.map(f => `${f.filePath}::${f.presetId}`);
      setSelectedFiles(new Set(allFileKeys));
      setSelectAll(true);
    }
  };

  const handleSelectFile = (fileKey: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileKey)) {
      newSelected.delete(fileKey);
    } else {
      newSelected.add(fileKey);
    }
    setSelectedFiles(newSelected);
    setSelectAll(newSelected.size === confirmation.files.length);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedFiles));
  };

  const handleReplaceAll = () => {
    const allFileKeys = confirmation.files.map(f => `${f.filePath}::${f.presetId}`);
    onConfirm(allFileKeys);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="overwrite-dialog max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-black/10 dark:border-white/10">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black/90 dark:text-white/90">Files Already Exist</h3>
            <p className="text-sm text-black/60 dark:text-white/60">
              {confirmation.files.length} compressed file{confirmation.files.length !== 1 ? 's' : ''} already exist{confirmation.files.length !== 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Select All Toggle */}
          <div className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-lg">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-black/90 dark:text-white/90">
              Select All ({selectedFiles.size} of {confirmation.files.length})
            </span>
          </div>

          {/* File List */}
          <div className="space-y-3">
            {confirmation.files.map((file, index) => {
              const fileKey = `${file.filePath}::${file.presetId}`;
              const isSelected = selectedFiles.has(fileKey);
              
              return (
                <div
                  key={fileKey}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-blue-500/10 border-blue-500/20' 
                      : 'bg-black/5 dark:bg-white/5 border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectFile(fileKey)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  
                  <div className="flex-1 space-y-2">
                    {/* Original File */}
                    <div className="flex items-center gap-2">
                      <FileVideo className="w-4 h-4 text-black/60 dark:text-white/60" />
                      <span className="text-sm font-medium text-black/90 dark:text-white/90">
                        {file.fileName}
                      </span>
                    </div>
                    
                    {/* Existing File */}
                    <div className="flex items-center gap-2 ml-6">
                      <Check className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-black/60 dark:text-white/60">
                        Will replace: {file.existingFileName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-black/60 dark:text-white/60">
            Selected files will be replaced. This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-black/10 dark:border-white/10">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleReplaceAll}
            className="flex-1"
          >
            Replace All
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={selectedFiles.size === 0}
            className="flex-1"
          >
            Replace Selected ({selectedFiles.size})
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BatchOverwriteConfirmationWindow;
