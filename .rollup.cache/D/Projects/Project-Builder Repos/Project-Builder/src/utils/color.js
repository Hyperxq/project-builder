"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = exports.removeColor = void 0;
const tslib_1 = require("tslib");
const ansi_colors_1 = tslib_1.__importDefault(require("ansi-colors"));
const tty_1 = require("tty");
function supportColor() {
    if (process.env.FORCE_COLOR !== undefined) {
        switch (process.env.FORCE_COLOR) {
            case '':
            case 'true':
            case '1':
            case '2':
            case '3':
                return true;
            default:
                return false;
        }
    }
    if (process.stdout instanceof tty_1.WriteStream) {
        return process.stdout.getColorDepth() > 1;
    }
    return false;
}
function removeColor(text) {
    return text.replace(ansi_colors_1.default.ansiRegex, '');
}
exports.removeColor = removeColor;
const colors = ansi_colors_1.default.create();
exports.colors = colors;
colors.enabled = supportColor();
