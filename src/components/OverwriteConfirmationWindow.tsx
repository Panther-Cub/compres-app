import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileVideo, Check } from 'lucide-react';
import { Button } from './ui';
import type { OverwriteConfirmation } from '../types';

interface OverwriteConfirmationWindowProps {
  confirmation: OverwriteConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const OverwriteConfirmationWindow: React.FC<OverwriteConfirmationWindowProps> = ({
  confirmation,
  onConfirm,
  onCancel,
  onClose
}) => {
  const fileName = confirmation.filePath.split('/').pop() || '';
  const existingFileName = confirmation.existingOutputPath.split('/').pop() || '';
  const newFileName = confirmation.newOutputPath.split('/').pop() || '';

  return (
    <motion.div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="overwrite-dialog max-w-md w-full mx-4 overflow-hidden"
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
            <h3 className="text-lg font-semibold text-black/90 dark:text-white/90">File Already Exists</h3>
            <p className="text-sm text-black/60 dark:text-white/60">A compressed version already exists</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-lg">
              <FileVideo className="w-5 h-5 text-black/60 dark:text-white/60" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-black/90 dark:text-white/90">{fileName}</p>
                <p className="text-xs text-black/60 dark:text-white/60">Original file</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Check className="w-5 h-5 text-yellow-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-black/90 dark:text-white/90">{existingFileName}</p>
                <p className="text-xs text-black/60 dark:text-white/60">Existing compressed file</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <FileVideo className="w-5 h-5 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-black/90 dark:text-white/90">{newFileName}</p>
                <p className="text-xs text-black/60 dark:text-white/60">New compressed file</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-black/60 dark:text-white/60">
            The existing compressed file will be replaced. This action cannot be undone.
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
            variant="destructive"
            onClick={onConfirm}
            className="flex-1"
          >
            Replace File
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OverwriteConfirmationWindow;
