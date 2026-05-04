import { Page } from '@playwright/test';

// Salesforce object API names (singular) used in Lightning URLs
const MODULE_URL_MAP: Record<string, string> = {
    'Leads': 'Lead',
    'Lead': 'Lead',
    'Contacts': 'Contact',
    'Contact': 'Contact',
    'Accounts': 'Account',
    'Account': 'Account',
    'Opportunities': 'Opportunity',
    'Opportunity': 'Opportunity',
    'Cases': 'Case',
    'Case': 'Case',
};

export class BasePage {
    protected page: Page;
    private static readonly ORG_URL = 'https://dream-business-9742.lightning.force.com';

    constructor(page: Page) {
        this.page = page;
    }

    async navigateTo(moduleName: string) {
        console.log(`🚀 Navigating to ${moduleName}...`);
        const apiName = MODULE_URL_MAP[moduleName] ?? moduleName;
        const targetUrl = `${BasePage.ORG_URL}/lightning/o/${apiName}/list`;

        // Already there — skip navigation
        if (this.page.url().includes(`/lightning/o/${apiName}/list`)) {
            return;
        }

        // Strategy 1: Direct URL (fast & reliable)
        await this.page.goto(targetUrl);
        await this.page.waitForLoadState('domcontentloaded');

        // Verify we landed correctly; if not, try App Launcher as fallback
        if (!this.page.url().includes(`/lightning/o/${apiName}`)) {
            console.log(`⚠️ Direct URL redirect failed, trying App Launcher for ${moduleName}...`);
            await this._navigateViaAppLauncher(moduleName, apiName);
        }
    }

    private async _navigateViaAppLauncher(moduleName: string, apiName: string) {
        try {
            const appLauncher = this.page.locator('.slds-icon-waffle, button:has(.slds-icon-waffle)').first();
            await appLauncher.waitFor({ state: 'visible', timeout: 10000 });
            await appLauncher.click();

            const searchInput = this.page.getByPlaceholder('Search apps or items...');
            await searchInput.waitFor({ state: 'visible', timeout: 8000 });
            await searchInput.fill(moduleName);

            const moduleLink = this.page.locator('one-app-launcher-menu-item')
                .filter({ hasText: moduleName }).first();
            await moduleLink.waitFor({ state: 'visible', timeout: 8000 });
            await moduleLink.click();
            await this.page.waitForLoadState('domcontentloaded');
        } catch {
            // Last resort: force goto
            await this.page.goto(`${BasePage.ORG_URL}/lightning/o/${apiName}/list`);
            await this.page.waitForLoadState('domcontentloaded');
        }
    }

    async dismissAuraError() {
        const auraError = this.page.locator('#auraError');
        if (await auraError.isVisible({ timeout: 2000 }).catch(() => false)) {
            await this.page.locator('#auraError button.closeBtn').first().click().catch(() => {});
        }
    }

    async wait(ms: number) {
        await this.page.waitForTimeout(ms);
    }

    async takeScreenshot(name: string) {
        await this.page.screenshot({ path: `screenshots/${name}.png` });
    }

    /**
     * Resilient click that dismisses background errors if they block the target.
     */
    async click(selector: string | import('@playwright/test').Locator, options: { force?: boolean, timeout?: number } = {}) {
        const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
        try {
            await locator.click(options);
        } catch (e) {
            console.log(`⚠️ Click failed, checking for blockers...`);
            await this.dismissAuraError();
            // Retry once
            await locator.click({ ...options, force: true });
        }
    }

    /**
     * Resilient fill that ensures the field is clear first.
     */
    async fill(selector: string | import('@playwright/test').Locator, value: string) {
        const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
        await locator.waitFor({ state: 'visible' });
        await locator.click();
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await locator.fill(value);
    }
}
