import { chromium, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class SessionManager {
    /**
     * Extracts session cookies from the current context and saves to file.
     */
    static async saveSession(context: BrowserContext, filePath: string) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await context.storageState({ path: filePath });
        console.log(`✅ Session saved to ${filePath}`);
    }

    /**
     * Helper script to be run in browser console to extract session.
     * Returns a string of code to be pasted into DevTools.
     */
    static getConsoleExtractionScript(): string {
        return `
(function() {
    const cookies = document.cookie.split('; ').map(c => {
        const [name, ...rest] = c.split('=');
        return {
            name,
            value: rest.join('='),
            domain: window.location.hostname,
            path: '/',
            expires: -1,
            httpOnly: false,
            secure: window.location.protocol === 'https:',
            sameSite: 'Lax'
        };
    });
    console.log(JSON.stringify({ cookies, origins: [] }, null, 2));
})();
        `;
    }
}
