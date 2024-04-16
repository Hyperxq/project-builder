import { Rule, Tree } from '@angular-devkit/schematics';
import { colors, logger, Spinner } from '../../utils';
import { getPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { execSync } from 'node:child_process';
// import {execSync} from 'child_process';
// import {colors, getPackageJsonDependency, Spinner} from '../../utils';

export function installPackage(options: {
  packageName: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun';
  dryRun: boolean;
}): Rule {
  logger.log({
    level: 'info',
    message: colors.bold('The installation of collections began'),
  });
  const ignores: string[] = [];
  const { packageName, dryRun, packageManager } = options;
  return (tree: Tree) => {
    try {
      if (ignores.some((ignore) => ignore === packageName)) return;
      const packageSpinner = new Spinner(packageName);
      packageSpinner.start(`Checking if ${colors.blue(packageName)} are install...`);
      const packageNameVersion = packageName;
      const packageDep = getPackageJsonDependency(tree, packageName);

      if (!packageDep) {
        if (!dryRun)
          execSync(
            `${packageManager ?? 'npm'} i ${packageNameVersion} ${
              packageManager === 'npm' ? ' --skip-confirmation' : ''
            }`,
            { stdio: 'inherit' }
          );
        packageSpinner.succeed(`${colors.green(packageName)} was installed successfully`);
      } else {
        packageSpinner.info(`${colors.green(packageName)} are already installed`);
        packageSpinner.stop();
      }
    } catch (error) {
      logger.error('Collection installation error:', error.message);
      process.exit(1);
    }
  };
}
