// In vscode-extension/src/commands/commandRouter.ts

import { sendMessageToAgent } from '../services/agentClient';

// Assuming 'composerInput' is the DOM element where the user types the message
const composerInput = document.getElementById('composer-input') as HTMLTextAreaElement;

// Add event listener for Enter and Shift+Enter key presses
composerInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        // Check if Shift key is held
        if (event.shiftKey) {
            // Insert newline on Shift+Enter
            return;
        }
        
        // Otherwise, send the message (if no Shift key pressed)
        sendMessageToAgent(composerInput.value);
        composerInput.value = ''; // Clear the input field after sending the message
        
        event.preventDefault(); // Prevent the default Enter action (newline)
    }
});
