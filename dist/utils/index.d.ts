import ansiColors from 'ansi-colors';

declare function removeColor(text: string): string;
declare const colors: typeof ansiColors;

declare class Spinner {
    private readonly spinner;
    enabled: boolean;
    constructor(text?: string);
    set text(text: string);
    succeed(text?: string): void;
    info(text?: string): void;
    fail(text?: string): void;
    warn(text?: string): void;
    stop(): void;
    start(text?: string): void;
}

export { Spinner, colors, removeColor };
