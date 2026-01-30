import * as assert from 'assert';
import { CommandRouter } from '../../../vscode-extension/src/commands/commandRouter';

describe('Slash Command Parsing', () => {
    let router: CommandRouter;

    before(() => {
        // @ts-ignore - Mocking dependencies for unit test
        router = new CommandRouter({} as any, () => {});
    });

    it('should return correct response for /index full', () => {
        const result = router.handleToolsSlashCommand('/index full');
        assert.strictEqual(result, 'Indexing started: full scan');
    });

    it('should return correct response for /index incremental', () => {
        const result = router.handleToolsSlashCommand('/index incremental');
        assert.strictEqual(result, 'Indexing started: incremental scan');
    });

    it('should return correct response for /index report', () => {
        const result = router.handleToolsSlashCommand('/index report');
        assert.strictEqual(result, 'Generating index report...');
    });

    it('should return correct response for /overview', () => {
        const result = router.handleToolsSlashCommand('/overview');
        assert.strictEqual(result, 'Overview: Folder structure and key files...');
    });

    it('should return correct response for /search with arguments', () => {
        const result = router.handleToolsSlashCommand('/search my query');
        assert.strictEqual(result, 'Searching for my query');
    });

    it('should return correct response for /doctor', () => {
        const result = router.handleToolsSlashCommand('/doctor');
        assert.strictEqual(result, 'Running system checks...');
    });

    it('should return correct response for /autoindex on', () => {
        const result = router.handleToolsSlashCommand('/autoindex on');
        assert.strictEqual(result, 'Auto-indexing enabled');
    });

    it('should return correct response for /autoindex off', () => {
        const result = router.handleToolsSlashCommand('/autoindex off');
        assert.strictEqual(result, 'Auto-indexing disabled');
    });

    it('should return correct response for /ask with arguments', () => {
        const result = router.handleToolsSlashCommand('/ask how do I use this?');
        assert.strictEqual(result, 'Asking the system: how do I use this?');
    });

    it('should return INVALID_COMMAND for unknown commands', () => {
        const result = router.handleToolsSlashCommand('/unknown');
        assert.strictEqual(result, 'INVALID_COMMAND');
    });

    it('should handle trailing spaces', () => {
        const result = router.handleToolsSlashCommand('/overview  ');
        assert.strictEqual(result, 'Overview: Folder structure and key files...');
    });
});
