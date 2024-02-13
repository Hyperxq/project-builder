interface BuildOptions {
    filePath: string;
    remoteFile?: boolean;
    installCollections?: boolean;
    dryRun: boolean;
    packageManager: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun';
}
type Dictionary = {
    [key: string]: any;
};
type Instance = ISchematic;
type SchematicSettings = Dictionary & {
    collection: string;
};
type ProjectSettings = Dictionary;
interface ISchematic {
    collection?: string;
    ID?: string;
    path?: string;
    settings?: SchematicSettings;
    instances?: Instance[];
    dependsOn?: string[];
    children?: {
        [schematicName: string]: ISchematic;
    };
}
type ICollections = {
    [collectionName: string]: {
        [schematicName: string]: SchematicSettings;
    } & {
        keepInstalled?: boolean;
        version?: string;
    };
};
interface IWorkspace {
    collections?: ICollections;
    projects?: {
        [projectName: string]: ProjectSettings;
    };
}
type IWorkspaceStructure = IWorkspace & {
    [schematicName: string]: ISchematic;
};
type SettingsCached = {
    [projectName: string]: {
        [schematicName: string]: SchematicSettings;
    };
} & {
    global?: {
        [schematicName: string]: SchematicSettings;
    };
};

export type { BuildOptions, Dictionary, ICollections, ISchematic, IWorkspaceStructure, Instance, ProjectSettings, SchematicSettings, SettingsCached };
