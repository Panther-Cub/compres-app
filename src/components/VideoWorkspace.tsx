import React, { useState } from 'react';
import { Play, Settings, Edit3, ArrowLeft, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Tooltip } from './ui';
import { cn } from '../lib/utils';
import { macAnimations, drawerVariants } from '../lib/animations';
import VideoList from './VideoList';
import SettingsDrawer from './SettingsDrawer';
import BatchRenameModal from './BatchRenameModal';
import { formatFileSize, formatDuration } from '../utils/formatters';
import type { VideoWorkspaceProps } from '../types';

const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  selectedFiles,
  fileInfos,
  onRemoveFile,
  onReset,
  onCompress,
  isCompressing,
  selectedPresets,
  drawerOpen,
  onToggleDrawer,
  settings,
  onBatchRename,
  onGenerateThumbnail,
  onGetThumbnailDataUrl,
  onShowInFinder,
  onOpenFile,
  onAddMoreVideos
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showBatchRename, setShowBatchRename] = useState(false);

  return (
    <motion.div 
      className="relative h-full w-full"
      variants={macAnimations.fadeIn}
      initial="initial"
      animate="animate"
    >
      {/* Main Content Area */}
      <motion.div 
        className={cn(
          "h-full flex flex-col transition-all duration-150 ease-out",
          drawerOpen ? "pr-80" : "pr-0"
        )}
        variants={macAnimations.slideUp}
      >
        {/* Top Bar */}
        <motion.div 
          className="flex items-center justify-between p-4 border-b border-border/20 flex-shrink-0"
          variants={macAnimations.slideUp}
        >
          <div className="flex items-center gap-4">
            <Tooltip id="back-tooltip" content="Go back to file selection">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onReset}
                className="non-draggable text-sm"
              >
                <ArrowLeft className="w-3 h-3 mr-2" />
                Back
              </Button>
            </Tooltip>
            <div className="h-4 w-px bg-border/30"></div>
            <span className="text-sm text-muted-foreground/70">
              {selectedFiles.length} video{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip id="add-more-tooltip" content="Add more videos to the queue">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddMoreVideos}
                className="non-draggable text-sm"
              >
                <Plus className="w-3 h-3 mr-2" />
                Add More Videos
              </Button>
            </Tooltip>
            {selectedFiles.length > 0 && (
              <Tooltip id="rename-tooltip" content="Batch rename selected files">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBatchRename(true)}
                  className="non-draggable text-sm"
                >
                  <Edit3 className="w-3 h-3 mr-2" />
                  Rename Files
                </Button>
              </Tooltip>
            )}
          </div>
        </motion.div>

        {/* Video List */}
        <div className="flex-1 overflow-hidden">
          <VideoList
            selectedFiles={selectedFiles}
            fileInfos={fileInfos}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRemoveFile={onRemoveFile}
            formatFileSize={formatFileSize}
            formatDuration={formatDuration}
            onGenerateThumbnail={onGenerateThumbnail}
            onGetThumbnailDataUrl={onGetThumbnailDataUrl}
            onShowInFinder={onShowInFinder}
            onOpenFile={onOpenFile}
          />
        </div>

        {/* Bottom Actions */}
        <motion.div 
          className="p-4 border-t border-border/20 flex-shrink-0"
          variants={macAnimations.slideUp}
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <Tooltip 
                id="compress-tooltip" 
                content={
                  isCompressing ? 'Compression in progress...' :
                  selectedFiles.length === 0 ? 'No videos selected' :
                  selectedPresets.length === 0 ? 'No presets selected' :
                  !settings.outputDirectory ? 'Please select output folder' :
                  `Compress ${selectedFiles.length} video${selectedFiles.length > 1 ? 's' : ''}`
                }
              >
                <Button 
                  onClick={onCompress}
                  disabled={isCompressing || selectedFiles.length === 0 || selectedPresets.length === 0 || !settings.outputDirectory}
                  className="mac-button w-full non-draggable text-sm"
                  size="sm"
                >
                  <Play className="w-3 h-3 mr-2" />
                  {isCompressing ? 'Compressing...' : 
                   !settings.outputDirectory ? 'Select Output Folder' :
                   settings.outputDirectory.includes('Compressed Videos') ? 
                     `Compres ${selectedFiles.length} video${selectedFiles.length > 1 ? 's' : ''} to Desktop` :
                     `Compres ${selectedFiles.length} video${selectedFiles.length > 1 ? 's' : ''}`}
                </Button>
              </Tooltip>
            </div>
            <Tooltip id="settings-tooltip" content={drawerOpen ? 'Hide settings panel' : 'Show settings panel'}>
              <Button 
                variant="outline"
                onClick={onToggleDrawer}
                className="mac-button non-draggable text-sm"
                size="sm"
              >
                <Settings className="w-3 h-3 mr-2" />
                {drawerOpen ? 'Hide' : 'Show'} Settings
              </Button>
            </Tooltip>
          </div>
        </motion.div>
      </motion.div>

      {/* Settings Drawer - Fixed Position */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div 
            className="absolute top-0 right-0 h-full w-80 drawer glass border-l border-border/20 z-10"
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <SettingsDrawer
              drawerOpen={drawerOpen}
              onToggleDrawer={onToggleDrawer}
              presets={settings.presets}
              selectedPresets={settings.selectedPresets}
              onPresetToggle={settings.onPresetToggle}
              presetSettings={settings.presetSettings}
              onPresetSettingsChange={settings.onPresetSettingsChange}
              outputDirectory={settings.outputDirectory}
              onSelectOutputDirectory={settings.onSelectOutputDirectory}
              outputFolderName={settings.outputFolderName}
              onOutputFolderNameChange={settings.onOutputFolderNameChange}
              defaultOutputFolderName={settings.defaultOutputFolderName}
              onSetDefaultOutputFolderName={settings.onSetDefaultOutputFolderName}
              advancedSettings={settings.advancedSettings}
              onAdvancedSettingsChange={settings.onAdvancedSettingsChange}
              showAdvanced={settings.showAdvanced}
              onToggleAdvanced={settings.onToggleAdvanced}
              onSaveCustomPreset={settings.onSaveCustomPreset}
              handleCustomPresetRemove={settings.handleCustomPresetRemove}
              selectedFiles={settings.selectedFiles}
              fileInfos={settings.fileInfos}
              defaultOutputDirectory={settings.defaultOutputDirectory}
              onSetDefaultOutputDirectory={settings.onSetDefaultOutputDirectory}
              // New default settings props
              defaultPresets={settings.defaultPresets}
              setDefaultPresets={settings.setDefaultPresets}
              defaultPresetSettings={settings.defaultPresetSettings}
              setDefaultPresetSettings={settings.setDefaultPresetSettings}
              defaultAdvancedSettings={settings.defaultAdvancedSettings}
              setDefaultAdvancedSettings={settings.setDefaultAdvancedSettings}
              saveUserDefaults={settings.saveUserDefaults}
              resetToDefaults={settings.resetToDefaults}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Rename Modal */}
      <AnimatePresence>
        {showBatchRename && (
          <BatchRenameModal
            selectedFiles={selectedFiles}
            onRename={onBatchRename}
            onClose={() => setShowBatchRename(false)}
          />
        )}
      </AnimatePresence>


    </motion.div>
  );
};

export default VideoWorkspace;
