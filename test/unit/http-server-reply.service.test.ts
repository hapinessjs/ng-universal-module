import { HttpServerReply } from '../../src';

let httpServerReplyService: HttpServerReply;

describe('- Unit http-server-reply.service.test.ts file', () => {
    /**
     * Executed before each tests
     */
    beforeEach(() => {
        httpServerReplyService = new HttpServerReply();
    });

    /**
     * Executed after each tests
     */
    afterEach(() => {
        httpServerReplyService = undefined;
    });

    /**
     * Test if `HttpServerReply.header` is a function
     */
    test('- `HttpServerReply.header` must be a function', (done) => {
        expect(typeof httpServerReplyService.header).toBe('function');
        done();
    });

    /**
     * Test if `HttpServerReply.redirect` is a function
     */
    test('- `HttpServerReply.redirect` must be a function', (done) => {
        expect(typeof httpServerReplyService.redirect).toBe('function');
        done();
    });

    /**
     * Test if `HttpServerReply.headers` returns empty headers object
     */
    test('- `HttpServerReply.headers` must return empty headers object', (done) => {
        expect(httpServerReplyService.headers).toStrictEqual({});
        done();
    });

    /**
     * Test if `HttpServerReply.redirectUrl` returns empty string
     */
    test('- `HttpServerReply.redirectUrl` must return empty string', (done) => {
        expect(httpServerReplyService.redirectUrl).toStrictEqual('');
        done();
    });

    /**
     * Test if `HttpServerReply.willRedirect` returns false
     */
    test('- `HttpServerReply.willRedirect` must return false', (done) => {
        expect(httpServerReplyService.willRedirect).toStrictEqual(false);
        done();
    });

    /**
     * Test if `HttpServerReply.headers` returns empty headers object after calling header() method without key/value
     */
    test('- `HttpServerReply.headers` must return empty headers object after calling header() method without key/value', (done) => {
        expect(httpServerReplyService.header(null, null).headers).toStrictEqual({});
        done();
    });

    /**
     * Test if `HttpServerReply.headers` returns additional headers object after calling header() method with key/value
     */
    test('- `HttpServerReply.headers` must return additional headers object after calling header() method with key/value',
        (done) => {
            expect(httpServerReplyService.header('x-additional-header', 'value').headers).toStrictEqual({ 'x-additional-header': 'value' });
            done();
        }
    );

    /**
     * Test if `HttpServerReply.redirect()` returns an error if no url is provided
     */
    test('- `HttpServerReply` must return an error if no url is provided', (done) => {
        try {
            httpServerReplyService.redirect(null);
        } catch (e) {
            expect(e.message).toBe('argument url must be a string');
        } finally {
            done();
        }
    });

    /**
     * Test if `HttpServerReply.redirect()` returns new redirect url and flag
     */
    test('- `HttpServerReply` must return new redirect url and flag', (done) => {
        httpServerReplyService.redirect('http://universal_redirect');
        expect(httpServerReplyService.redirectUrl).toStrictEqual('http://universal_redirect');
        expect(httpServerReplyService.willRedirect).toBeTruthy();
        done();
    });
});
