import {OnGet, Request, Route, ReplyNoContinue, HTTPHandlerResponse} from '@hapiness/core';
import {NgEngineService} from '../../../services';
import {Response} from 'hapi';
import {of} from 'rxjs/observable/of';
import {mergeStatic} from 'rxjs/operators/merge';
import {filter, flatMap, map} from 'rxjs/operators';


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
     *
     * @returns {Observable<any | HTTPHandlerResponse>}
     */
    onGet(request: Request, reply: ReplyNoContinue) {
        this._ngEngineService.universal(request, reply).subscribe(_ => {
            this.replyResponse(request, reply, _);
        });
    }


    /**
     * Function which send the response to the browser
     *  2 cases :
     *   > If the request has a property 'universal_redirect', the server will send a 302 request (redirect)
     *   > If not the sever will send the response create from the application
     * @param {Request} request
     * @param {ReplyNoContinue} reply
     * @param {any | HTTPHandlerResponse} response
     */
    replyResponse(request: Request, reply: ReplyNoContinue, response: any | HTTPHandlerResponse) {
        of(of(request))
            .pipe(
                flatMap(obs => {
                    return mergeStatic(
                        obs.pipe(
                            filter(__ => !!__ && !!__['universal_redirect']),
                            map(__ => ({redirect: true, data: __['universal_redirect']}))
                        ),
                        obs.pipe(
                            filter(__ => !!__ && !__['universal_redirect']),
                            map(__ => response),
                            map(__ => this.formatResponse(__)),
                            map(__ => ({redirect: false, data: __}))
                        )
                    )
                })
            ).subscribe((_: { redirect: boolean, data: any | HTTPHandlerResponse }) => {
            if (_.redirect) {
                reply.redirect(_.data);
            } else {
                let repl: Response = reply(_.data.response).code(this.isValid(_.data.response) ? _.data.statusCode : 204);
                repl.headers = Object.assign(_.data.headers, repl.headers);
            }
        });

    }

    /**
     * Format response to HTTPHandlerResponse object
     *
     * @param  {any} data
     * @returns HTTPHandlerResponse
     */
    private formatResponse(data: any): HTTPHandlerResponse {
        return {
            statusCode: !!data ? data.statusCode || 200 : 204,
            headers: !!data ? data.headers || {} : {},
            response: !!data ? data.response || data : data
        };
    }

    /**
     * Check if response is not empty
     *
     * @param  {any} response
     * @returns boolean
     */
    private isValid(response: any): boolean {
        return typeof response !== 'undefined' && response !== null;
    }
}
