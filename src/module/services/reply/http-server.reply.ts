import { Service } from '@hapiness/core';

@Service()
export class HttpServerReply {
    // private property to store all additional headers
    private _headers: { [key: string]: string; };
    // private property to store redirect url
    private _redirectUrl: string;
    // private property to store redirection flag
    private _willRedirect: boolean;

    /**
     * Constructor
     */
    constructor() {
        this._headers = {};
        this._redirectUrl = '';
        this._willRedirect = false;
    }

    /**
     * Add new header to the original response
     *
     * @param {string} key the header's key
     * @param {string} value the header's value
     *
     * @returns {HttpServerReply} current instance
     */
    header(key: string, value: string): HttpServerReply {
        if (!!key && !!value) {
            this._headers = { ...this._headers, [key]: value };
        }
        return this;
    }

    /**
     * Returns all additional headers for current response
     */
    get headers(): { [key: string]: string; } {
        return this._headers;
    }

    /**
     * Set redirect url
     *
     * @param {string} url redirection
     *
     * @returns {HttpServerReply} current instance
     */
    redirect(url: string): HttpServerReply {
        if (!url || typeof url !== 'string') {
            throw new TypeError('argument url must be a string');
        }
        this._redirectUrl = url;
        this._willRedirect = true;
        return this;
    }

    /**
     * Returns redirect url value
     */
    get redirectUrl(): string {
        return this._redirectUrl;
    }

    /**
     * Returns flag to know if response will be a redirection
     */
    get willRedirect(): boolean {
        return this._willRedirect;
    }
}
