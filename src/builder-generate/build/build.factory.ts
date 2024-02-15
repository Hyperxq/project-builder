import {SchematicContext, TaskId, Tree} from "@angular-devkit/schematics";
import {
    BuildOptions,
    ICollections,
    Instance,
    ISchematic,
    IWorkspaceStructure,
    SchematicSettings,
    SettingsCached
} from "./build.interfaces";
import {createId} from '@paralleldrive/cuid2';
import Ajv from "ajv";
import schema from '../../config/config-schema.json';
import {RunSchematicTask} from "@angular-devkit/schematics/tasks";
import {colors, logger, Spinner} from "../../utils";
import {parseName} from "@schematics/angular/utility/parse-name";
import {showSchematicInfo} from "../show-schematic-info/show-schematic-info.factory";
import {deepCopy} from "@angular-devkit/core";

let settingsCached: SettingsCached = {};

export function main(options: BuildOptions) {
    return async (tree: Tree, context: SchematicContext) => {
        logger.log({
            level: 'info',

            message: colors.bold('✨ Project Builder orchestrator started ✨')
        });

        logger.warn("🚸 Warning: if any schematic fails, none of the previously executed ones will take effect");
        // 1. * Read JSON or get JSON
        const {saveMode: dryRun, packageManager, filePath, remoteFile, installCollections} = options;


        const json: IWorkspaceStructure = await getFile(filePath, remoteFile, tree);
        if (json === undefined) return tree;
        // 2. * Validate JSON, needs to be a valid schema: https://medium.com/@AlexanderObregon/json-schema-a-guide-to-validating-your-json-data-9f225b2a17ef
        const isValid = await validateJson(json);

        if (!isValid) return tree;

        const {$schema, projects, collections, ...schematics}: IWorkspaceStructure = json;

        let dependencies: TaskId[] = [];

        // 3. * Validate is collections are installed.
        if (installCollections) dependencies.push(checkCollections(context, deepCopy(collections), packageManager, dryRun));


        // 4. (for angular) Add Collections to angular.json
        // 5. (for angular) Check if projects are created and if not, install them.
        // A. Call another orchestrator.
        // 6. * Check for dependencies
        //       * Check for circular dependencies
        //       * Check for invalid dependencies
        // checkDependencies();

        // 7. * Execute schematics.
        processCollections(deepCopy(collections));
        try {
            //TODO: run schematic in dry-run first to check if everything is okay
            dependencies = executeSchematics(context, schematics, dependencies, dryRun);
        } catch (err) {
            logger.error('Something happened when Project Builder tried to execute schematics', [err.message]);
            process.exit(1);
        }

        // 8. * Uninstall all the collection that doesn't have the attribute "keepInstalled"
        logger.debug(dependencies);
        if (installCollections) uninstallCollections(context, deepCopy(collections), packageManager, dependencies, dryRun);


        /*
        * 1. Generate unique ID for each schematic.
        * 2. Topological Sorting.
        * 3. Cycle Detections.
        * */
    }
}

//: Promise<IWorkspaceStructure>
async function getFile(filePath: string, remoteFile: boolean = false, tree: Tree) {
    const spinner = new Spinner('getFile');
    try {
        spinner.start(colors.blue(`Reading the ${remoteFile ? 'remote' : 'local'} file`));
        if (!remoteFile) {
            const buffer = tree.read(filePath);
            if (!buffer) {
                spinner.stop();
                logger.error(`Could not find ${filePath}.`);
                return undefined;
            }
            spinner.succeed('File was successfully read');
            return JSON.parse(buffer.toString());
        } else {
            const response = await fetch(filePath);
            spinner.succeed('File was successfully read');
            return await response.json();
        }
    } catch (error) {
        spinner.stop();
        logger.error(error.message);
        process.exit(1);
    }
}

async function validateJson(json: any) {
    try {
        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        const valid = validate(json);
        if (!valid) {
            logger.error(`The file is not in the correct format`, validate.errors);
            return false;
        } else {
            return true;
        }
    } catch (error) {
        logger.error('Error during json validation:', [error.message]);
        process.exit(1);
    }
}

function processCollections(collections: ICollections) {
    const entries = Object.entries(deepCopy(collections));
    for (const [collectionName, collectionContent] of entries) {
        const {keepInstalled, version, ...schematics} = collectionContent;
        for (const [schematicName, settings] of Object.entries(schematics)) {
            /*
            * Note: We have 2 scenarios here:
            * 1. If the user has 2 or more schematics with the same name but different collection
            * When that happens, the user needs to add an alias.
            * 2. When the user has 2 or more with the same alias.
            *
            * The question here is: Do we need to store all the schematics with the same in alias in a hash table?
            * */
            const {alias} = settings;
            if (settingsCached[alias] || settingsCached[schematicName]) {
                logger.error('Two or more schematics has the same schematic name or alias');
                process.exit(1);
            }
            settingsCached[alias ?? schematicName] = [collectionName, settings];
        }
    }
}

function assignUUID(schematics: ISchematic[]) {
    schematics.forEach(schematic => {
        schematic.ID = createId();
    });
}

// const collectionsCache: {[collectionName: string]: {
//     schematics: string[];
//     keepInstalled: boolean;
// }} = {};


function checkCollections(context: SchematicContext, collections: ICollections, packageManager: string, dryRun: boolean): TaskId {
    try {
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
    } catch (error) {
        logger.error('Something happened when Project Builder was trying to install collections: ', [error.message]);
        process.exit(1);
    }

}

function uninstallCollections(context: SchematicContext, collections: ICollections, packageManager: string, dependencies: TaskId[], dryRun: boolean): TaskId {

    const entries = Object.entries(collections);
    logger.debug('packageNames to uninstall', collections);
    const packageNames = entries
        .filter(([packageName, settings]) => {
            const {keepInstalled} = settings;
            return keepInstalled === undefined || !keepInstalled;
        })
        .map(([packageName]) => {
            return packageName
        });

    logger.debug('packageNames to uninstall', packageNames);
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
function getGlobalSettings(schematic: string, alias?: string) {

    if (!!alias && settingsCached[alias]) return (settingsCached[alias]);
    if (!!schematic && settingsCached[schematic]) return (settingsCached[schematic]);

    return [];
}

function executeSchematics(context: SchematicContext, schematics: {
    [schematicName: string]: ISchematic
}, dependencies: TaskId[], dryRun: boolean) {
    // - validate if the schematic exists.
    // - check if collections are installed.

    const schematicList = Object.entries(schematics);
    schematicList.forEach(([schematicName, schematic]) => {
        // - get global settings.
        dependencies.push(...processSchematic(context, '/', schematicName, schematic ?? {}, [], dryRun));
    });

    return dependencies;
}


function processSchematic(context: SchematicContext, path: string, schematicName: string, schematic: ISchematic, dependencies: TaskId[], dryRun: boolean) {

    // get settings
    const {
        collection,
        alias,
        ID,
        path: schematicPath,
        settings,
        instances,
        dependsOn,
        children,
        sendPath
    } = schematic;

    const [globalCollection, globalSettings] = getGlobalSettings(schematicName, alias);
    if (!globalCollection && !collection) {
        logger.error(`Error executing ${schematicName} schematic`, [`${schematicName} doesn't have a collection specified`])
        process.exit(1);
    }

    if (!!schematicPath) path = `${path}/${schematicPath}`;

    dependencies.push(context.addTask(
        new RunSchematicTask('showSchematicInfo', {
            schematicName,
            collection: collection ?? globalCollection
        }),
        dependencies
    ));


    const taskIdList = executeSchematic(
        context,
        path,
        globalCollection ?? collection,
        schematicName,
        {
            ...globalSettings,
            ...settings
        },
        dependencies,
        instances,
        dryRun,
        sendPath
    );

    dependencies.push(...taskIdList);

    // loop children
    if (!children) return dependencies;

    const childrenList = Object.entries(children);
    childrenList.forEach(([schematicChildName, childSettings]) => {
        dependencies.push(...processSchematic(context, path, schematicChildName, childSettings, dependencies, dryRun));
    });
    return dependencies;
}

//
function executeSchematic(
    context: SchematicContext,
    path: string,
    collection: string,
    schematicName: string,
    settings: SchematicSettings,
    dependencies: TaskId[] = [],
    instances: Instance[] = [],
    dryRun: boolean,
    sendPath: boolean
): TaskId[] {
    const taskIdList = [];
    const {path: schematicPath, name} = parseName(path, schematicName);
    logger.debug('executeSchematic' + schematicName, {schematicPath, name})
    if (!!schematicPath) path = schematicPath;

    if (instances.length === 0) {
        logger.debug('executeSchematic 0 instances' + schematicName, {
            dryRun,
            path,
            ...settings
        });

        let options: {} = settings;
        if (sendPath) {
            options = {
                path,
                ...settings
            }
        }
        const taskId = context.addTask(
            new RunSchematicTask(collection, schematicName, options),
            dependencies
        );

        taskIdList.push(taskId);
    } else {
        for (const instance of instances) {
            const {path: instancePath, ...instanceSettings} = instance;
            if (instancePath) path = `${path}/${instancePath}`;
            let options: {} = settings;
            if (sendPath) {
                options = {
                    path,
                    ...settings,
                    ...instanceSettings
                }
            }
            const taskId = context.addTask(
                new RunSchematicTask(collection, schematicName, options)
            );

            taskIdList.push(taskId);
        }
    }

    return taskIdList;
}