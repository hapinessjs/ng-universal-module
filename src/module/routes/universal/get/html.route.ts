import { OnGet, Request, Route, ReplyNoContinue, HTTPHandlerResponse } from '@hapiness/core';
import { NgEngineService } from '../../../services';
import { Response } from 'hapi';
import { Observable, of, merge } from 'rxjs';
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
        this._ngEngineService.universal(request, reply).pipe(
            flatMap(_ => this._replyResponse(request, reply, _))
        ).subscribe();
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
    private _replyResponse(request: Request, reply: ReplyNoContinue, response: any | HTTPHandlerResponse): Observable<string> {
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
                            map(__ => response),
                            map(__ => this._formatResponse(__)),
                            map(__ => of({ redirect: false, data: __ }))
                        )
                    )
                ),
                flatMap(obs =>
                    merge(
                        obs.pipe(
                            filter(__ => !!__ && !!__.redirect),
                            tap(__ => reply.redirect(__.data)),
                            map(__ => 'Handle 302 redirect')
                        ),
                        obs.pipe(
                            filter(__ => !!__ && !__.redirect),
                            tap(__ => {
                                const rep: Response = reply(__.data.response);
                                if (!!rep) {
                                    rep.code(this._isValid(__.data.response) ? __.data.statusCode : 204);
                                    rep.headers = Object.assign(__.data.headers, rep.headers);
                                }
                            }),
                            map(__ => 'Handle Angular response')
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
