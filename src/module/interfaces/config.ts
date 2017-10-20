import { InjectionToken } from '@hapiness/core';
import { NgSetupOptions } from './options';

export const NG_UNIVERSAL_MODULE_CONFIG = new InjectionToken<NgSetupOptions>('ng_universal_module_config');
