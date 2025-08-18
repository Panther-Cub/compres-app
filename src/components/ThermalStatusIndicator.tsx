import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Cpu, AlertTriangle, CheckCircle, Pause } from 'lucide-react';
import { Card, CardContent } from './ui';

interface ThermalStatus {
  thermalPressure: number;
  isThrottling: boolean;
  recommendedAction: 'normal' | 'reduce_concurrency' | 'pause' | 'resume';
  cpuTemperature?: number;
  cpuUsage?: number;
}

interface ThermalStatusIndicatorProps {
  isVisible: boolean;
  thermalStatus?: ThermalStatus | null;
  className?: string;
}

export const ThermalStatusIndicator: React.FC<ThermalStatusIndicatorProps> = ({
  isVisible,
  thermalStatus,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !thermalStatus) {
    return null;
  }

  const getThermalColor = (pressure: number) => {
    if (pressure < 30) return 'text-green-500';
    if (pressure < 60) return 'text-yellow-500';
    if (pressure < 80) return 'text-orange-500';
    return 'text-red-500';
  };

  const getThermalIcon = (pressure: number, isThrottling: boolean) => {
    if (isThrottling || pressure > 80) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (pressure > 60) {
      return <Thermometer className="w-4 h-4 text-orange-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getActionIcon = (action: ThermalStatus['recommendedAction']) => {
    switch (action) {
      case 'pause':
        return <Pause className="w-3 h-3" />;
      case 'reduce_concurrency':
        return <Cpu className="w-3 h-3" />;
      case 'resume':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getActionText = (action: ThermalStatus['recommendedAction']) => {
    switch (action) {
      case 'pause':
        return 'Paused for thermal safety';
      case 'reduce_concurrency':
        return 'Reducing compression load';
      case 'resume':
        return 'Resuming normal operation';
      default:
        return 'Normal operation';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-4 right-4 z-50 ${className}`}
        >
          <Card 
            className={`w-80 shadow-lg border-2 transition-all duration-300 ${
              thermalStatus.isThrottling ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
              thermalStatus.thermalPressure > 60 ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' :
              'border-green-200 bg-green-50 dark:bg-green-950/20'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CardContent className="p-4 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getThermalIcon(thermalStatus.thermalPressure, thermalStatus.isThrottling)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Thermal Status</span>
                      {getActionIcon(thermalStatus.recommendedAction)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getActionText(thermalStatus.recommendedAction)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getThermalColor(thermalStatus.thermalPressure)}`}>
                    {Math.round(thermalStatus.thermalPressure)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Pressure</div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t"
                  >
                    <div className="space-y-3">
                      {thermalStatus.cpuTemperature && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">CPU Temperature</span>
                          <span className={`text-sm font-medium ${getThermalColor(thermalStatus.cpuTemperature * 1.2)}`}>
                            {thermalStatus.cpuTemperature}°C
                          </span>
                        </div>
                      )}
                      
                      {thermalStatus.cpuUsage && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">CPU Usage</span>
                          <span className="text-sm font-medium">
                            {Math.round(thermalStatus.cpuUsage)}%
                          </span>
                        </div>
                      )}

                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            thermalStatus.thermalPressure < 30 ? 'bg-green-500' :
                            thermalStatus.thermalPressure < 60 ? 'bg-yellow-500' :
                            thermalStatus.thermalPressure < 80 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${thermalStatus.thermalPressure}%` }}
                        />
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {thermalStatus.isThrottling ? 
                          'System is throttling performance to prevent overheating' :
                          thermalStatus.thermalPressure > 60 ?
                          'System temperature is elevated - consider reducing compression load' :
                          'System temperature is within normal range'
                        }
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
