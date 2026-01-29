/**
 * Deterministic registry of supported slash commands.
 * ONLY supported commands are included here.
 */
export const slashCommandRegistry: { [key: string]: (args: string) => string } = {
    '/index full': (args) => {
        return 'Indexing started: full scan';
    },
    '/index incremental': (args) => {
        return 'Indexing started: incremental scan';
    },
    '/index report': (args) => {
        return 'Generating index report...';
    },
    '/overview': (args) => {
        return 'Overview: Folder structure and key files...';
    },
    '/search': (args) => {
        return `Searching for ${args}`;
    },
    '/doctor': (args) => {
        return 'Running system checks...';
    },
    '/autoindex on': (args) => {
        return 'Auto-indexing enabled';
    },
    '/autoindex off': (args) => {
        return 'Auto-indexing disabled';
    },
    '/ask': (args) => {
        return `Asking the system: ${args}`;
    }
};
