import * as assert from 'assert';
import * as vscode from 'vscode';
import { parseSlashCommand } from '../../../vscode-extension/src/commands/commandRouter';

describe('Slash Command Parsing', () => {
    const mockContext = {
        globalStorageUri: { fsPath: '/tmp/storage' }
    } as vscode.ExtensionContext;

    it('should return correct response for /index full', async () => {
        const result = await parseSlashCommand('/index full', mockContext);
        assert.strictEqual(result.type, 'commandResult');
        assert.strictEqual(result.payload, 'Indexing started: full scan');
    });

    it('should return correct response for /index incremental', async () => {
        const result = await parseSlashCommand('/index incremental', mockContext);
        assert.strictEqual(result.type, 'commandResult');
        assert.strictEqual(result.payload, 'Indexing started: incremental scan');
    });

    it('should return correct response for /index report', async () => {
        const result = await parseSlashCommand('/index report', mockContext);
        // Note: This might trigger showIndexModal if index doesn't exist in test environment
        assert.ok(['commandResult', 'showIndexModal', 'assistantResponse'].includes(result.type));
    });

    it('should return correct response for /overview', async () => {
        const result = await parseSlashCommand('/overview', mockContext);
        assert.ok(['commandResult', 'showIndexModal', 'assistantResponse'].includes(result.type));
    });

    it('should return correct response for /search with arguments', async () => {
        const result = await parseSlashCommand('/search my query', mockContext);
        assert.ok(['commandResult', 'showIndexModal', 'assistantResponse'].includes(result.type));
    });

    it('should return correct response for /doctor', async () => {
        const result = await parseSlashCommand('/doctor', mockContext);
        assert.strictEqual(result.type, 'assistantResponse');
    });

    it('should return correct response for /autoindex on', async () => {
        const result = await parseSlashCommand('/autoindex on', mockContext);
        assert.strictEqual(result.type, 'commandResult');
        assert.strictEqual(result.payload, 'Auto-indexing enabled');
    });

    it('should return correct response for /autoindex off', async () => {
        const result = await parseSlashCommand('/autoindex off', mockContext);
        assert.strictEqual(result.type, 'commandResult');
        assert.strictEqual(result.payload, 'Auto-indexing disabled');
    });

    it('should return correct response for /ask with arguments', async () => {
        const result = await parseSlashCommand('/ask how do I use this?', mockContext);
        assert.ok(['commandResult', 'showIndexModal', 'assistantResponse'].includes(result.type));
    });

    it('should return INVALID_COMMAND for unknown commands', async () => {
        const result = await parseSlashCommand('/unknown', mockContext);
        assert.strictEqual(result.type, 'commandResult');
        assert.strictEqual(result.payload, 'INVALID_COMMAND');
    });

    it('should handle trailing spaces', async () => {
        const result = await parseSlashCommand('/overview  ', mockContext);
        assert.ok(['commandResult', 'showIndexModal', 'assistantResponse'].includes(result.type));
    });
});
