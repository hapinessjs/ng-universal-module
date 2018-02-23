import { ReplyNoContinue } from '@hapiness/core';
import { test, suite } from 'mocha-typescript';
import { GetHtmlUniversalRoute } from '../../src/module/routes';
import { NgEngineService } from '../../src/module/services';

import * as unit from 'unit.js';
import { of } from 'rxjs/observable/of';
import { Buffer } from 'buffer';

@suite('- Unit GetHtmlUniversalRouteTest file')
export class GetHtmlUniversalRouteTest {
    // private property to store mock service instance
    private _ngEngineServiceMock: any;
    // private property to store route instance
    private _getHtmlUniversalRoute: GetHtmlUniversalRoute;
    // private property to store request mock
    private _request: any;
    // private property to store reply mock
    private _reply: any;

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
        this._request = { raw: { req: { url: '' }, res: {} } };
        this._reply = {};
        this._getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );
        this._ngEngineServiceMock = unit.mock(
            this._getHtmlUniversalRoute['_ngEngineService']
        );
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
     * Test if `GetHtmlUniversalRoute.onGet()` function returns an Observable with html data and without header
     */
    @test(
        '- `GetHtmlUniversalRoute.onGet()` function must return an Observable with html data and no header'
    )
    testGetHtmlUniversalRouteOnGetObservableHtmlWithoutHeader(done) {
        this._ngEngineServiceMock
            .expects('universal')
            .once()
            .returns(of({ response: Buffer.from('<h1>Hello Angular</h1>') }));

        this._getHtmlUniversalRoute.onGet(null, <ReplyNoContinue>(res => {
            unit
                .string(res.toString())
                .is('<h1>Hello Angular</h1>')
                .when(_ => {
                    this._ngEngineServiceMock.verify();
                    this._ngEngineServiceMock.restore();
                    done();
                });
        }));
    }

    /**
     * Test if `GetHtmlUniversalRoute.onGet()` function returns an Observable with html buffer and with header
     */
    @test(
        '- `GetHtmlUniversalRoute.onGet()` function must return an Observable with html buffer and header'
    )
    testGetHtmlUniversalRouteOnGetObservableHtmlWithHeader(done) {
        this._ngEngineServiceMock
            .expects('universal')
            .once()
            .returns(
                of({
                    response: Buffer.from('<h1>Hello Angular</h1>'),
                    mime: 'text/html'
                })
            );

        this._getHtmlUniversalRoute.onGet(null, <ReplyNoContinue>(res => {
            unit
                .string(res.toString())
                .is('<h1>Hello Angular</h1>')
                .when(_ => {
                    this._ngEngineServiceMock.verify();
                    this._ngEngineServiceMock.restore();
                    done();
                });
        }));
    }

    /**
     * Test if `GetHtmlUniversalRoute.onGet()` function calls reply request
     */
    @test('- `GetHtmlUniversalRoute.onGet()` function calls reply request')
    testGetHtmlUniversalRouteOnGetWithReplyHeader(done) {
        this._request['universal_redirect'] = 'http://localhost:4200/test';

        this._ngEngineServiceMock
            .expects('universal')
            .once()
            .returns(
                of({
                    redirect: function(res: string) {
                        return res;
                    }
                })
            );

        this._reply = {
            redirect: res => {
                unit
                    .string(res)
                    .is('http://localhost:4200/test')
                    .when(_ => {
                        this._ngEngineServiceMock.verify();
                        this._ngEngineServiceMock.restore();
                        done();
                    });
            }
        };

        this._getHtmlUniversalRoute.onGet(this._request, this._reply);
    }
}
