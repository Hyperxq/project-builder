import {SchematicContext, SchematicsException, TaskId, Tree} from "@angular-devkit/schematics";
import {BuildOptions, ICollections, ISchematic, IWorkspaceStructure} from "./build.interfaces";
import {createId} from '@paralleldrive/cuid2';
import Ajv from "ajv";
import schema from '../../config/config-schema.json';
import {RunSchematicTask} from "@angular-devkit/schematics/tasks";

export function main(options: BuildOptions) {
    return async (tree: Tree, context: SchematicContext) => {
        // TODO: Implement an error handler
        // 1. * Read JSON or get JSON
        const {saveMode: dryRun, packageManager, filePath, remoteFile, installCollections} = options;

        const json: IWorkspaceStructure = await getFile(filePath, remoteFile, tree);
        // 2. * Validate JSON, needs to be a valid schema: https://medium.com/@AlexanderObregon/json-schema-a-guide-to-validating-your-json-data-9f225b2a17ef
        const isValid = await validateJson(json);

        if (!isValid) return tree;

        const {projects, collections, ...schematics}: IWorkspaceStructure = json;

        const dependencies: TaskId[] = [];

        // 3. * Validate is collections are installed.
        if (installCollections) checkCollections(context, collections, packageManager, dryRun);


        // 4. (for angular) Add Collections to angular.json
        // 5. (for angular) Check if projects are created and if not, install them.
        // A. Call another orchestrator.
        // 6. * Check for dependencies
        //       * Check for circular dependencies
        //       * Check for invalid dependencies
        // checkDependencies();
        // 7. * Execute schematics.
        // executeSchematics(context, schematics);
        // 8. * Uninstall all the collection that doesn't have the attribute "keepInstalled"
        if (installCollections) uninstallCollections(context, collections, packageManager, dependencies, dryRun);


        /*
        * 1. Generate unique ID's for each schematic.
        * 2. Topological Sorting.
        * 3. Cycle Detection.
        * */
    }
}

//: Promise<IWorkspaceStructure>
async function getFile(filePath: string, remoteFile: boolean = false, tree: Tree) {
    if (!remoteFile) {
        const buffer = tree.read(filePath);
        if (!buffer) {
            throw new SchematicsException(`Could not find ${filePath}.`);
        }
        return JSON.parse(buffer.toString());
    } else {
        const response = await fetch(filePath);
        return await response.json();
    }
}

async function validateJson(json: any) {
    try {
        // const response = await fetch("https://api.pbuilder.dev/");
        // const schema = await response.json();

        const ajv = new Ajv();
        const validate = ajv.compile(schema);

        const valid = validate(JSON.parse(JSON.stringify(json, null, 2)));
        // const ajv = new Ajv2019({allErrors: true});
        // const draft07MetaSchema = require("ajv/dist/refs/json-schema-draft-07.json");
        // ajv.addMetaSchema(draft07MetaSchema);
        // const jsonData = JSON.parse(jsonString); // Parse JSON string to object

        // const validate = ajv.compile(schema);
        // const valid = validate(jsonData);

        if (!valid) {
            console.log('Validation errors:', validate.errors);
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error('Error during validation:', error);
        return false;
    }

}

function assignUUID(schematics: ISchematic[]) {
    schematics.forEach(schematic => {
        schematic.ID = createId();
    });
}

//TODO: chance dryRun to default to false
function checkCollections(context: SchematicContext, collections: ICollections, packageManager: string, dryRun: boolean = true): TaskId {
    const entries = Object.entries(collections);
    const packages = entries.map(([packageName, settings]) => {
        const {version} = settings;
        return {
            packageName,
            version
        }
    })
    return context.addTask(
        new RunSchematicTask('installCollections', {
            packages,
            packageManager,
            dryRun
        }),
    );
}

function uninstallCollections(context: SchematicContext, collections: ICollections, packageManager: string, dependencies: TaskId[], dryRun: boolean = true): TaskId {
    const entries = Object.entries(collections);
    const packageNames = entries
        .filter(([packageName, settings]) => {
            const {keepInstalled} = settings
            return !keepInstalled;
        })
        .map(([packageName, settings]) => {
            const {version} = settings;
            return packageName
        })
    return context.addTask(
        new RunSchematicTask('uninstallCollections', {
            packageNames,
            packageManager,
            dryRun
        }),
        dependencies
    );
}

//
// function checkDependencies(workspace?: IWorkspaceStructure): void {
//     // Check for circular dependencies
//     // Check for invalid dependencies
// }
//
//
// function executeSchematics(context: SchematicContext, schematics: { [schematicName: string]: ISchematic }) {
//     // - validate schematic, if it exists.
//     // - get global settings.
//     const schematicList = Object.entries(schematics);
//
//     schematicList.forEach(([schematicName, schematic]) => {
//         // processSchematic(context, './', schematicName, schematic, {});
//     });
// }
//
// function processSchematic(context: SchematicContext, path: string, schematicName: string, schematic: ISchematic, globalSettings: SchematicSettings) {
//     const {collection: globalCollection, ...globalSettingsList} = globalSettings;
//     // get settings
//     const {
//         collection,
//         ID,
//         path: schematicPath,
//         settings,
//         instances,
//         dependsOn,
//         children
//     } = schematic;
//
//     // check instances
//     executeSchematic(
//         context,
//         `${path}${schematicPath ? `/${schematicPath}` : ''}`,
//         collection,
//         schematicName,
//         {
//             ...globalSettingsList,
//             ...settings
//         },
//         instances
//     );
//
//     // loop children
//     const childrenList = Object.entries(children);
//     childrenList.forEach(([schematicName, schematic]) => {
//
//     });
// }
//
// function executeSchematic(context: SchematicContext, path: string, collection: string, schematicName: string, settings: SchematicSettings, instances?: Instance[]): TaskId[] {
//     const taskIdList = [];
//     const {path: schematicPath, name} = parseName('./', schematicName);
//
//     if (!instances) {
//         const taskId = context.addTask(
//             new RunSchematicTask(collection, schematicName, {
//                 path: `${path}${schematicPath ? '/' + schematicPath : ''}`,
//                 ...settings
//             })
//         );
//
//         taskIdList.push(taskId);
//     } else {
//         for (const instance of instances) {
//             const {path: instancePath, ...instanceSettings} = instance;
//             const taskId = context.addTask(
//                 new RunSchematicTask(collection, schematicName, {
//                     path: `${path}${schematicPath ? '/' + schematicPath : ''} ${instancePath ? '/' + instancePath : ''}`,
//                     ...settings,
//                     ...instanceSettings
//                 })
//             );
//
//             taskIdList.push(taskId);
//         }
//     }
//
//     return taskIdList;
// }