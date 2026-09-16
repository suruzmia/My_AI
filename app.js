/* =========================================================
   MY AI - FRONTEND JAVASCRIPT
   ========================================================= */

const messages = document.getElementById("messages");
const input = document.getElementById("userInput");
const fileInput = document.getElementById("fileInput");

let currentFeature = "chat";
let isProcessing = false;


/* =========================================================
   FEATURE DATA
   ========================================================= */

const features = {

    chat: {
        title: "MY AI",
        subtitle: "Your personal AI assistant",
        placeholder: "Message MY AI..."
    },

    image: {
        title: "Create Image",
        subtitle: "Generate images with AI",
        placeholder: "Describe the image you want..."
    },

    analyze: {
        title: "Analyze Image",
        subtitle: "Understand your images",
        placeholder: "Upload an image to analyze..."
    },

    file: {
        title: "Analyze File",
        subtitle: "Analyze PDFs and documents",
        placeholder: "Upload a PDF or file..."
    },

    voice: {
        title: "Voice",
        subtitle: "Talk with MY AI",
        placeholder: "Type or use the microphone..."
    },

    coding: {
        title: "Coding",
        subtitle: "Your AI coding assistant",
        placeholder: "Ask a coding question..."
    },

    study: {
        title: "Study",
        subtitle: "Learn with MY AI",
        placeholder: "What do you want to learn?"
    },

    translate: {
        title: "Translate",
        subtitle: "Translate between languages",
        placeholder: "Enter text to translate..."
    },

    summarize: {
        title: "Summarize",
        subtitle: "Make text shorter and clearer",
        placeholder: "Paste text to summarize..."
    },

    math: {
        title: "Math Solver",
        subtitle: "Solve mathematical problems",
        placeholder: "Enter a math problem..."
    },

    search: {
        title: "Web Search",
        subtitle: "Search the web with AI",
        placeholder: "What do you want to search?"
    },

    ocr: {
        title: "OCR",
        subtitle: "Read text from images",
        placeholder: "Upload an image with text..."
    },

    notes: {
        title: "AI Notes",
        subtitle: "Create smart notes",
        placeholder: "What note should I create?"
    },

    editing: {
        title: "Edit Image",
        subtitle: "Edit images with AI",
        placeholder: "Describe your image edit..."
    }

};


/* =========================================================
   SELECT FEATURE
   ========================================================= */

function selectFeature(feature) {

    if (!features[feature]) {
        return;
    }

    currentFeature = feature;

    const data = features[feature];

    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    if (pageTitle) {
        pageTitle.textContent = data.title;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = data.subtitle;
    }

    if (input) {
        input.placeholder = data.placeholder;
        input.value = "";
        autoResize(input);
    }

    /*
     * Image analysis / OCR automatically opens
     * the file picker when selected.
     */
    if (feature === "analyze" || feature === "ocr") {
        setTimeout(() => {
            openFile();
        }, 100);
    }

    /*
     * Close mobile sidebar
     */
    if (window.innerWidth <= 700) {

        const sidebar = document.getElementById("sidebar");

        if (sidebar) {
            sidebar.classList.remove("open");
        }
    }

}


/* =========================================================
   NEW CHAT
   ========================================================= */

function newChat() {

    currentFeature = "chat";

    if (messages) {

        messages.innerHTML = `
            <div class="empty-state" id="emptyState">
                <div class="empty-icon">🤖</div>
                <h3>How can I help?</h3>
                <p>Choose a tool above or send me a message.</p>
            </div>
        `;

    }

    if (input) {

        input.value = "";

        input.placeholder =
            features.chat.placeholder;

        autoResize(input);

        input.focus();
    }

    const pageTitle =
        document.getElementById("pageTitle");

    const pageSubtitle =
        document.getElementById("pageSubtitle");

    if (pageTitle) {
        pageTitle.textContent = features.chat.title;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent =
            features.chat.subtitle;
    }

}


/* =========================================================
   ENTER KEY
   ========================================================= */

function handleEnter(event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();
    }

}


/* =========================================================
   AUTO RESIZE TEXTAREA
   ========================================================= */

function autoResize(element) {

    if (!element) {
        return;
    }

    element.style.height = "auto";

    const maxHeight = 120;

    element.style.height =
        Math.min(element.scrollHeight, maxHeight) + "px";
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    if (isProcessing) {
        return;
    }

    const text =
        input ? input.value.trim() : "";

    if (!text) {
        return;
    }

    /*
     * IMAGE GENERATION
     */

    if (currentFeature === "image") {

        input.value = "";

        autoResize(input);

        await generateImage(text);

        return;
    }


    /*
     * NORMAL CHAT
     */

    addMessage(text, "user");

    input.value = "";

    autoResize(input);

    /*
     * For now all text-based tools use the AI chat
     * endpoint. Their dedicated behavior can be added
     * later without changing the UI.
     */

    await sendToAI(text);
}


/* =========================================================
   SEND TO AI
   ========================================================= */

async function sendToAI(text) {

    isProcessing = true;

    const loading =
        addMessage("🤖 Thinking", "ai", true);

    try {

        const response = await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: text,
                    feature: currentFeature
                })
            }
        );


        let data;

        try {
            data = await response.json();
        } catch {
            data = {};
        }


        if (loading) {
            loading.remove();
        }


        if (!response.ok) {

            addMessage(
                "❌ " +
                (data.error ||
                "Something went wrong."),
                "ai"
            );

            return;
        }


        if (data.reply) {

            typeMessage(data.reply);

        } else {

            addMessage(
                "❌ No response was generated.",
                "ai"
            );
        }


    } catch (error) {

        console.error(error);

        if (loading) {
            loading.remove();
        }

        addMessage(
            "❌ Cannot connect to MY AI server.",
            "ai"
        );

    } finally {

        isProcessing = false;
    }

}


/* =========================================================
   ADD MESSAGE
   ========================================================= */

function addMessage(
    text,
    type,
    temporary = false
) {

    if (!messages) {
        return null;
    }


    const emptyState =
        document.getElementById("emptyState");

    if (emptyState) {
        emptyState.remove();
    }


    const div =
        document.createElement("div");


    div.classList.add(
        "message"
    );


    if (type === "user") {

        div.classList.add(
            "user-message"
        );

    } else {

        div.classList.add(
            "ai-message"
        );
    }


    div.textContent = text;


    if (temporary) {

        div.classList.add(
            "thinking"
        );
    }


    messages.appendChild(div);

    scrollToBottom();


    return div;
}


/* =========================================================
   TYPING EFFECT
   ========================================================= */

function typeMessage(text) {

    if (!messages) {
        return;
    }


    const emptyState =
        document.getElementById("emptyState");

    if (emptyState) {
        emptyState.remove();
    }


    const div =
        document.createElement("div");

    div.className =
        "message ai-message";


    messages.appendChild(div);


    let index = 0;

    const speed = 8;


    function type() {

        if (index >= text.length) {
            return;
        }


        div.textContent +=
            text.charAt(index);

        index++;

        scrollToBottom();


        setTimeout(
            type,
            speed
        );
    }


    type();
}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {

    if (!messages) {
        return;
    }

    messages.scrollTop =
        messages.scrollHeight;
}


/* =========================================================
   IMAGE GENERATION
   ========================================================= */

async function generateImage(prompt) {

    if (isProcessing) {
        return;
    }

    isProcessing = true;


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


        let data;

        try {
            data = await response.json();
        } catch {
            data = {};
        }


        if (loading) {
            loading.remove();
        }


        if (!response.ok) {

            addMessage(
                "❌ " +
                (
                    data.error ||
                    "Image generation failed."
                ),
                "ai"
            );

            return;
        }


        if (data.image) {

            showGeneratedImage(
                data.image,
                data.mime_type ||
                "image/png"
            );

        } else {

            addMessage(
                "❌ No image was generated.",
                "ai"
            );
        }


    } catch (error) {

        console.error(error);

        if (loading) {
            loading.remove();
        }

        addMessage(
            "❌ Could not connect to image generation server.",
            "ai"
        );

    } finally {

        isProcessing = false;
    }

}


/* =========================================================
   SHOW GENERATED IMAGE
   ========================================================= */

function showGeneratedImage(
    base64,
    mimeType
) {

    if (!messages) {
        return;
    }


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


    saveButton.className =
        "image-save";


    saveButton.href =
        img.src;


    saveButton.download =
        "MY-AI-generated-image.png";


    saveButton.textContent =
        "⬇️ Save Image";


    wrapper.appendChild(img);

    wrapper.appendChild(saveButton);

    messages.appendChild(wrapper);

    scrollToBottom();
}


/* =========================================================
   FILE OPEN
   ========================================================= */

function openFile() {

    if (!fileInput) {
        return;
    }

    fileInput.click();
}


/* =========================================================
   FILE SELECTED
   ========================================================= */

function fileSelected(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    /*
     * IMAGE ANALYSIS
     */

    if (
        currentFeature === "analyze" &&
        file.type.startsWith("image/")
    ) {

        analyzeImage(file);

        event.target.value = "";

        return;
    }


    /*
     * OCR
     */

    if (
        currentFeature === "ocr" &&
        file.type.startsWith("image/")
    ) {

        analyzeImage(
            file,
            true
        );

        event.target.value = "";

        return;
    }


    /*
     * NORMAL IMAGE
     */

    if (
        file.type.startsWith("image/")
    ) {

        addMessage(
            "📸 " + file.name,
            "user"
        );

        showLocalImage(file);

        addMessage(
            "📸 Image received. Select “Analyze Image” to analyze it.",
            "ai"
        );

    }


    /*
     * PDF / DOCUMENT
     */

    else {

        addMessage(
            "📄 " + file.name,
            "user"
        );

        addMessage(
            "📄 File received. Full PDF/document analysis will be connected next.",
            "ai"
        );
    }


    event.target.value = "";
}


/* =========================================================
   SHOW LOCAL IMAGE
   ========================================================= */

function showLocalImage(file) {

    if (!messages) {
        return;
    }


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message ai-message image-result";


    const img =
        document.createElement("img");


    img.alt =
        file.name;


    const reader =
        new FileReader();


    reader.onload =
        function(event) {

            img.src =
                event.target.result;

            wrapper.appendChild(img);

            messages.appendChild(wrapper);

            scrollToBottom();
        };


    reader.readAsDataURL(file);
}


/* =========================================================
   ANALYZE IMAGE
   ========================================================= */

async function analyzeImage(
    file,
    isOCR = false
) {

    if (isProcessing) {
        return;
    }

    isProcessing = true;


    addMessage(
        "📸 " + file.name,
        "user"
    );


    showLocalImage(file);


    const loading =
        addMessage(
            isOCR
                ? "📷 Reading text from image"
                : "🔎 Analyzing your image",
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


        formData.append(
            "ocr",
            isOCR ? "true" : "false"
        );


        const response =
            await fetch(
                "/api/analyze-image",
                {
                    method: "POST",
                    body: formData
                }
            );


        let data;

        try {
            data = await response.json();
        } catch {
            data = {};
        }


        if (loading) {
            loading.remove();
        }


        if (!response.ok) {

            addMessage(
                "❌ " +
                (
                    data.error ||
                    "Image analysis failed."
                ),
                "ai"
            );

            return;
        }


        if (data.reply) {

            typeMessage(
                data.reply
            );

        } else {

            addMessage(
                "❌ No analysis result was generated.",
                "ai"
            );
        }


    } catch (error) {

        console.error(error);

        if (loading) {
            loading.remove();
        }

        addMessage(
            "❌ Could not connect to image analysis server.",
            "ai"
        );

    } finally {

        isProcessing = false;
    }

}


/* =========================================================
   VOICE INPUT
   ========================================================= */

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


    if (isProcessing) {
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


    recognition.maxAlternatives =
        1;


    recognition.onstart =
        function() {

            if (input) {

                input.placeholder =
                    "🎙️ Listening...";

                input.disabled =
                    true;
            }
        };


    recognition.onresult =
        function(event) {

            const transcript =
                event.results[0][0].transcript;


            if (input) {

                input.disabled =
                    false;

                input.value =
                    transcript;

                input.placeholder =
                    features[currentFeature]
                        .placeholder;

                autoResize(input);

                input.focus();
            }
        };


    recognition.onerror =
        function(event) {

            console.error(
                "Voice error:",
                event.error
            );


            if (input) {

                input.disabled =
                    false;

                input.placeholder =
                    features[currentFeature]
                        .placeholder;
            }


            addMessage(
                "❌ Voice input failed. Please try again.",
                "ai"
            );
        };


    recognition.onend =
        function() {

            if (input) {

                input.disabled =
                    false;

                input.placeholder =
                    features[currentFeature]
                        .placeholder;
            }
        };


    try {

        recognition.start();

    } catch (error) {

        console.error(error);

        if (input) {
            input.disabled = false;
        }
    }
}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");


    if (!sidebar) {
        return;
    }


    sidebar.classList.toggle(
        "open"
    );
}


/* =========================================================
   CLOSE SIDEBAR AFTER CLICK
   ========================================================= */

document.addEventListener(
    "click",
    function(event) {

        if (window.innerWidth > 700) {
            return;
        }


        const sidebar =
            document.getElementById(
                "sidebar"
            );


        const menuButton =
            document.querySelector(
                ".menu-btn"
            );


        if (!sidebar) {
            return;
        }


        if (
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !(menuButton &&
              menuButton.contains(event.target))
        ) {

            sidebar.classList.remove(
                "open"
            );
        }

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (input) {

            input.focus();

            autoResize(input);
        }

    }
);
