import { Compiler, CompilerFactory, NgModuleFactory, StaticProvider, Type } from '@angular/core';
import { INITIAL_CONFIG, platformDynamicServer, renderModuleFactory } from '@angular/platform-server';
import { ResourceLoader } from '@angular/compiler';
import {
    provideModuleMap,
    ɵnguniversal_modules_module_map_ngfactory_loader_module_map_ngfactory_loader_a as ModuleMap
} from '@nguniversal/module-map-ngfactory-loader';

import { from, merge, Observable, of, throwError } from 'rxjs';
import { filter, flatMap, map, tap, toArray } from 'rxjs/operators';

import * as fs from 'fs';
import { join } from 'path';
import * as Mimos from '@hapi/mimos';

import { NG_UNIVERSAL_MODULE_CONFIG, NgSetupOptions, StaticContent } from '../../interfaces';
import { REPLY, REQUEST, UTILS } from '../../../injection';
import { Inject, Service } from '@hapiness/core';

import { HttpResponse, HttpServerRequest } from '@hapiness/core/httpserver';
import { HttpServerReply } from '../reply';
import { HttpUtils } from '../utils';

@Service()
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
    private readonly _renderModuleFactory: <T>(moduleFactory: NgModuleFactory<T>, options: {
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
    private readonly _provideModuleMap: (moduleMap: ModuleMap) => StaticProvider;
    /**
     * Store mimos instance to stub it in tests
     */
    private _mimos: Mimos;

    /**
     * Service constructor
     *
     * @param {NgSetupOptions} _config
     * @param {HttpServerRequest} _request
     * @param {HttpServerReply} _reply helper to modify the response
     * @param {HttpUtils} _utils helper to manage data in request/response like cookies
     */
    constructor(@Inject(NG_UNIVERSAL_MODULE_CONFIG) private _config: NgSetupOptions,
                private _request: HttpServerRequest,
                private _reply: HttpServerReply,
                private _utils: HttpUtils) {
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
        this._mimos = new Mimos();
    }

    /**
     * Returns universal rendering of HTML
     *
     * @return {Observable<HttpResponse<any>>}
     */
    universal(): Observable<HttpResponse<any>> {
        return merge(
            this._checkRequest(),
            this._checkConfig()
        )
            .pipe(
                toArray(),
                map(_ =>
                    ({
                        config: <NgSetupOptions>_.pop()
                    })
                ),
                map(_ => Object.assign(_, { mime: this._mimos.path(this._request.raw.url).type })),
                flatMap(_ =>
                    merge(
                        this._getStaticContent(_),
                        this._getFactoryContent(_)
                    )
                )
            );
    }

    /**
     * Returns HttpResponse<any> from static content
     *
     * @param _
     *
     * @returns {Observable<HttpResponse<any>>}
     *
     * @private
     */
    private _getStaticContent(_: any): Observable<HttpResponse<any>> {
        return of(_)
            .pipe(
                filter(__ => !!__.mime),
                map(__ =>
                    ({
                        value: this._getDocument(this._buildFilePath(__.config.staticContent, __.mime, this._request.raw.url)),
                        headers: {
                            'content-type': __.mime
                        }
                    })
                )
            );
    }

    /**
     * Returns content from NgFactoryModule
     *
     * @param _
     *
     * @returns {Observable<HttpResponse<any>>}
     *
     * @private
     */
    private _getFactoryContent(_: any): Observable<HttpResponse<any>> {
        return of(_)
            .pipe(
                filter(__ => !__.mime),
                map(__ =>
                    ({
                        moduleOrFactory: __.config.bootstrap,
                        extraProviders: this._extraProviders(
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
                                from(this._renderModuleFactory(factory, { extraProviders: __.extraProviders }))
                            ),
                            map(html =>
                                ({
                                    value: html,
                                    headers: {
                                        'content-type': 'text/html'
                                    }
                                })
                            )
                        )
                )
            );
    }

    /**
     * Function to check request parameter
     *
     * @returns {Observable<true>}
     *
     * @private
     */
    private _checkRequest(): Observable<boolean> {
        return of(this._request)
            .pipe(
                flatMap(_ => (!!_ && !!_.raw && _.raw.url !== undefined) ?
                    of(true) :
                    throwError(new Error('url is undefined'))
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
                    throwError(new Error('You must pass in config a NgModule or NgModuleFactory to be bootstrapped'))
                ),
                flatMap(_ => (!!_ && !!_.lazyModuleMap) ?
                    of(_) :
                    throwError(new Error('You must pass in config lazy module map'))
                ),
                flatMap(_ => (!!_ && !!_.staticContent) ?
                    of(_) :
                    throwError(new Error('You must pass in config the static content object'))
                ),
                flatMap(_ => (!!_ && !!_.staticContent.indexFile) ?
                    of(_) :
                    throwError(new Error('You must pass in config the static content object with index file'))
                ),
                flatMap(_ => (!!_ && !!_.staticContent.rootPath) ?
                    of(_) :
                    throwError(new Error('You must pass in config the static content object with root path'))
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
     * @param {StaticProvider[]} providers
     * @param {ModuleMap} lazyModuleMap
     * @param {string} filePath
     *
     * @return {Provider[]}
     *
     * @private
     */
    private _extraProviders(providers: StaticProvider[],
                            lazyModuleMap: ModuleMap, filePath: string): StaticProvider[] {
        return providers!.concat(
            providers!,
            this._provideModuleMap(lazyModuleMap),
            this._getAdditionalProviders(),
            [
                {
                    provide: INITIAL_CONFIG,
                    useValue: {
                        document: this._getDocument(filePath).toString(),
                        url: this._request.raw.url
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
        return <Observable<NgModuleFactory<{}>>>of(
            of(moduleOrFactory)
        )
            .pipe(
                flatMap(obs =>
                    merge(
                        obs
                            .pipe(
                                filter(_ => _ instanceof NgModuleFactory)
                            ),
                        obs
                            .pipe(
                                filter(_ => !(_ instanceof NgModuleFactory)),
                                map((_: Type<{}>) => this._factoryCacheMap.get(_)),
                                flatMap(_ => !!_ ? of(_) : this._compile(<Type<{}>>moduleOrFactory))
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
        return <Observable<NgModuleFactory<{}>>>from(this._compiler.compileModuleAsync(module))
            .pipe(
                tap(_ => this._factoryCacheMap.set(module, _))
            );
    }

    /**
     * Get providers of the request and response
     *
     * @return {StaticProvider[]}
     *
     * @private
     */
    private _getAdditionalProviders(): StaticProvider[] {
        return <StaticProvider[]>[
            {
                provide: REQUEST,
                useValue: this._request
            },
            {
                provide: REPLY,
                useValue: this._reply
            },
            {
                provide: UTILS,
                useValue: this._utils
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
