import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { ErrorHandler, ErrorSeverity } from './ErrorHandler';

export interface TelemetryEvent {
    name: string;
    properties: Record<string, any>;
    measurements: Record<string, number>;
    timestamp: number;
}

export class TelemetryManager {
    private static instance: TelemetryManager;
    private configManager: ConfigurationManager;
    private errorHandler: ErrorHandler;
    private events: TelemetryEvent[] = [];
    private readonly MAX_EVENTS = 1000;
    private readonly FLUSH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    private constructor() {
        this.configManager = ConfigurationManager.getInstance();
        this.errorHandler = ErrorHandler.getInstance();
        this.startFlushInterval();
    }

    static getInstance(): TelemetryManager {
        if (!TelemetryManager.instance) {
            TelemetryManager.instance = new TelemetryManager();
        }
        return TelemetryManager.instance;
    }

    private startFlushInterval(): void {
        setInterval(() => {
            this.flushEvents();
        }, this.FLUSH_INTERVAL);
    }

    trackEvent(name: string, properties: Record<string, any> = {}, measurements: Record<string, number> = {}): void {
        const config = this.configManager.getSecurityConfig();
        if (!config.allowTelemetry) {
            return;
        }

        const event: TelemetryEvent = {
            name,
            properties,
            measurements,
            timestamp: Date.now()
        };

        this.events.push(event);
        if (this.events.length > this.MAX_EVENTS) {
            this.events.shift();
        }
    }

    trackError(error: Error | string, context?: any): void {
        const config = this.configManager.getSecurityConfig();
        if (!config.allowCrashReports) {
            return;
        }

        this.trackEvent('error', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            context
        });
    }

    trackPerformance(operation: string, duration: number, success: boolean): void {
        const config = this.configManager.getSecurityConfig();
        if (!config.allowUsageData) {
            return;
        }

        this.trackEvent('performance', {
            operation,
            success
        }, {
            duration
        });
    }

    trackFeatureUsage(feature: string, action: string): void {
        const config = this.configManager.getSecurityConfig();
        if (!config.allowUsageData) {
            return;
        }

        this.trackEvent('feature_usage', {
            feature,
            action
        });
    }

    private async flushEvents(): Promise<void> {
        if (this.events.length === 0) {
            return;
        }

        try {
            const events = [...this.events];
            this.events = [];

            // Here you would implement sending events to your backend
            // For now, we'll just log them
            console.log('Flushing telemetry events:', events);
        } catch (error) {
            this.errorHandler.handleError(
                error,
                ErrorSeverity.MEDIUM,
                { context: 'telemetry_flush' }
            );
        }
    }

    getEvents(): TelemetryEvent[] {
        return [...this.events];
    }

    clearEvents(): void {
        this.events = [];
    }

    getEventsByType(name: string): TelemetryEvent[] {
        return this.events.filter(event => event.name === name);
    }

    getRecentEvents(count: number = 10): TelemetryEvent[] {
        return this.events.slice(-count);
    }
} 