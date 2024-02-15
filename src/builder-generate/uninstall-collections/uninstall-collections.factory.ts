import {Rule, Tree} from '@angular-devkit/schematics';
import {colors, logger, Spinner} from "../../utils";
import {execSync} from "node:child_process";
// import {execSync} from 'child_process';
// import {colors, getPackageJsonDependency, Spinner} from '../../utils';

export function uninstallPackages(options: {
    packageNames: string[];
    packageManager?: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun'
    dryRun: boolean;
}): Rule {
    logger.log({
        level: 'info',
        message: colors.bold('The uninstallation of collections began')
    });
    const ignores: string[] = [];
    const {packageNames, dryRun, packageManager} = options;
    return (tree: Tree) => {
        let spinner = new Spinner('uninstallPackages');
        spinner.start('Uninstalling collections');
        try {
            for (const packageName of packageNames) {
                if (ignores.some((ignore) => ignore === packageName)) continue;
                const packageSpinner = new Spinner(packageName);
                packageSpinner.start(`Uninstalling ${colors.blue(packageName)}.`);
                if (!dryRun) execSync(`${packageManager ?? 'npm'} uninstall ${packageName}`, {stdio: 'inherit'});
                packageSpinner.succeed(`${colors.green(packageName)} was uninstalled successfully`);
            }
            spinner.succeed('All the packages have been uninstalled');
        } catch (err) {
            spinner?.stop();
            throw err;
        }
    };
}
