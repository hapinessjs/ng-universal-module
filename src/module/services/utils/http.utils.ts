import { Service } from '@hapiness/core';
import { parse, serialize } from 'cookie';

@Service()
export class HttpUtils {
    /**
     * Parse a cookie header.
     *
     * Parse the given cookie header string into an object
     * The object has the various cookies as keys(names) => values
     *
     * @param {string} str
     * @param {object} [options]
     *
     * @return {object}
     */
    parseCookie(str: string, options?: any) {
        return parse(str, options);
    }

    /**
     * Serialize data into a cookie header.
     *
     * Serialize the a name value pair into a cookie string suitable for
     * http headers. An optional options object specified cookie parameters.
     *
     * serialize('foo', 'bar', { httpOnly: true })
     *   => "foo=bar; httpOnly"
     *
     * @param {string} name
     * @param {string} value
     * @param {object} [options]
     *
     * @returns {string}
     */
    serializeCookie(name: string, value: string, options?: any) {
        return serialize(name, value, options);
    }
}
