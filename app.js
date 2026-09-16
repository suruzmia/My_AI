// =====================================================
// MY AI - COMPLETE APP.JS
// Chat + Commands + Image + Voice + Download
// =====================================================

// =========================
// GLOBAL VARIABLES
// =========================

let currentUser = null;
let currentChat = [];
let selectedFile = null;


// =========================
// DOM ELEMENTS
// =========================

const messages =
    document.getElementById("messages");

const emptyState =
    document.getElementById("emptyState");

const userInput =
    document.getElementById("userInput");

const commandBox =
    document.getElementById("commandBox");

const fileInput =
    document.getElementById("fileInput");

const chatHistory =
    document.getElementById("chatHistory");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const profileModal =
    document.getElementById("profileModal");

const loginModal =
    document.getElementById("loginModal");

const toast =
    document.getElementById("toast");


// =========================
// PAGE LOAD
// =========================

document.addEventListener("DOMContentLoaded", () => {

    loadLocalUser();

    loadHistory();

    updateProfileUI();

    if (userInput) {
        handleInput(userInput);
    }

});


// =========================
// SAFE API RESPONSE
// =========================

async function readApiResponse(response) {

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {

        return await response.json();

    }

    const text =
        await response.text();

    return {
        error:
            text || "Server returned an invalid response."
    };
}


// =========================
// SIDEBAR
// =========================

function toggleSidebar() {

    if (!sidebar) return;

    sidebar.classList.toggle("open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.toggle("show");
    }
}


// =========================
// NEW CHAT
// =========================

function newChat() {

    currentChat = [];

    if (messages) {
        messages.innerHTML = "";
    }

    if (emptyState) {
        messages.appendChild(emptyState);
        emptyState.style.display = "flex";
    }

    selectedFile = null;

    if (fileInput) {
        fileInput.value = "";
    }

    if (userInput) {
        userInput.value = "";
        userInput.style.height = "auto";
    }

    hideCommands();

    showToast("New chat started");

}


// =========================
// INPUT HANDLER
// =========================

function handleInput(element) {

    if (!element) return;

    element.style.height = "auto";

    element.style.height =
        Math.min(
            element.scrollHeight,
            160
        ) + "px";

    const value =
        element.value.trim();

    if (value.startsWith("/")) {

        showCommands(value);

    } else {

        hideCommands();

    }

}


// =========================
// ENTER KEY
// =========================

function handleEnter(event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();

    }

}


// =========================
// COMMAND BOX
// =========================

function showCommands(value = "/") {

    if (!commandBox) return;

    commandBox.style.display = "block";

    const buttons =
        commandBox.querySelectorAll("button");

    const command =
        value.toLowerCase();

    buttons.forEach(button => {

        const strong =
            button.querySelector("strong");

        if (!strong) return;

        const name =
            strong.textContent
                .toLowerCase();

        button.style.display =
            name.startsWith(command)
                ? "flex"
                : "none";

    });

}


function hideCommands() {

    if (commandBox) {
        commandBox.style.display = "none";
    }

}


// =========================
// USE COMMAND
// =========================

function useCommand(command) {

    if (!userInput) return;

    userInput.value = command;

    userInput.focus();

    handleInput(userInput);

}


// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

    if (!userInput) return;

    const message =
        userInput.value.trim();

    if (!message) return;

    userInput.value = "";

    userInput.style.height = "auto";

    hideCommands();

    // =====================
    // /HELP
    // =====================

    if (
        message.toLowerCase() === "/help"
    ) {

        addMessage(
            "user",
            message
        );

        addMessage(
            "assistant",
            `🤖 MY AI Commands

/image [prompt]
Generate an image

/voice [text]
Generate AI voice

/analyze
Analyze an attached image

/translate [text]
Translate text

/code [request]
Coding assistant

/help
Show commands`
        );

        return;
    }


    // =====================
    // ADD USER MESSAGE
    // =====================

    addMessage(
        "user",
        message
    );

    currentChat.push({
        role: "user",
        content: message
    });


    // =====================
    // /VOICE
    // =====================

    if (
        message
            .toLowerCase()
            .startsWith("/voice")
    ) {

        const voiceText =
            message
                .substring(6)
                .trim();

        if (!voiceText) {

            addMessage(
                "assistant",
                "🔊 Example:\n/voice Hello, how are you?"
            );

            return;
        }

        await generateVoice(
            voiceText
        );

        return;
    }


    // =====================
    // /IMAGE
    // =====================

    if (
        message
            .toLowerCase()
            .startsWith("/image")
    ) {

        const prompt =
            message
                .substring(6)
                .trim();

        if (!prompt) {

            addMessage(
                "assistant",
                "🖼️ Example:\n/image A futuristic city at night"
            );

            return;
        }

        await generateImage(
            prompt
        );

        return;
    }


    // =====================
    // /ANALYZE
    // =====================

    if (
        message
            .toLowerCase()
            .startsWith("/analyze")
    ) {

        if (!selectedFile) {

            addMessage(
                "assistant",
                "📸 Please attach an image first, then use /analyze."
            );

            return;
        }

        await analyzeImage();

        return;
    }


    // =====================
    // NORMAL CHAT
    // =====================

    const loading =
        addLoadingMessage(
            "Thinking..."
        );

    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: message,

                        history:
                            currentChat.slice(
                                -20
                            )

                    })

                }
            );

        const data =
            await readApiResponse(
                response
            );

        loading.remove();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "AI request failed."
            );

        }

        const reply =
            data.reply ||
            data.response ||
            data.text ||
            "No response received.";

        addMessage(
            "assistant",
            reply
        );

        currentChat.push({
            role: "assistant",
            content: reply
        });

        saveCurrentChat();

    } catch (error) {

        loading.remove();

        addMessage(
            "assistant",
            "❌ " + error.message
        );

    }

}


// =====================================================
// VOICE GENERATION
// =====================================================

async function generateVoice(text) {

    const loading =
        addLoadingMessage(
            "Generating voice..."
        );

    try {

        const response =
            await fetch(
                "/api/voice",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        text: text
                    })
                }
            );

        const data =
            await readApiResponse(
                response
            );

        loading.remove();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Voice generation failed."
            );

        }

        if (!data.audio) {

            throw new Error(
                "No audio was returned."
            );

        }


        // =====================
        // CREATE AUDIO
        // =====================

        const mimeType =
            data.mime_type ||
            "audio/mpeg";

        const audioData =
            "data:" +
            mimeType +
            ";base64," +
            data.audio;


        // =====================
        // MESSAGE ROW
        // =====================

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "message-row assistant";


        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "message-bubble";


        // =====================
        // TITLE
        // =====================

        const title =
            document.createElement(
                "div"
            );

        title.textContent =
            "🔊 MY AI Voice";

        title.style.fontWeight =
            "600";

        title.style.marginBottom =
            "10px";


        // =====================
        // AUDIO PLAYER
        // =====================

        const audio =
            document.createElement(
                "audio"
            );

        audio.controls = true;

        audio.autoplay = true;

        audio.preload = "auto";

        audio.src =
            audioData;

        audio.style.width =
            "100%";

        audio.style.maxWidth =
            "350px";


        // =====================
        // DOWNLOAD BUTTON
        // =====================

        const download =
            document.createElement(
                "a"
            );

        download.href =
            audioData;

        download.download =
            "MY-AI-Voice.mp3";

        download.textContent =
            "⬇️ Download Voice";

        download.style.display =
            "inline-block";

        download.style.marginTop =
            "10px";

        download.style.padding =
            "9px 14px";

        download.style.borderRadius =
            "10px";

        download.style.textDecoration =
            "none";

        download.style.fontSize =
            "14px";

        download.style.fontWeight =
            "600";

        download.style.background =
            "rgba(255,255,255,0.08)";

        download.style.color =
            "inherit";


        // =====================
        // TEXT
        // =====================

        const textElement =
            document.createElement(
                "div"
            );

        textElement.textContent =
            text;

        textElement.style.marginBottom =
            "12px";


        // =====================
        // APPEND
        // =====================

        bubble.appendChild(
            title
        );

        bubble.appendChild(
            textElement
        );

        bubble.appendChild(
            audio
        );

        bubble.appendChild(
            download
        );

        row.appendChild(
            bubble
        );

        messages.appendChild(
            row
        );


        // =====================
        // SCROLL
        // =====================

        messages.scrollTop =
            messages.scrollHeight;


    } catch (error) {

        loading.remove();

        addMessage(
            "assistant",
            "❌ Voice generation failed: " +
            error.message
        );

    }

}


// =====================================================
// IMAGE GENERATION
// =====================================================

async function generateImage(prompt) {

    const loading =
        addLoadingMessage(
            "Generating image..."
        );

    try {

        const response =
            await fetch(
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

        const data =
            await readApiResponse(
                response
            );

        loading.remove();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Image generation failed."
            );

        }

        if (!data.image) {

            throw new Error(
                "No image returned."
            );

        }

        addImageMessage(
            data.image
        );

    } catch (error) {

        loading.remove();

        addMessage(
            "assistant",
            "❌ Image generation error: " +
            error.message
        );

    }

}


// =====================================================
// IMAGE ANALYSIS
// =====================================================

async function analyzeImage() {

    const loading =
        addLoadingMessage(
            "Analyzing image..."
        );

    try {

        const formData =
            new FormData();

        formData.append(
            "image",
            selectedFile
        );

        const response =
            await fetch(
                "/api/analyze-image",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await readApiResponse(
                response
            );

        loading.remove();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Image analysis failed."
            );

        }

        addMessage(
            "assistant",
            data.reply ||
            "No analysis received."
        );

    } catch (error) {

        loading.remove();

        addMessage(
            "assistant",
            "❌ Image analysis error: " +
            error.message
        );

    }

}


// =====================================================
// ADD NORMAL MESSAGE
// =====================================================

function addMessage(
    role,
    text
) {

    if (emptyState) {
        emptyState.style.display =
            "none";
    }

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "message-row " +
        role;


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    // Prevent HTML injection
    bubble.textContent =
        text;


    row.appendChild(
        bubble
    );

    messages.appendChild(
        row
    );

    messages.scrollTop =
        messages.scrollHeight;

}


// =====================================================
// LOADING
// =====================================================

function addLoadingMessage(
    text = "Thinking..."
) {

    if (emptyState) {
        emptyState.style.display =
            "none";
    }

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "message-row assistant";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble loading";


    bubble.textContent =
        text;


    row.appendChild(
        bubble
    );

    messages.appendChild(
        row
    );

    messages.scrollTop =
        messages.scrollHeight;


    return row;
}


// =====================================================
// IMAGE MESSAGE
// =====================================================

function addImageMessage(
    imageData
) {

    if (emptyState) {
        emptyState.style.display =
            "none";
    }

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "message-row assistant";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    const image =
        document.createElement(
            "img"
        );


    if (
        imageData.startsWith(
            "http"
        )
    ) {

        image.src =
            imageData;

    } else {

        image.src =
            "data:image/png;base64," +
            imageData;

    }


    image.style.maxWidth =
        "100%";

    image.style.borderRadius =
        "12px";


    const download =
        document.createElement(
            "a"
        );

    download.href =
        image.src;

    download.download =
        "MY-AI-Image.png";

    download.textContent =
        "⬇️ Download Image";

    download.style.display =
        "inline-block";

    download.style.marginTop =
        "10px";

    download.style.padding =
        "8px 12px";

    download.style.textDecoration =
        "none";


    bubble.appendChild(
        image
    );

    bubble.appendChild(
        download
    );

    row.appendChild(
        bubble
    );

    messages.appendChild(
        row
    );

    messages.scrollTop =
        messages.scrollHeight;

}


// =====================================================
// FILE UPLOAD
// =====================================================

function openFile() {

    if (fileInput) {
        fileInput.click();
    }

}


function fileSelected(event) {

    const files =
        event.target.files;

    if (!files || !files.length) {
        return;
    }

    selectedFile =
        files[0];

    showToast(
        "📎 " +
        selectedFile.name +
        " attached"
    );

}


// =====================================================
// VOICE INPUT
// =====================================================

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

    recognition.continuous =
        false;


    showToast(
        "🎙️ Listening..."
    );


    recognition.start();


    recognition.onresult =
        function(event) {

            const text =
                event.results[0][0]
                    .transcript;

            userInput.value =
                text;

            handleInput(
                userInput
            );

        };


    recognition.onerror =
        function() {

            showToast(
                "❌ Voice input failed."
            );

        };

}


// =====================================================
// LOCAL USER
// =====================================================

function loadLocalUser() {

    try {

        const saved =
            localStorage.getItem(
                "my_ai_user"
            );

        if (saved) {

            currentUser =
                JSON.parse(saved);

        }

    } catch {

        currentUser =
            null;

    }

}


function updateProfileUI() {

    if (!currentUser) {
        return;
    }

    const name =
        currentUser.name ||
        "MY AI User";

    const avatar =
        name
            .charAt(0)
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

    const modalAvatar =
        document.getElementById(
            "modalAvatar"
        );

    const modalEmail =
        document.getElementById(
            "modalEmail"
        );


    if (profileName) {
        profileName.textContent =
            name;
    }

    if (profileAvatar) {
        profileAvatar.textContent =
            avatar;
    }

    if (modalName) {
        modalName.textContent =
            name;
    }

    if (modalAvatar) {
        modalAvatar.textContent =
            avatar;
    }

    if (
        modalEmail &&
        currentUser.email
    ) {

        modalEmail.textContent =
            currentUser.email;

    }

}


// =====================================================
// LOGIN
// =====================================================

function openLogin() {

    closeProfile();

    if (loginModal) {
        loginModal.style.display =
            "flex";
    }

}


function closeLogin() {

    if (loginModal) {
        loginModal.style.display =
            "none";
    }

}


function loginUser() {

    const nameInput =
        document.getElementById(
            "loginName"
        );

    const emailInput =
        document.getElementById(
            "loginEmail"
        );


    const name =
        nameInput
            ? nameInput.value.trim()
            : "";

    const email =
        emailInput
            ? emailInput.value.trim()
            : "";


    if (!name || !email) {

        showToast(
            "Please enter your name and email."
        );

        return;
    }


    currentUser = {
        name: name,
        email: email
    };


    localStorage.setItem(
        "my_ai_user",
        JSON.stringify(
            currentUser
        )
    );


    updateProfileUI();

    closeLogin();

    showToast(
        "✅ Welcome to MY AI"
    );

}


// =====================================================
// PROFILE
// =====================================================

function openProfile() {

    if (profileModal) {
        profileModal.style.display =
            "flex";
    }

}


function closeProfile() {

    if (profileModal) {
        profileModal.style.display =
            "none";
    }

}


// =====================================================
// CHAT HISTORY
// =====================================================

function saveCurrentChat() {

    if (!currentChat.length) {
        return;
    }

    try {

        let history =
            JSON.parse(
                localStorage.getItem(
                    "my_ai_chats"
                ) || "[]"
            );


        const title =
            currentChat.find(
                item =>
                    item.role === "user"
            )?.content ||
            "New Chat";


        history = history.filter(
            item =>
                item.title !== title
        );


        history.unshift({
            title: title.substring(
                0,
                60
            ),
            messages: currentChat
        });


        history =
            history.slice(
                0,
                30
            );


        localStorage.setItem(
            "my_ai_chats",
            JSON.stringify(
                history
            )
        );


        loadHistory();

    } catch (error) {

        console.log(
            "History save error:",
            error
        );

    }

}


// =====================================================
// LOAD HISTORY
// =====================================================

function loadHistory() {

    if (!chatHistory) {
        return;
    }

    chatHistory.innerHTML = "";


    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    "my_ai_chats"
                ) || "[]"
            );


        history.forEach(
            (chat, index) => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.className =
                    "history-item";


                button.textContent =
                    chat.title ||
                    "Chat " +
                    (index + 1);


                button.onclick =
                    function() {

                        openSavedChat(
                            index
                        );

                    };


                chatHistory.appendChild(
                    button
                );

            }
        );

    } catch {

        console.log(
            "Could not load history."
        );

    }

}


// =====================================================
// OPEN SAVED CHAT
// =====================================================

function openSavedChat(index) {

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    "my_ai_chats"
                ) || "[]"
            );


        const chat =
            history[index];

        if (
            !chat ||
            !Array.isArray(
                chat.messages
            )
        ) {
            return;
        }


        currentChat =
            chat.messages;


        messages.innerHTML = "";


        currentChat.forEach(
            message => {

                addMessage(
                    message.role,
                    message.content
                );

            }
        );


        if (
            window.innerWidth <= 800
        ) {

            toggleSidebar();

        }

    } catch {

        showToast(
            "Could not open chat."
        );

    }

}


// =====================================================
// CLEAR HISTORY
// =====================================================

function clearChatHistory() {

    localStorage.removeItem(
        "my_ai_chats"
    );

    currentChat = [];

    newChat();

    loadHistory();

    closeProfile();

    showToast(
        "🗑️ Chat history cleared"
    );

}


// =====================================================
// TOAST
// =====================================================

function showToast(text) {

    if (!toast) return;

    toast.textContent =
        text;

    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}
