import { EventEmitter } from 'events';
import os from 'os';

export interface ThermalStatus {
	cpuTemperature: number;
	cpuUsage: number;
	isThrottling: boolean;
	recommendedAction: 'normal' | 'reduce_concurrency' | 'pause' | 'resume';
	thermalPressure: number; // 0-100 scale
}

export interface ThermalSettings {
	enableThermalThrottling: boolean;
	thermalThrottleThreshold: number;
	maxCpuUsage: number;
	enablePauseOnOverheat: boolean;
	adaptiveConcurrency: boolean;
	hardwareAccelerationPriority: 'thermal' | 'speed' | 'balanced';
}

export class ThermalMonitor extends EventEmitter {
	private static instance: ThermalMonitor;
	private settings: ThermalSettings;
	private lastActionTime: number;
	private actionCooldown: number;
	private monitoringInterval: NodeJS.Timeout | null = null;
	private isMonitoring: boolean = false;
	private hasLoggedDisabled: boolean = false; // Added for logging control
	private lastEmittedThrottling: boolean | null = null;
	private lastEmittedAction: ThermalStatus['recommendedAction'] | null = null;

	private constructor() {
		super();
		// Allow unlimited listeners to avoid MaxListeners warnings during dev reloads
		this.setMaxListeners(0);
		this.settings = {
			enableThermalThrottling: false, // default OFF for stability
			thermalThrottleThreshold: 95,
			maxCpuUsage: 85,
			enablePauseOnOverheat: true,
			adaptiveConcurrency: true,
			hardwareAccelerationPriority: 'thermal'
		};
		this.lastActionTime = 0;
		this.actionCooldown = 10000; // 10 second cooldown between actions
	}

	static getInstance(): ThermalMonitor {
		if (!ThermalMonitor.instance) {
			ThermalMonitor.instance = new ThermalMonitor();
		}
		return ThermalMonitor.instance;
	}

	updateSettings(settings: Partial<ThermalSettings>): void {
		this.settings = { ...this.settings, ...settings };
	}

	async getCurrentStatus(): Promise<ThermalStatus> {
		try {
			const cpuTemperature = await this.getCPUTemperature();
			const cpuUsage = await this.getCPUUsage();
			const isThrottling = this.settings.enableThermalThrottling && this.shouldThrottle(cpuTemperature, cpuUsage);
			const recommendedAction = this.settings.enableThermalThrottling
				? this.getRecommendedAction(cpuTemperature, cpuUsage)
				: 'normal';
			const thermalPressure = this.settings.enableThermalThrottling
				? this.calculateThermalPressure(cpuTemperature, cpuUsage)
				: 0;

			return {
				cpuTemperature,
				cpuUsage,
				isThrottling,
				recommendedAction,
				thermalPressure
			};
		} catch (error) {
			console.error('Error getting thermal status:', error);
			// Return safe defaults if monitoring fails
			return {
				cpuTemperature: 50,
				cpuUsage: 50,
				isThrottling: false,
				recommendedAction: 'normal',
				thermalPressure: 0
			};
		}
	}

	private async getCPUTemperature(): Promise<number> {
		// We avoid shelling out. Provide a conservative estimate derived from CPU usage.
		const usage = await this.getCPUUsage();
		// 45°C base + 0.3°C per 1% CPU usage, clamped to 40-95
		return Math.max(40, Math.min(95, 45 + usage * 0.3));
	}

	private async getCPUUsage(): Promise<number> {
		try {
			// Lightweight approximation using 1-min load average
			const [oneMinuteLoad] = os.loadavg();
			const coreCount = Math.max(1, os.cpus()?.length || 1);
			const utilization = (oneMinuteLoad / coreCount) * 100;
			return Math.max(0, Math.min(100, Math.round(utilization)));
		} catch (error) {
			console.error('Error getting CPU usage (os.loadavg)', error);
			return 50; // fallback
		}
	}

	private shouldThrottle(cpuTemperature: number, cpuUsage: number): boolean {
		// Add cooldown to prevent rapid state changes
		const now = Date.now();
		if (now - this.lastActionTime < this.actionCooldown) {
			return false;
		}
		return cpuTemperature > this.settings.thermalThrottleThreshold || 
				cpuUsage > this.settings.maxCpuUsage;
	}

	private getRecommendedAction(cpuTemperature: number, cpuUsage: number): ThermalStatus['recommendedAction'] {
		const now = Date.now();
		if (now - this.lastActionTime < this.actionCooldown) {
			return 'normal';
		}
		const thermalPressure = this.calculateThermalPressure(cpuTemperature, cpuUsage);
		if (thermalPressure >= 90) return 'pause';
		if (thermalPressure >= 70) return 'reduce_concurrency';
		if (thermalPressure <= 30) return 'resume';
		return 'normal';
	}

	private calculateThermalPressure(cpuTemperature: number, cpuUsage: number): number {
		const tempWeight = 0.5;
		const usageWeight = 0.5;
		const normalizedTemp = Math.min(100, Math.max(0, ((cpuTemperature - 40) / 60) * 100));
		const normalizedUsage = Math.min(100, cpuUsage);
		const pressure = Math.round((normalizedTemp * tempWeight) + (normalizedUsage * usageWeight));
		if (pressure >= 70) this.lastActionTime = Date.now();
		return pressure;
	}

	getRecommendedConcurrency(currentConcurrency: number): number {
		return currentConcurrency;
	}

	shouldPauseCompression(): boolean {
		return false;
	}

	canResumeCompression(): boolean {
		return true;
	}

	startMonitoring(): void {
		if (this.isMonitoring) return;
		if (!this.settings.enableThermalThrottling) {
			// Only log once when first attempting to start monitoring
			if (!this.hasLoggedDisabled) {
				console.log('Thermal monitoring disabled');
				this.hasLoggedDisabled = true;
			}
			return;
		}

		this.isMonitoring = true;
		console.log('Thermal monitoring started');

		this.monitoringInterval = setInterval(async () => {
			try {
				// Calculate current measurements
				const cpuTemperature = await this.getCPUTemperature();
				const cpuUsage = await this.getCPUUsage();
				const isThrottlingNow = this.settings.enableThermalThrottling && this.shouldThrottle(cpuTemperature, cpuUsage);

				// Emit throttling state only when it changes
				if (this.lastEmittedThrottling !== isThrottlingNow) {
					this.emit('throttling-changed', isThrottlingNow);
					this.lastEmittedThrottling = isThrottlingNow;
				}

				// Emit pressure and action recommendations (action only on change, excluding 'normal')
				const thermalPressure = this.calculateThermalPressure(cpuTemperature, cpuUsage);
				this.emit('thermal-pressure-updated', thermalPressure);

				const action = this.getRecommendedAction(cpuTemperature, cpuUsage);
				if (action !== 'normal' && action !== this.lastEmittedAction) {
					this.emit('action-recommended', action);
					this.lastEmittedAction = action;
				}
			} catch (error) {
				console.error('Error in thermal monitoring:', error);
			}
		}, 15000); // Check every 15 seconds
	}

	stopMonitoring(): void {
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}
		this.isMonitoring = false;
		console.log('Thermal monitoring stopped');
	}

	isMonitoringActive(): boolean {
		return this.isMonitoring;
	}
}
