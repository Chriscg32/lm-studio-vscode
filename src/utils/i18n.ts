import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Translation {
    [key: string]: string | Translation;
}

export class I18n {
    private static instance: I18n;
    private translations: Map<string, Translation>;
    private currentLocale: string;
    private fallbackLocale: string = 'en';

    private constructor() {
        this.translations = new Map();
        this.currentLocale = vscode.env.language;
        this.loadTranslations();
    }

    public static getInstance(): I18n {
        if (!I18n.instance) {
            I18n.instance = new I18n();
        }
        return I18n.instance;
    }

    private loadTranslations(): void {
        const extensionPath = vscode.extensions.getExtension('lmstudio-community.lmstudio-vscode-extension')?.extensionPath;
        if (!extensionPath) {
            return;
        }

        const localesPath = path.join(extensionPath, 'locales');
        if (!fs.existsSync(localesPath)) {
            return;
        }

        const localeFiles = fs.readdirSync(localesPath);
        localeFiles.forEach(file => {
            if (file.endsWith('.json')) {
                const locale = path.basename(file, '.json');
                const content = fs.readFileSync(path.join(localesPath, file), 'utf-8');
                try {
                    const translation = JSON.parse(content);
                    this.translations.set(locale, translation);
                } catch (error) {
                    console.error(`Failed to load translations for ${locale}:`, error);
                }
            }
        });
    }

    public setLocale(locale: string): void {
        if (this.translations.has(locale)) {
            this.currentLocale = locale;
        } else {
            console.warn(`Locale ${locale} not found, falling back to ${this.fallbackLocale}`);
            this.currentLocale = this.fallbackLocale;
        }
    }

    public translate(key: string, params?: { [key: string]: string }): string {
        const translation = this.getTranslation(key);
        if (!translation) {
            return key;
        }

        if (params) {
            return this.interpolate(translation, params);
        }

        return translation;
    }

    private getTranslation(key: string): string | undefined {
        const keys = key.split('.');
        let translation = this.translations.get(this.currentLocale);

        if (!translation) {
            translation = this.translations.get(this.fallbackLocale);
        }

        if (!translation) {
            return undefined;
        }

        for (const k of keys) {
            if (typeof translation === 'string') {
                return undefined;
            }
            translation = translation[k];
        }

        return typeof translation === 'string' ? translation : undefined;
    }

    private interpolate(text: string, params: { [key: string]: string }): string {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] || match;
        });
    }

    public getAvailableLocales(): string[] {
        return Array.from(this.translations.keys());
    }

    public getCurrentLocale(): string {
        return this.currentLocale;
    }
} 