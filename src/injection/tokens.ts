import { InjectionToken } from '@angular/core';
import { Request } from '@hapiness/core';
import { Response } from 'hapi';

export const REQUEST = new InjectionToken<Request>('request');
export const RESPONSE = new InjectionToken<Response>('response');
