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


    // IMAGE MODE
    if (currentFeature === "image") {

        input.value = "";

        generateImage(text);

        return;
    }


    // NORMAL CHAT

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

            typeMessage(
                data.reply
            );

        } else {

            addMessage(
                "❌ " +
                (data.error ||
                    "Something went wrong."),
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

    const div =
        document.createElement("div");

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


            setTimeout(
                type,
                speed
            );

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

        div.classList.add(
            "thinking"
        );
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


    // Mobile sidebar close

    if (
        window.innerWidth <= 800
    ) {

        const sidebar =
            document.getElementById(
                "sidebar"
            );

        if (sidebar) {

            sidebar.classList.remove(
                "open"
            );
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


    const loading =
        addMessage(
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


    saveButton.href =
        img.src;


    saveButton.download =
        "MY-AI-generated-image.png";


    saveButton.textContent =
        "⬇️ Save Image";


    wrapper.appendChild(img);

    wrapper.appendChild(
        document.createElement("br")
    );

    wrapper.appendChild(
        saveButton
    );


    messages.appendChild(
        wrapper
    );


    messages.scrollTop =
        messages.scrollHeight;
}


// ========================================
// FILE UPLOAD
// ========================================

function openFile() {

    if (fileInput) {

        fileInput.click();
    }
}


function fileSelected(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    addMessage(
        "📎 " + file.name,
        "user"
    );


    // Image preview

    if (
        file.type.startsWith("image/")
    ) {

        const reader =
            new FileReader();


        reader.onload =
            function (e) {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "message ai-message image-result";


                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    e.target.result;


                img.alt =
                    file.name;


                wrapper.appendChild(img);


                messages.appendChild(
                    wrapper
                );


                messages.scrollTop =
                    messages.scrollHeight;


                addMessage(
                    "📸 Image received. Image analysis will be connected to the MY AI backend next.",
                    "ai"
                );
            };


        reader.readAsDataURL(file);

    } else {

        addMessage(
            "📄 " +
            file.name +
            " received. File analysis will be connected to the MY AI backend next.",
            "ai"
        );
    }


    // Reset input so same file can be selected again

    event.target.value = "";
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


    recognition.lang =
        "bn-BD";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


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
                "Message MY AI...";
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
        document.getElementById(
            "sidebar"
        );


    if (sidebar) {

        sidebar.classList.toggle(
            "open"
        );
    }
}


// ========================================
// CLOSE SIDEBAR WHEN CLICKING OUTSIDE
// ========================================

document.addEventListener(
    "click",
    function (event) {

        if (
            window.innerWidth > 800
        ) return;


        const sidebar =
            document.getElementById(
                "sidebar"
            );


        if (!sidebar) return;


        const menuButton =
            document.querySelector(
                ".menu-btn"
            );


        if (
            sidebar.classList.contains(
                "open"
            ) &&
            !sidebar.contains(event.target) &&
            !(
                menuButton &&
                menuButton.contains(event.target)
            )
        ) {

            sidebar.classList.remove(
                "open"
            );
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
            body: JSON.stringify({
                message: text
            })

        });


        const data = await response.json();

        loading.remove();


        if (data.reply) {

            typeMessage(data.reply);

        } else {

            addMessage(
                "❌ " + (data.error || "Something went wrong."),
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


// ===============================
// TYPING EFFECT
// ===============================

function typeMessage(text) {

    const div = document.createElement("div");

    div.className = "message ai-message";

    messages.appendChild(div);

    let index = 0;

    const speed = 12;


    function type() {

        if (index < text.length) {

            div.textContent += text.charAt(index);

            index++;

            messages.scrollTop =
                messages.scrollHeight;

            setTimeout(type, speed);

        }

    }

    type();

}


// ===============================
// ADD MESSAGE
// ===============================

function addMessage(text, type, temporary = false) {

    const div = document.createElement("div");

    div.className =
        "message " +
        (type === "user"
            ? "user-message"
            : "ai-message");

    div.textContent = text;

    if (temporary) {
        div.classList.add("thinking");
    }

    messages.appendChild(div);

    messages.scrollTop =
        messages.scrollHeight;

    return div;

}


// ===============================
// ENTER TO SEND
// ===============================

function handleEnter(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

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

    document.getElementById("pageTitle").textContent =
        "MY AI";

    document.getElementById("pageSubtitle").textContent =
        "Your personal AI assistant";

    input.placeholder =
        "Message MY AI...";

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

        editing: "Describe your image edit..."

    };


    input.placeholder =
        placeholders[feature] ||
        "Message MY AI...";


    if (window.innerWidth <= 800) {

        document
            .getElementById("sidebar")
            .classList.remove("open");

    }

}


// ===============================
// IMAGE GENERATION
// ===============================

async function generateImage(prompt) {

    if (!prompt) return;


    addMessage(
        "🎨 " + prompt,
        "user"
    );


    const loading = addMessage(
        "🎨 Creating your image...",
        "ai",
        true
    );


    try {

        const response = await fetch(
            "/api/generate-image",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
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
                (data.error ||
                    "Image generation failed."),
                "ai"
            );

        }

    } catch (error) {

        loading.remove();

        addMessage(
            "❌ Could not generate image.",
            "ai"
        );

        console.error(error);

    }

}


// ===============================
// SHOW GENERATED IMAGE
// ===============================

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


    const download =
        document.createElement("a");

    download.href =
        img.src;

    download.download =
        "my-ai-image.png";

    download.textContent =
        "⬇️ Save Image";


    wrapper.appendChild(img);

    wrapper.appendChild(
        document.createElement("br")
    );

    wrapper.appendChild(download);

    messages.appendChild(wrapper);

    messages.scrollTop =
        messages.scrollHeight;

}


// ===============================
// FILE
// ===============================

function openFile() {

    fileInput.click();

}


function fileSelected(event) {

    const file =
        event.target.files[0];

    if (!file) return;


    addMessage(
        "📎 " + file.name,
        "user"
    );


    addMessage(
        "📄 File received. File analysis backend will be connected next.",
        "ai"
    );

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


    recognition.lang =
        "bn-BD";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


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
                "Message MY AI...";

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
                "Message MY AI...";

        };


    recognition.start();

}


// ===============================
// SIDEBAR
// ===============================

function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle("open");

}


// ===============================
// IMAGE TILE INPUT
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        input.focus();


        // Intercept send button for image mode

        const originalSend =
            document.querySelector(
                ".send-btn"
            );


        if (originalSend) {

            originalSend.addEventListener(
                "click",
                function () {

                    if (
                        currentFeature ===
                        "image"
                    ) {

                        const prompt =
                            input.value.trim();

                        if (!prompt) return;

                        input.value = "";

                        generateImage(
                            prompt
                        );

                    }

                }
            );

        }

    }
);
