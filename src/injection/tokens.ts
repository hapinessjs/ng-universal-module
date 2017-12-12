import { InjectionToken } from '@angular/core';
import { Request , ReplyNoContinue} from '@hapiness/core';

export const REQUEST = new InjectionToken<Request>('request');
export const RESPONSE = new InjectionToken<ReplyNoContinue>('response');
