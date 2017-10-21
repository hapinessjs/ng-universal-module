/**
 * @see https://github.com/pana-cc/mocha-typescript
 */
import { test, suite } from 'mocha-typescript';

/**
 * @see http://unitjs.com/
 */
import * as unit from 'unit.js';

import { Observable } from 'rxjs/Observable';
import { NgEngineService } from '../../src/module/services';

@suite('- Unit NgEngineServiceTest file')
export class NgEngineServiceTest {
    // private property to store service instance
    private _ngEngineService: NgEngineService;

    /**
     * Function executed before the suite
     */
    static before() {}

    /**
     * Function executed after the suite
     */
    static after() {}

    /**
     * Class constructor
     * New lifecycle
     */
    constructor() {}

    /**
     * Function executed before each test
     */
    before() {
        this._ngEngineService = new NgEngineService(null);
    }

    /**
     * Function executed after each test
     */
    after() {
        this._ngEngineService = undefined;
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
}
