import * as assert from 'assert';
import { parseSlashCommand } from '../../../vscode-extension/src/commands/commandRouter';

describe('Slash Command Parsing', () => {
    it('should return correct response for /index full', () => {
        const result = parseSlashCommand('/index full');
        assert.strictEqual(result, 'Indexing started: full scan');
    });

    it('should return correct response for /index incremental', () => {
        const result = parseSlashCommand('/index incremental');
        assert.strictEqual(result, 'Indexing started: incremental scan');
    });

    it('should return correct response for /index report', () => {
        const result = parseSlashCommand('/index report');
        assert.strictEqual(result, 'Generating index report...');
    });

    it('should return correct response for /overview', () => {
        const result = parseSlashCommand('/overview');
        assert.strictEqual(result, 'Overview: Folder structure and key files...');
    });

    it('should return correct response for /search with arguments', () => {
        const result = parseSlashCommand('/search my query');
        assert.strictEqual(result, 'Searching for my query');
    });

    it('should return correct response for /doctor', () => {
        const result = parseSlashCommand('/doctor');
        assert.strictEqual(result, 'Running system checks...');
    });

    it('should return correct response for /autoindex on', () => {
        const result = parseSlashCommand('/autoindex on');
        assert.strictEqual(result, 'Auto-indexing enabled');
    });

    it('should return correct response for /autoindex off', () => {
        const result = parseSlashCommand('/autoindex off');
        assert.strictEqual(result, 'Auto-indexing disabled');
    });

    it('should return correct response for /ask with arguments', () => {
        const result = parseSlashCommand('/ask how do I use this?');
        assert.strictEqual(result, 'Asking the system: how do I use this?');
    });

    it('should return INVALID_COMMAND for unknown commands', () => {
        const result = parseSlashCommand('/unknown');
        assert.strictEqual(result, 'INVALID_COMMAND');
    });

    it('should handle trailing spaces', () => {
        const result = parseSlashCommand('/overview  ');
        assert.strictEqual(result, 'Overview: Folder structure and key files...');
    });
});
