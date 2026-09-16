import os
import base64
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder=".")

API_KEY = os.getenv("OPENAI_API_KEY")

if not API_KEY:
    print("WARNING: OPENAI_API_KEY is not configured.")

client = OpenAI(api_key=API_KEY) if API_KEY else None


# =========================
# CONFIG
# =========================

TEXT_MODEL = "gpt-5.6-luna"
IMAGE_MODEL = "gpt-image-2"
TTS_MODEL = "gpt-4o-mini-tts"


# =========================
# HELPERS
# =========================

def api_error(message, status=500):
    return jsonify({
        "error": message
    }), status


def require_client():
    if client is None:
        return api_error(
            "OPENAI_API_KEY is not configured on the server.",
            500
        )

    return None


def clean_history(history):
    """
    Keep only simple user/assistant text messages.
    """

    if not isinstance(history, list):
        return []

    cleaned = []

    for item in history[-20:]:

        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if role not in ["user", "assistant"]:
            continue

        if not isinstance(content, str):
            continue

        if not content.strip():
            continue

        cleaned.append({
            "role": role,
            "content": content[:12000]
        })

    return cleaned


# =========================
# HOME
# =========================

@app.route("/")
def home():
    return send_from_directory(".", "index.html")


# =========================
# STATIC FILES
# =========================

@app.route("/<path:path>")
def static_files(path):

    if path.startswith("api/"):
        return api_error("API endpoint not found.", 404)

    full_path = os.path.join(".", path)

    if os.path.isfile(full_path):
        return send_from_directory(".", path)

    return send_from_directory(".", "index.html")


# =========================
# NORMAL CHAT
# =========================

@app.route("/api/chat", methods=["POST"])
def chat():

    error = require_client()

    if error:
        return error

    try:

        data = request.get_json(
            silent=True
        ) or {}

        message = (
            data.get("message")
            or ""
        ).strip()

        history = clean_history(
            data.get("history", [])
        )

        if not message:
            return api_error(
                "Message is empty.",
                400
            )

        lower = message.lower()

        # =====================
        # COMMAND MODES
        # =====================

        system_instruction = (
            "You are MY AI, a helpful personal AI assistant. "
            "Answer clearly and naturally. "
            "Do not mention internal model names unless asked."
        )

        if lower.startswith("/code"):

            system_instruction += (
                " The user is asking for coding help. "
                "Give complete, practical code when appropriate "
                "and explain important parts briefly."
            )

            message = message[5:].strip()

            if not message:
                message = (
                    "Help me with coding."
                )

        elif lower.startswith("/translate"):

            system_instruction += (
                " The user wants translation. "
                "Translate accurately and preserve the meaning. "
                "Do not add unnecessary explanation."
            )

            message = message[10:].strip()

            if not message:
                message = (
                    "Please translate the text I provide."
                )

        elif lower.startswith("/voice"):

            system_instruction += (
                " The user wants text prepared for "
                "natural voice narration. "
                "Return clean natural spoken text."
            )

            message = message[6:].strip()

            if not message:
                message = (
                    "Prepare a natural spoken response."
                )

        elif lower.startswith("/analyze"):

            system_instruction += (
                " The user wants image analysis. "
                "If no image is attached, explain that "
                "they should attach an image."
            )

            message = message[8:].strip()

            if not message:
                message = (
                    "Analyze the attached image."
                )

        # =====================
        # RESPONSES API
        # =====================

        input_messages = [
            {
                "role": "system",
                "content": system_instruction
            }
        ]

        for item in history:

            input_messages.append({
                "role": item["role"],
                "content": item["content"]
            })

        input_messages.append({
            "role": "user",
            "content": message
        })

        response = client.responses.create(
            model=TEXT_MODEL,
            input=input_messages
        )

        reply = response.output_text

        if not reply:
            reply = (
                "I couldn't generate a response."
            )

        return jsonify({
            "reply": reply
        })

    except Exception as error:

        print("CHAT ERROR:", repr(error))

        return api_error(
            "AI request failed: " + str(error),
            500
        )


# =========================
# IMAGE GENERATION
# =========================

@app.route("/api/generate-image", methods=["POST"])
def generate_image():

    error = require_client()

    if error:
        return error

    try:

        data = request.get_json(
            silent=True
        ) or {}

        prompt = (
            data.get("prompt")
            or ""
        ).strip()

        if not prompt:
            return api_error(
                "Image prompt is empty.",
                400
            )

        result = client.images.generate(
            model=IMAGE_MODEL,
            prompt=prompt,
            size="1024x1024"
        )

        if not result.data:
            return api_error(
                "No image was returned.",
                500
            )

        image = result.data[0]

        # Base64 response
        if getattr(image, "b64_json", None):

            return jsonify({
                "image":
                    image.b64_json
            })

        # URL response
        if getattr(image, "url", None):

            return jsonify({
                "image":
                    image.url
            })

        return api_error(
            "Image response did not contain image data.",
            500
        )

    except Exception as error:

        print(
            "IMAGE GENERATION ERROR:",
            repr(error)
        )

        return api_error(
            "Image generation error: "
            + str(error),
            500
        )


# =========================
# IMAGE ANALYSIS
# =========================

@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():

    error = require_client()

    if error:
        return error

    try:

        image_file = request.files.get(
            "image"
        )

        if not image_file:
            return api_error(
                "No image was uploaded.",
                400
            )

        image_bytes = image_file.read()

        if not image_bytes:
            return api_error(
                "Uploaded image is empty.",
                400
            )

        mime_type = (
            image_file.mimetype
            or "image/jpeg"
        )

        encoded = base64.b64encode(
            image_bytes
        ).decode("utf-8")

        response = client.responses.create(
            model=TEXT_MODEL,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "Analyze this image carefully. "
                                "Describe what is visible, "
                                "read useful text if present, "
                                "and answer naturally."
                            )
                        },
                        {
                            "type": "input_image",
                            "image_url":
                                f"data:{mime_type};base64,{encoded}"
                        }
                    ]
                }
            ]
        )

        reply = response.output_text

        return jsonify({
            "reply": reply
        })

    except Exception as error:

        print(
            "IMAGE ANALYSIS ERROR:",
            repr(error)
        )

        return api_error(
            "Image analysis error: "
            + str(error),
            500
        )


# =========================
# TEXT TO SPEECH
# =========================

@app.route("/api/voice", methods=["POST"])
def text_to_voice():

    error = require_client()

    if error:
        return error

    try:

        data = request.get_json(
            silent=True
        ) or {}

        text = (
            data.get("text")
            or ""
        ).strip()

        if not text:
            return api_error(
                "Text is empty.",
                400
            )

        speech = client.audio.speech.create(
            model=TTS_MODEL,
            voice="alloy",
            input=text,
            response_format="mp3"
        )

        audio_bytes = speech.read()

        encoded = base64.b64encode(
            audio_bytes
        ).decode("utf-8")

        return jsonify({
            "audio": encoded,
            "mime_type": "audio/mpeg"
        })

    except Exception as error:

        print(
            "VOICE ERROR:",
            repr(error)
        )

        return api_error(
            "Voice generation error: "
            + str(error),
            500
        )


# =========================
# HEALTH
# =========================

@app.route("/api/health")
def health():

    return jsonify({
        "status": "ok",
        "ai": "openai"
    })


# =========================
# RUN
# =========================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
            )
