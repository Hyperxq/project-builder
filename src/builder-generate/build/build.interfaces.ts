export interface BuildOptions {
  filePath: string;
  remoteFile?: boolean;
  base64String?: string;

  installCollections?: boolean;
  saveMode: boolean;
  silentMode: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun';
  // workspaceStructure: WorkspaceStructure;
  // unInstallCollection?: boolean;
  // name?: string;
}

export type Dictionary = { [key: string]: any };
export type Instance = ISchematic;
export type SchematicSettings = Dictionary & { collection: string };
export type ProjectSettings = Dictionary;

export interface ISchematic {
  sendPath?: boolean;
  alias?: string;
  collection?: string;
  ID?: string; // Test if I can generate my own ID
  path?: string;
  settings?: SchematicSettings;
  instances?: Instance[];
  dependsOn?: string[];
  children?: { [schematicName: string]: ISchematic };
}

export type ICollections = {
  [collectionName: string]: { [schematicName: string]: SchematicSettings } & {
    keepInstalled?: boolean;
    version?: string
  }
}

interface IWorkspace {
  $schema: string;
  collections?: ICollections;
  projects?: { [projectName: string]: ProjectSettings };
}

export type IWorkspaceStructure = IWorkspace & { [schematicName: string]: ISchematic };

export type SettingsCached = {
  [schematicName: string]: [string, SchematicSettings];
};

// interface IWorkspaceStructure {
//     globalSettings?: {
//         [key: string]: {
//             [prop: string]: string;
//         };
//     };
//     projects: {
//         [key: string]: {
//             [prop: string]: {
//                 [prop: string]: any;
//             };
//         };
//     };
// }

// export type IProjects = {
//     [p: string]: {
//         type: string;
//     } & {
//         [p: string]: {
//             [p: string]: any;
//         };
//     };
// };
//
// export type WorkspaceStructure = IWorkspaceStructure & {
//     [key: string]: {
//         [prop: string]: any;
//     };
// };
//
// export type ISchematicSettings = {
//     schematicName?: string;
//     collection?: string;
//     settings: {
//         [key: string]: {
//             [prop: string]: any;
//         };
//     };
// };
// export type ISchematic = ISchematicSettings & {
//     instances?: {
//         [key: string]: {
//             [prop: string]: {
//                 [prop: string]: any;
//             };
//         };
//     };
// };
//
// export interface ISettings {
//     [key: string]: {
//         [prop: string]: {
//             alias: string;
//         } & {
//             [prop: string]: any;
//         };
//     };
// }
//
// export interface ISchematicParentsSettings {
//     globalSettings?: ISchematicSettings;
//     projectSettings?: ISchematicSettings;
// }
//
// export type SchematicStructure = {
//     type: 'schematic';
//     instances?: {
//         [key: string]: any;
//     };
// } & {
//     [key: string]: any;
// };
//
// export type Structure = {
//     type: 'folder' | 'schematic';
// } & (FolderStructure | SchematicStructure);
//
// export type FolderStructure = {
//     type: 'folder';
//     [key: string]: FolderStructure | SchematicStructure | string;
// };
//
// export type SettingsCached = {
//     [projectName: string]: { [schematicName: string]: ISchematicSettings };
// } & {
//     global?: {
//         [schematicName: string]: ISchematicSettings;
//     };
// };
