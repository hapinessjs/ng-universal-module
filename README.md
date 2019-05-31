<img src="http://bit.ly/2mxmKKI" width="500" alt="Hapiness" />

<div style="margin-bottom:20px;">
<div style="line-height:60px">
    <a href="https://travis-ci.org/hapinessjs/ng-universal-module.svg?branch=master">
        <img src="https://travis-ci.org/hapinessjs/ng-universal-module.svg?branch=master" alt="build" />
    </a>
    <a href="https://coveralls.io/github/hapinessjs/ng-universal-module?branch=master">
        <img src="https://coveralls.io/repos/github/hapinessjs/ng-universal-module/badge.svg?branch=master" alt="coveralls" />
    </a>
    <a href="https://david-dm.org/hapinessjs/ng-universal-module">
        <img src="https://david-dm.org/hapinessjs/ng-universal-module.svg" alt="dependencies" />
    </a>
    <a href="https://david-dm.org/hapinessjs/ng-universal-module?type=dev">
        <img src="https://david-dm.org/hapinessjs/ng-universal-module/dev-status.svg" alt="devDependencies" />
    </a>
</div>
<div>
    <a href="https://www.typescriptlang.org/docs/tutorial.html">
        <img src="https://cdn-images-1.medium.com/max/800/1*8lKzkDJVWuVbqumysxMRYw.png"
             align="right" alt="Typescript logo" width="50" height="50" style="border:none;" />
    </a>
    <a href="http://reactivex.io/rxjs">
        <img src="http://reactivex.io/assets/Rx_Logo_S.png"
             align="right" alt="ReactiveX logo" width="50" height="50" style="border:none;" />
    </a>
    <a href="https://www.fastify.io">
        <img src="https://www.fastify.io/images/fastify-logo-menu.d13f8da7a965c800.png"
             align="right" alt="Fastify logo" height="55" style="border:none;" />
    </a>
    <a href="https://www.angular.io">
            <img src="https://angular.io/assets/images/logos/angular/angular.svg"
                 align="right" alt="Angular logo" width="75" style="border:none; margin-top:-5px;" />
        </a>
</div>
</div>

# NG-Universal

This is a [Hapiness](https://github.com/hapinessjs/hapiness) Engine for running [Angular](https://www.angular.io) Apps on the server for server side rendering.

<hr />

# Integrating NG-Universal into existing CLI Applications

This story will show you how to set up Universal bundling for an existing `@angular/cli`.

We support actually `@angular` `@8.0.0` and next so you must upgrade all packages inside your project.

We use `yarn` as package manager.

## Table of contents

- [Install Dependencies](#install-dependencies)
- [Step 1: Prepare your App for Universal rendering](#step-1-prepare-your-app-for-universal-rendering)
    - [src/app/app.module.ts](#srcappappmodulets)
    - [src/app/app.server.module.ts](#srcappappservermodulets)
    - [src/main.ts](#srcmaints)
- [Step 2: Create a server "main" file and tsconfig to build it](#step-2-create-a-server-main-file-and-tsconfig-to-build-it)
    - [src/main.server.ts](#srcmainserverts)
    - [./tsconfig.server.json](#tsconfigserverjson)
- [Step 3: Create a new target in angular.json](#step-3-create-a-new-target-in-angularjson)
    - [angular.json](#angularjson)
    - [Building the bundle](#building-the-bundle)
- [Step 4: Setting up a Hapiness Application to run our Universal bundles](#step-4-setting-up-a-hapiness-application-to-run-our-universal-bundles)
    - [./server.ts (root project level)](#serverts-root-project-level)
    - [Extra Providers](#extra-providers)
    - [Using the Request, Reply and Utils](#using-the-requestreply-and-utils)
- [Step 5: Setup a webpack config to handle this Node server.ts file and serve your application!](#step-5-setup-a-webpack-config-to-handle-this-node-serverts-file-and-serve-your-application)
    - [./webpack.server.config.js (root project level)](#webpackserverconfigjs-root-project-level)
    - [Almost there](#almost-there)
- [Contributing](#contributing)
- [Change History](#change-history)
- [Maintainers](#maintainers)
- [License](#license)

<hr />

## Install Dependencies

Install `@angular/platform-server` into your project. Make sure you use the same version as the other `@angular` packages in your project.

Install [Hapiness](https://github.com/hapinessjs/hapiness) modules into your project: [`@hapiness/core`](https://github.com/hapinessjs/hapiness), [`@hapiness/ng-universal`](https://github.com/hapinessjs/ng-universal-module) and [`@hapiness/ng-universal-transfer-http`](https://github.com/hapinessjs/ng-universal-transfer-http).

> You also need :
> - `ts-loader` and `webpack`, `webpack-cli` for your webpack build we'll show later and it's only in `devDependencies`.
> - `@nguniversal/module-map-ngfactory-loader`, as it's used to handle lazy-loading in the context of a server-render. (by loading the chunks right away)


```bash
$ yarn add --dev ts-loader webpack webpack-cli
$ yarn add @angular/platform-server @nguniversal/module-map-ngfactory-loader @hapiness/core @hapiness/ng-universal @hapiness/ng-universal-transfer-http
```

## Step 1: Prepare your App for Universal rendering

The first thing you need to do is make your `AppModule` compatible with Universal by adding `.withServerTransition()` and an application ID to your `BrowserModule` import.

`TransferHttpCacheModule` installs a Http interceptor that avoids duplicate `HttpClient` requests on the client, for requests that were already made when the application was rendered on the server side.

When the module is installed in the application `NgModule`, it will intercept `HttpClient` requests on the server and store the response in the `TransferState` key-value store. This is transferred to the client, which then uses it to respond to the same `HttpClient` requests on the client.

To use the `TransferHttpCacheModule` just install it as part of the top-level App module.

### src/app/app.module.ts:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { TransferHttpCacheModule } from '@hapiness/ng-universal-transfer-http';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    // Add .withServerTransition() to support Universal rendering.
    // The application ID can be any identifier which is unique on
    // the page.
    BrowserModule.withServerTransition({ appId: 'ng-universal-example' }),
    // Add TransferHttpCacheModule to install a Http interceptor
    TransferHttpCacheModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```

Next, create a module specifically for your application when running on the server. It's recommended to call this module `AppServerModule`.

This example places it alongside `app.module.ts` in a file named `app.server.module.ts`:

### src/app/app.server.module.ts:

```typescript
import { NgModule } from '@angular/core';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    // The AppServerModule should import your AppModule followed
    // by the ServerModule from @angular/platform-server.
    AppModule,
    ServerModule,
    ModuleMapLoaderModule,
    ServerTransferStateModule
  ],
  // Since the bootstrapped component is not inherited from your
  // imported AppModule, it needs to be repeated here.
  bootstrap: [AppComponent]
})
export class AppServerModule {
}
```

Then, you must set an event on `DOMContentLoaded` to be sure `TransferState` will be passed between `server` and `client`.

### src/main.ts:

```typescript
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
});
```

[back to top](#table-of-contents)

<hr />

## Step 2: Create a server "main" file and tsconfig to build it

Create a main file for your Universal bundle. This file only needs to export your `AppServerModule`. It can go in `src`. This example calls this file `main.server.ts`:

### src/main.server.ts:

```typescript
export { AppServerModule } from './app/app.server.module';
```

Copy `tsconfig.app.json` to `tsconfig.server.json` and change it to build with a `"module"` target of `"commonjs"`.

Add a section for `"angularCompilerOptions"` and set `"entryModule"` to your `AppServerModule`, specified as a path to the import with a hash (`#`) containing the symbol name. In this example, this would be `src/app/app.server.module#AppServerModule`.

### src/tsconfig.server.json:

```
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "./out-tsc/app",
        "baseUrl": "./",
        "module": "commonjs",
        "types": []
    },
    "include": [
        "src/**/*.ts"
    ],
    "exclude": [
        "test.ts",
        "**/*.spec.ts"
    ],
    "angularCompilerOptions": {
        "entryModule": "src/app/app.server.module#AppServerModule"
    }
}
```

[back to top](#table-of-contents)

<hr />

## Step 3: Create a new target in `angular.json`

In `angular.json` locate the **architect** property inside your project, and add a new **server target**.

In **build target**, adapt `options.outputPath` to `dist/browser`.

### angular.json:

```
{
  ...
  "architect": {
    "build": {
      "builder": "@angular-devkit/build-angular:browser",
      "options: {
        "outputPath": "dist/browser",
        ...
      },
      ...
    }
    "server": {
      "builder": "@angular-devkit/build-angular:server",
      "options": {
        "outputPath": "dist/server",
        "main": "src/main.server.ts",
        "tsConfig": "tsconfig.server.json",
        "fileReplacements": [
          {
            "replace": "src/environments/environment.ts",
            "with": "src/environments/environment.prod.ts"
          }
        ],
        "optimization": true,
        "sourceMap": false
      }
    }
  }
  ...
}
```

### Building the bundle:

With these steps complete, you should be able to build a server bundle for your application:

```bash
# This builds the client application in dist/browser/
$ ng build --prod
...
# This builds the server bundle in dist/server/
$ ng run your-project-name:server

# outputs:
Date: 2017-10-21T21:54:49.240Z                                                       
Hash: 3034f2772435757f234a
Time: 3689ms
chunk {0} main.js (main) 9.2 kB [entry] [rendered]
chunk {1} styles.css (styles) 0 bytes [entry] [rendered]
```

[back to top](#table-of-contents)

<hr />

## Step 4: Setting up a Hapiness Application to run our Universal bundles

Now that we have everything set up to -make- the bundles, how we get everything running?

We'll use Hapiness application and `@hapiness/ng-universal` module.

Below we can see a TypeScript implementation of a -very- simple Hapiness application to fire everything up.

> **Note:**
>
> This is a very bare bones Hapiness application, and is just for demonstrations sake.
>
> In a real production environment, you'd want to make sure you have other authentication and security things setup here as well.
>
> This is just meant just to show the specific things needed that are relevant to Universal itself. The rest is up to you!

At the ROOT level of your project (where package.json / etc are), created a file named: `server.ts`

### server.ts (root project level):

```typescript
// These are important and needed before anything else
import 'reflect-metadata';
import 'zone.js/dist/zone-node';

import { enableProdMode } from '@angular/core';
import { Hapiness, Module } from '@hapiness/core';
import { HttpServer, HttpServerConfig } from '@hapiness/core/httpserver';
import { NgUniversalModule } from '@hapiness/ng-universal';
import { join } from 'path';

const BROWSER_FOLDER = join(process.cwd(), 'dist', 'browser');

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./dist/server/main');

// Create our Hapiness application
@Module({
    version: '1.0.0',
    imports: [
        NgUniversalModule.setConfig({
            bootstrap: AppServerModuleNgFactory,
            lazyModuleMap: LAZY_MODULE_MAP,
            staticContent: {
                indexFile: 'index.html',
                rootPath: BROWSER_FOLDER
            }
        })
    ]
})
class HapinessApplication {
    /**
     * OnStart process
     */
    onStart(): void {
        console.log(`SSR application is running`);
    }

    /**
     * OnError process
     */
    onError(error: Error): void {
        console.error(error);
    }
}


// Boostrap Hapiness application
Hapiness.bootstrap(HapinessApplication, [
    HttpServer.setConfig<HttpServerConfig>({
        host: '0.0.0.0',
        port: 4000
    })
]);
```

### Extra Providers:

Extra Providers can be provided either on engine setup

```typescript
NgUniversalModule.setConfig({
  bootstrap: AppServerModuleNgFactory,
  lazyModuleMap: LAZY_MODULE_MAP,
  staticContent: {
    indexFile: 'index.html',
    rootPath: BROWSER_FOLDER
  },
  providers: [
      ServerService
  ]
})
```

### Using the Request, Reply and Utils:

The `Request`, `Reply` and `Utils` objects are injected into the app via injection tokens (`REQUEST`, `REPLY` and `UTILS`). You can access them by `@Inject`

```typescript
import { Inject, Injectable } from '@angular/core';
import { HttpServerRequest, REQUEST } from '@hapiness/ng-universal';

@Injectable()
export class RequestService {
  constructor(@Inject(REQUEST) private _request: HttpServerRequest) {}
}
```

If your app runs on the `client` side too, you will have to provide your own versions of these in the client app.

- `REQUEST` token will inject `HttpServerRequest` the current instance of [Fastify Request](https://www.fastify.io/docs/latest/Request/).
- `REPLY` token will inject `HttpServerReply` current instance provides:
    - `header(key: string, value: string): HttpServerReply` method to add `new header` in `SSR` response
    - `redirect(url: string): HttpServerReply` method to `redirect` the response with a `302` to the given `URL`.
- `UTILS` token will inject `HttpUtils` current instance provides:
    - `parseCookie(str: string, options?: any)` method which is the same of original `cookie` [library](https://github.com/jshttp/cookie#cookieparsestr-options).
    - `serializeCookie(name: string, value: string, options?: any)` method which is the same of original `cookie` [library](https://github.com/jshttp/cookie#cookieparsestr-options).

[back to top](#table-of-contents)

<hr />

## Step 5: Setup a webpack config to handle this Node server.ts file and serve your application!

Now that we have our Hapiness application setup, we need to pack it and serve it!

Create a file named `webpack.server.config.js` at the ROOT of your application.

> This file basically takes that `server.ts` file, and takes it and compiles it and every dependency it has into `dist/server.js`.

### ./webpack.server.config.js (root project level):

```javascript
const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'none',
    entry: { server: './server.ts' },
    target: 'node',
    resolve: {
        extensions: [ '.ts', '.js' ]
    },
    optimization: {
        minimize: false
    },
    externals: [
        /(node_modules)/,
        {
            // Temporary Fix for issue: https://github.com/ethanent/centra/pull/2
            // to prevent unknown module when executing SSR
            // You have to install it until fix is merged
            // npm i centra
            centra: {
                commonjs: 'centra',
                root: 'centra'
            }
        }
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: "commonjs"
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader' },
            {
                // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
                // Removing this will cause deprecation warnings to appear.
                test: /(\\|\/)@angular(\\|\/)core(\\|\/).+\.js$/,
                parser: { system: true },
            }
        ]
    },
    plugins: [
        // Temporary Fix for issue: https://github.com/angular/angular/issues/11580
        // for "WARNING Critical dependency: the request of a dependency is an expression"
        new webpack.ContextReplacementPlugin(
            /(.+)?angular(\\|\/)core(.+)?/,
            path.join(__dirname, 'src'), // location of your src
            {} // a map of your routes
        ),
        new webpack.ContextReplacementPlugin(
            /(.+)?hapiness(\\|\/)core(.+)?/,
            path.join(__dirname, 'src'),
            {}
        ),
        new webpack.ContextReplacementPlugin(
            /(.+)?hapiness(\\|\/)ng-universal(.+)?/,
            path.join(__dirname, 'src'),
            {}
        )
    ],
    stats: {
        warnings: false
    }
};
```

Now, you can build your server file:

```bash
$ webpack --config webpack.server.config.js --progress --colors
```

#### Almost there:

Now let's see what our resulting structure should look like, if we open up our `/dist/` folder we should see:

```
/dist/
  /browser/
  /server/
  server.js
```

To fire up the application, in your terminal enter

```bash
$ node dist/server.js
```

Now lets create a few handy scripts to help us do all of this in the future.

```
"scripts": {

  // These will be your common scripts
  "build:dynamic": "yarn run build:client-and-server-bundles && yarn run webpack:server",
  "serve:dynamic": "node dist/server.js",

  // Helpers for the above scripts
  "build:client-and-server-bundles": "ng build --prod && ng run your-project-name:server",
  "webpack:server": "webpack --config webpack.server.config.js --progress --colors"
}
```

In the future when you want to see a Production build of your app with Universal (locally), you can simply run:

```bash
$ yarn run build:dynamic && yarn run serve:dynamic
```

Enjoy!

Once again to see a working version of everything, check out the [universal-starter](https://github.com/hapinessjs/ng-universal-example).


[back to top](#table-of-contents)

<hr />

## Contributing

To set up your development environment:

1. clone the repo to your workspace,
2. in the shell `cd` to the main folder,
3. hit `npm or yarn install`,
4. run `npm or yarn run test`.
    * It will lint the code and execute all tests.
    * The test coverage report can be viewed from `./coverage/lcov-report/index.html`.

[Back to top](#table-of-contents)

## Change History
* v8.0.0 (2019-05-31)
    * `Angular v8.0.0+`
    * Migrate server to `Hapiness` v2 based on [Fastify](https://www.fastify.io/)
    * Code refactoring
    * Adapt tests
    * Documentation
* v7.0.0 (2018-10-31)
    * `Angular v7.0.1+`
    * Migrate tests to [jest](https://jestjs.io/en/) and [ts-jest](https://kulshekhar.github.io/ts-jest/)
    * Code refactoring
    * Documentation
* v6.2.0 (2018-09-24)
    * `Angular v6.1.8+`
    * Latest packages' versions
    * Install automatically `rxj-compat@6.2.2` to be compatible with all `Hapiness` extensions
    * Update doc of [webpack.server.config.ts]((#webpackserverconfigjs-root-project-level)) to match with latest version of `Angular Universal` [story](https://github.com/angular/angular-cli/wiki/stories-universal-rendering#webpackserverconfigjs-root-project-level)
    * Documentation
* v6.1.0 (2018-07-26)
    * `Angular v6.1.0+`
    * Documentation
* v6.0.1 (2018-05-25)
    * `Angular v6.0.3+`
    * `RxJS v6.2.0+`
    * Documentation
* v6.0.0 (2018-05-11)
    * `Angular v6.0.1+`
    * `RxJS v6.1.0+`
    * Documentation

[Back to top](#table-of-contents)

## Maintainers

<table>
    <tr>
        <td colspan="5" align="center"><a href="https://www.tadaweb.com"><img src="http://bit.ly/2xHQkTi" width="117" alt="tadaweb" /></a></td>
    </tr>
    <tr>
        <td align="center"><a href="https://github.com/Juneil"><img src="https://avatars3.githubusercontent.com/u/6546204?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/reptilbud"><img src="https://avatars3.githubusercontent.com/u/6841511?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/njl07"><img src="https://avatars3.githubusercontent.com/u/1673977?v=3&s=117" width="117"/></a></td>
        <td align="center"><a href="https://github.com/sopretty"><img src="https://avatars2.githubusercontent.com/u/6479712?s=117&v=4" width="117"/></a></td>
    </tr>
    <tr>
        <td align="center"><a href="https://github.com/Juneil">Julien Fauville</a></td>
        <td align="center"><a href="https://github.com/reptilbud">Sébastien Ritz</a></td>
        <td align="center"><a href="https://github.com/njl07">Nicolas Jessel</a></td>
        <td align="center"><a href="https://github.com/sopretty">Mathieu Jeanmougin</a></td>
    </tr>
</table>

[Back to top](#table-of-contents)

## License

Copyright (c) 2018 **Hapiness** Licensed under the [MIT license](https://github.com/hapinessjs/hapiness/blob/master/LICENSE.md).

[Back to top](#table-of-contents)
