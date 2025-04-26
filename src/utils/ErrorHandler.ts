import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager';

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface ErrorDetails {
    message: string;
    severity: ErrorSeverity;
    code: string;
    timestamp: number;
    stack?: string;
    context?: any;
}

export class ErrorHandler {
    private static instance: ErrorHandler;
    private configManager: ConfigurationManager;
    private errorLog: ErrorDetails[] = [];
    private readonly MAX_LOG_SIZE = 1000;

    private constructor() {
        this.configManager = ConfigurationManager.getInstance();
    }

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    handleError(error: Error | string, severity: ErrorSeverity = ErrorSeverity.MEDIUM, context?: any): void {
        const errorDetails: ErrorDetails = {
            message: error instanceof Error ? error.message : error,
            severity,
            code: this.generateErrorCode(),
            timestamp: Date.now(),
            stack: error instanceof Error ? error.stack : undefined,
            context
        };

        this.logError(errorDetails);
        this.showErrorNotification(errorDetails);
        this.reportError(errorDetails);
    }

    private logError(error: ErrorDetails): void {
        this.errorLog.push(error);
        if (this.errorLog.length > this.MAX_LOG_SIZE) {
            this.errorLog.shift();
        }

        // Log to VS Code output channel
        const outputChannel = vscode.window.createOutputChannel('LM Studio');
        outputChannel.appendLine(`[${new Date(error.timestamp).toISOString()}] ${error.severity.toUpperCase()}: ${error.message}`);
        if (error.stack) {
            outputChannel.appendLine(error.stack);
        }
        if (error.context) {
            outputChannel.appendLine(`Context: ${JSON.stringify(error.context, null, 2)}`);
        }
    }

    private showErrorNotification(error: ErrorDetails): void {
        const config = this.configManager.getUIConfig();
        if (!config.showNotifications) {
            return;
        }

        const message = this.formatErrorMessage(error);
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                vscode.window.showErrorMessage(message, { modal: true });
                break;
            case ErrorSeverity.HIGH:
                vscode.window.showErrorMessage(message);
                break;
            case ErrorSeverity.MEDIUM:
                vscode.window.showWarningMessage(message);
                break;
            case ErrorSeverity.LOW:
                vscode.window.showInformationMessage(message);
                break;
        }
    }

    private reportError(error: ErrorDetails): void {
        const config = this.configManager.getSecurityConfig();
        if (!config.allowCrashReports) {
            return;
        }

        // Here you would implement error reporting to your backend
        // For now, we'll just log it
        console.error('Error Report:', error);
    }

    private generateErrorCode(): string {
        return `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
    }

    private formatErrorMessage(error: ErrorDetails): string {
        return `[${error.code}] ${error.message}`;
    }

    getErrorLog(): ErrorDetails[] {
        return [...this.errorLog];
    }

    clearErrorLog(): void {
        this.errorLog = [];
    }

    getErrorsBySeverity(severity: ErrorSeverity): ErrorDetails[] {
        return this.errorLog.filter(error => error.severity === severity);
    }

    getRecentErrors(count: number = 10): ErrorDetails[] {
        return this.errorLog.slice(-count);
    }
} 