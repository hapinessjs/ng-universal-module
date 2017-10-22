import { test, suite } from 'mocha-typescript';
import { Hapiness, HapinessModule, HttpServerExt, HttpServerService, OnError, OnStart } from '@hapiness/core';
import { Observable } from 'rxjs/Observable';
import { NgUniversalModule } from '../../src';

import * as unit from 'unit.js';
import 'rxjs/add/observable/fromPromise';

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
                NgUniversalModule.setConfig({bootstrap: <any> {}, lazyModuleMap: {}, indexFilePath: './test/integration/test.html'})
            ],
            providers: [
                HttpServerService
            ]
        })
        class NUMTest implements OnError, OnStart {
            constructor(private _httpServer: HttpServerService) {}

            onStart(): Observable<any> {
                return Observable.fromPromise(this._httpServer.instance().inject('/'));
            }

            onError(error: Error): void {
                unit.string(error.message)
                    .is('No NgModule metadata found for \'[object Object]\'.')
                    .when(_ => this._httpServer.instance().stop().then(__ => done()));
            }
        }

        Hapiness.bootstrap(NUMTest, [
            HttpServerExt.setConfig({ host: '0.0.0.0', port: 4443 })
        ]);
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
            ],
            providers: [
                HttpServerService
            ]
        })
        class NUMTest implements OnError, OnStart {
            constructor(private _httpServer: HttpServerService) {}

            onStart(): Observable<any> {
                return Observable.fromPromise(this._httpServer.instance().inject('/'));
            }

            onError(error: Error): void {
                unit.string(error.message)
                    .is('No provider for InjectionToken ng_universal_module_config! ' +
                        '(NgEngineService -> InjectionToken ng_universal_module_config)')
                    .when(_ => this._httpServer.instance().stop().then(__ => done()));
            }
        }

        Hapiness.bootstrap(NUMTest, [
            HttpServerExt.setConfig({ host: '0.0.0.0', port: 4443 })
        ]);
    }
}
