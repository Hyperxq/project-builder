"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseName = void 0;
const core_1 = require("@angular-devkit/core");
function parseName(path, name) {
    const nameWithoutPath = (0, core_1.basename)((0, core_1.normalize)(name));
    const namePath = (0, core_1.dirname)((0, core_1.join)((0, core_1.normalize)(path), name));
    return {
        name: nameWithoutPath,
        path: (0, core_1.normalize)('/' + namePath),
    };
}
exports.parseName = parseName;
