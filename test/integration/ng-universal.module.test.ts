import { test, suite } from 'mocha-typescript';
import { Hapiness, HapinessModule, HttpServerExt } from '@hapiness/core';
import { NgUniversalModule } from '../../src';

import * as unit from 'unit.js';

@suite('- Integration NgUniversalModuleTest file')
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
     * Test if universal route returns an error if bad value in module config bootstrap
     */
    @test('- check if universal route returns an error if bad value in module config bootstrap')
    testGetHtmlUniversaleRouteErrorInModuleConfigBootstrap(done) {
        @HapinessModule({
            version: '1.0.0',
            imports: [
                NgUniversalModule.setConfig({bootstrap: <any> {}, lazyModuleMap: {}})
            ]
        })
        class NUMTest {}

        Hapiness.bootstrap(NUMTest, [
            HttpServerExt.setConfig({ host: '0.0.0.0', port: 4443 })
        ]).then(_ => {
            const server = Hapiness['extensions'].pop().value;
            server.inject('./test.html', reply => unit.exception(reply.result).when(__ => server.stop().then(___ => done())));
        });
    }

    /**
     * Test if universal route returns an error if no module config
     */
    @test('- check if universal route returns an error if no module config')
    testGetHtmlUniversaleRouteErrorOnModuleBootstrap(done) {
        @HapinessModule({
            version: '1.0.0',
            imports: [
                NgUniversalModule
            ]
        })
        class NUMTest {}

        Hapiness.bootstrap(NUMTest, [
            HttpServerExt.setConfig({ host: '0.0.0.0', port: 4443 })
        ]).then(_ => {
            const server = Hapiness['extensions'].pop().value;
            server.inject('./test.html', reply => unit.exception(reply.result).when(__ => server.stop().then(___ => done())));
        });
    }
}
