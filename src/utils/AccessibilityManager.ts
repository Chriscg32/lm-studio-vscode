import * as vscode from 'vscode';
import { Logger } from './Logger';

export class AccessibilityManager {
    private static instance: AccessibilityManager;
    private logger: Logger;
    private isHighContrast: boolean;
    private isReducedMotion: boolean;
    private isScreenReader: boolean;

    private constructor() {
        this.logger = Logger.getInstance();
        this.isHighContrast = vscode.workspace.getConfiguration('window').get('highContrast') || false;
        this.isReducedMotion = vscode.workspace.getConfiguration('window').get('reducedMotion') || false;
        this.isScreenReader = vscode.workspace.getConfiguration('accessibility').get('screenReader') || false;
        
        this.setupListeners();
    }

    public static getInstance(): AccessibilityManager {
        if (!AccessibilityManager.instance) {
            AccessibilityManager.instance = new AccessibilityManager();
        }
        return AccessibilityManager.instance;
    }

    private setupListeners(): void {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('window.highContrast')) {
                this.isHighContrast = vscode.workspace.getConfiguration('window').get('highContrast') || false;
                this.logger.info('High contrast mode changed');
            }
            if (e.affectsConfiguration('window.reducedMotion')) {
                this.isReducedMotion = vscode.workspace.getConfiguration('window').get('reducedMotion') || false;
                this.logger.info('Reduced motion setting changed');
            }
            if (e.affectsConfiguration('accessibility.screenReader')) {
                this.isScreenReader = vscode.workspace.getConfiguration('accessibility').get('screenReader') || false;
                this.logger.info('Screen reader setting changed');
            }
        });
    }

    public getAccessibilitySettings(): {
        isHighContrast: boolean;
        isReducedMotion: boolean;
        isScreenReader: boolean;
    } {
        return {
            isHighContrast: this.isHighContrast,
            isReducedMotion: this.isReducedMotion,
            isScreenReader: this.isScreenReader
        };
    }

    public applyAccessibilityStyles(element: HTMLElement): void {
        if (this.isHighContrast) {
            element.style.setProperty('--foreground', '#ffffff');
            element.style.setProperty('--background', '#000000');
            element.style.setProperty('--contrast-ratio', '21:1');
        }

        if (this.isReducedMotion) {
            element.style.setProperty('--transition-duration', '0s');
            element.style.setProperty('--animation-duration', '0s');
        }
    }

    public announceToScreenReader(message: string): void {
        if (this.isScreenReader) {
            vscode.window.showInformationMessage(message);
        }
    }

    public getAccessibleLabel(element: HTMLElement): string {
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
            return ariaLabel;
        }

        const role = element.getAttribute('role');
        const textContent = element.textContent?.trim();
        
        if (role && textContent) {
            return `${textContent} (${role})`;
        }
        
        return textContent || '';
    }

    public setAccessibleLabel(element: HTMLElement, label: string): void {
        element.setAttribute('aria-label', label);
        if (this.isScreenReader) {
            this.announceToScreenReader(label);
        }
    }

    public makeElementFocusable(element: HTMLElement): void {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
    }

    public addKeyboardNavigation(element: HTMLElement, onEnter: () => void, onSpace: () => void): void {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onEnter();
            } else if (e.key === ' ') {
                e.preventDefault();
                onSpace();
            }
        });
    }
} 