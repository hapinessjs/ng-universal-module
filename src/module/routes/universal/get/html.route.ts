import { OnGet, Request, Route } from '@hapiness/core';
import { HapinessHTTPHandlerResponse } from '@hapiness/core/extensions/http-server';
import { NgEngineService } from '../../../services';
import { Observable } from 'rxjs/Observable';

@Route({
    path: '/{path*}',
    method: 'GET'
})
export class GetHtmlUniversalRoute implements OnGet {
    /**
     * Class constructor
     *
     * @param {NgEngineService} _ngEngineService
     */
    constructor(private _ngEngineService: NgEngineService) {
    }

    /**
     * OnGet implementation
     *
     * @param {Request} request
     *
     * @returns {Observable<any | HapinessHTTPHandlerResponse>}
     */
    onGet(request: Request): Observable<any | HapinessHTTPHandlerResponse> {
        return this._ngEngineService.universal(request);
    }
}
