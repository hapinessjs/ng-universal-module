import { NgUniversalModule } from '../../src';

describe('- Unit ng-universal.module.test.ts file', () => {
    /**
     * Test if `NgUniversalModule` as a `setConfig` static function
     */
    test('- `NgUniversalModule` must have `setConfig` static function', () => expect(typeof NgUniversalModule.setConfig).toBe('function'));

    /**
     * Test if `NgUniversalModule.universal()` static function returns CoreModuleWithProviders
     */
    test('- `NgUniversalModule.setConfig()` static function must return CoreModuleWithProviders', () => {
        const cwp = NgUniversalModule.setConfig({ bootstrap: <any> {}, lazyModuleMap: {}, staticContent: null });
        expect(cwp).toHaveProperty('module');
        expect(cwp).toHaveProperty('providers');
        expect(cwp.providers).toHaveLength(1);
        const provider = cwp.providers.pop();
        expect(provider).toHaveProperty('provide');
        expect(provider).toHaveProperty('useValue');
    });
});
