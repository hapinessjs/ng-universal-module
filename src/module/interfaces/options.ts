import { NgModuleFactory, StaticProvider, Type } from '@angular/core';
import { ɵa } from '@nguniversal/module-map-ngfactory-loader';

/**
 * These are the allowed options for the module
 */
export interface NgSetupOptions {
    bootstrap: Type<{}> | NgModuleFactory<{}>;
    lazyModuleMap: ɵa;
    staticContent: StaticContent;
    providers?: StaticProvider[];
}

export interface StaticContent {
    indexFile: string;
    rootPath: string
}
