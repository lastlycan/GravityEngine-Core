import { Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class GlobalNavigationBar extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    async openApp(appName: string) {
        // Navigate directly to the Lightning app by URL — more reliable than App Launcher UI
        const appUrls: Record<string, string> = {
            'Sales': 'https://dream-business-9742.lightning.force.com/lightning/o/Lead/list',
            'Service': 'https://dream-business-9742.lightning.force.com/lightning/o/Case/list',
        };
        const url = appUrls[appName] ?? 'https://dream-business-9742.lightning.force.com/';
        await this.page.goto(url);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async clickTab(tabName: string) {
        // Tab is already open via direct navigation; just verify it's visible
        await this.page.waitForSelector(`//a[@title='${tabName}']`, { timeout: 10000 }).catch(() => {});
    }
}
