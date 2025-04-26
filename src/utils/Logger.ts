import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL'
}

export class Logger {
    private static instance: Logger;
    private logFile: string;
    private logLevel: LogLevel;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.logFile = path.join(vscode.workspace.rootPath || '', '.lmstudio', 'logs', 'extension.log');
        this.logLevel = LogLevel.INFO;
        this.outputChannel = vscode.window.createOutputChannel('LM Studio');
        this.ensureLogDirectory();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private ensureLogDirectory(): void {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    public log(level: LogLevel, message: string, error?: Error): void {
        if (this.shouldLog(level)) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level}] ${message}`;
            
            // Write to file
            fs.appendFileSync(this.logFile, logMessage + '\n');
            
            // Show in output channel
            this.outputChannel.appendLine(logMessage);
            
            // Show in status bar for errors
            if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
                vscode.window.showErrorMessage(message);
            }
            
            // Log error details if provided
            if (error) {
                const errorDetails = `Error: ${error.message}\nStack: ${error.stack}`;
                fs.appendFileSync(this.logFile, errorDetails + '\n');
                this.outputChannel.appendLine(errorDetails);
            }
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = Object.values(LogLevel);
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }

    public debug(message: string): void {
        this.log(LogLevel.DEBUG, message);
    }

    public info(message: string): void {
        this.log(LogLevel.INFO, message);
    }

    public warning(message: string): void {
        this.log(LogLevel.WARNING, message);
    }

    public error(message: string, error?: Error): void {
        this.log(LogLevel.ERROR, message, error);
    }

    public critical(message: string, error?: Error): void {
        this.log(LogLevel.CRITICAL, message, error);
    }

    public showOutput(): void {
        this.outputChannel.show();
    }
} 