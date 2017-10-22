import { test, suite } from 'mocha-typescript';
import { NgUniversalModule } from '../../src';

import * as unit from 'unit.js';

@suite('- Unit NgUniversalModuleTest file')
export class NgUniversalModuleTest {
    /**
     * Function executed before the suite
     */
    static before() {
    }

    /**
     * Function executed after the suite
     */
    static after() {
    }

    /**
     * Class constructor
     * New lifecycle
     */
    constructor() {
    }

    /**
     * Function executed before each test
     */
    before() {
    }

    /**
     * Function executed after each test
     */
    after() {
    }

    /**
     * Test if `NgUniversalModule` as a `setConfig` static function
     */
    @test('- `NgUniversalModule` must have `setConfig` static function')
    testNgUniversalModuleSetConfig() {
        unit.function(NgUniversalModule.setConfig);
    }

    /**
     * Test if `NgUniversalModule.universal()` static function returns CoreModuleWithProviders
     */
    @test('- `NgUniversalModule.setConfig()` static function must return CoreModuleWithProviders')
    testNgUniversalModuleSetConfigReturnsCoreModuleWithProviders(done) {
        const cwp = NgUniversalModule.setConfig({bootstrap: <any> {}, lazyModuleMap: {}, indexFilePath: ''});
        unit.object(cwp)
            .hasProperty('module')
            .hasProperty('providers')
            .when(_ => {
                unit.array(cwp.providers)
                    .hasLength(1)
                    .when(__ => {
                        unit.object(cwp.providers.pop())
                            .hasProperty('provide')
                            .hasProperty('useValue');
                        done();
                    });
            });
    }
}
