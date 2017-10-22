import { Inject, Injectable, Request } from '@hapiness/core';
import { Compiler, CompilerFactory, NgModuleFactory, StaticProvider, Type } from '@angular/core';
import { INITIAL_CONFIG, platformDynamicServer, renderModuleFactory } from '@angular/platform-server';
import { ResourceLoader } from '@angular/compiler';
import { ModuleMap, provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';

import * as fs from 'fs';

import { NG_UNIVERSAL_MODULE_CONFIG, REQUEST, RESPONSE, NgSetupOptions } from '../../interfaces';

interface ModuleOrFactoryAndProviders {
    moduleOrFactory: Type<{}> | NgModuleFactory<{}>;
    extraProviders: StaticProvider[];
}

@Injectable()
export class NgEngineService {
    /**
     * This holds a cached version of each index used.
     */
    private _templateCache: { [key: string]: string };
    /**
     * Map of Module Factories
     */
    private _factoryCacheMap: Map<Type<{}>, NgModuleFactory<{}>>;
    /**
     * Angular compiler factory
     */
    private _compilerFactory: CompilerFactory;
    /**
     * Angular compiler instance
     */
    private _compiler: Compiler;
    /**
     * Renders a {@link NgModuleFactory} to string.
     *
     * `document` is the full document HTML of the page to render, as a string.
     * `url` is the URL for the current render request.
     * `extraProviders` are the platform level providers for the current render request.
     *
     * store original function to stub it in tests
     */
    private _renderModuleFactory: <T>(moduleFactory: NgModuleFactory<T>, options: {
        document?: string;
        url?: string;
        extraProviders?: StaticProvider[];
    }) => Promise<string>;
    /**
     * Helper function for getting the providers object for the MODULE_MAP
     *
     * @param {ModuleMap} moduleMap Map to use as a value for MODULE_MAP
     *
     * store original function to stub it in tests
     */
    private _provideModuleMap: (moduleMap: ModuleMap) => StaticProvider;

    /**
     * Service constructor
     *
     * @param {NgSetupOptions} _config
     */
    constructor(@Inject(NG_UNIVERSAL_MODULE_CONFIG) private _config: NgSetupOptions) {
        this._templateCache = {};
        this._factoryCacheMap = new Map<Type<{}>, NgModuleFactory<{}>>();

        this._compilerFactory = platformDynamicServer().injector.get(CompilerFactory);

        this._compiler = this._compilerFactory.createCompiler([
            {
                providers: [
                    { provide: ResourceLoader, useClass: FileLoader, deps: [] }
                ]
            }
        ]);

        this._renderModuleFactory = renderModuleFactory;
        this._provideModuleMap = provideModuleMap;
    }

    /**
     * Returns universal rendering of HTML
     *
     * @param {Request} request initial request
     *
     * @return {Observable<string>}
     */
    universal(request: Request): Observable<string> {
        return Observable
            .of(request)
            .flatMap(_ => (!!_ && !!_.raw && !!_.raw.req && _.raw.req.url !== undefined) ?
                this._getModuleOrFactoryAndProviders(_) :
                Observable.throw(new Error('url is undefined'))
            )
            .flatMap(_ =>
                this._getFactory(_.moduleOrFactory)
                    .flatMap(factory => Observable.fromPromise(this._renderModuleFactory(factory, { extraProviders: _.extraProviders })))
            );
    }

    /**
     * Returns module or factory bootstraped and extra providers
     *
     * @param {Request} request current request
     *
     * @returns {Observable<ModuleOrFactoryAndProviders>}
     *
     * @private
     */
    private _getModuleOrFactoryAndProviders(request: Request): Observable<ModuleOrFactoryAndProviders> {
            return this._checkConfig()
            .map(_ => ({
                moduleOrFactory: _.bootstrap,
                extraProviders: this._extraProviders(request, _.providers, _.lazyModuleMap, _.indexFilePath)
            }));
    }

    /**
     * Function to check module config
     *
     * @returns {Observable<NgSetupOptions>}
     *
     * @private
     */
    private _checkConfig(): Observable<NgSetupOptions> {
        return Observable
            .of(this._config)
            .flatMap(_ => (!!_ && !!_.bootstrap) ?
                Observable.of({
                    bootstrap: _.bootstrap,
                    lazyModuleMap: _.lazyModuleMap,
                    indexFilePath: _.indexFilePath,
                    providers: _.providers || []
                }) :
                Observable.throw(new Error('You must pass in config a NgModule or NgModuleFactory to be bootstrapped'))
            )
            .flatMap(_ => (!!_ && !!_.lazyModuleMap) ?
                Observable.of({
                    bootstrap: _.bootstrap,
                    lazyModuleMap: _.lazyModuleMap,
                    indexFilePath: _.indexFilePath,
                    providers: _.providers
                }) :
                Observable.throw(new Error('You must pass in config lazy module map'))
            )
            .flatMap(_ => (!!_ && !!_.indexFilePath) ?
                Observable.of({
                    bootstrap: _.bootstrap,
                    lazyModuleMap: _.lazyModuleMap,
                    indexFilePath: _.indexFilePath,
                    providers: _.providers
                }) :
                Observable.throw(new Error('You must pass in config the path of index.html'))
            );
    }

    /**
     * Builds extra providers
     *
     * @param {Request} request
     * @param {StaticProvider[]} providers
     * @param {ModuleMap} lazyModuleMap
     * @param {string} filePath
     *
     * @return {Provider[]}
     *
     * @private
     */
    private _extraProviders(request: Request, providers: StaticProvider[], lazyModuleMap: ModuleMap, filePath: string): StaticProvider[] {
        return providers!.concat(
            providers!,
            this._provideModuleMap(lazyModuleMap),
            this._getRequestProviders(request),
            [
                {
                    provide: INITIAL_CONFIG,
                    useValue: {
                        document: this._getDocument(filePath),
                        url: request.raw.req.url
                    }
                }
            ]
        );
    }

    /**
     * Get a factory from a bootstrapped module / module factory
     *
     * @param {Type<{}> | NgModuleFactory<{}>} moduleOrFactory
     *
     * @return {Observable<NgModuleFactory<{}>>}
     *
     * @private
     */
    private _getFactory(moduleOrFactory: Type<{}> | NgModuleFactory<{}>): Observable<NgModuleFactory<{}>> {
        return <Observable<NgModuleFactory<{}>>> Observable.merge(
            Observable
                .of(moduleOrFactory)
                .filter(_ => _ instanceof NgModuleFactory),
            Observable
                .of(moduleOrFactory)
                .filter(_ => !(_ instanceof NgModuleFactory))
                .map((_: Type<{}>) => this._factoryCacheMap.get(_))
                .flatMap(_ => !!_ ? Observable.of(_) : this._compile(<Type<{}>> moduleOrFactory))
        )
    }

    /**
     * Compile the module and cache it
     *
     * @param {Type<{}>} module to compile and cache
     *
     * @return {Observable<NgModuleFactory<{}>>}
     *
     * @private
     */
    private _compile(module: Type<{}>): Observable<NgModuleFactory<{}>> {
        return <Observable<NgModuleFactory<{}>>> Observable
            .fromPromise(this._compiler.compileModuleAsync(module))
            .do(_ => this._factoryCacheMap.set(module, _));
    }

    /**
     * Get providers of the request and response
     *
     * @param {Request} request current request
     *
     * @return {StaticProvider[]}
     *
     * @private
     */
    private _getRequestProviders(request: Request): StaticProvider[] {
        return <StaticProvider[]> [
            {
                provide: REQUEST,
                useValue: request
            },
            {
                provide: RESPONSE,
                useValue: request.raw.res
            }
        ];
    }

    /**
     * Returns document from cache or file system
     *
     * @param {string} filePath path to the file
     *
     * @return {string}
     *
     * @private
     */
    private _getDocument(filePath: string): string {
        return this._templateCache[filePath] = this._templateCache[filePath] || fs.readFileSync(filePath).toString();
    }
}

/**
 * FileLoader implementation
 */
class FileLoader implements ResourceLoader {
    /* istanbul ignore next */
    get(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(url, (err: NodeJS.ErrnoException, buffer: Buffer) => {
                if (err) {
                    return reject(err);
                }

                resolve(buffer.toString());
            });
        });
    }
}
