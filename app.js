let currentUser = null;
let currentChat = [];
let selectedFile = null;


/* =========================
   DOM
========================= */

const messages = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const userInput = document.getElementById("userInput");
const commandBox = document.getElementById("commandBox");
const fileInput = document.getElementById("fileInput");

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const profileModal = document.getElementById("profileModal");
const loginModal = document.getElementById("loginModal");

const toast = document.getElementById("toast");


/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {

    loadLocalUser();
    loadHistory();

    userInput.addEventListener("input", () => {
        handleInput(userInput);
    });

});


/* =========================
   TOAST
========================= */

function showToast(message) {

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* =========================
   SIDEBAR
========================= */

function toggleSidebar() {

    if (!sidebar) return;

    sidebar.classList.toggle("open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.toggle(
            "show",
            sidebar.classList.contains("open")
        );
    }
}


function closeMobileSidebar() {

    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("show");

}


/* =========================
   NEW CHAT
========================= */

function newChat() {

    currentChat = [];

    messages.innerHTML = "";

    const empty = document.createElement("div");

    empty.className = "empty-state";

    empty.innerHTML = `
        <div class="empty-icon">🤖</div>
        <h2>How can I help you?</h2>
        <p>Ask anything or use <strong>/</strong> for AI commands.</p>
    `;

    messages.appendChild(empty);

    selectedFile = null;

    if (fileInput) {
        fileInput.value = "";
    }

    hideCommands();

    closeMobileSidebar();

    userInput.focus();
}


/* =========================
   INPUT
========================= */

function handleInput(textarea) {

    autoResize(textarea);

    const value = textarea.value;

    if (value.trim().startsWith("/")) {
        showCommands(value);
    } else {
        hideCommands();
    }
}


function autoResize(textarea) {

    textarea.style.height = "auto";

    textarea.style.height =
        Math.min(textarea.scrollHeight, 160) + "px";
}


function handleEnter(event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();
    }
}


/* =========================
   COMMANDS
========================= */

function showCommands(value) {

    if (!commandBox) return;

    const query = value
        .trim()
        .toLowerCase();

    if (!query.startsWith("/")) {
        hideCommands();
        return;
    }

    const buttons =
        commandBox.querySelectorAll("button");

    let visible = 0;

    buttons.forEach(button => {

        const command =
            button.querySelector("strong")?.textContent
            ?.toLowerCase() || "";

        if (
            query === "/" ||
            command.startsWith(query)
        ) {
            button.style.display = "flex";
            visible++;
        } else {
            button.style.display = "none";
        }

    });

    commandBox.style.display =
        visible > 0 ? "block" : "none";
}


function hideCommands() {

    if (commandBox) {
        commandBox.style.display = "none";
    }
}


function useCommand(command) {

    userInput.value = command;

    hideCommands();

    autoResize(userInput);

    userInput.focus();
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

    const text = userInput.value.trim();

    if (!text && !selectedFile) {
        return;
    }

    hideCommands();

    if (emptyState) {
        emptyState.remove();
    }

    const sentText = text;

    addMessage(
        "user",
        sentText || "📎 File attached"
    );

    currentChat.push({
        role: "user",
        content: sentText
    });

    userInput.value = "";
    autoResize(userInput);

    const file = selectedFile;

    selectedFile = null;

    if (fileInput) {
        fileInput.value = "";
    }

    const loading = addLoadingMessage();

    try {

        let response;

        /*
         * IMAGE COMMAND
         */

        if (
            sentText.toLowerCase().startsWith("/image ")
        ) {

            const prompt =
                sentText.substring(7).trim();

            response = await fetch(
                "/api/generate-image",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        prompt: prompt
                    })
                }
            );

        }

        /*
         * IMAGE ANALYSIS
         */

        else if (
            sentText.toLowerCase().startsWith("/analyze")
            && file
        ) {

            const formData =
                new FormData();

            formData.append("image", file);

            response = await fetch(
                "/api/analyze-image",
                {
                    method: "POST",
                    body: formData
                }
            );

        }

        /*
         * NORMAL CHAT
         */

        else {

            response = await fetch(
                "/api/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        message: sentText,
                        history: currentChat
                    })
                }
            );

        }

        removeLoadingMessage(loading);

        const data =
            await readApiResponse(response);

        if (!response.ok) {

            throw new Error(
                data?.error ||
                data?.message ||
                "Request failed"
            );
        }


        /*
         * IMAGE RESPONSE
         */

        if (data.image) {

            addImageMessage(
                data.image
            );

            currentChat.push({
                role: "assistant",
                content: "[Generated image]"
            });

        }

        /*
         * NORMAL RESPONSE
         */

        else {

            const reply =
                data.reply ||
                data.response ||
                data.text ||
                "No response received.";

            addMessage(
                "ai",
                reply
            );

            currentChat.push({
                role: "assistant",
                content: reply
            });

        }

        saveCurrentChat();

    } catch (error) {

        removeLoadingMessage(loading);

        console.error(error);

        addMessage(
            "ai",
            "❌ " + error.message
        );

    }

    scrollMessages();
}


/* =========================
   API RESPONSE
========================= */

async function readApiResponse(response) {

    const text =
        await response.text();

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {
            return JSON.parse(text);
        } catch {
            throw new Error(
                "Server returned invalid JSON."
            );
        }
    }

    if (
        text.trim().startsWith("<")
    ) {

        throw new Error(
            `Server returned an HTML page instead of JSON. HTTP ${response.status}`
        );
    }

    return {
        error:
            text ||
            `HTTP ${response.status}`
    };
}


/* =========================
   MESSAGE UI
========================= */

function addMessage(role, text) {

    const row =
        document.createElement("div");

    row.className =
        `message-row ${role}`;

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.innerHTML =
        formatMessage(text);

    row.appendChild(bubble);

    messages.appendChild(row);

    scrollMessages();

    return row;
}


function formatMessage(text) {

    if (!text) return "";

    let safe =
        String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    /*
     * Basic code block formatting
     */

    safe = safe.replace(
        /```([\s\S]*?)```/g,
        "<pre><code>$1</code></pre>"
    );

    safe = safe.replace(
        /\n/g,
        "<br>"
    );

    return safe;
}


/* =========================
   LOADING
========================= */

function addLoadingMessage() {

    const row =
        document.createElement("div");

    row.className =
        "message-row ai loading-message";

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        "Thinking...";

    row.appendChild(bubble);

    messages.appendChild(row);

    scrollMessages();

    return row;
}


function removeLoadingMessage(element) {

    if (element) {
        element.remove();
    }
}


/* =========================
   IMAGE MESSAGE
========================= */

function addImageMessage(image) {

    const row =
        document.createElement("div");

    row.className =
        "message-row ai";

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    const img =
        document.createElement("img");

    img.src =
        image.startsWith("data:")
            ? image
            : "data:image/png;base64," + image;

    img.style.maxWidth = "100%";
    img.style.borderRadius = "12px";
    img.style.display = "block";

    bubble.appendChild(img);

    const saveButton =
        document.createElement("button");

    saveButton.textContent =
        "⬇ Save Image";

    saveButton.style.marginTop =
        "10px";

    saveButton.style.padding =
        "8px 12px";

    saveButton.style.borderRadius =
        "9px";

    saveButton.style.background =
        "#202a3a";

    saveButton.style.color =
        "#fff";

    saveButton.onclick =
        () => saveImage(img.src);

    bubble.appendChild(
        saveButton
    );

    row.appendChild(bubble);

    messages.appendChild(row);

    scrollMessages();
}


function saveImage(src) {

    const link =
        document.createElement("a");

    link.href = src;

    link.download =
        "my-ai-image.png";

    link.click();
}


/* =========================
   FILE
========================= */

function openFile() {

    fileInput?.click();
}


function fileSelected(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;

    selectedFile = file;

    showToast(
        `Selected: ${file.name}`
    );

    /*
     * Automatically show command
     * for image analysis.
     */

    if (
        file.type.startsWith("image/")
        &&
        !userInput.value.trim()
    ) {

        userInput.value =
            "/analyze ";

        autoResize(userInput);

        userInput.focus();
    }
}


/* =========================
   VOICE INPUT
========================= */

function startVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        showToast(
            "Voice input is not supported in this browser."
        );

        return;
    }

    const recognition =
        new SpeechRecognition();

    recognition.lang =
        "en-US";

    recognition.interimResults =
        false;

    recognition.maxAlternatives =
        1;

    recognition.onstart = () => {

        showToast(
            "🎙️ Listening..."
        );

    };

    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0]
                    .transcript;

            userInput.value =
                transcript;

            autoResize(userInput);

        };

    recognition.onerror =
        () => {

            showToast(
                "Voice input failed."
            );

        };

    recognition.start();
}


/* =========================
   CHAT HISTORY
========================= */

function saveCurrentChat() {

    if (!currentChat.length) {
        return;
    }

    const histories =
        JSON.parse(
            localStorage.getItem(
                "my_ai_chats"
            ) || "[]"
        );

    const firstUser =
        currentChat.find(
            item => item.role === "user"
        );

    const title =
        firstUser?.content
            ?.substring(0, 40)
            || "New Chat";

    histories.unshift({
        id: Date.now(),
        title: title,
        messages: currentChat
    });

    /*
     * Keep latest 30 chats
     */

    const unique =
        histories.filter(
            (item, index, array) =>
                index ===
                array.findIndex(
                    x => x.title === item.title
                )
        );

    localStorage.setItem(
        "my_ai_chats",
        JSON.stringify(
            unique.slice(0, 30)
        )
    );

    loadHistory();
}


function loadHistory() {

    const historyElement =
        document.getElementById(
            "chatHistory"
        );

    if (!historyElement) return;

    historyElement.innerHTML = "";

    const histories =
        JSON.parse(
            localStorage.getItem(
                "my_ai_chats"
            ) || "[]"
        );

    histories.forEach(chat => {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "history-item";

        button.textContent =
            chat.title;

        button.onclick =
            () => openSavedChat(chat);

        historyElement.appendChild(
            button
        );

    });
}


function openSavedChat(chat) {

    currentChat =
        chat.messages || [];

    messages.innerHTML = "";

    currentChat.forEach(message => {

        if (
            message.role === "user"
            ||
            message.role === "assistant"
        ) {

            addMessage(
                message.role === "assistant"
                    ? "ai"
                    : "user",
                message.content
            );

        }

    });

    closeMobileSidebar();

    scrollMessages();
}


/* =========================
   CLEAR HISTORY
========================= */

function clearChatHistory() {

    const confirmed =
        confirm(
            "Clear all saved chat history?"
        );

    if (!confirmed) return;

    localStorage.removeItem(
        "my_ai_chats"
    );

    loadHistory();

    showToast(
        "Chat history cleared."
    );
}


/* =========================
   LOGIN / PROFILE
========================= */

function loadLocalUser() {

    const saved =
        localStorage.getItem(
            "my_ai_user"
        );

    if (!saved) return;

    try {

        currentUser =
            JSON.parse(saved);

        updateProfileUI();

    } catch {

        localStorage.removeItem(
            "my_ai_user"
        );

    }
}


function openProfile() {

    if (!profileModal) return;

    profileModal.style.display =
        "flex";
}


function closeProfile() {

    if (!profileModal) return;

    profileModal.style.display =
        "none";
}


function openLogin() {

    closeProfile();

    if (loginModal) {
        loginModal.style.display =
            "flex";
    }
}


function closeLogin() {

    if (!loginModal) return;

    loginModal.style.display =
        "none";
}


function loginUser() {

    const name =
        document.getElementById(
            "loginName"
        )?.value.trim();

    const email =
        document.getElementById(
            "loginEmail"
        )?.value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        )?.value;

    if (!name || !email || !password) {

        showToast(
            "Please fill in all fields."
        );

        return;
    }

    /*
     * Temporary local login.
     *
     * Real secure account authentication
     * will be connected to the backend/database
     * in the next step.
     */

    currentUser = {
        name: name,
        email: email
    };

    localStorage.setItem(
        "my_ai_user",
        JSON.stringify(currentUser)
    );

    updateProfileUI();

    closeLogin();

    showToast(
        "Welcome to MY AI!"
    );
}


function updateProfileUI() {

    if (!currentUser) return;

    const name =
        currentUser.name ||
        "MY AI User";

    const firstLetter =
        name.charAt(0)
            .toUpperCase();

    const profileName =
        document.getElementById(
            "profileName"
        );

    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );

    const modalName =
        document.getElementById(
            "modalName"
        );

    const modalEmail =
        document.getElementById(
            "modalEmail"
        );

    const modalAvatar =
        document.getElementById(
            "modalAvatar"
        );

    if (profileName) {
        profileName.textContent =
            name;
    }

    if (profileAvatar) {
        profileAvatar.textContent =
            firstLetter;
    }

    if (modalName) {
        modalName.textContent =
            name;
    }

    if (modalEmail) {
        modalEmail.textContent =
            currentUser.email ||
            "MY AI Account";
    }

    if (modalAvatar) {
        modalAvatar.textContent =
            firstLetter;
    }
}


/* =========================
   SCROLL
========================= */

function scrollMessages() {

    if (!messages) return;

    requestAnimationFrame(() => {

        messages.scrollTop =
            messages.scrollHeight;

    });
}


/* =========================
   CLOSE MODALS
========================= */

window.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            profileModal
        ) {
            closeProfile();
        }

        if (
            event.target ===
            loginModal
        ) {
            closeLogin();
        }

    }
);
