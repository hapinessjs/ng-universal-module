import { OnGet, Request, Route, ReplyNoContinue } from '@hapiness/core';
import { NgEngineService, UniversalResult } from '../../../services';

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
     * @param {ReplyNoContinue} reply
     */
    onGet(request: Request, reply: ReplyNoContinue): void {
        this._ngEngineService.universal(request)
            .subscribe((_: UniversalResult) => !!_.mime ? reply(_.body).header('content-type', _.mime) : reply(_.body.toString()));
    }
}
