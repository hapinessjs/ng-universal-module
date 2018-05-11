import { ReplyNoContinue } from '@hapiness/core';
import { test, suite } from 'mocha-typescript';
import { GetHtmlUniversalRoute } from '../../src/module/routes';
import { NgEngineService } from '../../src/module/services';

import * as unit from 'unit.js';
import { of } from 'rxjs';
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
    // private property to store reply mock
    private _response: any;

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
        this._request = { raw: { req: { url: '' }, res: {} } };
        this._reply = {};
        this._response = {};
        this._getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        unit.spy();

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
        unit.function(this._getHtmlUniversalRoute['_replyResponse']);
        unit.function(this._getHtmlUniversalRoute['_formatResponse']);
        unit.function(this._getHtmlUniversalRoute['_isValid']);
    }

    /**
     * Test if `GetHtmlUniversalRoute.onGet()` function returns an Observable with html data and no header
     */
    @test(
        '- `GetHtmlUniversalRoute.onGet()` function must return an Observable with html data and no header'
    )
    testGetHtmlUniversalRouteOnGetObservableHtmlWithoutHeader(done) {
        this._ngEngineServiceMock
            .expects('universal')
            .once()
            .returns(of({ response: Buffer.from('<h1>Hello Angular</h1>') }));

        this._getHtmlUniversalRoute.onGet(this._request, <ReplyNoContinue>(res => {
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


        this._getHtmlUniversalRoute.onGet(this._request, <ReplyNoContinue>(res => {
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
                    redirect: (res: string) => {
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

    /**
     * Test if `replyResponse()` calls the redirect function of reply
     */
    @test('- `replyResponse()` calls the redirect function of reply')
    testReplyResponseWithPropertyToRedirect(done) {
        this._request['universal_redirect'] = 'http://localhost:4200/test';
        this._response = 'HTML';
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
        this._getHtmlUniversalRoute['_replyResponse'](this._request, this._reply, this._response).subscribe();
    }

    /**
     * Test if `replyResponse()` calls the reply function with a statusCode, no header and a response
     */
    @test('- `replyResponse()` calls the reply function with a statusCode, no header and a response')
    testReplyResponseWithoutPropertyToRedirectWithStatusCodeResponseWithoutHeader(done) {
        this._response = { statusCode: 200, headers: {}, response: '<h1>Hello Angular</h1>' };

        let responseMock = {
            code: (code) => {
                responseMock.statusCode = code;
                return responseMock;
            },
            statusCode: 0,
            headers: {},
            response: ''
        };
        this._reply = (res: any) => {
            unit.string(res);
            responseMock.response = res;
            return responseMock;
        };
        this._getHtmlUniversalRoute['_replyResponse'](this._request, this._reply, this._response).subscribe();

        unit.object(responseMock).matchEach((it, key) => {
            if (key === 'statusCode') {
                return (typeof it === 'number' && it === 200);
            }

            if (key === 'response') {
                return (typeof it === 'string' && it === '<h1>Hello Angular</h1>');
            }

            if (key === 'headers') {
                return (typeof it === 'object' && Object.keys(it).length === 0);
            }
            // For the function : Code
            return true;
        });

        done();
    }

    /**
     * Test if `replyResponse()` calls the reply function with a statusCode, header and a response
     */
    @test('- `replyResponse()` calls the reply function with a statusCode, header and a response')
    testReplyResponseWithoutPropertyToRedirectWithStatusCodeResponseHeader(done) {
        this._response = { statusCode: 200, headers: { test: 'test' }, response: '<h1>Hello Angular</h1>' };

        let responseMock = {
            code: (code) => {
                responseMock.statusCode = code;
                return responseMock;
            },
            statusCode: 0,
            headers: {},
            response: ''
        };
        this._reply = (res: any) => {
            unit.string(res);
            responseMock.response = res;
            return responseMock;
        };
        this._getHtmlUniversalRoute['_replyResponse'](this._request, this._reply, this._response).subscribe();

        unit.object(responseMock).matchEach((it, key) => {
            if (key === 'statusCode') {
                return (typeof it === 'number' && it === 200);
            }

            if (key === 'response') {
                return (typeof it === 'string' && it === '<h1>Hello Angular</h1>');
            }

            if (key === 'headers') {
                return (typeof it === 'object' && Object.keys(it).length === 1 && it.test === 'test');
            }
            // For the function : Code
            return true;
        });

        done();
    }

    /**
     * Test if `replyResponse()` calls the reply function with header and a response and without statusCode
     */
    @test('- `replyResponse()` calls the reply function with header and a response and without statusCode')
    testReplyResponseWithoutPropertyToRedirectWithResponseHeaderWithoutCodeStatus(done) {
        this._response = { headers: { test: 'test' }, response: '<h1>Hello Angular</h1>' };

        let responseMock = {
            code: (code) => {
                responseMock.statusCode = code;
                return responseMock;
            },
            statusCode: 0,
            headers: {},
            response: ''
        };
        this._reply = (res: any) => {
            unit.string(res);
            responseMock.response = res;
            return responseMock;
        };
        this._getHtmlUniversalRoute['_replyResponse'](this._request, this._reply, this._response).subscribe();

        unit.object(responseMock).matchEach((it, key) => {
            if (key === 'statusCode') {
                return (typeof it === 'number' && it === 200);
            }

            if (key === 'response') {
                return (typeof it === 'string' && it === '<h1>Hello Angular</h1>');
            }

            if (key === 'headers') {
                return (typeof it === 'object' && Object.keys(it).length === 1 && it.test === 'test');
            }
            // For the function : Code
            return true;
        });

        done();
    }

    /**
     * Test if `replyResponse()` calls the reply function with only html
     */
    @test('- `replyResponse()` calls the reply function with only html')
    testReplyResponseWithoutPropertyToRedirectWithOnlyHtml(done) {
        this._response = '<h1>Hello Angular</h1>';

        let responseMock = {
            code: (code) => {
                responseMock.statusCode = code;
                return responseMock;
            },
            statusCode: 0,
            headers: {},
            response: ''
        };
        this._reply = (res: any) => {
            unit.string(res);
            responseMock.response = res;
            return responseMock;
        };
        this._getHtmlUniversalRoute['_replyResponse'](this._request, this._reply, this._response).subscribe();

        unit.object(responseMock).matchEach((it, key) => {
            if (key === 'statusCode') {
                return (typeof it === 'number' && it === 200);
            }

            if (key === 'response') {
                return (typeof it === 'string' && it === '<h1>Hello Angular</h1>');
            }

            if (key === 'headers') {
                return (typeof it === 'object' && Object.keys(it).length === 0);
            }
            // For the function : Code
            return true;
        });

        done();
    }

    /**
     * Test if `replyResponse()` calls the reply function with headers, statusCode without response
     */
    @test('- `replyResponse()` calls the reply function with headers, statusCode without response')
    testReplyResponseWithoutPropertyToRedirectWithHeadersStatusCodeWithoutResponse(done) {
        this._response = null;

        let responseMock = {
            code: (code) => {
                responseMock.statusCode = code;
                return responseMock;
            },
            statusCode: 0,
            headers: {},
            response: ''
        };
        this._reply = (res: any) => {
            responseMock.response = res;
            return responseMock;
        };
        this._getHtmlUniversalRoute['_replyResponse'](this._request, this._reply, this._response).subscribe();

        unit.object(responseMock).matchEach((it, key) => {
            if (key === 'statusCode') {
                return (typeof it === 'number' && it === 204);
            }

            if (key === 'headers') {
                return (typeof it === 'object' && Object.keys(it).length === 0);
            }
            // For the function : Code
            return true;
        });

        done();
    }

    /**
     * Test if `formatResponse` returns an empty object
     */
    @test('- `formatResponse` returns an empty object')
    testFormatResponseReturnEmptyObject() {
        const res = this._getHtmlUniversalRoute['_formatResponse'](null);
        unit.object(res).matchEach((it, key) => {
            if (key === 'statusCode') {
                return (typeof it === 'number' && it === 204);
            }
            if (key === 'headers') {
                return (typeof it === 'object' && Object.keys(it).length === 0);
            }
            if (key === 'response') {
                return (it === null);
            }
        });
    }

    /**
     * Test if `formatResponse` returns a new object depending on the given response
     */
    @test('- `formatResponse` returns a new object depending on the given response')
    testFormatResponseReturnObjectGivenResponse() {
        const res = this._getHtmlUniversalRoute['_formatResponse']({ statusCode: 402, headers: {}, response: '<h1>Hello Angular</h1>' });
        unit.object(res).matchEach((it, key) => {
            if (key === 'statusCode') {
                return (typeof it === 'number' && it === 402);
            }
            if (key === 'headers') {
                return (typeof it === 'object' && Object.keys(it).length === 0);
            }
            if (key === 'response') {
                return (typeof it === 'string' && it === '<h1>Hello Angular</h1>');
            }
        });
    }

    /**
     * Test if `isValid` returns false when the response is null
     */
    @test('- `isValid` returns false when the response is null')
    testIsValidReturnFalseNullResponse() {
        const res: boolean = this._getHtmlUniversalRoute['_isValid'](null);
        unit.bool(res).isFalse();
    }

    /**
     * Test if `isValid` returns false when the response is undefined
     */
    @test('- `isValid` returns false when the response is undefined')
    testIsValidReturnFalseUndefinedResponse() {
        const res: boolean = this._getHtmlUniversalRoute['_isValid'](undefined);
        unit.bool(res).isFalse();
    }

    /**
     * Test if `isValid` returns true when the response is well defined
     */
    @test('- `isValid` returns true when the response is well defined')
    testIsValidReturnTrue() {
        const res: boolean = this._getHtmlUniversalRoute['_isValid']({ test: 'test' });
        unit.bool(res).isTrue();
    }
}
