import { HtmlUniversalRoute } from '../../src/module/routes/universal';
import { HttpServerReply, NgEngineService } from '../../src/module/services';
import { of } from 'rxjs';
import { Buffer } from 'buffer';

// mock NgEngineService constructor and all its methods
jest.mock('../../src/module/services/engine/ng.service');

describe('- Unit get-html-universal.route.test.ts file', () => {
    afterAll(() => {
        // restores the original (non-mocked) implementation.
        (<any>NgEngineService).mockRestore();
    });

    /**
     * Test if `HtmlUniversalRoute` has `onGet`, `_replyResponse` and `_isValid` functions
     */
    test('- `HtmlUniversalRoute` must have `onGet`, `_replyResponse` and `_isValid` functions', (done) => {
        // show that mockClear() is working
        expect(NgEngineService).not.toHaveBeenCalled();

        const htmlUniversalRoute = new HtmlUniversalRoute(new NgEngineService(null, null, null, null), new HttpServerReply());

        expect(typeof htmlUniversalRoute.onGet).toBe('function');
        expect(typeof htmlUniversalRoute['_createResponse']).toBe('function');
        expect(typeof htmlUniversalRoute['_formatResponse']).toBe('function');
        expect(typeof htmlUniversalRoute['_isValid']).toBe('function');

        // NgEngineService constructor should have been called only 1 time
        expect(NgEngineService).toHaveBeenCalledTimes(1);

        done();
    });

    /**
     * Test if `HtmlUniversalRoute.onGet()` function returns an Observable with html data and no header
     */
    test(
        '- `HtmlUniversalRoute.onGet()` function must return an Observable with html data and no header',
        (done) => {
            // show that mockClear() is working
            expect(NgEngineService).not.toHaveBeenCalled();

            const htmlUniversalRoute = new HtmlUniversalRoute(new NgEngineService(null, null, null, null), new HttpServerReply());

            (<any>NgEngineService).mock.instances[0]
                .universal.mockReturnValueOnce(of({ value: '<h1>Hello Angular</h1>' }));

            htmlUniversalRoute.onGet().subscribe(res => {
                expect(res.value).toBe('<h1>Hello Angular</h1>');
                expect(res.headers).toStrictEqual({});

                // NgEngineService constructor should have been called only 1 time
                expect(NgEngineService).toHaveBeenCalledTimes(1);

                done();
            });
        }
    );

    /**
     * Test if `HtmlUniversalRoute.onGet()` function returns an Observable with html buffer and with header
     */
    test(
        '- `HtmlUniversalRoute.onGet()` function must return an Observable with html buffer and header',
        (done) => {
            // show that mockClear() is working
            expect(NgEngineService).not.toHaveBeenCalled();

            const htmlUniversalRoute = new HtmlUniversalRoute(new NgEngineService(null, null, null, null), new HttpServerReply());

            (<any>NgEngineService).mock.instances[0].universal.mockReturnValueOnce(
                of({
                    value: Buffer.from('<h1>Hello Angular</h1>'),
                    headers: {
                        'content-type': 'text/html'
                    }
                })
            );

            htmlUniversalRoute.onGet().subscribe(res => {
                expect(res.value.toString()).toBe('<h1>Hello Angular</h1>');
                expect(res.headers).toStrictEqual({ 'content-type': 'text/html' });

                // NgEngineService constructor should have been called only 1 time
                expect(NgEngineService).toHaveBeenCalledTimes(1);

                done();
            });
        }
    );

    /**
     * Test if `HtmlUniversalRoute.onGet()` function returns an Observable with redirect data and no header
     */
    test(
        '- `HtmlUniversalRoute.onGet()` function must return an Observable with redirect data and no header',
        (done) => {
            // show that mockClear() is working
            expect(NgEngineService).not.toHaveBeenCalled();

            const htmlUniversalRoute = new HtmlUniversalRoute(new NgEngineService(null, null, null, null), new HttpServerReply());

            (<any>NgEngineService).mock.instances[0]
                .universal.mockReturnValueOnce(of({ value: '<h1>Hello Angular</h1>' }));

            htmlUniversalRoute['_reply'].redirect('http://universal_redirect');

            htmlUniversalRoute.onGet().subscribe(res => {
                expect(res.value).toBe('http://universal_redirect');
                expect(res.redirect).toBeTruthy();

                // NgEngineService constructor should have been called only 1 time
                expect(NgEngineService).toHaveBeenCalledTimes(1);

                done();
            });
        }
    );

    /**
     * Test if `HtmlUniversalRoute.onGet()` function returns an Observable with redirect data and additional header
     */
    test(
        '- `HtmlUniversalRoute.onGet()` function must return an Observable with redirect data and additional header',
        (done) => {
            // show that mockClear() is working
            expect(NgEngineService).not.toHaveBeenCalled();

            const htmlUniversalRoute = new HtmlUniversalRoute(new NgEngineService(null, null, null, null), new HttpServerReply());

            (<any>NgEngineService).mock.instances[0]
                .universal.mockReturnValueOnce(of({ value: '<h1>Hello Angular</h1>' }));

            htmlUniversalRoute['_reply'].header('x-redirect', 'universal_redirect').redirect('http://universal_redirect');

            htmlUniversalRoute.onGet().subscribe(res => {
                expect(res.value).toBe('http://universal_redirect');
                expect(res.redirect).toBeTruthy();
                expect(res.headers).toStrictEqual({ 'x-redirect': 'universal_redirect' });

                // NgEngineService constructor should have been called only 1 time
                expect(NgEngineService).toHaveBeenCalledTimes(1);

                done();
            });
        }
    );


    /**
     * Test if `HtmlUniversalRoute.onGet()` function returns an Observable with empty data
     */
    test(
        '- `HtmlUniversalRoute.onGet()` function must return an Observable with empty data',
        (done) => {
            // show that mockClear() is working
            expect(NgEngineService).not.toHaveBeenCalled();

            const htmlUniversalRoute = new HtmlUniversalRoute(new NgEngineService(null, null, null, null), new HttpServerReply());

            (<any>NgEngineService).mock.instances[0]
                .universal.mockReturnValueOnce(of(null));

            htmlUniversalRoute.onGet().subscribe(res => {
                expect(res.value).toBeNull();
                expect(res.headers).toStrictEqual({});
                expect(res.statusCode).toBe(204);

                // NgEngineService constructor should have been called only 1 time
                expect(NgEngineService).toHaveBeenCalledTimes(1);

                done();
            });
        }
    );
});
