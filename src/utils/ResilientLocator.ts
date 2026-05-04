import { Locator, Page, expect } from '@playwright/test';

export class ResilientLocator {
    /**
     * Attempts to find a stable locator by trying multiple strategies.
     * Useful for Salesforce components that change IDs or structures.
     */
    static async find(page: Page, selectors: string[], options: { timeout?: number } = {}): Promise<Locator> {
        const timeout = options.timeout || 10000;
        const start = Date.now();

        while (Date.now() - start < timeout) {
            for (const selector of selectors) {
                const locator = page.locator(selector).first();
                if (await locator.isVisible().catch(() => false)) {
                    return locator;
                }
            }
            await page.waitForTimeout(500);
        }

        throw new Error(`❌ Failed to find a resilient locator among: ${selectors.join(', ')}`);
    }

    /**
     * Specialized Salesforce Shadow DOM piercer.
     */
    static shadow(page: Page, host: string, target: string): Locator {
        return page.locator(`${host} >>> ${target}`);
    }
}
