/**
 * This file defines your AngularJS app
 * The underlying router configuration, controllers, services, and directives
 * are all defined by individual files to help keep a manageable codebase.
 *
 * The only thing you likely will change here is adding app-level dependencies like 'ngResource' or similar
 */

import allControllers from './controllers.js';
import allServices from './services.js';
import allDirectives from './directives.js';
import allFilters from './filters.js';

var app = angular.module("es6ngApp", ['ui.router', allControllers, allServices, allDirectives, allFilters])
    // You may add additional configuration here
    .config(['$compileProvider', ($compileProvider) => {
        // For the download link to work during local development
        // http://stackoverflow.com/questions/15637133/unsafe-link-in-angular
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data):/);
    }])
    ;

export default app;