import os
import base64

from flask import Flask, request, jsonify, send_from_directory
from google import genai
from google.genai import types


# =========================================================
# APP CONFIG
# =========================================================

app = Flask(__name__, static_folder=".")

TEXT_MODEL = "gemini-3.8-flash"
IMAGE_MODEL = "gemini-3.1-flash-image"

API_KEY = os.environ.get("GEMINI_API_KEY")


# =========================================================
# GEMINI CLIENT
# =========================================================

client = None

if API_KEY:
    try:
        client = genai.Client(
            api_key=API_KEY
        )
    except Exception as error:
        print("Gemini client error:", error)


# =========================================================
# BASIC HELPERS
# =========================================================

def api_error(message, status=500):
    return jsonify({
        "error": message
    }), status


def check_client():
    if client is None:
        return False

    return True


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


# =========================================================
# STATIC FILES
# =========================================================

@app.route("/<path:filename>")
def static_files(filename):

    return send_from_directory(
        ".",
        filename
    )


# =========================================================
# AI CHAT
# =========================================================

@app.route(
    "/api/chat",
    methods=["POST"]
)
def chat():

    if not check_client():

        return api_error(
            "GEMINI_API_KEY is not configured on the server.",
            500
        )


    data = request.get_json(
        silent=True
    ) or {}


    message = str(
        data.get("message", "")
    ).strip()


    feature = str(
        data.get("feature", "chat")
    ).strip()


    if not message:

        return api_error(
            "Message is required.",
            400
        )


    # =====================================================
    # SYSTEM-STYLE PROMPT
    # =====================================================

    feature_instruction = {

        "chat":
            "Answer naturally and helpfully.",

        "coding":
            "Act as a helpful programming assistant. Explain code clearly and provide correct examples.",

        "study":
            "Act as a study assistant. Explain concepts simply and step by step.",

        "translate":
            "Act as a translation assistant. Translate accurately while preserving the intended meaning.",

        "summarize":
            "Summarize the user's text clearly and keep the important information.",

        "math":
            "Act as a math solver. Solve the problem carefully and explain the steps.",

        "search":
            "Answer as an AI assistant. Do not claim to have performed a live web search unless a search tool is actually connected.",

        "notes":
            "Help the user create clear, organized and useful notes.",

        "voice":
            "Respond naturally as a conversational AI assistant.",

        "file":
            "Explain that file analysis requires an uploaded file when appropriate.",

        "ocr":
            "Help with text recognition and explain that an image must be uploaded for OCR.",

        "editing":
            "Help the user describe image editing instructions clearly."

    }


    instruction = feature_instruction.get(
        feature,
        feature_instruction["chat"]
    )


    prompt = f"""
You are MY AI, a helpful personal AI assistant.

{instruction}

Important:
- Be accurate and useful.
- If the user asks in Bangla or Banglish, reply naturally in Bangla/Banglish.
- If the user asks in English, reply in English.
- Do not mention internal model names.
- Do not pretend that unavailable tools were used.
- Keep answers reasonably concise unless more detail is requested.

User message:
{message}
"""


    try:

        response = client.models.generate_content(

            model=TEXT_MODEL,

            contents=prompt
        )


        reply = (
            response.text
            if response.text
            else "I couldn't generate a response."
        )


        return jsonify({
            "reply": reply
        })


    except Exception as error:

        print(
            "CHAT ERROR:",
            repr(error)
        )


        return api_error(
            "AI request failed: "
            + str(error),
            500
        )


# =========================================================
# IMAGE ANALYSIS / OCR
# =========================================================

@app.route(
    "/api/analyze-image",
    methods=["POST"]
)
def analyze_image():

    if not check_client():

        return api_error(
            "GEMINI_API_KEY is not configured on the server.",
            500
        )


    image = request.files.get(
        "image"
    )


    if image is None:

        return api_error(
            "No image was uploaded.",
            400
        )


    image_bytes = image.read()


    if not image_bytes:

        return api_error(
            "The uploaded image is empty.",
            400
        )


    mime_type = (
        image.mimetype
        or "image/jpeg"
    )


    if not mime_type.startswith(
        "image/"
    ):

        return api_error(
            "Please upload a valid image.",
            400
        )


    ocr_mode = (
        str(
            request.form.get(
                "ocr",
                "false"
            )
        ).lower()
        == "true"
    )


    # =====================================================
    # PROMPT
    # =====================================================

    if ocr_mode:

        prompt = """
Read the text visible in this image.

Return the recognized text as accurately as possible.

Rules:
- Preserve the original wording where possible.
- Keep line breaks when useful.
- If there is no readable text, clearly say that.
- Do not invent missing text.
"""

    else:

        prompt = """
Analyze this image carefully.

Provide:

1. Short description
2. Main objects or subjects
3. Visible text, if any
4. Important details
5. Useful observations

Be accurate.
Do not invent details that cannot be seen.
"""


    try:

        response = client.models.generate_content(

            model=TEXT_MODEL,

            contents=[

                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type
                ),

                prompt
            ]
        )


        reply = (
            response.text
            if response.text
            else "I couldn't analyze this image."
        )


        return jsonify({
            "reply": reply
        })


    except Exception as error:

        print(
            "IMAGE ANALYSIS ERROR:",
            repr(error)
        )


        return api_error(
            "Image analysis failed: "
            + str(error),
            500
        )


# =========================================================
# IMAGE GENERATION
# =========================================================

@app.route(
    "/api/generate-image",
    methods=["POST"]
)
def generate_image():

    if not check_client():

        return api_error(
            "GEMINI_API_KEY is not configured on the server.",
            500
        )


    data = request.get_json(
        silent=True
    ) or {}


    prompt = str(
        data.get("prompt", "")
    ).strip()


    if not prompt:

        return api_error(
            "Image prompt is required.",
            400
        )


    try:

        response = client.models.generate_content(

            model=IMAGE_MODEL,

            contents=prompt,

            config=types.GenerateContentConfig(

                response_modalities=[
                    "IMAGE"
                ]

            )
        )


        # =================================================
        # FIND GENERATED IMAGE
        # =================================================

        for candidate in (
            response.candidates or []
        ):

            if not candidate.content:
                continue


            for part in (
                candidate.content.parts or []
            ):

                if not part.inline_data:
                    continue


                image_bytes = (
                    part.inline_data.data
                )


                if not image_bytes:
                    continue


                mime_type = (
                    part.inline_data.mime_type
                    or "image/png"
                )


                image_base64 = (
                    base64.b64encode(
                        image_bytes
                    ).decode("utf-8")
                )


                return jsonify({

                    "image":
                        image_base64,

                    "mime_type":
                        mime_type
                })


        return api_error(
            "No image was generated.",
            500
        )


    except Exception as error:

        print(
            "IMAGE GENERATION ERROR:",
            repr(error)
        )


        return api_error(
            "Image generation failed: "
            + str(error),
            500
        )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "status": "online",

        "my_ai": True,

        "gemini_configured":
            bool(client),

        "text_model":
            TEXT_MODEL,

        "image_model":
            IMAGE_MODEL
    })


# =========================================================
# 404 API HANDLER
# =========================================================

@app.errorhandler(404)
def not_found(error):

    if request.path.startswith("/api/"):

        return jsonify({
            "error": "API endpoint not found."
        }), 404


    return error


# =========================================================
# SERVER
# =========================================================

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
