import * as vscode from "vscode";

import { ChatPanelViewProvider } from "./webview/ChatPanelViewProvider";

export function activate(context: vscode.ExtensionContext) {
    const provider = new ChatPanelViewProvider(context, context.extensionUri);
    const command = vscode.commands.registerCommand("offlineFolderRag.openChat", () => {
        provider.show();
    });

    context.subscriptions.push(command);

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
