import { test, suite } from 'mocha-typescript';
import { Observable } from 'rxjs/Observable';
import { GetHtmlUniversalRoute } from '../../src/module/routes';
import { NgEngineService } from '../../src/module/services';

import * as unit from 'unit.js';
import 'rxjs/add/observable/of';

@suite('- Unit GetHtmlUniversalRouteTest file')
export class GetHtmlUniversalRouteTest {
    // private property to store mock service instance
    private _ngEngineServiceMock: any;
    // private property to store route instance
    private _getHtmlUniversalRoute: GetHtmlUniversalRoute;
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
        this._getHtmlUniversalRoute = new GetHtmlUniversalRoute(new NgEngineService(null));
        this._ngEngineServiceMock = unit.mock(this._getHtmlUniversalRoute['_ngEngineService']);
    }

    /**
     * Function executed after each test
     */
    after() {
        this._getHtmlUniversalRoute = undefined;
        this._ngEngineServiceMock = undefined;
    }

    /**
     * Test if `GetHtmlUniversalRoute` as a `onGet` function
     */
    @test('- `GetHtmlUniversalRoute` must have `onGet` function')
    testGetHtmlUniversalRouteOnGet() {
        unit.function(this._getHtmlUniversalRoute.onGet);
    }

    /**
     * Test if `GetHtmlUniversalRoute.onGet()` function returns an Observable
     */
    @test('- `GetHtmlUniversalRoute.onGet()` function must return an Observable')
    testGetHtmlUniversalRouteOnGetObservable(done) {
        unit.object(this._getHtmlUniversalRoute.onGet(null)).isInstanceOf(Observable).when(_ => done());
    }

    /**
     * Test if `GetHtmlUniversalRoute.onGet()` function returns an Observable with html data
     */
    @test('- `GetHtmlUniversalRoute.onGet()` function must return an Observable with html data')
    testGetHtmlUniversalRouteOnGetObservableHtml(done) {
        this._ngEngineServiceMock.expects('universal').once().returns(Observable.of('<h1>Hello Angular</h1>'));

        this._getHtmlUniversalRoute.onGet(null).subscribe(_ => unit.string(_).is('<h1>Hello Angular</h1>')
            .when(__ => {
                this._ngEngineServiceMock.verify();
                this._ngEngineServiceMock.restore();
                done();
            }));
    }
}
