"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uninstallPackages = void 0;
const utils_1 = require("../../utils");
const node_child_process_1 = require("node:child_process");
function uninstallPackages(options) {
    const ignores = [];
    const { packageNames, dryRun, packageManager } = options;
    return (tree) => {
        let spinner = new utils_1.Spinner('uninstallPackages');
        spinner.start('Uninstalling collections');
        try {
            for (const packageName of packageNames) {
                if (ignores.some((ignore) => ignore === packageName))
                    continue;
                const packageSpinner = new utils_1.Spinner(packageName);
                packageSpinner.start(`Uninstalling ${utils_1.colors.blue(packageName)}.`);
                if (!dryRun)
                    (0, node_child_process_1.execSync)(`${packageManager ?? 'npm'} uninstall ${packageName}`, { stdio: 'inherit' });
                packageSpinner.succeed(`${utils_1.colors.green(packageName)} was uninstalled successfully`);
            }
            spinner.succeed('All the packages have been uninstalled');
        }
        catch (err) {
            spinner?.stop();
            throw err;
        }
    };
}
exports.uninstallPackages = uninstallPackages;
