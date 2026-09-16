// =========================================================
// MY AI - FRONTEND
// =========================================================

let currentFeature = "chat";
let selectedFile = null;


// =========================================================
// FEATURES
// =========================================================

const FEATURES = {
    chat: {
        title: "AI Chat",
        subtitle: "Your personal AI assistant"
    },
    image: {
        title: "Create Image",
        subtitle: "Generate images with AI"
    },
    analyze: {
        title: "Analyze Image",
        subtitle: "Understand images with AI"
    },
    file: {
        title: "Analyze File",
        subtitle: "Analyze your documents"
    },
    voice: {
        title: "Voice",
        subtitle: "Talk with MY AI"
    },
    coding: {
        title: "Coding",
        subtitle: "Build and debug with AI"
    },
    study: {
        title: "Study",
        subtitle: "Learn with MY AI"
    },
    translate: {
        title: "Translate",
        subtitle: "Translate any language"
    },
    summarize: {
        title: "Summarize",
        subtitle: "Summarize text quickly"
    },
    math: {
        title: "Math Solver",
        subtitle: "Solve math problems"
    },
    search: {
        title: "Web Search",
        subtitle: "Search with AI"
    },
    ocr: {
        title: "OCR",
        subtitle: "Read text from images"
    },
    notes: {
        title: "AI Notes",
        subtitle: "Create smart notes"
    },
    editing: {
        title: "Edit Image",
        subtitle: "AI image editing"
    }
};


// =========================================================
// SAFE API RESPONSE
// =========================================================

async function readApiResponse(response) {

    const contentType =
        response.headers.get("content-type") || "";

    const text =
        await response.text();

    // JSON response
    if (
        contentType.includes("application/json")
    ) {
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(
                "Server returned invalid JSON."
            );
        }
    }

    // Server returned HTML or something else
    if (
        text.trim().startsWith("<")
    ) {
        throw new Error(
            `Server returned an HTML page instead of JSON. HTTP ${response.status}`
        );
    }

    throw new Error(
        text.trim() ||
        `Server error. HTTP ${response.status}`
    );
}


// =========================================================
// SELECT FEATURE
// =========================================================

function selectFeature(feature) {

    currentFeature = feature;

    const data =
        FEATURES[feature] ||
        FEATURES.chat;

    const title =
        document.getElementById("pageTitle");

    const subtitle =
        document.getElementById("pageSubtitle");

    if (title) {
        title.textContent = data.title;
    }

    if (subtitle) {
        subtitle.textContent = data.subtitle;
    }

    const input =
        document.getElementById("userInput");

    if (input) {

        input.placeholder =
            feature === "image"
                ? "Describe the image you want..."
                : "Message MY AI...";

        input.focus();
    }

    closeSidebar();
}


// =========================================================
// NEW CHAT
// =========================================================

function newChat() {

    const messages =
        document.getElementById("messages");

    if (!messages) return;

    messages.innerHTML = `
        <div class="empty-state" id="emptyState">
            <div class="empty-icon">🤖</div>
            <h3>How can I help?</h3>
            <p>Choose a tool above or send me a message.</p>
        </div>
    `;

    selectFeature("chat");
}


// =========================================================
// ENTER
// =========================================================

function handleEnter(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {
        event.preventDefault();
        sendMessage();
    }
}


// =========================================================
// AUTO RESIZE
// =========================================================

function autoResize(textarea) {

    textarea.style.height = "auto";

    textarea.style.height =
        Math.min(
            textarea.scrollHeight,
            130
        ) + "px";
}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

    const input =
        document.getElementById("userInput");

    if (!input) return;

    const message =
        input.value.trim();

    if (!message) return;


    input.value = "";

    autoResize(input);


    if (currentFeature === "image") {

        await generateImage(message);

        return;
    }


    addMessage(
        message,
        "user"
    );


    const typingId =
        showTyping();


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
                        message,
                        feature:
                            currentFeature
                    })
                }
            );


        const data =
            await readApiResponse(
                response
            );


        removeTyping(typingId);


        if (!response.ok) {

            throw new Error(
                data.error ||
                `AI request failed. HTTP ${response.status}`
            );
        }


        addMessage(
            data.reply ||
            "I couldn't generate a response.",
            "ai"
        );


    } catch (error) {

        removeTyping(typingId);

        addMessage(
            "❌ " + error.message,
            "ai"
        );
    }
}


// =========================================================
// ADD MESSAGE
// =========================================================

function addMessage(text, type) {

    const messages =
        document.getElementById("messages");

    if (!messages) return;


    const empty =
        document.getElementById(
            "emptyState"
        );

    if (empty) {
        empty.remove();
    }


    const row =
        document.createElement("div");

    row.className =
        "message-row " +
        (type === "user"
            ? "user"
            : "ai");


    const bubble =
        document.createElement("div");

    bubble.className =
        "message " +
        (type === "user"
            ? "user"
            : "ai");


    if (type === "ai") {

        // Instant response
        // No slow character-by-character animation
        bubble.textContent = text;

    } else {

        bubble.textContent = text;
    }


    row.appendChild(bubble);

    messages.appendChild(row);

    scrollToBottom();
}


// =========================================================
// TYPING INDICATOR
// =========================================================

function showTyping() {

    const messages =
        document.getElementById(
            "messages"
        );

    const id =
        "typing-" +
        Date.now();


    const row =
        document.createElement("div");

    row.className =
        "message-row ai";

    row.id = id;


    row.innerHTML = `
        <div class="message ai">
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;


    messages.appendChild(row);

    scrollToBottom();

    return id;
}


function removeTyping(id) {

    const element =
        document.getElementById(id);

    if (element) {
        element.remove();
    }
}


// =========================================================
// SCROLL
// =========================================================

function scrollToBottom() {

    const messages =
        document.getElementById(
            "messages"
        );

    if (!messages) return;

    requestAnimationFrame(() => {

        messages.scrollTop =
            messages.scrollHeight;
    });
}


// =========================================================
// IMAGE GENERATION
// =========================================================

async function generateImage(prompt) {

    addMessage(
        "🖼️ " + prompt,
        "user"
    );


    const typingId =
        showTyping();


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
                        prompt
                    })
                }
            );


        const data =
            await readApiResponse(
                response
            );


        removeTyping(typingId);


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Image generation failed. HTTP ${response.status}`
            );
        }


        if (
            !data.image ||
            !data.mime_type
        ) {

            throw new Error(
                "Server did not return an image."
            );
        }


        showGeneratedImage(
            data.image,
            data.mime_type
        );


    } catch (error) {

        removeTyping(typingId);

        addMessage(
            "❌ " + error.message,
            "ai"
        );
    }
}


// =========================================================
// SHOW IMAGE
// =========================================================

function showGeneratedImage(
    base64,
    mimeType
) {

    const messages =
        document.getElementById(
            "messages"
        );


    const row =
        document.createElement("div");

    row.className =
        "message-row ai";


    const bubble =
        document.createElement("div");

    bubble.className =
        "message ai";


    const image =
        document.createElement("img");

    image.src =
        `data:${mimeType};base64,${base64}`;

    image.alt =
        "Generated image";


    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";


    const save =
        document.createElement("button");

    save.className =
        "image-save";

    save.textContent =
        "⬇ Save Image";


    save.onclick = () => {

        const link =
            document.createElement("a");

        link.href =
            image.src;

        link.download =
            "my-ai-image.png";

        link.click();
    };


    actions.appendChild(save);

    bubble.appendChild(image);

    bubble.appendChild(actions);

    row.appendChild(bubble);

    messages.appendChild(row);

    scrollToBottom();
}


// =========================================================
// FILE
// =========================================================

function openFile() {

    const input =
        document.getElementById(
            "fileInput"
        );

    if (input) {
        input.click();
    }
}


function fileSelected(event) {

    const file =
        event.target.files[0];

    if (!file) return;

    selectedFile = file;


    if (
        file.type &&
        file.type.startsWith("image/")
    ) {

        analyzeImage(
            file,
            currentFeature === "ocr"
        );

    } else {

        addMessage(
            `📄 ${file.name}\n\nFile analysis is not connected yet.`,
            "ai"
        );
    }
}


// =========================================================
// IMAGE ANALYSIS / OCR
// =========================================================

async function analyzeImage(
    file,
    isOCR = false
) {

    addMessage(
        `📎 ${file.name}`,
        "user"
    );


    const typingId =
        showTyping();


    try {

        const formData =
            new FormData();

        formData.append(
            "image",
            file
        );

        formData.append(
            "ocr",
            isOCR
                ? "true"
                : "false"
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


        removeTyping(typingId);


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Image analysis failed. HTTP ${response.status}`
            );
        }


        addMessage(
            data.reply ||
            "No analysis result.",
            "ai"
        );


    } catch (error) {

        removeTyping(typingId);

        addMessage(
            "❌ " + error.message,
            "ai"
        );
    }
}


// =========================================================
// VOICE
// =========================================================

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

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;


    recognition.onstart = () => {

        addMessage(
            "🎙️ Listening...",
            "ai"
        );
    };


    recognition.onresult =
        (event) => {

            const text =
                event.results[0][0]
                    .transcript;


            const input =
                document.getElementById(
                    "userInput"
                );


            input.value = text;

            autoResize(input);

            input.focus();
        };


    recognition.onerror = () => {

        addMessage(
            "❌ Voice input failed. Please try again.",
            "ai"
        );
    };


    recognition.start();
}


// =========================================================
// SIDEBAR
// =========================================================

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (!sidebar || !overlay) return;


    sidebar.classList.toggle("open");

    overlay.classList.toggle("show");
}


function closeSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {
        sidebar.classList.remove(
            "open"
        );
    }

    if (overlay) {
        overlay.classList.remove(
            "show"
        );
    }
}


// =========================================================
// START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        selectFeature("chat");

        const input =
            document.getElementById(
                "userInput"
            );

        if (input) {
            input.focus();
        }
    }
);
