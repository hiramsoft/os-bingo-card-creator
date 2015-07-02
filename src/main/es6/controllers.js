var moduleName = "ngApp.controllers";

import bingoCardController from './controller/bingo-card-conroller.js';

var ctrls = Array.from([
    bingoCardController
]);

var app = angular.module(moduleName, []);

for(var ctrl of ctrls){
    app.controller(ctrl.name, ctrl.def);
}

export default moduleName;