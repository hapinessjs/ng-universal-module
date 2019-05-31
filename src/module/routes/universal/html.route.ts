import { HttpServerReply, NgEngineService } from '../../services';
import { merge, Observable, of } from 'rxjs';
import { filter, flatMap, map } from 'rxjs/operators';
import { Get, HttpResponse, Route } from '@hapiness/core/httpserver';


@Route({
    path: '*'
})
export class HtmlUniversalRoute {
    /**
     * Class constructor
     *
     * @param {NgEngineService} _ngEngineService
     * @param {HttpServerReply} _reply
     */
    constructor(private _ngEngineService: NgEngineService,
                private _reply: HttpServerReply) {
    }

    /**
     * Get implementation
     *
     * @returns {Observable<HttpResponse<any>>}
     */
    @Get()
    onGet(): Observable<HttpResponse<any>> {
        return this._ngEngineService.universal()
            .pipe(
                flatMap((resp: HttpResponse<any>) =>
                    of(
                        of(
                            this._reply.willRedirect
                        )
                    )
                        .pipe(
                            flatMap((obsWillRedirect: Observable<boolean>) =>
                                merge(
                                    obsWillRedirect
                                        .pipe(
                                            filter((redirect: boolean) => !!redirect),
                                            map(() => this._createResponse())
                                        ),
                                    obsWillRedirect
                                        .pipe(
                                            filter((redirect: boolean) => !redirect),
                                            map(() => this._formatResponse(resp)),
                                            map((_: HttpResponse<any>) => ({
                                                ..._,
                                                statusCode: this._isValid(_.value) ? _.statusCode : 204
                                            })),
                                            map((_: HttpResponse<any>) => this._createResponse(_))
                                        )
                                )
                            )
                        )
                )
            );
    }

    /**
     * Format response to HttpResponse object
     *
     * @param  {any} data
     *
     * @returns HttpResponse
     */
    private _formatResponse(data: HttpResponse<any>): HttpResponse<any> {
        return {
            statusCode: !!data ? data.statusCode || 200 : 204,
            headers: !!data ? data.headers || {} : {},
            value: !!data ? data.value : null
        };
    }

    /**
     * Check if response is not empty
     *
     * @param  {any} response
     *
     * @returns boolean
     */
    private _isValid(response: any): boolean {
        return typeof response !== 'undefined' && response !== null;
    }

    /**
     * Apply new headers or create redirection
     *
     * @param {HttpResponse<any>} response initial response
     *
     * @returns {HttpResponse<any>} new response
     *
     * @private
     */
    private _createResponse(response: HttpResponse<any> = { value: null, headers: {} }): HttpResponse<any> {
        if (this._reply.willRedirect) {
            return {
                redirect: this._reply.willRedirect,
                value: this._reply.redirectUrl,
                headers: this._reply.headers
            };
        }
        return {
            ...response,
            headers: {
                ...response.headers, ...this._reply.headers
            }
        };
    }
}
