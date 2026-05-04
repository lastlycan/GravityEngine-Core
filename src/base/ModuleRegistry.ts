export type Capability = 'CPQ_VERIFICATION' | 'PDF_PARSING' | 'AI_COORDINATION' | 'MFA_BYPASS';

export class ModuleRegistry {
    private static registeredCapabilities = new Set<Capability>();

    static register(capability: Capability) {
        console.log(`💎 Premium Capability Registered: ${capability}`);
        this.registeredCapabilities.add(capability);
    }

    static has(capability: Capability): boolean {
        return this.registeredCapabilities.has(capability);
    }

    static require(capability: Capability) {
        if (!this.has(capability)) {
            throw new Error(`🚫 Premium Capability Required: ${capability}. Please install the corresponding GravityEngine Pro module.`);
        }
    }
}
