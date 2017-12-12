import { OnGet, Request, Route, HTTPHandlerResponse } from '@hapiness/core';
import { NgEngineService } from '../../../services';
import { Observable } from 'rxjs/Observable';
import { ReplyNoContinue } from 'hapi';

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
     * @returns {Observable<any | HTTPHandlerResponse>}
     */
    onGet(request: Request, reply: ReplyNoContinue): Observable<any | HTTPHandlerResponse> {
        return this._ngEngineService.universal(request, reply);
    }
}
