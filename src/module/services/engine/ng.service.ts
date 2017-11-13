import { HttpServerService, Inject, Injectable, Request } from '@hapiness/core';
import { Compiler, CompilerFactory, NgModuleFactory, StaticProvider, Type } from '@angular/core';
import { INITIAL_CONFIG, platformDynamicServer, renderModuleFactory } from '@angular/platform-server';
import { ResourceLoader } from '@angular/compiler';
import { ModuleMap, provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

import { Observable } from 'rxjs/Observable';
import { toArray, filter, flatMap, map, tap } from 'rxjs/operators';
import { mergeStatic } from 'rxjs/operators/merge';
import { of } from 'rxjs/observable/of';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { _throw } from 'rxjs/observable/throw';

import * as fs from 'fs';
import { join } from 'path';
import { Buffer } from 'buffer';

import { NG_UNIVERSAL_MODULE_CONFIG, REQUEST, RESPONSE, NgSetupOptions, StaticContent } from '../../interfaces';

export interface UniversalResult {
    body: Buffer;
    mime?: string;
}

@Injectable()
export class NgEngineService {
    /**
     * This holds a cached version of each data used.
     */
    private _dataCache: { [key: string]: Buffer };
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
     * @param {HttpServerService} _httpServerService
     */
    constructor(@Inject(NG_UNIVERSAL_MODULE_CONFIG) private _config: NgSetupOptions, private _httpServerService: HttpServerService) {
        this._dataCache = {};
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
     * @return {Observable<UniversalResult>}
     */
    universal(request: Request): Observable<UniversalResult> {
        return mergeStatic(
            this._checkRequest(request),
            this._checkConfig()
        )
            .pipe(
                toArray(),
                map(_ =>
                    ({
                        request: <Request> _.shift(),
                        config: <NgSetupOptions> _.pop()
                    })
                ),
                map(_ => Object.assign(_, { mime: this._httpServerService.instance().mime.path(_.request.raw.req.url).type })),
                flatMap(_ => mergeStatic(
                    this._getStaticContent(_),
                    this._getFactoryContent(_)
                    )
                )
            );
    }

    /**
     * Returns UniversalResult from static content
     *
     * @param _
     *
     * @returns {Observable<UniversalResult>}
     *
     * @private
     */
    private _getStaticContent(_: any): Observable<UniversalResult> {
        return of(_)
            .pipe(
                filter(__ => !!__.mime),
                flatMap(__ =>
                    of({
                        body: this._getDocument(this._buildFilePath(__.config.staticContent, __.mime, __.request.raw.req.url)),
                        mime: __.mime
                    })
                )
            );
    }

    /**
     * Returns UniversalResult from NgFactoryModule
     *
     * @param _
     *
     * @returns {Observable<UniversalResult>}
     *
     * @private
     */
    private _getFactoryContent(_: any): Observable<UniversalResult> {
        return of(_)
            .pipe(
                filter(__ => !__.mime),
                map(__ =>
                    ({
                        moduleOrFactory: __.config.bootstrap,
                        extraProviders: this._extraProviders(
                            __.request,
                            __.config.providers,
                            __.config.lazyModuleMap,
                            this._buildFilePath(__.config.staticContent)
                        )
                    })
                ),
                flatMap(__ =>
                    this._getFactory(__.moduleOrFactory)
                        .pipe(
                            flatMap(factory =>
                                fromPromise(this._renderModuleFactory(factory, { extraProviders: __.extraProviders }))
                            ),
                            flatMap(content =>
                                of({
                                        body: Buffer.from(content)
                                    })
                            )
                        )
                )
            );
    }

    /**
     * Function to check request parameter
     *
     * @param {Request} request
     *
     * @returns {Observable<Request>}
     *
     * @private
     */
    private _checkRequest(request: Request): Observable<Request> {
        return of(request)
            .pipe(
                flatMap(_ => (!!_ && !!_.raw && !!_.raw.req && _.raw.req.url !== undefined) ?
                    of(_) :
                    _throw(new Error('url is undefined'))
                )
            );
    }

    /**
     * Function to check module config
     *
     * @returns {Observable<NgSetupOptions>}
     *
     * @private
     */
    private _checkConfig(): Observable<NgSetupOptions> {
        return of(this._config)
            .pipe(
                flatMap(_ => (!!_ && !!_.bootstrap) ?
                    of(_) :
                    _throw(new Error('You must pass in config a NgModule or NgModuleFactory to be bootstrapped'))
                ),
                flatMap(_ => (!!_ && !!_.lazyModuleMap) ?
                    of(_) :
                    _throw(new Error('You must pass in config lazy module map'))
                ),
                flatMap(_ => (!!_ && !!_.staticContent) ?
                    of(_) :
                    _throw(new Error('You must pass in config the static content object'))
                ),
                flatMap(_ => (!!_ && !!_.staticContent.indexFile) ?
                    of(_) :
                    _throw(new Error('You must pass in config the static content object with index file'))
                ),
                flatMap(_ => (!!_ && !!_.staticContent.rootPath) ?
                    of(_) :
                    _throw(new Error('You must pass in config the static content object with root path'))
                ),
                flatMap(_ => of({
                        bootstrap: _.bootstrap,
                        lazyModuleMap: _.lazyModuleMap,
                        staticContent: _.staticContent,
                        providers: _.providers || []
                    })
                )
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
                        document: this._getDocument(filePath).toString(),
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
        return <Observable<NgModuleFactory<{}>>> of(
            of(moduleOrFactory)
        )
            .pipe(
                flatMap(obs =>
                    mergeStatic(
                        obs
                            .pipe(
                                filter(_ => _ instanceof NgModuleFactory)
                            ),
                        obs
                            .pipe(
                                filter(_ => !(_ instanceof NgModuleFactory)),
                                map((_: Type<{}>) => this._factoryCacheMap.get(_)),
                                flatMap(_ => !!_ ? of(_) : this._compile(<Type<{}>> moduleOrFactory))
                            )
                    )
                )
            );
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
        return <Observable<NgModuleFactory<{}>>> fromPromise(this._compiler.compileModuleAsync(module))
            .pipe(
                tap(_ => this._factoryCacheMap.set(module, _))
            );
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
     * Returns document path
     *
     * @param {StaticContent} staticContent
     * @param {string} mime
     * @param {string} staticFileUrl
     *
     * @returns {string}
     *
     * @private
     */
    private _buildFilePath(staticContent: StaticContent, mime?: string, staticFileUrl?: string): string {
        return (!!mime && !!staticFileUrl) ?
            join(staticContent.rootPath, staticFileUrl) :
            join(staticContent.rootPath, staticContent.indexFile);
    }

    /**
     * Returns document from cache or file system
     *
     * @param {string} filePath path to the file
     *
     * @return {Buffer}
     *
     * @private
     */
    private _getDocument(filePath: string): Buffer {
        return this._dataCache[filePath] = this._dataCache[filePath] || fs.readFileSync(filePath);
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
