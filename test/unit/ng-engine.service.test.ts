import { NgEngineService } from '../../src/module/services/engine';
import { Observable } from 'rxjs';
import * as fs from 'fs';
import { Buffer } from 'buffer';

const request: any = { raw: { url: '/static/content' } };
const reply: any = {};
const utils: any = {};

describe('- Unit ng-engine.service.test.ts file', () => {
    /**
     * Test if `NgEngineService` as a `universal` function
     */
    test('- `NgEngineService` must have `universal` function',
        (done) => {
            expect(typeof new NgEngineService(null, null, null, null).universal).toBe('function');
            done();
        });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable
     */
    test('- `NgEngineService.universal()` function must return an Observable', (done) => {
        expect(new NgEngineService(null, null, null, null).universal()).toBeInstanceOf(Observable);
        done();
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if parameter is wrong
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if parameter is wrong', (done) => {
        new NgEngineService(null, null, null, null).universal().subscribe(() => undefined, e => expect(e.message).toBe('url is undefined'));
        done();
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing bootstrap in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing bootstrap in config', (done) => {
        new NgEngineService(null, request, reply, utils).universal()
            .subscribe(() => undefined, e => expect(e.message)
                .toBe('You must pass in config a NgModule or NgModuleFactory to be bootstrapped'));
        done();
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing lazyModuleMap in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing lazyModuleMap in config', (done) => {
        const ngE = new NgEngineService({
            bootstrap: <any>{},
            lazyModuleMap: null,
            staticContent: null
        }, request, reply, utils);

        ngE.universal().subscribe(() => undefined, e => expect(e.message)
            .toBe('You must pass in config lazy module map'));
        done();
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing staticContent in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing staticContent in config', (done) => {
        const ngE = new NgEngineService({ bootstrap: <any>{}, lazyModuleMap: {}, staticContent: null }, request, reply, utils);
        ngE.universal()
            .subscribe(() => undefined, e => expect(e.message).toBe('You must pass in config the static content object'));
        done();
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing staticContent indexFile in config
     */
    test('- `NgEngineService.universal()` function must return an Observable ' +
        'Error if missing staticContent indexFile in config', (done) => {
        const ngE = new NgEngineService({
            bootstrap: <any>{},
            lazyModuleMap: {},
            staticContent: { indexFile: null, rootPath: '' }
        }, request, reply, utils);

        ngE.universal()
            .subscribe(() => undefined, e => expect(e.message).toBe('You must pass in config the static content object with index file'));
        done();
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing staticContent rootPath in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing staticContent rootPath in config', (done) => {
        const ngE = new NgEngineService({
            bootstrap: <any>{},
            lazyModuleMap: {},
            staticContent: { indexFile: '/', rootPath: '' }
        }, request, reply, utils);

        ngE.universal()
            .subscribe(() => undefined, e => expect(e.message).toBe('You must pass in config the static content object with root path'));
        done();
    });

    /**
     * Test if `NgEngineService.universal()` function returns success with compiler
     */
    test('- `NgEngineService.universal()` success execution with compiler', (done) => {
        const ngE = new NgEngineService({
            bootstrap: <any>{}, lazyModuleMap: {}, staticContent: {
                rootPath: './root/path',
                indexFile: 'test.html'
            }
        }, request, reply, utils);

        // create all mocks
        const compilerStub = jest.spyOn(ngE['_compiler'], 'compileModuleAsync')
            .mockReturnValueOnce(new Promise((resolve) => resolve({} as any)));
        const renderModuleFactoryStub = jest.spyOn<any, string>(ngE, '_renderModuleFactory')
            .mockReturnValueOnce(new Promise((resolve) => resolve('<h1>Hello Angular</h1>')));
        const fsStub = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(Buffer.from(''));

        ngE.universal().subscribe(_ => {
            expect(_.value).toBe('<h1>Hello Angular</h1>');

            // compilerStub should have been called only 1 time
            expect(compilerStub).toHaveBeenCalledTimes(1);

            // renderModuleFactoryStub should have been called only 1 time
            expect(renderModuleFactoryStub).toHaveBeenCalledTimes(1);

            // fsStub should have been called only 1 time
            expect(fsStub).toHaveBeenCalledTimes(1);

            // restore mocks
            compilerStub.mockRestore();
            renderModuleFactoryStub.mockRestore();
            fsStub.mockRestore();

            done();
        });
    });

    /**
     * Test if `NgEngineService.universal()` function returns success with cache
     */
    test('- `NgEngineService.universal()` success execution with cache', (done) => {
        const ngE = new NgEngineService({
            bootstrap: NgEngineService, lazyModuleMap: {}, staticContent: {
                rootPath: './root/path',
                indexFile: 'test.html'
            }
        }, request, reply, utils);

        ngE['_factoryCacheMap'].set(NgEngineService, <any>{});

        // create all mocks
        const renderModuleFactoryStub = jest.spyOn<any, string>(ngE, '_renderModuleFactory')
            .mockReturnValueOnce(new Promise((resolve) => resolve('<h1>Hello Angular</h1>')));
        const fsStub = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(Buffer.from(''));

        ngE.universal().subscribe(_ => {
            expect(_.value).toBe('<h1>Hello Angular</h1>');

            // renderModuleFactoryStub should have been called only 1 time
            expect(renderModuleFactoryStub).toHaveBeenCalledTimes(1);

            // fsStub should have been called only 1 time
            expect(fsStub).toHaveBeenCalledTimes(1);

            // restore mocks
            renderModuleFactoryStub.mockRestore();
            fsStub.mockRestore();

            done();
        });
    });

    /**
     * Test if `NgEngineService.universal()` function returns success with static content
     */
    test('- `NgEngineService.universal()` success execution with static content', (done) => {
        const ngE = new NgEngineService({
            bootstrap: <any>{}, lazyModuleMap: {}, staticContent: {
                rootPath: './root/path',
                indexFile: 'test.html'
            }
        }, request, reply, utils);

        const fsStub = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(Buffer.from(''));
        const mimosStub = jest.spyOn<any, string>(ngE['_mimos'], 'path').mockReturnValue({ type: 'plain/text' });

        ngE.universal().subscribe(_ => {
            expect(_.value.toString()).toBe('');

            // fsStub should have been called only 1 time
            expect(fsStub).toHaveBeenCalledTimes(1);

            // mimosStub should have been called only 1 time
            expect(mimosStub).toHaveBeenCalledTimes(1);

            // restore mocks
            fsStub.mockRestore();
            mimosStub.mockRestore();

            done();
        });
    });
})
;
