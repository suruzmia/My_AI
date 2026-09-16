const messages = document.getElementById("messages");
const input = document.getElementById("userInput");
const fileInput = document.getElementById("fileInput");

let currentFeature = "chat";


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    const text = input.value.trim();

    if (!text) return;


    // IMAGE GENERATION
    if (currentFeature === "image") {

        input.value = "";

        generateImage(text);

        return;
    }


    addMessage(text, "user");

    input.value = "";


    const loading = addMessage(
        "🤖 Thinking",
        "ai",
        true
    );


    try {

        const response = await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: text
                })
            }
        );


        const data = await response.json();

        loading.remove();


        if (data.reply) {

            typeMessage(data.reply);

        } else {

            addMessage(
                "❌ " +
                (data.error || "Something went wrong."),
                "ai"
            );
        }


    } catch (error) {

        loading.remove();

        addMessage(
            "❌ Cannot connect to MY AI server.",
            "ai"
        );

        console.error(error);
    }
}


// ========================================
// TYPING EFFECT
// ========================================

function typeMessage(text) {

    const div = document.createElement("div");

    div.className =
        "message ai-message";

    messages.appendChild(div);


    let index = 0;

    const speed = 10;


    function type() {

        if (index < text.length) {

            div.textContent +=
                text.charAt(index);

            index++;

            messages.scrollTop =
                messages.scrollHeight;

            setTimeout(type, speed);

        }
    }

    type();
}


// ========================================
// ADD MESSAGE
// ========================================

function addMessage(
    text,
    type,
    temporary = false
) {

    const div =
        document.createElement("div");


    div.className =
        "message " +
        (
            type === "user"
                ? "user-message"
                : "ai-message"
        );


    div.textContent = text;


    if (temporary) {
        div.classList.add("thinking");
    }


    messages.appendChild(div);

    messages.scrollTop =
        messages.scrollHeight;


    return div;
}


// ========================================
// ENTER TO SEND
// ========================================

function handleEnter(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


// ========================================
// NEW CHAT
// ========================================

function newChat() {

    messages.innerHTML = "";

    input.value = "";

    currentFeature = "chat";


    document.getElementById(
        "pageTitle"
    ).textContent = "MY AI";


    document.getElementById(
        "pageSubtitle"
    ).textContent =
        "Your personal AI assistant";


    input.placeholder =
        "Message MY AI...";
}


// ========================================
// FEATURE SELECT
// ========================================

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


    document.getElementById(
        "pageTitle"
    ).textContent = data[0];


    document.getElementById(
        "pageSubtitle"
    ).textContent = data[1];


    const placeholders = {

        chat:
            "Message MY AI...",

        image:
            "Describe the image you want...",

        analyze:
            "Upload an image to analyze...",

        file:
            "Upload a PDF or file...",

        voice:
            "Speak with MY AI...",

        coding:
            "Ask a coding question...",

        study:
            "What do you want to learn?",

        translate:
            "Enter text to translate...",

        summarize:
            "Paste text to summarize...",

        math:
            "Enter a math problem...",

        search:
            "What do you want to search?",

        ocr:
            "Upload an image with text...",

        notes:
            "What note should I create?",

        editing:
            "Describe your image edit..."
    };


    input.placeholder =
        placeholders[feature] ||
        "Message MY AI...";


    if (window.innerWidth <= 800) {

        const sidebar =
            document.getElementById("sidebar");

        if (sidebar) {
            sidebar.classList.remove("open");
        }
    }
}


// ========================================
// IMAGE GENERATION
// ========================================

async function generateImage(prompt) {

    addMessage(
        "🎨 " + prompt,
        "user"
    );


    const loading = addMessage(
        "🎨 Creating your image",
        "ai",
        true
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
            await response.json();


        loading.remove();


        if (data.image) {

            showGeneratedImage(
                data.image,
                data.mime_type
            );

        } else {

            addMessage(
                "❌ " +
                (
                    data.error ||
                    "Image generation failed."
                ),
                "ai"
            );
        }


    } catch (error) {

        loading.remove();

        addMessage(
            "❌ Could not connect to image generation server.",
            "ai"
        );

        console.error(error);
    }
}


// ========================================
// SHOW GENERATED IMAGE
// ========================================

function showGeneratedImage(
    base64,
    mimeType
) {

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message ai-message image-result";


    const img =
        document.createElement("img");


    img.src =
        "data:" +
        mimeType +
        ";base64," +
        base64;


    img.alt =
        "MY AI generated image";


    const saveButton =
        document.createElement("a");


    saveButton.href = img.src;

    saveButton.download =
        "MY-AI-generated-image.png";

    saveButton.textContent =
        "⬇️ Save Image";


    wrapper.appendChild(img);

    wrapper.appendChild(
        document.createElement("br")
    );

    wrapper.appendChild(saveButton);


    messages.appendChild(wrapper);

    messages.scrollTop =
        messages.scrollHeight;
}


// ========================================
// FILE BUTTON
// ========================================

function openFile() {

    if (fileInput) {
        fileInput.click();
    }
}


// ========================================
// FILE SELECTED
// ========================================

function fileSelected(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    // IMAGE ANALYSIS
    if (
        currentFeature === "analyze" &&
        file.type.startsWith("image/")
    ) {

        analyzeImage(file);

        event.target.value = "";

        return;
    }


    // Normal image upload
    if (file.type.startsWith("image/")) {

        showLocalImage(file);

        addMessage(
            "📸 Image received.",
            "ai"
        );

    } else {

        addMessage(
            "📄 " +
            file.name +
            " received. File analysis will be added next.",
            "ai"
        );
    }


    event.target.value = "";
}


// ========================================
// IMAGE ANALYSIS
// ========================================

async function analyzeImage(file) {

    addMessage(
        "📸 " + file.name,
        "user"
    );


    showLocalImage(file);


    const loading =
        addMessage(
            "🔎 Analyzing your image",
            "ai",
            true
        );


    try {

        const formData =
            new FormData();


        formData.append(
            "image",
            file
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
            await response.json();


        loading.remove();


        if (data.reply) {

            typeMessage(
                data.reply
            );

        } else {

            addMessage(
                "❌ " +
                (
                    data.error ||
                    "Image analysis failed."
                ),
                "ai"
            );
        }


    } catch (error) {

        loading.remove();

        addMessage(
            "❌ Could not connect to image analysis server.",
            "ai"
        );

        console.error(error);
    }
}


// ========================================
// LOCAL IMAGE PREVIEW
// ========================================

function showLocalImage(file) {

    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            const wrapper =
                document.createElement("div");


            wrapper.className =
                "message ai-message image-result";


            const img =
                document.createElement("img");


            img.src =
                event.target.result;


            img.alt =
                file.name;


            wrapper.appendChild(img);


            messages.appendChild(
                wrapper
            );


            messages.scrollTop =
                messages.scrollHeight;
        };


    reader.readAsDataURL(file);
}


// ========================================
// VOICE INPUT
// ========================================

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


    recognition.onstart =
        function () {

            input.placeholder =
                "🎙️ Listening...";
        };


    recognition.onresult =
        function (event) {

            input.value =
                event.results[0][0]
                    .transcript;

            input.placeholder =
                currentFeature === "image"
                    ? "Describe the image you want..."
                    : "Message MY AI...";
        };


    recognition.onerror =
        function () {

            input.placeholder =
                "Message MY AI...";

            addMessage(
                "❌ Voice input failed.",
                "ai"
            );
        };


    recognition.onend =
        function () {

            input.placeholder =
                currentFeature === "image"
                    ? "Describe the image you want..."
                    : "Message MY AI...";
        };


    recognition.start();
}


// ========================================
// SIDEBAR
// ========================================

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");


    if (sidebar) {

        sidebar.classList.toggle("open");
    }
}


// ========================================
// CLOSE SIDEBAR
// ========================================

document.addEventListener(
    "click",
    function (event) {

        if (window.innerWidth > 800)
            return;


        const sidebar =
            document.getElementById("sidebar");


        const menuButton =
            document.querySelector(".menu-btn");


        if (!sidebar)
            return;


        if (
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !(
                menuButton &&
                menuButton.contains(event.target)
            )
        ) {

            sidebar.classList.remove("open");
        }
    }
);


// ========================================
// STARTUP
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (input) {
            input.focus();
        }

    }
);
