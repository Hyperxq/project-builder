import {Rule, Tree} from '@angular-devkit/schematics';
import {colors, logger, Spinner} from "../../utils";
import {getPackageJsonDependency} from "@schematics/angular/utility/dependencies";
import {execSync} from "node:child_process";
// import {execSync} from 'child_process';
// import {colors, getPackageJsonDependency, Spinner} from '../../utils';

export function installPackages(options: {
    packages: { packageName: string; version?: string }[];
    packageManager?: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun'
    dryRun: boolean;
}): Rule {
    logger.log({
        level: 'info',
        message: colors.bold('The installation of collections began')
    });
    const ignores: string[] = [];
    const {packages, dryRun, packageManager} = options;
    return (tree: Tree) => {
        let spinner = new Spinner('installPackages');
        spinner.start('Checking collections');
        try {
            for (const {packageName, version} of packages) {
                if (ignores.some((ignore) => ignore === packageName)) continue;
                const packageSpinner = new Spinner(packageName);
                packageSpinner.start(`Checking if ${colors.blue(packageName)} are install...`);
                const packageNameVersion = packageName + `${version ? `@${version}` : ''}`;
                const packageDep = getPackageJsonDependency(tree, packageName);

                if (!packageDep) {
                    if (!dryRun) execSync(`${packageManager ?? 'npm'} i ${packageNameVersion} --skip-confirmation`, {stdio: 'inherit'});
                    packageSpinner.succeed(`${colors.green(packageName)} was installed successfully`);
                } else {
                    packageSpinner.info(`${colors.green(packageName)} are already installed`);
                    packageSpinner.stop();
                }
            }
            spinner.succeed('All the  packages have been installed');
        } catch (error) {
            spinner?.stop();
            logger.error('Collection installation error:', error.message);
        }
    };
}
