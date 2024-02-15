import * as _angular_devkit_schematics_src_tree_interface from '@angular-devkit/schematics/src/tree/interface';
import { Tree, SchematicContext } from '@angular-devkit/schematics';

interface BuildOptions {
    filePath: string;
    remoteFile?: boolean;
    installCollections?: boolean;
    saveMode: boolean;
    silentMode: boolean;
    packageManager: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun';
}

declare function main(options: BuildOptions): (tree: Tree, context: SchematicContext) => Promise<_angular_devkit_schematics_src_tree_interface.Tree>;

export { main };
