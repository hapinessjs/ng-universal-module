import { test, suite } from 'mocha-typescript';
import { Buffer } from 'buffer';
import { Observable } from 'rxjs/Observable';
import { NgEngineService } from '../../src/module/services';

import * as unit from 'unit.js';
import * as fs from 'fs';

@suite('- Unit NgEngineServiceTest file')
export class NgEngineServiceTest {
    // private property to store service instance
    private _ngEngineService: NgEngineService;
    // private property to store request mock
    private _request: any;
    // private property to store fs stub
    private _fsStub: any;

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
        this._ngEngineService = new NgEngineService(null);
        this._request = { raw: { req: { url: '' }, res: {} } };
        this._fsStub = unit.stub(fs, 'readFileSync').returns(Buffer.from(''));
    }

    /**
     * Function executed after each test
     */
    after() {
        this._ngEngineService = undefined;
        this._request = undefined;
        this._fsStub.restore();
        this._fsStub = undefined;
    }

    /**
     * Test if `NgEngineService` as a `universal` function
     */
    @test('- `NgEngineService` must have `universal` function')
    testNgEngineServiceUniversal() {
        unit.function(this._ngEngineService.universal);
    }

    /**
     * Test if `NgEngineService.universal()` function returns an Observable
     */
    @test('- `NgEngineService.universal()` function must return an Observable')
    testNgEngineServiceUniversalObservable(done) {
        unit.object(this._ngEngineService.universal(null)).isInstanceOf(Observable).when(_ => done());
    }

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if parameter is wrong
     */
    @test('- `NgEngineService.universal()` function must return an Observable Error if parameter is wrong')
    testNgEngineServiceUniversalObservableReqParamError(done) {
        this._ngEngineService.universal(null)
            .subscribe(null, e => unit.string(e.message).is('url is undefined').when(_ => done()));
    }

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing bootstrap in config
     */
    @test('- `NgEngineService.universal()` function must return an Observable Error if missing bootstrap in config')
    testNgEngineServiceUniversalObservableConfigBootstrapError(done) {
        this._ngEngineService.universal(this._request)
            .subscribe(null, e => unit.string(e.message)
                .is('You must pass in a NgModule or NgModuleFactory to be bootstrapped').when(_ => done()));
    }

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing lazyModuleMap in config
     */
    @test('- `NgEngineService.universal()` function must return an Observable Error if missing bootstrap in config')
    testNgEngineServiceUniversalObservableConfigLazyModuleMapError(done) {
        const ngE = new NgEngineService({ bootstrap: <any> {}, lazyModuleMap: null });
        ngE.universal(this._request)
            .subscribe(null, e => unit.string(e.message)
                .is('You must pass in LazyModuleMap').when(_ => done()));
    }

    /**
     * Test if `NgEngineService.universal()` function returns success with compiler
     */
    @test('- `NgEngineService.universal()` success execution with compiler')
    testNgEngineServiceUniversalSuccessWithCompile(done) {
        const ngE = new NgEngineService({ bootstrap: <any> {}, lazyModuleMap: {} });

        const compilerStub = unit.stub(ngE['_compiler'], 'compileModuleAsync').returns(new Promise((resolve) => resolve({})));
        const renderModuleFactoryStub = unit.stub(ngE, '_renderModuleFactory')
            .returns(new Promise((resolve) => resolve('<h1>Hello Angular</h1>')));

        ngE.universal(this._request)
            .subscribe(_ => unit.string(_).is('<h1>Hello Angular</h1>')
                .when(__ => {
                    compilerStub.restore();
                    renderModuleFactoryStub.restore();
                    done();
                })
            );
    }

    /**
     * Test if `NgEngineService.universal()` function returns success with cache
     */
    @test('- `NgEngineService.universal()` success execution with cache')
    testNgEngineServiceUniversalSuccessWithCache(done) {
        const ngE = new NgEngineService({ bootstrap: NgEngineService, lazyModuleMap: {} });

        ngE['_factoryCacheMap'].set(NgEngineService, <any> {});

        const renderModuleFactoryStub = unit.stub(ngE, '_renderModuleFactory')
            .returns(new Promise((resolve) => resolve('<h1>Hello Angular</h1>')));

        ngE.universal(this._request)
            .subscribe(_ => unit.string(_).is('<h1>Hello Angular</h1>')
                .when(__ => {
                    renderModuleFactoryStub.restore();
                    done();
                })
            );
    }
}
