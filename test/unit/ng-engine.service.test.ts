import { NgEngineService } from '../../src/module/services/engine';
import { Observable } from 'rxjs';
import * as fs from 'fs';
import { Buffer } from 'buffer';

const request: any = { raw: { req: { url: '' }, res: {} } };
const reply: any = {};
const server: any = { instance: () => ({ mime: { path: (p: string) => ({ type: '' }) } }) };

// jest.mock('fs');

describe('- Unit ng-engine.service.test.ts file', () => {
    /**
     * Test if `NgEngineService` as a `universal` function
     */
    test('- `NgEngineService` must have `universal` function',
        () => expect(typeof new NgEngineService(null, null).universal).toBe('function'));

    /**
     * Test if `NgEngineService.universal()` function returns an Observable
     */
    test('- `NgEngineService.universal()` function must return an Observable', () => {
        expect(new NgEngineService(null, null).universal(null, null)).toBeInstanceOf(Observable);
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if parameter is wrong
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if parameter is wrong', () => {
        new NgEngineService(null, null).universal(null, null).subscribe(undefined, e => expect(e.message).toBe('url is undefined'));
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing bootstrap in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing bootstrap in config', () => {
        new NgEngineService(null, null).universal(request, reply)
            .subscribe(undefined, e => expect(e.message).toBe('You must pass in config a NgModule or NgModuleFactory to be bootstrapped'));
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing lazyModuleMap in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing lazyModuleMap in config', () => {
        const ngE = new NgEngineService({
            bootstrap: <any> {},
            lazyModuleMap: null,
            staticContent: null
        }, null);

        ngE.universal(request, reply).subscribe(undefined, e => expect(e.message).toBe('You must pass in config lazy module map'));
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing staticContent in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing staticContent in config', () => {
        const ngE = new NgEngineService({ bootstrap: <any> {}, lazyModuleMap: {}, staticContent: null }, null);
        ngE.universal(request, reply)
            .subscribe(undefined, e => expect(e.message).toBe('You must pass in config the static content object'));
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing staticContent indexFile in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing staticContent indexFile in config', () => {
        const ngE = new NgEngineService({
            bootstrap: <any> {},
            lazyModuleMap: {},
            staticContent: { indexFile: null, rootPath: '' }
        }, null);

        ngE.universal(request, reply)
            .subscribe(undefined, e => expect(e.message).toBe('You must pass in config the static content object with index file'));
    });

    /**
     * Test if `NgEngineService.universal()` function returns an Observable Error if missing staticContent rootPath in config
     */
    test('- `NgEngineService.universal()` function must return an Observable Error if missing staticContent rootPath in config', () => {
        const ngE = new NgEngineService({
            bootstrap: <any> {},
            lazyModuleMap: {},
            staticContent: { indexFile: '/', rootPath: '' }
        }, null);

        ngE.universal(request, reply)
            .subscribe(undefined, e => expect(e.message).toBe('You must pass in config the static content object with root path'));
    });

    /**
     * Test if `NgEngineService.universal()` function returns success with compiler
     */
    test('- `NgEngineService.universal()` success execution with compiler', () => {
        const ngE = new NgEngineService({
            bootstrap: <any> {}, lazyModuleMap: {}, staticContent: {
                rootPath: './root/path',
                indexFile: 'test.html'
            }
        }, server);

        // create all mocks
        const compilerStub = jest.spyOn(ngE['_compiler'], 'compileModuleAsync').mockReturnValueOnce(new Promise((resolve) => resolve({})));
        const renderModuleFactoryStub = jest.spyOn<any, keyof any>(ngE, '_renderModuleFactory')
            .mockReturnValueOnce(new Promise((resolve) => resolve('<h1>Hello Angular</h1>')));
        const fsStub = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(Buffer.from(''));

        ngE.universal(request, reply).subscribe(_ => {
            expect(_).toBe('<h1>Hello Angular</h1>');

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
        });
    });

    /**
     * Test if `NgEngineService.universal()` function returns success with cache
     */
    test('- `NgEngineService.universal()` success execution with cache', () => {
        const ngE = new NgEngineService({
            bootstrap: NgEngineService, lazyModuleMap: {}, staticContent: {
                rootPath: './root/path',
                indexFile: 'test.html'
            }
        }, server);

        ngE['_factoryCacheMap'].set(NgEngineService, <any> {});

        // create all mocks
        const renderModuleFactoryStub = jest.spyOn<any, keyof any>(ngE, '_renderModuleFactory')
            .mockReturnValueOnce(new Promise((resolve) => resolve('<h1>Hello Angular</h1>')));
        const fsStub = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(Buffer.from(''));

        ngE.universal(request, reply).subscribe(_ => {
            expect(_).toBe('<h1>Hello Angular</h1>');

            // renderModuleFactoryStub should have been called only 1 time
            expect(renderModuleFactoryStub).toHaveBeenCalledTimes(1);

            // fsStub should have been called only 1 time
            expect(fsStub).toHaveBeenCalledTimes(1);

            // restore mocks
            renderModuleFactoryStub.mockRestore();
            fsStub.mockRestore();
        });
    });

    /**
     * Test if `NgEngineService.universal()` function returns success with static content
     */
    test('- `NgEngineService.universal()` success execution with static content', () => {
        const ngE = new NgEngineService({
            bootstrap: <any> {}, lazyModuleMap: {}, staticContent: {
                rootPath: './root/path',
                indexFile: 'test.html'
            }
        }, <any> { instance: () => ({ mime: { path: (p: string) => ({ type: 'plain/text' }) } }) });

        const fsStub = jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(Buffer.from(''));

        ngE.universal(<any> { raw: { req: { url: '/' } } }, reply).subscribe(_ => {
            expect(_.response.toString()).toBe('');

            // fsStub should have been called only 1 time
            expect(fsStub).toHaveBeenCalledTimes(1);

            // restore mocks
            fsStub.mockRestore();
        });
    });
});
