import { CoreModuleWithProviders, Module } from '@hapiness/core';
import { HttpServerReply, HttpUtils, NgEngineService } from './services';
import { HtmlUniversalRoute } from './routes';
import { NG_UNIVERSAL_MODULE_CONFIG, NgSetupOptions } from './interfaces';

@Module({
    version: '8.0.0-alpha.1',
    components: [
        HtmlUniversalRoute
    ],
    providers: [
        NgEngineService,
        HttpUtils,
        HttpServerReply
    ],
    prefix: false
})
export class NgUniversalModule {
    static setConfig(config: NgSetupOptions): CoreModuleWithProviders {
        return {
            module: NgUniversalModule,
            providers: [{ provide: NG_UNIVERSAL_MODULE_CONFIG, useValue: config }]
        };
    }
}
