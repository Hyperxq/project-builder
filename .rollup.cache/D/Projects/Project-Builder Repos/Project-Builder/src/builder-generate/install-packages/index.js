"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installPackages = void 0;
const utils_1 = require("../../utils");
const dependencies_1 = require("@schematics/angular/utility/dependencies");
const node_child_process_1 = require("node:child_process");
function installPackages(options) {
    console.log('installPackages');
    const ignores = ['@schematics/angular'];
    const { packages, dryRun, packageManager } = options;
    return (tree) => {
        let spinner = new utils_1.Spinner('installPackages');
        try {
            console.log(utils_1.colors.green('Checking collections...'));
            for (const { packageName, version } of packages) {
                if (ignores.some((ignore) => ignore === packageName))
                    continue;
                const packageSpinner = new utils_1.Spinner(packageName);
                packageSpinner.start(`Checking if ${utils_1.colors.blue(packageName)} are install...`);
                const packageNameVersion = packageName + `${version ? `@${version}` : ''}`;
                const packageDep = (0, dependencies_1.getPackageJsonDependency)(tree, packageName);
                if (!packageDep) {
                    if (!dryRun)
                        (0, node_child_process_1.execSync)(`${packageManager ?? 'npm'} ${packageNameVersion} --skip-confirmation`, { stdio: 'inherit' });
                    packageSpinner.succeed(`${utils_1.colors.green(packageName)} was installed successfully`);
                }
                else {
                    packageSpinner.info(`${utils_1.colors.green(packageName)} are already installed`);
                    packageSpinner.stop();
                }
            }
            spinner.succeed('All the  packages have been installed');
        }
        catch (err) {
            spinner?.stop();
            throw err;
        }
    };
}
exports.installPackages = installPackages;
