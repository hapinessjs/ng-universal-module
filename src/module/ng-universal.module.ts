import { CoreModuleWithProviders, HapinessModule, HttpServerService } from '@hapiness/core';
import { NgEngineService } from './services';
import { GetHtmlUniversalRoute } from './routes';
import { NG_UNIVERSAL_MODULE_CONFIG, NgSetupOptions } from './interfaces';

@HapinessModule({
    version: '6.0.0',
    declarations: [
        GetHtmlUniversalRoute
    ],
    providers: [
        NgEngineService,
        HttpServerService
    ]
})
export class NgUniversalModule {
    static setConfig(config: NgSetupOptions): CoreModuleWithProviders {
        return {
            module: NgUniversalModule,
            providers: [{ provide: NG_UNIVERSAL_MODULE_CONFIG, useValue: config }]
        };
    }
}
