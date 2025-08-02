"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaApiModule = void 0;
const common_1 = require("@nestjs/common");
const persona_api_controller_1 = require("./persona-api.controller");
let PersonaApiModule = class PersonaApiModule {
};
exports.PersonaApiModule = PersonaApiModule;
exports.PersonaApiModule = PersonaApiModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [persona_api_controller_1.PersonaApiController],
        providers: [],
    })
], PersonaApiModule);
//# sourceMappingURL=persona-api.module.js.map