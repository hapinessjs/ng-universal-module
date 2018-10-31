import { GetHtmlUniversalRoute } from '../../src/module/routes/universal/get';
import { NgEngineService } from '../../src/module/services/engine';
import { of } from 'rxjs';
import { Buffer } from 'buffer';
import { ReplyNoContinue } from '@hapiness/core';

// mock NgEngineService constructor and all its methods
jest.mock('../../src/module/services/engine/ng.service');

// static mocks
const request: any = { raw: { req: { url: '' }, res: {} } };

describe('- Unit get-html-universal.route.test.ts file', () => {
    afterAll(() => {
        // restores the original (non-mocked) implementation.
        (<any> NgEngineService).mockRestore();
    });

    /**
     * Test if `GetHtmlUniversalRoute` has `onGet`, `_replyResponse` and `_isValid` functions
     */
    test('- `GetHtmlUniversalRoute` must have `onGet`, `_replyResponse` and `_isValid` functions', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(new NgEngineService(null, null));

        expect(typeof getHtmlUniversalRoute.onGet).toBe('function');
        expect(typeof getHtmlUniversalRoute['_replyResponse']).toBe('function');
        expect(typeof getHtmlUniversalRoute['_formatResponse']).toBe('function');
        expect(typeof getHtmlUniversalRoute['_isValid']).toBe('function');

        // NgEngineService constructor should have been called only 1 time
        expect(NgEngineService).toHaveBeenCalledTimes(1);
    });

    /**
     * Test if `GetHtmlUniversalRoute.onGet()` function returns an Observable with html data and no header
     */
    test(
        '- `GetHtmlUniversalRoute.onGet()` function must return an Observable with html data and no header',
        () => {
            // show that mockClear() is working
            expect(NgEngineService).not.toHaveBeenCalled();

            const getHtmlUniversalRoute = new GetHtmlUniversalRoute(new NgEngineService(null, null));

            (<any> NgEngineService).mock.instances[0]
                .universal.mockReturnValueOnce(of({ response: '<h1>Hello Angular</h1>' }));

            getHtmlUniversalRoute.onGet(request, <ReplyNoContinue>(res => {
                expect(res).toBe('<h1>Hello Angular</h1>');

                // NgEngineService constructor should have been called only 1 time
                expect(NgEngineService).toHaveBeenCalledTimes(1);
            }));
        }
    );

    /**
     * Test if `GetHtmlUniversalRoute.onGet()` function returns an Observable with html buffer and with header
     */
    test(
        '- `GetHtmlUniversalRoute.onGet()` function must return an Observable with html buffer and header',
        () => {
            // show that mockClear() is working
            expect(NgEngineService).not.toHaveBeenCalled();

            const getHtmlUniversalRoute = new GetHtmlUniversalRoute(new NgEngineService(null, null));

            (<any> NgEngineService).mock.instances[0].universal.mockReturnValueOnce(
                of({
                    response: Buffer.from('<h1>Hello Angular</h1>'),
                    mime: 'text/html'
                })
            );

            getHtmlUniversalRoute.onGet(request, <ReplyNoContinue>(res => {
                expect(res.toString()).toBe('<h1>Hello Angular</h1>');

                // NgEngineService constructor should have been called only 1 time
                expect(NgEngineService).toHaveBeenCalledTimes(1);
            }));
        }
    );

    /**
     * Test if `GetHtmlUniversalRoute.onGet()` function calls reply request
     */
    test('- `GetHtmlUniversalRoute.onGet()` function calls reply request', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        (<any> NgEngineService).mock.instances[0].universal.mockReturnValueOnce(of({ redirect: (res: string) => res }));

        getHtmlUniversalRoute.onGet(Object.assign({}, request, { 'universal_redirect': 'http://universal_redirect' }), <ReplyNoContinue>({
            redirect: res => {
                expect(res).toBe('http://universal_redirect');

                // NgEngineService constructor should have been called only 1 time
                expect(NgEngineService).toHaveBeenCalledTimes(1);
            }
        }));
    });

    /**
     * Test if `GetHtmlUniversalRoute._replyResponse()` calls the redirect function of reply
     */
    test('- `GetHtmlUniversalRoute._replyResponse()` calls the redirect function of reply', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        getHtmlUniversalRoute['_replyResponse'](
            Object.assign({}, request, { 'universal_redirect': 'http://universal_redirect' }),
            <ReplyNoContinue>({
                redirect: res => {
                    expect(res).toBe('http://universal_redirect');

                    // NgEngineService constructor should have been called only 1 time
                    expect(NgEngineService).toHaveBeenCalledTimes(1);
                }
            }),
            ''
        ).subscribe();
    });

    /**
     * Test if `GetHtmlUniversalRoute._replyResponse()` calls the reply function with a statusCode, no header and a response
     */
    test('- `GetHtmlUniversalRoute._replyResponse()` calls the reply function with a statusCode, no header and a response', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        let responseMock = {
            code: code => responseMock.statusCode = code,
            statusCode: 0,
            headers: {},
            response: ''
        };

        getHtmlUniversalRoute['_replyResponse'](
            request,
            (res => {
                expect(res).toBe('<h1>Hello Angular</h1>');
                return Object.assign(responseMock, { response: res });
            }) as any,
            { statusCode: 200, headers: {}, response: '<h1>Hello Angular</h1>' }
        ).subscribe(undefined, undefined, () => {
            expect(responseMock.statusCode).toBe(200);
            expect(responseMock.response).toBe('<h1>Hello Angular</h1>');
            expect(Object.keys(responseMock.headers)).toHaveLength(0);

            // NgEngineService constructor should have been called only 1 time
            expect(NgEngineService).toHaveBeenCalledTimes(1);
        });
    });

    /**
     * Test if `GetHtmlUniversalRoute._replyResponse()` calls the reply function with a statusCode, header and a response
     */
    test('- `GetHtmlUniversalRoute._replyResponse()` calls the reply function with a statusCode, header and a response', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        let responseMock = {
            code: code => responseMock.statusCode = code,
            statusCode: 0,
            headers: {},
            response: ''
        };

        getHtmlUniversalRoute['_replyResponse'](
            request,
            (res => {
                expect(res).toBe('<h1>Hello Angular</h1>');
                return Object.assign(responseMock, { response: res });
            }) as any,
            { statusCode: 200, headers: { test: 'test' }, response: '<h1>Hello Angular</h1>' }
        ).subscribe(undefined, undefined, () => {
            expect(responseMock.statusCode).toBe(200);
            expect(responseMock.response).toBe('<h1>Hello Angular</h1>');
            expect(Object.keys(responseMock.headers)).toHaveLength(1);
            expect(responseMock.headers['test']).toBe('test');

            // NgEngineService constructor should have been called only 1 time
            expect(NgEngineService).toHaveBeenCalledTimes(1);
        });
    });

    /**
     * Test if `GetHtmlUniversalRoute._replyResponse()` calls the reply function with header and a response and without statusCode
     */
    test('- `GetHtmlUniversalRoute._replyResponse()` calls the reply function with header and a response and without statusCode', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        let responseMock = {
            code: code => responseMock.statusCode = code,
            statusCode: 0,
            headers: {},
            response: ''
        };

        getHtmlUniversalRoute['_replyResponse'](
            request,
            (res => {
                expect(res).toBe('<h1>Hello Angular</h1>');
                return Object.assign(responseMock, { response: res });
            }) as any,
            { headers: { test: 'test' }, response: '<h1>Hello Angular</h1>' }
        ).subscribe(undefined, undefined, () => {
            expect(responseMock.statusCode).toBe(200);
            expect(responseMock.response).toBe('<h1>Hello Angular</h1>');
            expect(Object.keys(responseMock.headers)).toHaveLength(1);
            expect(responseMock.headers['test']).toBe('test');

            // NgEngineService constructor should have been called only 1 time
            expect(NgEngineService).toHaveBeenCalledTimes(1);
        });
    });

    /**
     * Test if `GetHtmlUniversalRoute._replyResponse()` calls the reply function with only html
     */
    test('- `GetHtmlUniversalRoute._replyResponse()` calls the reply function with only html', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        let responseMock = {
            code: code => responseMock.statusCode = code,
            statusCode: 0,
            headers: {},
            response: ''
        };

        getHtmlUniversalRoute['_replyResponse'](
            request,
            (res => {
                expect(res).toBe('<h1>Hello Angular</h1>');
                return Object.assign(responseMock, { response: res });
            }) as any,
            '<h1>Hello Angular</h1>'
        ).subscribe(undefined, undefined, () => {
            expect(responseMock.statusCode).toBe(200);
            expect(responseMock.response).toBe('<h1>Hello Angular</h1>');
            expect(Object.keys(responseMock.headers)).toHaveLength(0);

            // NgEngineService constructor should have been called only 1 time
            expect(NgEngineService).toHaveBeenCalledTimes(1);
        });
    });

    /**
     * Test if `GetHtmlUniversalRoute._replyResponse()` calls the reply function with headers, statusCode without response
     */
    test('- `GetHtmlUniversalRoute._replyResponse()` calls the reply function with headers, statusCode without response', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        let responseMock = {
            code: code => responseMock.statusCode = code,
            statusCode: 0,
            headers: {},
            response: ''
        };

        getHtmlUniversalRoute['_replyResponse'](
            request,
            (res => Object.assign(responseMock, { response: res })) as any,
            null
        ).subscribe(undefined, undefined, () => {
            expect(responseMock.statusCode).toBe(204);
            expect(Object.keys(responseMock.headers)).toHaveLength(0);
            expect(responseMock.response).toBe(null);

            // NgEngineService constructor should have been called only 1 time
            expect(NgEngineService).toHaveBeenCalledTimes(1);
        });
    });

    /**
     * Test if `GetHtmlUniversalRoute._formatResponse()` returns an empty object
     */
    test('- `GetHtmlUniversalRoute._formatResponse()` returns an empty object', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        const res = getHtmlUniversalRoute['_formatResponse'](null);

        expect(res.statusCode).toBe(204);
        expect(Object.keys(res.headers)).toHaveLength(0);
        expect(res.response).toBe(null);

        // NgEngineService constructor should have been called only 1 time
        expect(NgEngineService).toHaveBeenCalledTimes(1);
    });

    /**
     * Test if `GetHtmlUniversalRoute._formatResponse()` returns a new object depending on the given response
     */
    test('- `GetHtmlUniversalRoute._formatResponse()` returns a new object depending on the given response', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        const res = getHtmlUniversalRoute['_formatResponse']({ statusCode: 402, headers: {}, response: '<h1>Hello Angular</h1>' });

        expect(res.statusCode).toBe(402);
        expect(Object.keys(res.headers)).toHaveLength(0);
        expect(res.response).toBe('<h1>Hello Angular</h1>');

        // NgEngineService constructor should have been called only 1 time
        expect(NgEngineService).toHaveBeenCalledTimes(1);
    });

    /**
     * Test if `GetHtmlUniversalRoute._isValid` returns false when the response is null
     */
    test('- `GetHtmlUniversalRoute._isValid` returns false when the response is null', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        expect(getHtmlUniversalRoute['_isValid'](null)).toBeFalsy();

        // NgEngineService constructor should have been called only 1 time
        expect(NgEngineService).toHaveBeenCalledTimes(1);
    });

    /**
     * Test if `GetHtmlUniversalRoute._isValid` returns false when the response is undefined
     */
    test('- `GetHtmlUniversalRoute._isValid` returns false when the response is undefined', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        expect(getHtmlUniversalRoute['_isValid'](undefined)).toBeFalsy();

        // NgEngineService constructor should have been called only 1 time
        expect(NgEngineService).toHaveBeenCalledTimes(1);
    });

    /**
     * Test if `GetHtmlUniversalRoute._isValid` returns true when the response is well defined
     */
    test('- `GetHtmlUniversalRoute._isValid` returns true when the response is well defined', () => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const getHtmlUniversalRoute = new GetHtmlUniversalRoute(
            new NgEngineService(null, null)
        );

        expect(getHtmlUniversalRoute['_isValid']({ test: 'test' })).toBeTruthy();

        // NgEngineService constructor should have been called only 1 time
        expect(NgEngineService).toHaveBeenCalledTimes(1);
    });
});
