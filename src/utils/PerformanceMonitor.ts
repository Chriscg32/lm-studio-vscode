import * as vscode from 'vscode';
import { Logger } from './Logger';

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, number[]>;
    private logger: Logger;

    private constructor() {
        this.metrics = new Map();
        this.logger = Logger.getInstance();
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    public startOperation(operationName: string): () => void {
        const startTime = performance.now();
        return () => this.endOperation(operationName, startTime);
    }

    private endOperation(operationName: string, startTime: number): void {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (!this.metrics.has(operationName)) {
            this.metrics.set(operationName, []);
        }
        this.metrics.get(operationName)?.push(duration);

        // Log if operation takes too long
        if (duration > 1000) { // 1 second threshold
            this.logger.warning(`Operation ${operationName} took ${duration.toFixed(2)}ms`);
        }
    }

    public getMetrics(): Map<string, {
        avg: number;
        min: number;
        max: number;
        count: number;
    }> {
        const results = new Map();
        
        this.metrics.forEach((durations, operationName) => {
            const sum = durations.reduce((a, b) => a + b, 0);
            const avg = sum / durations.length;
            const min = Math.min(...durations);
            const max = Math.max(...durations);
            
            results.set(operationName, {
                avg,
                min,
                max,
                count: durations.length
            });
        });
        
        return results;
    }

    public generateReport(): string {
        const metrics = this.getMetrics();
        let report = 'Performance Report:\n';
        
        metrics.forEach((stats, operationName) => {
            report += `\n${operationName}:\n`;
            report += `  Average: ${stats.avg.toFixed(2)}ms\n`;
            report += `  Min: ${stats.min.toFixed(2)}ms\n`;
            report += `  Max: ${stats.max.toFixed(2)}ms\n`;
            report += `  Count: ${stats.count}\n`;
        });
        
        return report;
    }

    public clearMetrics(): void {
        this.metrics.clear();
    }
} 