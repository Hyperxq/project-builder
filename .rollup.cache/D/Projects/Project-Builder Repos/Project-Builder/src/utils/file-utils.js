"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientBuild = exports.getJsonFile = exports.createEmptyFolder = exports.addDependencyToModule = exports.getBuildTarget = exports.getProjectsIterator = exports.getProjectNames = exports.getDefaultProjectName = exports.getProject = exports.getSourceFile = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const ts = tslib_1.__importStar(require("typescript"));
const ast_utils_1 = require("./ast-utils");
const change_1 = require("./change");
const workspace_1 = require("./workspace");
function getSourceFile(host, path) {
    const buffer = host.read(path);
    if (!buffer) {
        throw new schematics_1.SchematicsException(`Could not find ${path}.`);
    }
    const content = buffer.toString();
    return ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
}
exports.getSourceFile = getSourceFile;
function getProject(workspace, projectName) {
    return workspace.projects.get(projectName);
}
exports.getProject = getProject;
function getDefaultProjectName(workspace) {
    const projectName = workspace.projects.keys().next().value;
    if (!projectName) {
        throw new schematics_1.SchematicsException(`You don't have any project in your workspace`);
    }
    return projectName;
}
exports.getDefaultProjectName = getDefaultProjectName;
function getProjectNames(workspace) {
    return Array.from(workspace.projects.entries(), ([key]) => key);
}
exports.getProjectNames = getProjectNames;
function getProjectsIterator(workspace) {
    return workspace.projects.entries();
}
exports.getProjectsIterator = getProjectsIterator;
function getBuildTarget(project) {
    const buildTarget = project?.targets.get('build');
    if (!buildTarget) {
        throw new schematics_1.SchematicsException(`Project target "build" not found.`);
    }
    return buildTarget;
}
exports.getBuildTarget = getBuildTarget;
function addDependencyToModule(tree, bootstrapModuleDestinyPath, dependencyPath, dependencyName, addToMetadataField = true) {
    if (!(0, ast_utils_1.isImported)(getSourceFile(tree, bootstrapModuleDestinyPath), dependencyName, dependencyPath)) {
        const changes = (0, ast_utils_1.addImportToModule)(getSourceFile(tree, bootstrapModuleDestinyPath), bootstrapModuleDestinyPath, dependencyName, dependencyPath, addToMetadataField);
        const recorder = tree.beginUpdate(bootstrapModuleDestinyPath);
        (0, change_1.applyToUpdateRecorder)(recorder, changes);
        tree.commitUpdate(recorder);
    }
}
exports.addDependencyToModule = addDependencyToModule;
function createEmptyFolder(path) {
    return (tree) => {
        if (!tree.exists(`${path}/.gitkeep`)) {
            tree.create((0, core_1.normalize)(`${path}/.gitkeep`), '');
        }
        return tree;
    };
}
exports.createEmptyFolder = createEmptyFolder;
function getJsonFile(tree, path) {
    const buffer = tree.read(path);
    if (!buffer) {
        throw new schematics_1.SchematicsException(`Could not find ${path}.`);
    }
    const content = buffer.toString();
    return JSON.parse(content);
}
exports.getJsonFile = getJsonFile;
async function getClientBuild(tree, projectName) {
    const workspace = await (0, workspace_1.readWorkspace)(tree);
    const project = getProject(workspace, projectName);
    return getBuildTarget(project);
}
exports.getClientBuild = getClientBuild;
