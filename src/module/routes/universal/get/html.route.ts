import { OnGet, Request, Route, ReplyNoContinue } from '@hapiness/core';
import { NgEngineService } from '../../../services';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';

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
     * @return {Observable<any>}
     */
    onGet(request: Request, reply: ReplyNoContinue): void {
        this._ngEngineService.universal(request).flatMap(_ =>
            Observable
                .of({ body: _, mime: request.server.mime.path(request.raw.req.url).type })
        ).subscribe(_ => !! _.mime ? reply(_.body).header('content-type', _.mime) : reply(_.body));
    }
}
