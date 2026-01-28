import * as vscode from "vscode";

import { ChatPanelViewProvider } from "./webview/ChatPanelViewProvider";

export function activate(context: vscode.ExtensionContext) {
    const provider = new ChatPanelViewProvider(context.extensionUri);
    const command = vscode.commands.registerCommand("offlineFolderRag.openChat", () => {
        provider.show();
    });

    context.subscriptions.push(command);
}

export function deactivate() {
    return undefined;
}
