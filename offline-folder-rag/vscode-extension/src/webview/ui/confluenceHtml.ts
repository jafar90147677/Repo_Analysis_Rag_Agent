export function getConfluenceFileSelectorHtml(availableFiles: string[] = ['api.py', 'config.yaml', 'README.md', 'utils.py'], nonce: string = ''): string {
    const fileListHtml = availableFiles.map(file => `
        <div style="display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid var(--vscode-widget-border);">
            <input type="checkbox" id="file-${file}" value="${file}" style="margin-right: 10px; cursor: pointer;">
            <label for="file-${file}" style="font-size: 13px; cursor: pointer; flex: 1;">${file}</label>
        </div>
    `).join('');

    return `
        <div class="confluence-card" style="border: 1px solid var(--vscode-widget-border); border-radius: 8px; padding: 16px; background-color: var(--vscode-editor-background); width: 100%; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.2); margin: 10px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 18px; margin-right: 8px;">💾</span>
                <h3 style="margin: 0; font-size: 15px; font-weight: 600;">Save to Confluence - Intelligent Mode</h3>
            </div>
            
            <p style="margin: 0 0 12px 0; font-size: 13px; color: var(--vscode-foreground);">Select files for intelligent formatting</p>
            
            <div style="margin-bottom: 16px;">
                <button type="button" data-action="confluenceBrowse" style="width: 100%; padding: 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>📁</span> Browse Files...
                </button>
            </div>

            <div id="confluence-file-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 16px; border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 4px 8px; background: var(--vscode-input-background);">
                ${fileListHtml}
            </div>

            <div style="font-size: 13px; margin-bottom: 20px; padding: 12px; background: var(--vscode-textBlockQuote-background); border-radius: 6px; border-left: 3px solid var(--vscode-accent);">
                <div id="confluence-selection-count" style="font-weight: 600; margin-bottom: 8px;">Selected: 0 files</div>
                <div style="color: var(--vscode-descriptionForeground); font-size: 12px;">Selected files will be:</div>
                <ul style="margin: 4px 0 0 0; padding-left: 20px; color: var(--vscode-descriptionForeground); font-size: 12px; line-height: 1.6;">
                    <li>Automatically analyzed</li>
                    <li>Intelligently formatted</li>
                    <li>Perfectly organized</li>
                </ul>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" data-action="confluenceCancel" style="padding: 8px 16px; background: transparent; color: var(--vscode-foreground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer; font-size: 13px;">
                    Cancel
                </button>
                <button id="confluence-next-button" type="button" data-action="confluenceNext" disabled style="padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: not-allowed; opacity: 0.5; font-size: 13px; font-weight: 600;">
                    Next: Let AI Decide
                </button>
            </div>
            <script ${nonce ? `nonce="${nonce}"` : ''}>
                const vscode = acquireVsCodeApi();
                window.vscode = vscode;

                window.handleConfluenceBrowse = function() {
                    vscode.postMessage({ type: 'confluenceBrowse' });
                };

                const updateSelection = function() {
                    const checkboxes = document.querySelectorAll('#confluence-file-list input[type="checkbox"]');
                    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
                    const countEl = document.getElementById('confluence-selection-count');
                    if (countEl) countEl.textContent = 'Selected: ' + selected.length + ' files';
                    const nextButton = document.getElementById('confluence-next-button');
                    if (nextButton) {
                        nextButton.disabled = selected.length === 0;
                        nextButton.style.cursor = selected.length === 0 ? 'not-allowed' : 'pointer';
                        nextButton.style.opacity = selected.length === 0 ? 0.5 : 1;
                    }
                };

                window.updateConfluenceSelection = updateSelection;

                window.submitConfluenceSelection = function() {
                    const checkboxes = document.querySelectorAll('#confluence-file-list input[type="checkbox"]');
                    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
                    vscode.postMessage({ type: 'confluenceNext', files: selected });
                };

                updateSelection();
            </script>
        </div>
    `;
}

export function getConfluenceAnalysisHtml(files: string[] = [], nonce: string = ''): string {
    const fileList = files.length > 0 ? files.join(', ') : 'No files selected';
    return `
        <div class="confluence-card" style="border: 1px solid var(--vscode-widget-border); border-radius: 8px; padding: 16px; background-color: var(--vscode-editor-background); max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            <script ${nonce ? `nonce="${nonce}"` : ''}>
                const vscode = acquireVsCodeApi();
                window.vscode = vscode;
            </script>
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 18px; margin-right: 8px;">🤖</span>
                <h3 style="margin: 0; font-size: 15px; font-weight: 600;">Intelligent Analysis Complete</h3>
            </div>

            <div style="font-size: 13px; margin-bottom: 12px; color: var(--vscode-foreground);">
                <strong>Files:</strong> ${fileList}
            </div>
            
            <div style="font-size: 13px; margin-bottom: 16px;">
                <div style="font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span>🧠</span> AI Detected:
                </div>
                <ul style="margin: 0; padding-left: 24px; line-height: 1.6;">
                    <li>Python FastAPI backend</li>
                    <li>Configuration settings</li>
                    <li>Project documentation</li>
                </ul>
            </div>

            <div style="font-size: 13px; margin-bottom: 16px; padding: 12px; background: var(--vscode-textBlockQuote-background); border-radius: 6px; border-left: 3px solid var(--vscode-button-background);">
                <div style="font-weight: 600; color: var(--vscode-textLink-foreground); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <span>🎯</span> Intelligent Format Selected:
                </div>
                <div style="font-weight: 500;">"API Project Documentation" template</div>
                <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">(Matches 5 similar successful examples)</div>
            </div>

            <div style="font-size: 13px; margin-bottom: 16px;">
                <div style="font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span>📝</span> Suggested Title:
                </div>
                <div id="confluence-title-display" style="padding: 8px 12px; border: 1px solid var(--vscode-input-border); border-radius: 4px; background: var(--vscode-input-background); font-family: monospace;">
                    API Service Setup & Configuration
                </div>
            </div>

            <div style="font-size: 13px; margin-bottom: 20px;">
                <div style="font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span>📍</span> Confluence Space:
                </div>
                <select style="width: 100%; padding: 8px; background: var(--vscode-select-background); color: var(--vscode-select-foreground); border: 1px solid var(--vscode-select-border); border-radius: 4px; cursor: pointer;">
                    <option>DEV</option>
                    <option>DOCS</option>
                </select>
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="button" onclick="window.editConfluenceTitle()" style="flex: 1; padding: 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer; font-size: 13px;">
                    Edit Title
                </button>
                <button type="button" onclick="window.submitConfluenceCreate()" style="flex: 1; padding: 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">
                    Create Perfect Page
                </button>
            </div>
            <script ${nonce ? `nonce="${nonce}"` : ''}>
                (function() {
                    const vscode = window.vscode;

                    window.editConfluenceTitle = function() {
                        const display = document.getElementById('confluence-title-display');
                        if (!display) return;
                        const currentTitle = display.textContent.trim();
                        const newTitle = prompt('Edit Title', currentTitle);
                        if (newTitle) {
                            display.textContent = newTitle;
                        }
                    };

                    window.submitConfluenceCreate = function() {
                        vscode.postMessage({ type: 'confluenceCreate' });
                    };
                })();
            </script>
        </div>
    `;
}

export function getConfluenceProgressHtml(nonce: string = ''): string {
    return `
        <div class="confluence-card" style="border: 1px solid var(--vscode-widget-border); border-radius: 8px; padding: 16px; background-color: var(--vscode-editor-background); max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            <script ${nonce ? `nonce="${nonce}"` : ''}>
                const vscode = acquireVsCodeApi();
                window.vscode = vscode;
            </script>
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 18px; margin-right: 8px;">⏳</span>
                <h3 style="margin: 0; font-size: 15px; font-weight: 600;">Creating Intelligent Documentation...</h3>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px;">
                    <span style="margin-right: 12px; color: #4CAF50; font-weight: bold;">✓</span>
                    <span>Analyzing content structure...</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px;">
                    <span style="margin-right: 12px; color: #4CAF50; font-weight: bold;">✓</span>
                    <span>Selecting optimal template...</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px;">
                    <span style="margin-right: 12px; color: var(--vscode-progressBar-foreground); animation: pulse 1.5s infinite;">●</span>
                    <span style="font-weight: 600;">Applying intelligent formatting...</span>
                    <span style="margin-left: auto; font-family: monospace; color: var(--vscode-descriptionForeground);">███</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px;">
                    <span style="margin-right: 12px; color: var(--vscode-descriptionForeground);">○</span>
                    <span style="color: var(--vscode-descriptionForeground);">Uploading to Confluence...</span>
                    <span style="margin-left: auto; font-family: monospace; color: var(--vscode-descriptionForeground); opacity: 0.3;">▓▓▓</span>
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <div style="height: 6px; width: 100%; background-color: var(--vscode-progressBar-background); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: 75%; background-color: var(--vscode-progressBar-foreground); transition: width 0.5s ease;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 6px; opacity: 0.8; font-weight: 500;">
                    <span>75%</span>
                    <span>Estimated: 12 seconds</span>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end;">
                <button type="button" onclick="document.getElementById('confluence-overlay').classList.remove('visible')" style="padding: 4px 12px; background: transparent; color: var(--vscode-foreground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Cancel
                </button>
            </div>
            <style>
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
            </style>
        </div>
    `;
}

export function getConfluenceSuccessHtml(nonce: string = ''): string {
    return `
        <div class="confluence-card" style="border: 1px solid #4CAF50; border-radius: 8px; padding: 16px; background-color: var(--vscode-editor-background); max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            <script ${nonce ? `nonce="${nonce}"` : ''}>
                const vscode = acquireVsCodeApi();
                window.vscode = vscode;
            </script>
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 18px; margin-right: 8px;">✅</span>
                <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #4CAF50;">Intelligent Documentation Created!</h3>
            </div>

            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; font-size: 13px; margin-bottom: 16px;">
                <span style="font-weight: 600; color: var(--vscode-descriptionForeground);">Title:</span>
                <span>API Service Setup & Configuration</span>
                
                <span style="font-weight: 600; color: var(--vscode-descriptionForeground);">Space:</span>
                <span>DEV</span>
                
                <span style="font-weight: 600; color: var(--vscode-descriptionForeground);">Format:</span>
                <span style="display: flex; align-items: center; gap: 6px;">
                    API Project Docs
                    <span style="background: #4CAF50; color: white; font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: bold;">AI-FORMATTED</span>
                </span>
                
                <span style="font-weight: 600; color: var(--vscode-descriptionForeground);">Confidence:</span>
                <span style="color: #4CAF50; font-weight: bold;">94%</span>
            </div>
            
            <div style="margin-bottom: 16px; padding: 12px; background: var(--vscode-textBlockQuote-background); border-radius: 6px;">
                <div style="font-size: 12px; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span>🔗</span> Page Link:
                </div>
                <div style="font-size: 11px; color: var(--vscode-textLink-foreground); word-break: break-all; font-family: monospace;">
                    https://confluence.example.com/page/123
                </div>
            </div>

            <div style="font-size: 13px; margin-bottom: 20px;">
                <div style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <span>📊</span> What made this intelligent:
                </div>
                <ul style="margin: 0; padding-left: 24px; line-height: 1.6; color: var(--vscode-descriptionForeground); font-size: 12px;">
                    <li>Detected FastAPI patterns</li>
                    <li>Used proven API template</li>
                    <li>Organized logically</li>
                </ul>
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="button" onclick="document.getElementById('confluence-overlay').classList.remove('visible')" style="flex: 1; padding: 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">
                    Done
                </button>
                <button type="button" onclick="window.openConfluenceUrl('https://confluence.example.com/page/123')" style="flex: 1; padding: 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer; font-size: 13px;">
                    Open in Browser
                </button>
                <button type="button" onclick="window.copyConfluenceLink('https://confluence.example.com/page/123')" style="flex: 1; padding: 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer; font-size: 13px;">
                    Copy Link
                </button>
            </div>
            <script ${nonce ? `nonce="${nonce}"` : ''}>
                (function() {
                    const vscode = window.vscode;

                    window.openConfluenceUrl = function(url) {
                        vscode.postMessage({ type: 'openUrl', url: url });
                    };

                    window.copyConfluenceLink = function(text) {
                        vscode.postMessage({ type: 'copyToClipboard', text: text });
                    };
                })();
            </script>
        </div>
    `;
}

export function getConfluenceErrorHtml(error: string, message: string, suggestion: string, confidence: number, nonce: string = ''): string {
    return `
        <div class="confluence-card" style="border: 1px solid var(--vscode-errorForeground); border-radius: 8px; padding: 16px; background-color: var(--vscode-editor-background); max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            <script ${nonce ? `nonce="${nonce}"` : ''}>
                const vscode = acquireVsCodeApi();
                window.vscode = vscode;
            </script>
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 18px; margin-right: 8px;">❌</span>
                <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--vscode-errorForeground);">Intelligent Creation Failed</h3>
            </div>

            <div style="font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
                <div style="margin-bottom: 4px;"><strong>Error:</strong> <span style="font-family: monospace;">${error}</span></div>
                <div><strong>Message:</strong> ${message}</div>
            </div>

            <div style="font-size: 13px; margin-bottom: 16px; padding: 12px; background: var(--vscode-textBlockQuote-background); border-radius: 6px; border-left: 3px solid var(--vscode-errorForeground);">
                <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <span>💡</span> AI Suggestion:
                </div>
                <div>${suggestion}</div>
            </div>

            <div style="font-size: 13px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <span><strong>Fallback available:</strong> Yes</span>
                <span><strong>Confidence:</strong> <span style="color: var(--vscode-errorForeground); font-weight: bold;">${Math.round(confidence * 100)}%</span></span>
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="button" onclick="window.retryConfluenceCreate()" style="flex: 1; padding: 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">
                    Retry
                </button>
                <button type="button" onclick="document.getElementById('confluence-overlay').classList.remove('visible')" style="flex: 1; padding: 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer; font-size: 13px;">
                    Cancel
                </button>
                <button type="button" onclick="window.openConfluenceSettings()" style="flex: 1.5; padding: 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer; font-size: 13px;">
                    Update Settings
                </button>
            </div>
            <script ${nonce ? `nonce="${nonce}"` : ''}>
                (function() {
                    const vscode = window.vscode;

                    window.retryConfluenceCreate = function() {
                        vscode.postMessage({ type: 'confluenceCreate' });
                    };

                    window.openConfluenceSettings = function() {
                        vscode.postMessage({ type: 'confluenceSettings' });
                    };
                })();
            </script>
        </div>
    `;
}
