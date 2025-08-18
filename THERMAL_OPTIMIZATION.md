# Thermal Optimization for FFmpeg Mac App

## Overview

This document outlines the comprehensive thermal optimization features implemented to prevent your Mac from overheating during intensive video compression operations.

## Key Features

### 1. Thermal Monitoring System
- **Real-time temperature monitoring** using macOS system commands
- **CPU usage tracking** to detect high system load
- **Thermal pressure calculation** (0-100 scale) combining temperature and CPU usage
- **Adaptive throttling** based on thermal thresholds

### 2. Performance Settings

#### Default Conservative Settings
- **Max Concurrent Compressions**: Reduced from 2-4 to **1** by default
- **Thermal Threshold**: 85°C (configurable 70-95°C)
- **Max CPU Usage**: 70% (configurable 50-90%)
- **Adaptive Concurrency**: Enabled by default
- **Pause on Overheat**: Enabled by default

#### Thermal Management Options
- **Enable Thermal Throttling**: Master switch for all thermal features
- **Thermal Threshold**: Temperature at which throttling begins
- **Max CPU Usage**: Maximum CPU usage before throttling
- **Adaptive Concurrency**: Automatically adjust concurrent compressions
- **Pause on Overheat**: Pause compression when critically hot

### 3. Adaptive Concurrency Control

The system automatically adjusts concurrent compressions based on thermal pressure:

| Thermal Pressure | Concurrency Adjustment |
|------------------|------------------------|
| < 20% | Increase by 1 (if safe) |
| 20-40% | No change |
| 40-60% | Reduce to 75% |
| 60-80% | Reduce to 50% |
| > 80% | Reduce to 25% |

### 4. Thermal-Optimized Presets

New presets specifically designed for thermal efficiency:

#### Thermal Cool
- **Codec**: H.264 VideoToolbox (hardware accelerated)
- **Bitrate**: 800k (low thermal impact)
- **FPS**: 24 (reduced processing)
- **Preset**: Fast (single-pass encoding)
- **Use Case**: Ultra-low thermal impact

#### Thermal Balanced
- **Codec**: H.264 VideoToolbox (hardware accelerated)
- **Bitrate**: 1200k (balanced quality/thermal)
- **FPS**: 30 (standard)
- **Preset**: Medium (balanced encoding)
- **Use Case**: Good quality with thermal awareness

#### Thermal Efficient
- **Codec**: HEVC VideoToolbox (hardware accelerated)
- **Bitrate**: 600k (maximum compression)
- **FPS**: 24 (reduced processing)
- **Preset**: Fast (single-pass encoding)
- **Use Case**: Maximum compression with thermal optimization

### 5. Visual Thermal Status Indicator

Real-time thermal status display during compression:
- **Color-coded status**: Green (safe) → Yellow (elevated) → Orange (high) → Red (critical)
- **Thermal pressure percentage**: Visual indicator of system stress
- **Recommended actions**: Shows current thermal management actions
- **Expandable details**: CPU temperature, usage, and recommendations

## How It Works

### 1. Temperature Monitoring
The system uses multiple methods to detect CPU temperature:
```bash
# Primary method
sudo powermetrics --samplers smc -n 1 -i 1000 | grep "CPU die temperature"

# Fallback methods
sudo powermetrics --samplers smc -n 1 -i 1000 | grep "CPU die"
sudo powermetrics --samplers smc -n 1 -i 1000 | grep "temperature"
```

### 2. CPU Usage Monitoring
```bash
top -l 1 -n 0 | grep "CPU usage"
```

### 3. Thermal Pressure Calculation
```
Thermal Pressure = (Temperature Pressure × 0.7) + (CPU Pressure × 0.3)
```

### 4. Adaptive Response
- **Normal Operation**: Full performance
- **Elevated Temperature**: Reduce concurrency
- **High Temperature**: Further reduce concurrency
- **Critical Temperature**: Pause compression entirely

## Configuration

### Accessing Thermal Settings
1. Open the app
2. Go to **Settings** (gear icon)
3. Navigate to **Performance Settings**
4. Configure thermal management options

### Recommended Settings by Mac Type

#### MacBook Air (M1/M2)
- **Max Concurrent**: 1-2
- **Thermal Threshold**: 80°C
- **Max CPU Usage**: 60%
- **Use Presets**: Thermal Cool, Thermal Balanced

#### MacBook Pro (M1/M2)
- **Max Concurrent**: 2-3
- **Thermal Threshold**: 85°C
- **Max CPU Usage**: 70%
- **Use Presets**: Thermal Balanced, Thermal Efficient

#### Mac Studio/Mac Pro
- **Max Concurrent**: 3-4
- **Thermal Threshold**: 90°C
- **Max CPU Usage**: 80%
- **Use Presets**: Any thermal preset or standard presets

## Best Practices

### 1. Choose Thermal Presets
- Use **Thermal Cool** for batch processing
- Use **Thermal Balanced** for quality-conscious work
- Use **Thermal Efficient** for maximum compression

### 2. Monitor Thermal Status
- Watch the thermal indicator during compression
- If it turns orange/red, consider reducing batch size
- Allow system to cool between large batches

### 3. Environment Considerations
- Ensure good ventilation around your Mac
- Avoid running in hot environments
- Close other intensive applications during compression

### 4. Batch Size Management
- Start with smaller batches (5-10 videos)
- Increase gradually while monitoring thermal status
- Use thermal presets for large batches

## Troubleshooting

### High Thermal Pressure
1. **Reduce batch size**: Process fewer videos simultaneously
2. **Use thermal presets**: Switch to Thermal Cool or Thermal Balanced
3. **Lower concurrency**: Reduce max concurrent compressions
4. **Check environment**: Ensure proper ventilation

### Compression Paused
1. **Wait for cooling**: System will resume automatically
2. **Check thermal status**: Monitor the thermal indicator
3. **Reduce load**: Cancel some compressions if needed
4. **Use thermal presets**: Switch to lower-impact presets

### Performance Issues
1. **Check thermal throttling**: May be reducing performance for safety
2. **Monitor CPU usage**: Ensure other apps aren't consuming resources
3. **Adjust settings**: Fine-tune thermal thresholds if needed

## Technical Details

### Hardware Acceleration Priority
The system prioritizes hardware acceleration (VideoToolbox) for thermal efficiency:
- **H.264 VideoToolbox**: Lower thermal impact than software encoding
- **HEVC VideoToolbox**: Maximum compression with hardware acceleration
- **Fallback to software**: Only when hardware acceleration unavailable

### Memory Management
- **Active compression tracking**: Prevents memory leaks
- **Progress interval cleanup**: Reduces background processing
- **Garbage collection**: Automatic memory cleanup

### Event System
- **Real-time updates**: Thermal status updates every 2 seconds
- **Event-driven architecture**: Immediate response to thermal changes
- **UI synchronization**: Visual feedback for all thermal events

## Future Enhancements

### Planned Features
- **Machine learning**: Adaptive thermal prediction
- **Custom thermal profiles**: User-defined thermal management
- **Background processing**: Resume compression after cooling
- **Thermal history**: Track thermal patterns over time

### Performance Optimizations
- **Smart batching**: Automatic batch size optimization
- **Preset switching**: Automatic preset selection based on thermal status
- **Time-based scheduling**: Schedule compression during cooler periods

## Support

If you experience thermal issues:
1. Check the thermal status indicator
2. Review your thermal settings
3. Try thermal-optimized presets
4. Reduce batch size and concurrency
5. Ensure proper system ventilation

The thermal optimization system is designed to protect your Mac while maintaining compression quality and performance.
