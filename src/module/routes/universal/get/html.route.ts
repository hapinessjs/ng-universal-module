import { OnGet, Request, Route } from '@hapiness/core';
import { Observable } from 'rxjs/Observable';
import { NgEngineService } from '../../../services';

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
     * @return {Observable<any>}
     */
    onGet(request: Request): Observable<any> {
        return this._ngEngineService.universal(request);
    }
}
