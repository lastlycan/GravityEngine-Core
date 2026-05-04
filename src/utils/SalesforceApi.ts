import { request, APIRequestContext } from '@playwright/test';

/**
 * Salesforce API Utility for Playwright.
 * Enables rapid data setup/teardown within TypeScript tests.
 */
export class SalesforceApi {
    private requestContext: APIRequestContext | null = null;
    private accessToken: string | null = null;
    private instanceUrl: string | null = null;

    constructor() {}

    /**
     * Authenticates with Salesforce using the Username-Password flow.
     */
    async authenticate() {
        const loginUrl = 'https://login.salesforce.com/services/oauth2/token';
        const clientId = process.env.SF_CLIENT_ID;
        const clientSecret = process.env.SF_CLIENT_SECRET;
        const username = process.env.SF_USERNAME || 'edengamingarena_kiocwsyi6zhez6c@gmail.com';
        const password = process.env.SF_PASSWORD || '#13MarshMellows';

        const context = await request.newContext();
        const response = await context.post(loginUrl, {
            form: {
                grant_type: 'password',
                client_id: clientId || '',
                client_secret: clientSecret || '',
                username: username,
                password: password
            }
        });

        if (!response.ok()) {
            throw new Error(`Failed to authenticate with Salesforce API: ${await response.text()}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.instanceUrl = data.instance_url;
        this.requestContext = context;
        
        console.log('✅ Salesforce API Authenticated.');
    }

    /**
     * Creates a record via REST API.
     */
    async createRecord(sObjectType: string, fields: Record<string, any>): Promise<string> {
        if (!this.requestContext || !this.accessToken || !this.instanceUrl) {
            await this.authenticate();
        }

        const url = `${this.instanceUrl}/services/data/v58.0/sobjects/${sObjectType}`;
        const response = await this.requestContext!.post(url, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: fields
        });

        if (!response.ok()) {
            throw new Error(`Failed to create ${sObjectType}: ${await response.text()}`);
        }

        const result = await response.json();
        return result.id;
    }

    /**
     * Specialized helper for Lead creation.
     */
    async createLead(firstName: string, lastName: string, company: string, status: string = 'Open - Not Contacted') {
        return this.createRecord('Lead', { FirstName: firstName, LastName: lastName, Company: company, Status: status });
    }

    /**
     * Specialized helper for Account creation.
     */
    async createAccount(name: string, type: string = 'Prospect') {
        return this.createRecord('Account', { Name: name, Type: type });
    }

    /**
     * Specialized helper for Contact creation.
     */
    async createContact(firstName: string, lastName: string, accountId: string, email?: string) {
        return this.createRecord('Contact', { FirstName: firstName, LastName: lastName, AccountId: accountId, Email: email });
    }

    /**
     * Specialized helper for Opportunity creation.
     */
    async createOpportunity(name: string, accountId: string, closeDate: string, stage: string = 'Prospecting') {
        return this.createRecord('Opportunity', { Name: name, AccountId: accountId, CloseDate: closeDate, StageName: stage });
    }

    /**
     * Specialized helper for Case creation.
     */
    async createCase(subject: string, origin: string, status: string = 'New', accountId?: string) {
        return this.createRecord('Case', { Subject: subject, Origin: origin, Status: status, AccountId: accountId });
    }

    /**
     * Deletes a record via REST API.
     */
    async deleteRecord(sObjectType: string, id: string) {
        if (!this.requestContext || !this.accessToken || !this.instanceUrl) {
            await this.authenticate();
        }

        const url = `${this.instanceUrl}/services/data/v58.0/sobjects/${sObjectType}/${id}`;
        const response = await this.requestContext!.delete(url, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok() && response.status() !== 404) {
            throw new Error(`Failed to delete ${sObjectType} ${id}: ${await response.text()}`);
        }
    }
}
