import { Inject, Injectable, Request } from '@hapiness/core';
import { Compiler, CompilerFactory, NgModuleFactory, Provider, Type } from '@angular/core';
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
                    { provide: ResourceLoader, useClass: FileLoader }
                ]
            }
        ]);
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
            .flatMap(_ => !!_.raw.req.url ?
                Observable.of(_.raw.req.url) :
                Observable.throw(new Error('url is undefined'))
            )
            .flatMap(filePath =>
                Observable
                    .of(this._config)
                    .flatMap(_ => !!_.bootstrap ?
                        Observable.of({
                            bootstrap: _.bootstrap,
                            providers: _.providers || [],
                            lazyModuleMap: _.lazyModuleMap
                        }) :
                        Observable.throw(new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped'))
                    )
                    .map(_ => ({
                        moduleOrFactory: _.bootstrap,
                        extraProviders: this._extraProviders(_.providers, _.lazyModuleMap, request, filePath)
                    }))
            )
            .flatMap(_ =>
                this._getFactory(_.moduleOrFactory)
                    .flatMap(factory => Observable.fromPromise(renderModuleFactory(factory, { extraProviders: _.extraProviders })))
            );
    }

    /**
     * Builds extra providers
     *
     * @param {Provider[]} providers
     * @param {ModuleMap} lazyModuleMap
     * @param {Request} request
     * @param {string} filePath
     *
     * @return {Provider[]}
     *
     * @private
     */
    private _extraProviders(providers: Provider[], lazyModuleMap: ModuleMap, request: Request, filePath: string): Provider[] {
        return providers!.concat(
            providers!,
            lazyModuleMap ? provideModuleMap(lazyModuleMap) : [],
            this._getRequestProviders(request),
            [
                {
                    provide: INITIAL_CONFIG,
                    useValue: {
                        document: this._getDocument(filePath),
                        url: filePath
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
     * @return {Provider[]}
     *
     * @private
     */
    private _getRequestProviders(request: Request): Provider[] {
        return <Provider[]> [
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
