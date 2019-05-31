import { HttpUtils } from '../../src';

let httpUtilsService: HttpUtils;

describe('- Unit http-utils.service.test.ts file', () => {
    /**
     * Executed before each tests
     */
    beforeEach(() => {
        httpUtilsService = new HttpUtils();
    });

    /**
     * Executed after each tests
     */
    afterEach(() => {
        httpUtilsService = undefined;
    });

    /**
     * Test if `HttpUtils.parseCookie` is a function
     */
    test('- `HttpUtils.parseCookie` must be a function', (done) => {
        expect(typeof httpUtilsService.parseCookie).toBe('function');
        done();
    });

    /**
     * Test if `HttpUtils.serializeCookie` is a function
     */
    test('- `HttpUtils.serializeCookie` must be a function', (done) => {
        expect(typeof httpUtilsService.serializeCookie).toBe('function');
        done();
    });

    /**
     * Test if `HttpUtils.parseCookie()` returns an object with each cookie inside
     */
    test('- `HttpUtils.parseCookie` must return an object with each cookie inside', (done) => {
        expect(httpUtilsService.parseCookie('foo=bar; equation=E%3Dmc%5E2')).toStrictEqual({ foo: 'bar', equation: 'E=mc^2' });
        done();
    });

    /**
     * Test if `HttpUtils.serializeCookie()` returns header string
     */
    test('- `HttpUtils.serializeCookie` must return header string', (done) => {
        expect(httpUtilsService.serializeCookie('foo', 'bar', { httpOnly: true })).toStrictEqual('foo=bar; HttpOnly');
        done();
    });
});
