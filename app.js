const messages = document.getElementById("messages");
const input = document.getElementById("userInput");
const fileInput = document.getElementById("fileInput");

let currentFeature = "chat";


// ===============================
// SEND MESSAGE TO MY AI
// ===============================

async function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    // Show user message
    addMessage(text, "user");

    input.value = "";

    // Show loading
    const loading = document.createElement("div");

    loading.className = "message ai-message";
    loading.textContent = "🤖 Thinking...";

    messages.appendChild(loading);

    messages.scrollTop = messages.scrollHeight;


    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: text
            })

        });


        const data = await response.json();


        // Remove loading
        loading.remove();


        if (data.reply) {

            addMessage(data.reply, "ai");

        } else {

            addMessage(
                "❌ " + (data.error || "Something went wrong."),
                "ai"
            );

        }

    } catch (error) {

        loading.remove();

        addMessage(
            "❌ Cannot connect to MY AI server. Please try again.",
            "ai"
        );

        console.error(error);

    }

}


// ===============================
// ADD MESSAGE
// ===============================

function addMessage(text, type) {

    const div = document.createElement("div");

    div.className =
        "message " +
        (type === "user"
            ? "user-message"
            : "ai-message");

    div.textContent = text;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

}


// ===============================
// ENTER TO SEND
// ===============================

function handleEnter(event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();

    }

}


// ===============================
// NEW CHAT
// ===============================

function newChat() {

    messages.innerHTML = "";

    input.value = "";

    currentFeature = "chat";

    document.getElementById("pageTitle").textContent = "MY AI";

    document.getElementById("pageSubtitle").textContent =
        "Your personal AI assistant";

    input.placeholder = "Message MY AI...";

}


// ===============================
// FEATURE SELECT
// ===============================

function selectFeature(feature) {

    currentFeature = feature;


    const names = {

        chat: [
            "AI Chat",
            "Ask anything"
        ],

        image: [
            "Create Image",
            "Generate images with AI"
        ],

        analyze: [
            "Analyze Image",
            "Understand your images"
        ],

        file: [
            "Analyze File",
            "Analyze PDF and documents"
        ],

        voice: [
            "Voice",
            "Talk with MY AI"
        ],

        coding: [
            "Coding",
            "Your AI coding assistant"
        ],

        study: [
            "Study",
            "Learn with MY AI"
        ],

        translate: [
            "Translate",
            "Translate between languages"
        ],

        summarize: [
            "Summarize",
            "Summarize your text"
        ],

        math: [
            "Math Solver",
            "Solve mathematical problems"
        ],

        search: [
            "Web Search",
            "Search the web with AI"
        ],

        ocr: [
            "OCR",
            "Read text from images"
        ],

        notes: [
            "AI Notes",
            "Create smart notes"
        ],

        editing: [
            "Edit Image",
            "Edit images with AI"
        ]

    };


    const data = names[feature];

    if (!data) return;


    document.getElementById("pageTitle").textContent =
        data[0];

    document.getElementById("pageSubtitle").textContent =
        data[1];


    // Change placeholder

    const placeholders = {

        chat: "Message MY AI...",

        image: "Describe the image you want...",

        analyze: "Upload an image to analyze...",

        file: "Upload a PDF or file...",

        voice: "Speak with MY AI...",

        coding: "Ask a coding question...",

        study: "What do you want to learn?",

        translate: "Enter text to translate...",

        summarize: "Paste text to summarize...",

        math: "Enter a math problem...",

        search: "What do you want to search?",

        ocr: "Upload an image with text...",

        notes: "What note should I create?",

        editing: "Upload an image to edit..."

    };


    input.placeholder =
        placeholders[feature] || "Message MY AI...";


    // Close mobile sidebar

    if (window.innerWidth <= 800) {

        document
            .getElementById("sidebar")
            .classList.remove("open");

    }

}


// ===============================
// MOBILE SIDEBAR
// ===============================

function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle("open");

}


// ===============================
// OPEN FILE
// ===============================

function openFile() {

    fileInput.click();

}


// ===============================
// FILE SELECTED
// ===============================

function fileSelected(event) {

    const file = event.target.files[0];

    if (!file) return;


    addMessage(
        "📎 Selected file: " + file.name,
        "user"
    );


    // Show file information

    setTimeout(() => {

        addMessage(
            "📄 File received: " +
            file.name +
            "\n\nFile analysis will be connected to the MY AI backend next.",
            "ai"
        );

    }, 500);

}


// ===============================
// VOICE INPUT
// ===============================

function startVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        addMessage(
            "🎙️ Voice input is not supported in this browser.",
            "ai"
        );

        return;

    }


    const recognition =
        new SpeechRecognition();


    recognition.lang = "bn-BD";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = function () {

        input.placeholder = "🎙️ Listening...";

    };


    recognition.onresult = function (event) {

        const text =
            event.results[0][0].transcript;

        input.value = text;

        input.placeholder =
            "Message MY AI...";

    };


    recognition.onerror = function () {

        input.placeholder =
            "Message MY AI...";

        addMessage(
            "❌ Voice input failed. Please try again.",
            "ai"
        );

    };


    recognition.onend = function () {

        input.placeholder =
            "Message MY AI...";

    };


    recognition.start();

}


// ===============================
// INITIAL MESSAGE
// ===============================

function showWelcomeMessage() {

    if (messages.children.length === 0) {

        // Keep chat clean initially.
        // User can start chatting immediately.

    }

}


// ===============================
// START APP
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showWelcomeMessage();

        input.focus();

    }
);
