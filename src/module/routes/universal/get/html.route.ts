import { OnGet, Request, Route, ReplyNoContinue } from '@hapiness/core';
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
    constructor(private _ngEngineService: NgEngineService) {}

    /**
     * OnGet implementation
     *
     * @param {Request} request
     * @param {ReplyNoContinue} reply
     *
     * @returns {Observable<any | HTTPHandlerResponse>}
     */
    onGet(request: Request, reply: ReplyNoContinue) {
        this._ngEngineService.universal(request, reply).subscribe(_ => {
            if (!!request && !!request['universal_redirect']) {
                reply.redirect(request['universal_redirect']);
            } else {
                const repl = reply(_.response).code(
                    this.isValid(_.response) ? _.statusCode : 204
                );
                repl.headers = Object.assign(_.headers, repl.headers);
            }
        });
    }

    /**
     * Check of response is not empty
     *
     * @param  {any} response
     * @returns boolean
     */
    private isValid(response: any): boolean {
        return typeof response !== 'undefined' && response !== null;
    }
}
