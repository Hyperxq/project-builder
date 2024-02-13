"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const tslib_1 = require("tslib");
const schematics_1 = require("@angular-devkit/schematics");
const cuid2_1 = require("@paralleldrive/cuid2");
const ajv_1 = tslib_1.__importDefault(require("ajv"));
const config_schema_json_1 = tslib_1.__importDefault(require("../../config/config-schema.json"));
const tasks_1 = require("@angular-devkit/schematics/tasks");
function main(options) {
    return async (tree, context) => {
        const { dryRun, packageManager, filePath, remoteFile, installCollections } = options;
        const json = await getFile(filePath, remoteFile, tree);
        const isValid = await validateJson(json);
        if (!isValid)
            return tree;
        const { projects, collections, ...schematics } = json;
        const dependencies = [];
        if (installCollections)
            dependencies.push(checkCollections(context, collections, packageManager));
        if (installCollections)
            uninstallCollections(context, collections, packageManager, dependencies);
    };
}
exports.main = main;
async function getFile(filePath, remoteFile = false, tree) {
    if (!remoteFile) {
        const buffer = tree.read(filePath);
        if (!buffer) {
            throw new schematics_1.SchematicsException(`Could not find ${filePath}.`);
        }
        return JSON.parse(buffer.toString());
    }
    else {
        const response = await fetch(filePath);
        return await response.json();
    }
}
async function validateJson(json) {
    try {
        const ajv = new ajv_1.default();
        const validate = ajv.compile(config_schema_json_1.default);
        const valid = validate(JSON.parse(JSON.stringify(json, null, 2)));
        if (!valid) {
            console.log('Validation errors:', validate.errors);
            return false;
        }
        else {
            return true;
        }
    }
    catch (error) {
        console.error('Error during validation:', error);
        return false;
    }
}
function assignUUID(schematics) {
    schematics.forEach(schematic => {
        schematic.ID = (0, cuid2_1.createId)();
    });
}
function checkCollections(context, collections, packageManager, dryRun = true) {
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
function uninstallCollections(context, collections, packageManager, dependencies, dryRun = true) {
    const entries = Object.entries(collections);
    const packageNames = entries
        .filter(([packageName, settings]) => {
        const { keepInstalled } = settings;
        return !keepInstalled;
    })
        .map(([packageName, settings]) => {
        const { version } = settings;
        return packageName;
    });
    return context.addTask(new tasks_1.RunSchematicTask('uninstallCollections', {
        packageNames,
        packageManager,
        dryRun
    }), dependencies);
}
