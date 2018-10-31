import { HTTPHandlerResponse, OnGet, ReplyNoContinue, Request, Route } from '@hapiness/core';
import { NgEngineService } from '../../../services';
import { Response } from 'hapi';
import { EMPTY, merge, Observable, of } from 'rxjs';
import { filter, flatMap, map, tap } from 'rxjs/operators';


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
        this._ngEngineService.universal(request, reply)
            .pipe(
                flatMap(_ => this._replyResponse(request, reply, _))
            )
            .subscribe();
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
    private _replyResponse(request: Request, reply: ReplyNoContinue, response: any | HTTPHandlerResponse): Observable<never> {
        return of(of(request))
            .pipe(
                flatMap(obs =>
                    merge(
                        obs.pipe(
                            filter(__ => !!__ && !!__['universal_redirect']),
                            map(__ => of({ redirect: true, data: __['universal_redirect'] }))
                        ),
                        obs.pipe(
                            filter(__ => !!__ && !__['universal_redirect']),
                            map(__ => of({ redirect: false, data: this._formatResponse(response) }))
                        )
                    )
                ),
                flatMap(obs =>
                    merge(
                        obs.pipe(
                            filter(__ => !!__ && !!__.redirect),
                            tap(__ => reply.redirect(__.data)),
                            flatMap(__ => EMPTY)
                        ),
                        obs.pipe(
                            filter(__ => !!__ && !__.redirect),
                            map(__ => __.data),
                            tap(__ => {
                                const rep: Response = reply(__.response);
                                if (!!rep) {
                                    rep.code(this._isValid(__.response) ? __.statusCode : 204);
                                    Object.assign(rep.headers, __.headers);
                                }
                            }),
                            flatMap(__ => EMPTY)
                        )
                    )
                )
            )
    }

    /**
     * Format response to HTTPHandlerResponse object
     *
     * @param  {any} data
     * @returns HTTPHandlerResponse
     */
    private _formatResponse(data: any): HTTPHandlerResponse {
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
    private _isValid(response: any): boolean {
        return typeof response !== 'undefined' && response !== null;
    }
}
