import {Rule} from '@angular-devkit/schematics';
import {logger} from "../../utils";
// import {execSync} from 'child_process';
// import {colors, getPackageJsonDependency, Spinner} from '../../utils';

export function showSchematicInfo({schematicName, collectionName}: {
    schematicName: string;
    collectionName: string;
}): Rule {
    return () => {
        logger.log(
            'info',
            `Executing ${schematicName} schematic`,
            collectionName ? [`Schematic's name: ${schematicName}`, `Collection's name: ${collectionName}`] : []
        );
    };
}
