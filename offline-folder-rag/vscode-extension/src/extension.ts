import * as vscode from "vscode";

import { ChatPanelViewProvider } from "./webview/ChatPanelViewProvider";

export function activate(context: vscode.ExtensionContext) {
    const provider = new ChatPanelViewProvider(context, context.extensionUri);
    const command = vscode.commands.registerCommand("offlineFolderRag.openChat", () => {
        provider.show();
    });

    context.subscriptions.push(command);

    const confluencePublish = vscode.commands.registerCommand("offlineFolderRag.confluencePublish", async () => {
        const baseUrl = await getAgentBaseUrl(context);
        if (!baseUrl) return;
        try {
            const token = await getAgentToken(context);
            const res = await fetch(`${baseUrl}/confluence/health`, { headers: token ? { "X-LOCAL-TOKEN": token } : {} });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.config_present) {
                vscode.window.showInformationMessage("Confluence: configured and ready.");
            } else {
                vscode.window.showWarningMessage("Confluence: not configured or agent unreachable.");
            }
        } catch {
            vscode.window.showErrorMessage("Confluence: failed to reach Edge Agent.");
        }
    });
    context.subscriptions.push(confluencePublish);

    const confluenceStatus = vscode.commands.registerCommand("offlineFolderRag.confluenceViewStatus", async () => {
        const baseUrl = await getAgentBaseUrl(context);
        if (!baseUrl) return;
        try {
            const token = await getAgentToken(context);
            const res = await fetch(`${baseUrl}/confluence/health`, { headers: token ? { "X-LOCAL-TOKEN": token } : {} });
            const data = await res.json().catch(() => ({}));
            vscode.window.showInformationMessage(`Confluence status: ${data.status || "unknown"}, config_present: ${data.config_present ?? false}`);
        } catch {
            vscode.window.showErrorMessage("Confluence: failed to reach Edge Agent.");
        }
    });
    context.subscriptions.push(confluenceStatus);

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

async function getAgentBaseUrl(context: vscode.ExtensionContext): Promise<string | null> {
    const url = context.globalState.get<string>("edgeAgentBaseUrl") ?? "http://localhost:8000";
    return url || null;
}

async function getAgentToken(context: vscode.ExtensionContext): Promise<string | null> {
    return context.globalState.get<string>("edgeAgentToken") ?? null;
}

export function deactivate() {
    return undefined;
}
