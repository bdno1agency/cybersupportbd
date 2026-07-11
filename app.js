// System instructions injected into every AI conversation
const SYSTEM_PROMPT = `You are CyberSupportBD AI, an elite cybersecurity first responder dedicated to helping users in Bangladesh. Provide immediate, actionable, and empathetic guidance.

OPERATIONAL RULES:
1. TONALITY: Calming, professional, objective, and urgent when necessary. Do not panic the user.
2. BANGLADESH CONTEXT: Frame legal advice around Bangladeshi cyber laws. Mention resources like the Bangladesh Police Cyber Support for Women (PCSW), CID Cyber Police, or BGD e-GOV CIRT when appropriate.
3. RISK TRIAGE: 
   - LOW RISK: Provide clear, numbered step-by-step guides.
   - MEDIUM RISK: Provide recovery steps and immediate security hardening settings.
   - HIGH RISK (Extortion, media leaks, active blackmail): Command the user explicitly: "Do not delete any messages. Take screenshots immediately. Do not pay any money." Provide emergency helpline phone numbers.

OUTPUT FORMATTING: Keep sentences short and use simple language. Bold critical emergency instructions.`;

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const apiKeyInput = document.getElementById('api-key');

let conversationHistory = [
    { role: "system", content: SYSTEM_PROMPT }
];

function appendMessage(sender, text, isAi = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex gap-3 max-w-[85%] ${sender === 'You' ? 'ml-auto flex-row-reverse' : ''}`;
    
    const avatar = document.createElement('div');
    avatar.className = `w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${isAi ? 'bg-red-600' : 'bg-blue-600'}`;
    avatar.innerText = sender === 'You' ? 'U' : 'AI';

    const textBubble = document.createElement('div');
    textBubble.className = `${isAi ? 'bg-gray-800' : 'bg-blue-600 text-white'} rounded-2xl p-3 text-sm shadow-md whitespace-pre-line`;
    textBubble.innerHTML = text;

    if (sender === 'You') {
        textBubble.classList.add('rounded-tr-none');
    } else {
        textBubble.classList.add('rounded-tl-none');
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(textBubble);
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function sendQuickHelp(text) {
    userInput.value = text;
    sendMessage();
}

async function sendMessage() {
    const text = userInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!text) return;
    if (!apiKey) {
        alert("Please enter your OpenAI API key in the settings panel below to continue.");
        return;
    }

    // Append user message to UI and history
    appendMessage('You', text, false);
    conversationHistory.push({ role: "user", content: text });
    userInput.value = '';

    // Create a placeholder for AI response
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = "flex gap-3 max-w-[85%]";
    aiMessageDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm shrink-0">AI</div>
        <div class="bg-gray-800 rounded-2xl rounded-tl-none p-3 text-sm shadow-md text-gray-400 italic animate-pulse" id="loading-bubble">Thinking...</div>
    `;
    chatWindow.appendChild(aiMessageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
        const response = await fetch('https://openai.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Cost-efficient and fast
                messages: conversationHistory
            })
        });

        const data = await response.json();
        document.getElementById('loading-bubble').remove();
        aiMessageDiv.remove();

        if (data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content;
            
            // Format some basic markdown stars to bold HTML tags for display
            const formattedResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            appendMessage('CyberSupportBD AI', formattedResponse, true);
            conversationHistory.push({ role: "assistant", content: aiResponse });
        } else {
            appendMessage('System', 'Error: Invalid response from API. Check your key permissions.', true);
        }

    } catch (error) {
        document.getElementById('loading-bubble').remove();
        aiMessageDiv.remove();
        appendMessage('System', 'Connection failed. Please check your internet or API key.', true);
        console.error(error);
    }
}
