var moduleName = "ngApp.directives";

// UI Directives

var directives = [
    // add your own directives here
];

var app = angular.module(moduleName, []);

for(var directive of directives){
    app.directive(directive.name, directive.fn);
}

export default moduleName;