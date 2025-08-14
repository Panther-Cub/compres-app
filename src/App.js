import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FolderOpen, Cog, Play, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Checkbox } from './components/ui/checkbox';
import { cn } from './lib/utils';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionComplete, setCompressionComplete] = useState(false);
  const [outputPath, setOutputPath] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('hero');
  const [keepAudio, setKeepAudio] = useState(false);
  const [outputDirectory, setOutputDirectory] = useState('');

  // Set up event listeners for compression events
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onCompressionStarted(() => {
        setIsCompressing(true);
        setCompressionProgress(0);
        setCompressionComplete(false);
      });

      window.electronAPI.onCompressionProgress((progress) => {
        setCompressionProgress(Math.round(progress || 0));
      });

      return () => {
        window.electronAPI.removeAllListeners('compression-started');
        window.electronAPI.removeAllListeners('compression-progress');
      };
    }
  }, []);

  const presetOptions = {
    hero: { 
      name: 'Hero Video', 
      desc: '1280px, high quality, web optimized'
    },
    background: { 
      name: 'Background Video', 
      desc: '1080px, medium quality, smaller size'
    },
    demo: { 
      name: 'Product Demo', 
      desc: '1280px, good quality, balanced'
    },
    social: { 
      name: 'Social/Mobile', 
      desc: '720px, mobile optimized, fast encode'
    }
  };

  const handleFileSelect = useCallback(async (file) => {
    setError('');
    setSelectedFile(file);
    setCompressionComplete(false);
    setCompressionProgress(0);
    
    try {
      const info = await window.electronAPI.getFileInfo(file);
      setFileInfo(info);
    } catch (err) {
      setError('Error reading file information');
      console.error(err);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        handleFileSelect(file.path);
      } else {
        setError('Please select a video file');
      }
    }
  }, [handleFileSelect]);

  const handleSelectFile = useCallback(async () => {
    try {
      const filePath = await window.electronAPI.selectFile();
      if (filePath) {
        handleFileSelect(filePath);
      }
    } catch (err) {
      setError('Error selecting file');
      console.error(err);
    }
  }, [handleFileSelect]);

  const handleSelectOutputDirectory = useCallback(async () => {
    try {
      const directory = await window.electronAPI.selectOutputDirectory();
      if (directory) {
        setOutputDirectory(directory);
      }
    } catch (err) {
      setError('Error selecting output directory');
      console.error(err);
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!selectedFile) return;
    
    setError('');
    setIsCompressing(true);
    setCompressionProgress(0);
    
    try {
      const options = {
        preset: selectedPreset,
        keepAudio: keepAudio,
        outputDirectory: outputDirectory
      };
      const output = await window.electronAPI.compressVideo(selectedFile, options);
      setOutputPath(output);
      setCompressionComplete(true);
    } catch (err) {
      setError('Error compressing video: ' + err.message);
      console.error(err);
    } finally {
      setIsCompressing(false);
    }
  }, [selectedFile, selectedPreset, keepAudio, outputDirectory]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Draggable Header */}
      <header className="draggable-region fixed top-0 left-0 right-0 z-50 h-12 bg-background/95 backdrop-blur-md border-b border-border/50 flex items-center justify-between pl-20 pr-4 select-none">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-foreground/90">FFmpeg Video Compressor</h1>
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedFile ? 'Ready to compress' : 'Drop a video file to start'}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-12">
        {!selectedFile ? (
          /* Centered Drop Zone */
          <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors duration-200">
                <CardContent 
                  className={cn(
                    "p-16 text-center space-y-6 cursor-pointer",
                    isDragOver && "border-primary bg-accent/50"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleSelectFile}
                >
                  <div className="w-20 h-20 mx-auto bg-accent rounded-full flex items-center justify-center">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold">Drop your video here</h2>
                    <p className="text-muted-foreground text-lg">or click to browse files</p>
                  </div>
                  <Button variant="secondary" size="lg" className="mac-button non-draggable">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Select Video File
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Supports MP4, MOV, AVI, and more
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Video Processing Section */
          <div className="p-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Back Button */}
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSelectedFile(null);
                    setFileInfo(null);
                    setCompressionComplete(false);
                    setCompressionProgress(0);
                    setError('');
                    setOutputPath('');
                  }}
                  className="non-draggable"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Upload
                </Button>
                <div className="h-6 w-px bg-border"></div>
                <span className="text-sm text-muted-foreground">
                  {selectedFile?.split('/').pop()}
                </span>
              </div>

              {/* File Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    File Selected
                  </CardTitle>
                  <CardDescription>
                    {selectedFile.split('/').pop()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fileInfo && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Size</p>
                        <p className="font-medium">{formatFileSize(fileInfo.size)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{formatDuration(fileInfo.duration)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Resolution</p>
                        <p className="font-medium">{fileInfo.width}x{fileInfo.height}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Codec</p>
                        <p className="font-medium">{fileInfo.codec}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cog className="w-5 h-5" />
                    Compression Settings
                  </CardTitle>
                  <CardDescription>
                    Choose your video preset and options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Presets */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Video Preset</h3>
                    <RadioGroup 
                      value={selectedPreset} 
                      onValueChange={setSelectedPreset}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {Object.entries(presetOptions).map(([key, preset]) => (
                        <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors non-draggable">
                          <RadioGroupItem value={key} id={key} />
                          <label htmlFor={key} className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">{preset.name}</p>
                              <p className="text-xs text-muted-foreground">{preset.desc}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Audio Option */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Audio Settings</h3>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg non-draggable">
                      <Checkbox 
                        id="keep-audio" 
                        checked={keepAudio}
                        onCheckedChange={setKeepAudio}
                      />
                      <label htmlFor="keep-audio" className="text-sm cursor-pointer">
                        Keep audio track (uncheck for autoplay-friendly videos)
                      </label>
                    </div>
                  </div>

                  {/* Output Directory */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Output Location</h3>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={handleSelectOutputDirectory}
                        className="mac-button non-draggable"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Choose Folder
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {outputDirectory || 'Desktop (default)'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              {(isCompressing || compressionComplete) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isCompressing ? 'Compressing...' : 'Complete!'}
                    </CardTitle>
                    <CardDescription>
                      {isCompressing ? `${compressionProgress}% complete` : 'Your video has been compressed'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={compressionProgress} className="w-full" />
                    {compressionComplete && outputPath && (
                      <div className="mt-4 p-3 bg-accent rounded-lg">
                        <p className="text-sm font-medium">Output saved to:</p>
                        <p className="text-xs text-muted-foreground break-all">{outputPath}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Error */}
              {error && (
                <Card className="border-destructive">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleCompress}
                  disabled={isCompressing || !selectedFile}
                  className="mac-button flex-1 non-draggable"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isCompressing ? 'Compressing...' : 'Start Compression'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileInfo(null);
                    setCompressionComplete(false);
                    setCompressionProgress(0);
                    setError('');
                    setOutputPath('');
                  }}
                  className="mac-button non-draggable"
                  size="lg"
                >
                  New File
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 