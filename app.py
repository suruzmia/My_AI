import os
import base64
import time

from flask import Flask, request, jsonify, send_from_directory
from google import genai
from google.genai import types


# =========================================================
# MY AI SERVER
# =========================================================

app = Flask(__name__, static_folder=".")


# =========================================================
# GEMINI MODELS
# =========================================================

TEXT_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
]

IMAGE_MODEL = "gemini-3.1-flash-image"


# =========================================================
# GEMINI CLIENT
# =========================================================

API_KEY = os.environ.get("GEMINI_API_KEY")

client = None

if API_KEY:
    try:
        client = genai.Client(
            api_key=API_KEY
        )

        print(
            "MY AI: Gemini client initialized."
        )

    except Exception as error:

        print(
            "MY AI: Gemini client error:",
            repr(error)
        )

else:

    print(
        "MY AI: GEMINI_API_KEY is missing."
    )


# =========================================================
# ERROR HELPER
# =========================================================

def api_error(message, status=500):

    return jsonify({
        "error": message
    }), status


# =========================================================
# CLIENT CHECK
# =========================================================

def check_client():

    return client is not None


# =========================================================
# TEMPORARY ERROR CHECK
# =========================================================

def is_temporary_error(error):

    error_text = str(
        error
    ).upper()

    temporary_errors = [
        "503",
        "UNAVAILABLE",
        "HIGH DEMAND",
        "429",
        "RESOURCE_EXHAUSTED",
        "TOO MANY REQUESTS",
        "OVERLOADED",
        "CAPACITY",
    ]

    for item in temporary_errors:

        if item in error_text:
            return True

    return False


# =========================================================
# TEXT AI WITH FALLBACK
# =========================================================

def generate_text_with_fallback(contents):

    last_error = None

    for model in TEXT_MODELS:

        print(
            "Trying text model:",
            model
        )

        try:

            response = client.models.generate_content(
                model=model,
                contents=contents
            )

            if response and response.text:

                print(
                    "Text generation success:",
                    model
                )

                return response.text

        except Exception as error:

            last_error = error

            print(
                model,
                "failed:",
                repr(error)
            )

            # Retry temporary errors once
            if is_temporary_error(error):

                try:

                    print(
                        "Retrying:",
                        model
                    )

                    time.sleep(1)

                    response = client.models.generate_content(
                        model=model,
                        contents=contents
                    )

                    if response and response.text:

                        print(
                            "Retry success:",
                            model
                        )

                        return response.text

                except Exception as retry_error:

                    last_error = retry_error

                    print(
                        model,
                        "retry failed:",
                        repr(retry_error)
                    )

    raise RuntimeError(
        "All text models are temporarily unavailable."
    ) from last_error


# =========================================================
# HOME
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
        data.get(
            "message",
            ""
        )
    ).strip()


    feature = str(
        data.get(
            "feature",
            "chat"
        )
    ).strip()


    if not message:

        return api_error(
            "Message is required.",
            400
        )


    feature_instruction = {

        "chat":
            "Answer naturally and helpfully.",

        "coding":
            "Act as a helpful programming assistant. "
            "Explain code clearly and provide correct examples.",

        "study":
            "Act as a study assistant. "
            "Explain concepts simply and step by step.",

        "translate":
            "Act as a translation assistant. "
            "Translate accurately while preserving meaning.",

        "summarize":
            "Summarize the user's text clearly "
            "while keeping important information.",

        "math":
            "Act as a math solver. "
            "Solve problems carefully and explain steps.",

        "search":
            "Answer as an AI assistant. "
            "Do not claim that you performed a live web search "
            "unless a search tool is actually connected.",

        "notes":
            "Help the user create clear, organized and useful notes.",

        "voice":
            "Respond naturally as a conversational AI assistant.",

        "file":
            "Help the user with file-related questions. "
            "If a file is required, ask the user to upload it.",

        "ocr":
            "Help with text recognition from images.",

        "editing":
            "Help the user describe image editing instructions clearly.",
    }


    instruction = feature_instruction.get(
        feature,
        feature_instruction["chat"]
    )


    prompt = f"""
You are MY AI, a helpful personal AI assistant.

{instruction}

Important rules:

- Be accurate and useful.
- If the user asks in Bangla or Banglish,
  reply naturally in Bangla/Banglish.
- If the user asks in English,
  reply in English.
- Do not mention internal model names.
- Do not pretend unavailable tools were used.
- Keep answers reasonably concise unless
  the user asks for more detail.
- Be friendly and natural.

User message:

{message}
"""


    try:

        reply = generate_text_with_fallback(
            prompt
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
            "AI is temporarily busy. Please try again.",
            503
        )


# =========================================================
# IMAGE ANALYSIS + OCR
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


    if ocr_mode:

        prompt = """
Read the text visible in this image.

Return the recognized text as accurately as possible.

Rules:

- Preserve the original wording where possible.
- Keep line breaks when useful.
- If there is no readable text,
  clearly say that.
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

Do not invent details
that cannot be seen.
"""


    contents = [

        types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type
        ),

        prompt
    ]


    try:

        reply = generate_text_with_fallback(
            contents
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
            "Image analysis is temporarily unavailable.",
            503
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
        data.get(
            "prompt",
            ""
        )
    ).strip()


    if not prompt:

        return api_error(
            "Image prompt is required.",
            400
        )


    print(
        "IMAGE REQUEST:",
        prompt
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


        # -------------------------------------------------
        # Read generated image
        # -------------------------------------------------

        if not response:

            return api_error(
                "Empty response received from image model.",
                500
            )


        # New SDK response.parts
        parts = response.parts


        if parts:

            for part in parts:

                if part.inline_data is None:
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
                    ).decode(
                        "utf-8"
                    )
                )


                print(
                    "IMAGE GENERATED SUCCESSFULLY"
                )


                return jsonify({

                    "image":
                        image_base64,

                    "mime_type":
                        mime_type
                })


        # -------------------------------------------------
        # Fallback response.candidates
        # -------------------------------------------------

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
                    ).decode(
                        "utf-8"
                    )
                )


                print(
                    "IMAGE GENERATED SUCCESSFULLY"
                )


                return jsonify({

                    "image":
                        image_base64,

                    "mime_type":
                        mime_type
                })


        # -------------------------------------------------
        # No image
        # -------------------------------------------------

        print(
            "IMAGE RESPONSE DID NOT CONTAIN IMAGE"
        )


        return api_error(
            "The AI did not return an image. "
            "Please try another prompt.",
            500
        )


    except Exception as error:

        print(
            "IMAGE GENERATION ERROR:",
            repr(error)
        )


        # Return actual error so we can diagnose it
        return api_error(
            "Image generation error: "
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

        "status":
            "online",

        "my_ai":
            True,

        "gemini_configured":
            bool(client),

        "text_models":
            TEXT_MODELS,

        "image_model":
            IMAGE_MODEL
    })


# =========================================================
# API 404
# =========================================================

@app.errorhandler(404)
def not_found(error):

    if request.path.startswith(
        "/api/"
    ):

        return jsonify({

            "error":
                "API endpoint not found."

        }), 404


    return error


# =========================================================
# RUN SERVER
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
