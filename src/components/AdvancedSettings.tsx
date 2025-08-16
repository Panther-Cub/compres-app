import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button, Checkbox, Select, SelectOption, Tooltip } from './ui';

interface AdvancedSettingsType {
  crf: number;
  videoBitrate: string;
  audioBitrate: string;
  fps: number;
  resolution: string;
  preserveAspectRatio: boolean;
  twoPass: boolean;
  fastStart: boolean;
  optimizeForWeb: boolean;
}

interface AdvancedSettingsProps {
  advancedSettings: AdvancedSettingsType;
  onAdvancedSettingsChange: (settings: AdvancedSettingsType) => void;
  showAdvanced?: boolean; // Optional since it's no longer used
  onToggleAdvanced?: () => void; // Optional since it's no longer used
  onSaveCustomPreset: () => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ 
  advancedSettings, 
  onAdvancedSettingsChange, 
  showAdvanced, 
  onToggleAdvanced,
  onSaveCustomPreset
}) => {
  const [localSettings, setLocalSettings] = useState<AdvancedSettingsType>(advancedSettings);

  const handleSettingChange = (key: keyof AdvancedSettingsType, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onAdvancedSettingsChange(newSettings);
  };

  const resetToDefaults = () => {
    const defaults: AdvancedSettingsType = {
      crf: 25,
      videoBitrate: '1500k',
      audioBitrate: '96k',
      fps: 30,
      resolution: '1280x720',
      preserveAspectRatio: true,
      twoPass: false,
      fastStart: true,
      optimizeForWeb: true
    };
    setLocalSettings(defaults);
    onAdvancedSettingsChange(defaults);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Tooltip id="reset-advanced-tooltip" content="Reset to default settings">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="text-xs"
          >
            Reset
          </Button>
        </Tooltip>
        <Tooltip id="save-preset-tooltip" content="Save as custom preset">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveCustomPreset}
            className="text-xs"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Preset
          </Button>
        </Tooltip>
      </div>

      <div className="space-y-4">
        {/* Quality Control */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quality Control</h4>
          
          {/* CRF Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Quality (CRF)</span>
              <span className="text-muted-foreground">{localSettings.crf}</span>
            </div>
            <input
              type="range"
              min="18"
              max="35"
              value={localSettings.crf}
              onChange={(e) => handleSettingChange('crf', parseInt(e.target.value))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>High Quality</span>
              <span>Small File</span>
            </div>
          </div>

          {/* Video Bitrate */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Video Bitrate</span>
              <span className="text-muted-foreground">{localSettings.videoBitrate}</span>
            </div>
            <Select
              value={localSettings.videoBitrate}
              onChange={(e) => handleSettingChange('videoBitrate', e.target.value)}
              className="text-xs"
            >
              <SelectOption value="500k">500k (Low)</SelectOption>
              <SelectOption value="800k">800k (Mobile)</SelectOption>
              <SelectOption value="1200k">1200k (Standard)</SelectOption>
              <SelectOption value="1500k">1500k (HD)</SelectOption>
              <SelectOption value="2000k">2000k (Full HD)</SelectOption>
              <SelectOption value="2500k">2500k (High Quality)</SelectOption>
              <SelectOption value="4000k">4000k (Ultra HD)</SelectOption>
            </Select>
          </div>

          {/* Audio Bitrate */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Audio Bitrate</span>
              <span className="text-muted-foreground">{localSettings.audioBitrate}</span>
            </div>
            <Select
              value={localSettings.audioBitrate}
              onChange={(e) => handleSettingChange('audioBitrate', e.target.value)}
              className="text-xs"
            >
              <SelectOption value="32k">32k (Minimal)</SelectOption>
              <SelectOption value="48k">48k (Low)</SelectOption>
              <SelectOption value="64k">64k (Standard)</SelectOption>
              <SelectOption value="96k">96k (Good)</SelectOption>
              <SelectOption value="128k">128k (High)</SelectOption>
              <SelectOption value="192k">192k (Premium)</SelectOption>
            </Select>
          </div>
        </div>

        {/* Video Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Video Settings</h4>
          
          {/* FPS */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Frame Rate (FPS)</span>
              <span className="text-muted-foreground">{localSettings.fps}</span>
            </div>
            <Select
              value={localSettings.fps}
              onChange={(e) => handleSettingChange('fps', parseInt(e.target.value))}
              className="text-xs"
            >
              <SelectOption value={24}>24 FPS (Film)</SelectOption>
              <SelectOption value={25}>25 FPS (PAL)</SelectOption>
              <SelectOption value={30}>30 FPS (Standard)</SelectOption>
              <SelectOption value={50}>50 FPS (Smooth)</SelectOption>
              <SelectOption value={60}>60 FPS (High)</SelectOption>
            </Select>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Resolution</span>
              <span className="text-muted-foreground">{localSettings.resolution}</span>
            </div>
            <Select
              value={localSettings.resolution}
              onChange={(e) => handleSettingChange('resolution', e.target.value)}
              className="text-xs"
            >
              <SelectOption value="480x270">480x270 (SD)</SelectOption>
              <SelectOption value="640x360">640x360 (HD Ready)</SelectOption>
              <SelectOption value="854x480">854x480 (Mobile HD)</SelectOption>
              <SelectOption value="1280x720">1280x720 (HD)</SelectOption>
              <SelectOption value="1920x1080">1920x1080 (Full HD)</SelectOption>
              <SelectOption value="2560x1440">2560x1440 (2K)</SelectOption>
              <SelectOption value="3840x2160">3840x2160 (4K)</SelectOption>
            </Select>
          </div>
        </div>

        {/* Optimization Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Optimization</h4>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="preserve-aspect"
                checked={localSettings.preserveAspectRatio}
                onCheckedChange={(checked) => handleSettingChange('preserveAspectRatio', checked)}
              />
              <label htmlFor="preserve-aspect" className="text-xs leading-none">
                Preserve aspect ratio (add black bars if needed)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="two-pass"
                checked={localSettings.twoPass}
                onCheckedChange={(checked) => handleSettingChange('twoPass', checked)}
              />
              <label htmlFor="two-pass" className="text-xs leading-none">
                Two-pass encoding (better quality, slower)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fast-start"
                checked={localSettings.fastStart}
                onCheckedChange={(checked) => handleSettingChange('fastStart', checked)}
              />
              <label htmlFor="fast-start" className="text-xs leading-none">
                Fast start (better for web streaming)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="optimize-web"
                checked={localSettings.optimizeForWeb}
                onCheckedChange={(checked) => handleSettingChange('optimizeForWeb', checked)}
              />
              <label htmlFor="optimize-web" className="text-xs leading-none">
                Optimize for web delivery
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
