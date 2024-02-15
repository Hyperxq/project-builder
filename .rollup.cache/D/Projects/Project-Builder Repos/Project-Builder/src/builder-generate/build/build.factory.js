"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const tslib_1 = require("tslib");
const cuid2_1 = require("@paralleldrive/cuid2");
const ajv_1 = tslib_1.__importDefault(require("ajv"));
const config_schema_json_1 = tslib_1.__importDefault(require("../../config/config-schema.json"));
const tasks_1 = require("@angular-devkit/schematics/tasks");
const utils_1 = require("../../utils");
const parse_name_1 = require("@schematics/angular/utility/parse-name");
const core_1 = require("@angular-devkit/core");
let settingsCached = {};
function main(options) {
    return async (tree, context) => {
        utils_1.logger.log({
            level: 'info',
            message: utils_1.colors.bold('✨ Project Builder orchestrator started ✨')
        });
        utils_1.logger.warn("🚸 Warning: if any schematic fails, none of the previously executed ones will take effect");
        const { saveMode: dryRun, packageManager, filePath, remoteFile, installCollections } = options;
        const json = await getFile(filePath, remoteFile, tree);
        if (json === undefined)
            return tree;
        const isValid = await validateJson(json);
        if (!isValid)
            return tree;
        const { $schema, projects, collections, ...schematics } = json;
        let dependencies = [];
        if (installCollections)
            dependencies.push(checkCollections(context, (0, core_1.deepCopy)(collections), packageManager, dryRun));
        processCollections((0, core_1.deepCopy)(collections));
        try {
            dependencies = executeSchematics(context, schematics, dependencies, dryRun);
        }
        catch (err) {
            utils_1.logger.error('Something happened when Project Builder tried to execute schematics', [err.message]);
            process.exit(1);
        }
        utils_1.logger.debug(dependencies);
        if (installCollections)
            uninstallCollections(context, (0, core_1.deepCopy)(collections), packageManager, dependencies, dryRun);
    };
}
exports.main = main;
async function getFile(filePath, remoteFile = false, tree) {
    const spinner = new utils_1.Spinner('getFile');
    try {
        spinner.start(utils_1.colors.blue(`Reading the ${remoteFile ? 'remote' : 'local'} file`));
        if (!remoteFile) {
            const buffer = tree.read(filePath);
            if (!buffer) {
                spinner.stop();
                utils_1.logger.error(`Could not find ${filePath}.`);
                return undefined;
            }
            spinner.succeed('File was successfully read');
            return JSON.parse(buffer.toString());
        }
        else {
            const response = await fetch(filePath);
            spinner.succeed('File was successfully read');
            return await response.json();
        }
    }
    catch (error) {
        spinner.stop();
        utils_1.logger.error(error.message);
        process.exit(1);
    }
}
async function validateJson(json) {
    try {
        const ajv = new ajv_1.default();
        const validate = ajv.compile(config_schema_json_1.default);
        const valid = validate(json);
        if (!valid) {
            utils_1.logger.error(`The file is not in the correct format`, validate.errors);
            return false;
        }
        else {
            return true;
        }
    }
    catch (error) {
        utils_1.logger.error('Error during json validation:', [error.message]);
        process.exit(1);
    }
}
function processCollections(collections) {
    const entries = Object.entries((0, core_1.deepCopy)(collections));
    for (const [collectionName, collectionContent] of entries) {
        const { keepInstalled, version, ...schematics } = collectionContent;
        for (const [schematicName, settings] of Object.entries(schematics)) {
            const { alias } = settings;
            if (settingsCached[alias] || settingsCached[schematicName]) {
                utils_1.logger.error('Two or more schematics has the same schematic name or alias');
                process.exit(1);
            }
            settingsCached[alias ?? schematicName] = [collectionName, settings];
        }
    }
}
function assignUUID(schematics) {
    schematics.forEach(schematic => {
        schematic.ID = (0, cuid2_1.createId)();
    });
}
function checkCollections(context, collections, packageManager, dryRun) {
    try {
        const entries = Object.entries(collections);
        const packages = entries.map(([packageName, settings]) => {
            const { version } = settings;
            return {
                packageName,
                version
            };
        });
        return context.addTask(new tasks_1.RunSchematicTask('installCollections', {
            packages,
            packageManager,
            dryRun
        }));
    }
    catch (error) {
        utils_1.logger.error('Something happened when Project Builder was trying to install collections: ', [error.message]);
        process.exit(1);
    }
}
function uninstallCollections(context, collections, packageManager, dependencies, dryRun) {
    const entries = Object.entries(collections);
    utils_1.logger.debug('packageNames to uninstall', collections);
    const packageNames = entries
        .filter(([packageName, settings]) => {
        const { keepInstalled } = settings;
        return keepInstalled === undefined || !keepInstalled;
    })
        .map(([packageName]) => {
        return packageName;
    });
    utils_1.logger.debug('packageNames to uninstall', packageNames);
    return context.addTask(new tasks_1.RunSchematicTask('uninstallCollections', {
        packageNames,
        packageManager,
        dryRun
    }), dependencies);
}
function getGlobalSettings(schematic, alias) {
    if (!!alias && settingsCached[alias])
        return (settingsCached[alias]);
    if (!!schematic && settingsCached[schematic])
        return (settingsCached[schematic]);
    return [];
}
function executeSchematics(context, schematics, dependencies, dryRun) {
    const schematicList = Object.entries(schematics);
    schematicList.forEach(([schematicName, schematic]) => {
        dependencies.push(...processSchematic(context, '/', schematicName, schematic ?? {}, [], dryRun));
    });
    return dependencies;
}
function processSchematic(context, path, schematicName, schematic, dependencies, dryRun) {
    const { collection, alias, ID, path: schematicPath, settings, instances, dependsOn, children, sendPath } = schematic;
    const [globalCollection, globalSettings] = getGlobalSettings(schematicName, alias);
    if (!globalCollection && !collection) {
        utils_1.logger.error(`Error executing ${schematicName} schematic`, [`${schematicName} doesn't have a collection specified`]);
        process.exit(1);
    }
    if (!!schematicPath)
        path = `${path}/${schematicPath}`;
    dependencies.push(context.addTask(new tasks_1.RunSchematicTask('showSchematicInfo', {
        schematicName,
        collection: collection ?? globalCollection
    }), dependencies));
    const taskIdList = executeSchematic(context, path, globalCollection ?? collection, schematicName, {
        ...globalSettings,
        ...settings
    }, dependencies, instances, dryRun, sendPath);
    dependencies.push(...taskIdList);
    if (!children)
        return dependencies;
    const childrenList = Object.entries(children);
    childrenList.forEach(([schematicChildName, childSettings]) => {
        dependencies.push(...processSchematic(context, path, schematicChildName, childSettings, dependencies, dryRun));
    });
    return dependencies;
}
function executeSchematic(context, path, collection, schematicName, settings, dependencies = [], instances = [], dryRun, sendPath) {
    const taskIdList = [];
    const { path: schematicPath, name } = (0, parse_name_1.parseName)(path, schematicName);
    utils_1.logger.debug('executeSchematic' + schematicName, { schematicPath, name });
    if (!!schematicPath)
        path = schematicPath;
    if (instances.length === 0) {
        utils_1.logger.debug('executeSchematic 0 instances' + schematicName, {
            dryRun,
            path,
            ...settings
        });
        let options = settings;
        if (sendPath) {
            options = {
                path,
                ...settings
            };
        }
        const taskId = context.addTask(new tasks_1.RunSchematicTask(collection, schematicName, options), dependencies);
        taskIdList.push(taskId);
    }
    else {
        for (const instance of instances) {
            const { path: instancePath, ...instanceSettings } = instance;
            if (instancePath)
                path = `${path}/${instancePath}`;
            let options = settings;
            if (sendPath) {
                options = {
                    path,
                    ...settings,
                    ...instanceSettings
                };
            }
            const taskId = context.addTask(new tasks_1.RunSchematicTask(collection, schematicName, options));
            taskIdList.push(taskId);
        }
    }
    return taskIdList;
}
