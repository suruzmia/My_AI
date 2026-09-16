const messages = document.getElementById("messages");
const input = document.getElementById("userInput");

let currentFeature = "chat";


function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    addMessage(text, "user");

    input.value = "";

    setTimeout(() => {

        addMessage(
            "👋 Hello! I'm MY AI. AI backend connect করলে আমি আপনার প্রশ্নের উত্তর দিতে পারব.",
            "ai"
        );

    }, 600);
}


function addMessage(text, type) {

    const div = document.createElement("div");

    div.className =
        "message " +
        (type === "user" ? "user-message" : "ai-message");

    div.textContent = text;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
}


function handleEnter(event) {

    if (event.key === "Enter") {
        sendMessage();
    }

}


function newChat() {

    messages.innerHTML = "";

    input.value = "";

    document.getElementById("pageTitle").textContent = "MY AI";
    document.getElementById("pageSubtitle").textContent =
        "Your personal AI assistant";

    currentFeature = "chat";

}


function selectFeature(feature) {

    currentFeature = feature;

    const names = {

        chat: ["AI Chat", "Ask anything"],

        image: ["Create Image", "Generate an image with AI"],

        analyze: ["Analyze Image", "Upload an image to analyze"],

        file: ["Analyze File", "Analyze PDF or documents"],

        voice: ["Voice", "Talk with MY AI"],

        coding: ["Coding", "Your AI coding assistant"],

        study: ["Study", "Learn with MY AI"],

        translate: ["Translate", "Translate between languages"],

        summarize: ["Summarize", "Summarize your text"],

        math: ["Math Solver", "Solve mathematical problems"],

        search: ["Web Search", "Search the web with AI"],

        ocr: ["OCR", "Read text from images"],

        notes: ["AI Notes", "Create smart notes"],

        editing: ["Edit Image", "Edit images with AI"]

    };


    const data = names[feature];

    if (!data) return;

    document.getElementById("pageTitle").textContent = data[0];

    document.getElementById("pageSubtitle").textContent = data[1];

    input.placeholder = "Ask MY AI...";

    if (window.innerWidth <= 800) {
        document.getElementById("sidebar").classList.remove("open");
    }

}


function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle("open");

}


function openFile() {

    document.getElementById("fileInput").click();

}


function fileSelected(event) {

    const file = event.target.files[0];

    if (!file) return;

    addMessage(
        "📎 Selected file: " + file.name,
        "user"
    );

}


function startVoice() {

    if (!("webkitSpeechRecognition" in window)) {

        addMessage(
            "🎙️ Voice input is not supported in this browser.",
            "ai"
        );

        return;
    }


    const recognition =
        new webkitSpeechRecognition();

    recognition.lang = "bn-BD";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = function () {

        input.placeholder = "Listening...";

    };


    recognition.onresult = function (event) {

        const text =
            event.results[0][0].transcript;

        input.value = text;

        input.placeholder = "Message MY AI...";

    };


    recognition.onerror = function () {

        input.placeholder = "Message MY AI...";

    };


    recognition.start();

}
