let currentMode = 'chat';
let chatHistory = [];
let attachedFile = null;

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const voiceBtn = document.getElementById('voice-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const menuBtns = document.querySelectorAll('.menu-btn');
const modeTitle = document.getElementById('current-mode-title');
const fileTagContainer = document.getElementById('file-tag-container');

marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true
});

menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.menu-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        modeTitle.innerText = btn.innerText;
    });
});

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text && !attachedFile) return;

    appendMessage('user', text);
    userInput.value = '';
    fileTagContainer.innerHTML = '';

    const typingElem = showTypingIndicator();

    if (currentMode === 'image-gen') {
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();
            removeTypingIndicator(typingElem);
            
            if (data.success) {
                appendImageMessage(data.image_url);
            } else {
                appendMessage('ai', '⚠️ Failed to generate image: ' + data.error);
            }
        } catch (err) {
            removeTypingIndicator(typingElem);
            appendMessage('ai', '⚠️ Error generating image.');
        }
    } else if (attachedFile) {
        const formData = new FormData();
        formData.append('prompt', text || 'Analyze this file');
        
        let endpoint = '/api/analyze-image';
        if (attachedFile.type === 'application/pdf') {
            endpoint = '/api/analyze-pdf';
            formData.append('file', attachedFile);
        } else {
            formData.append('image', attachedFile);
        }

        try {
            const res = await fetch(endpoint, { method: 'POST', body: formData });
            const data = await res.json();
            removeTypingIndicator(typingElem);
            typeWriterEffect(data.reply || data.error);
        } catch (err) {
            removeTypingIndicator(typingElem);
            appendMessage('ai', '⚠️ Error processing file.');
        }
        attachedFile = null;
    } else {
        let promptText = text;
        if (currentMode === 'coding') promptText = `Provide code and explanation for: ${text}`;
        if (currentMode === 'translate') promptText = `Translate the following to English and Bengali: ${text}`;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText, history: chatHistory })
            });
            const data = await res.json();
            removeTypingIndicator(typingElem);

            if (data.success) {
                typeWriterEffect(data.reply);
                chatHistory.push({ sender: 'user', text: text });
                chatHistory.push({ sender: 'ai', text: data.reply });
            } else {
                appendMessage('ai', '⚠️ Error: ' + data.error);
            }
        } catch (err) {
            removeTypingIndicator(typingElem);
            appendMessage('ai', '⚠️ Connection error.');
        }
    }
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    msgDiv.innerHTML = sender === 'user' ? escapeHtml(text) : marked.parse(text);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('message', 'ai-message', 'typing-indicator');
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatBox.appendChild(indicator);
    chatBox.scrollTop = chatBox.scrollHeight;
    return indicator;
}

function removeTypingIndicator(elem) {
    if (elem) elem.remove();
}

function typeWriterEffect(text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'ai-message');
    chatBox.appendChild(msgDiv);

    let index = 0;
    const speed = 10;

    function type() {
        if (index < text.length) {
            index += 4;
            const currentText = text.substring(0, index);
            msgDiv.innerHTML = marked.parse(currentText);
            hljs.highlightAll();
            chatBox.scrollTop = chatBox.scrollHeight;
            setTimeout(type, speed);
        } else {
            msgDiv.innerHTML = marked.parse(text);
            hljs.highlightAll();
        }
    }
    type();
}

function appendImageMessage(url) {
    const img = document.createElement('img');
    img.src = url;
    img.classList.add('ai-image-res');
    chatBox.appendChild(img);
    chatBox.scrollTop = chatBox.scrollHeight;
}

attachBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    attachedFile = e.target.files[0];
    if (attachedFile) {
        fileTagContainer.innerHTML = `<i class="fa-solid fa-paperclip"></i> Attached: <b>${attachedFile.name}</b>`;
    }
});

clearChatBtn.addEventListener('click', () => {
    chatHistory = [];
    chatBox.innerHTML = '<div class="message ai-message">Memory cleared! How can I help you?</div>';
});

if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    voiceBtn.addEventListener('click', () => {
        voiceBtn.classList.toggle('recording');
        recognition.start();
    });
    recognition.onresult = (e) => {
        userInput.value = e.results[0][0].transcript;
        voiceBtn.classList.remove('recording');
    };
    recognition.onerror = () => voiceBtn.classList.remove('recording');
} else {
    voiceBtn.style.display = 'none';
}

function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s];
    });
}
