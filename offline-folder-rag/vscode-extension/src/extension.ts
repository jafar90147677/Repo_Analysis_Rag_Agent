import * as vscode from "vscode";

import { ChatPanelViewProvider } from "./webview/ChatPanelViewProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('!!! OFFLINE RAG EXTENSION IS NOW ACTIVATING !!!');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    const provider = new ChatPanelViewProvider(context, context.extensionUri);
    const command = vscode.commands.registerCommand("offlineFolderRag.openChat", () => {
        provider.show();
    });

    context.subscriptions.push(command);

    const analyzeCommand = vscode.commands.registerCommand("offlineFolderRag.analyzeFolder", () => {
        vscode.window.showInformationMessage('Analyzing folder...');
    });
    context.subscriptions.push(analyzeCommand);

    const saveToIntelligentCommand = vscode.commands.registerCommand('confluence.saveToIntelligent', () => {
        vscode.window.showInformationMessage('Starting chat-only Confluence flow...');
    });
    context.subscriptions.push(saveToIntelligentCommand);

    const saveSelectionCommand = vscode.commands.registerCommand('confluence.saveSelection', () => {
        const selection = vscode.window.activeTextEditor?.selection;
        if (selection && !selection.isEmpty) {
            vscode.window.showInformationMessage('Saving selection to Confluence...');
        }
    });
    context.subscriptions.push(saveSelectionCommand);

    const documentProjectCommand = vscode.commands.registerCommand('confluence.documentProject', () => {
        vscode.window.showInformationMessage('Documenting project intelligently...');
    });
    context.subscriptions.push(documentProjectCommand);

    const viewCreationsCommand = vscode.commands.registerCommand('confluence.viewCreations', () => {
        vscode.window.showInformationMessage('Opening Intelligent Creations dashboard...');
    });
    context.subscriptions.push(viewCreationsCommand);

    const configureSettingsCommand = vscode.commands.registerCommand('confluence.configureSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'confluence');
    });
    context.subscriptions.push(configureSettingsCommand);

    const citationCommand = vscode.commands.registerCommand('citation.open', async (args) => {
        const doc = await vscode.workspace.openTextDocument(args.path);
        const editor = await vscode.window.showTextDocument(doc);
        const start = new vscode.Position(args.startLine - 1, 0);  // Zero-based index
        const end = new vscode.Position(args.endLine - 1, 0);  // Zero-based index
        editor.selection = new vscode.Selection(start, end);
        editor.revealRange(new vscode.Range(start, end));  // Highlight the range
    });
    context.subscriptions.push(citationCommand);
}

export function deactivate() {
    return undefined;
}
