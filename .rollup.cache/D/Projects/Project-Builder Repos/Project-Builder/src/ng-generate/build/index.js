"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const parse_name_1 = require("@schematics/angular/utility/parse-name");
const tasks_1 = require("@angular-devkit/schematics/tasks");
function main(options) {
    return async (tree, context) => {
        context.addTask(new tasks_1.RunSchematicTask('installCollections', {
            packages: [
                { packageName: 'test' }
            ],
            dryRun: true
        }));
    };
}
exports.main = main;
function checkCollections(collections) {
    return { id: 12 };
}
function checkDependencies(workspace) {
}
function executeSchematics(context, schematics) {
    const schematicList = Object.entries(schematics);
    schematicList.forEach(([schematicName, schematic]) => {
    });
}
function processSchematic(context, path, schematicName, schematic, globalSettings) {
    const { collection: globalCollection, ...globalSettingsList } = globalSettings;
    const { collection, ID, path: schematicPath, settings, instances, dependsOn, children } = schematic;
    executeSchematic(context, `${path}${schematicPath ? `/${schematicPath}` : ''}`, collection, schematicName, {
        ...globalSettingsList,
        ...settings
    }, instances);
    const childrenList = Object.entries(children);
    childrenList.forEach(([schematicName, schematic]) => {
    });
}
function executeSchematic(context, path, collection, schematicName, settings, instances) {
    const taskIdList = [];
    const { path: schematicPath, name } = (0, parse_name_1.parseName)('./', schematicName);
    if (!instances) {
        const taskId = context.addTask(new tasks_1.RunSchematicTask(collection, schematicName, {
            path: `${path}${schematicPath ? '/' + schematicPath : ''}`,
            ...settings
        }));
        taskIdList.push(taskId);
    }
    else {
        for (const instance of instances) {
            const { path: instancePath, ...instanceSettings } = instance;
            const taskId = context.addTask(new tasks_1.RunSchematicTask(collection, schematicName, {
                path: `${path}${schematicPath ? '/' + schematicPath : ''} ${instancePath ? '/' + instancePath : ''}`,
                ...settings,
                ...instanceSettings
            }));
            taskIdList.push(taskId);
        }
    }
    return taskIdList;
}
