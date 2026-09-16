import os
import base64

from flask import Flask, request, jsonify, send_from_directory
from google import genai
from google.genai import types


app = Flask(__name__, static_folder=".")

API_KEY = os.environ.get("GEMINI_API_KEY")

client = genai.Client(api_key=API_KEY) if API_KEY else None


# ========================================
# FRONTEND
# ========================================

@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


# ========================================
# AI CHAT
# ========================================

@app.route("/api/chat", methods=["POST"])
def chat():

    if not client:
        return jsonify({
            "error": "GEMINI_API_KEY is not configured."
        }), 500

    data = request.get_json(silent=True) or {}

    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "error": "Message is required."
        }), 400

    try:

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=message
        )

        return jsonify({
            "reply": response.text or "No response generated."
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ========================================
# IMAGE ANALYSIS
# ========================================

@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():

    if not client:
        return jsonify({
            "error": "GEMINI_API_KEY is not configured."
        }), 500

    image = request.files.get("image")

    if not image:
        return jsonify({
            "error": "No image was uploaded."
        }), 400

    try:

        image_bytes = image.read()

        if not image_bytes:
            return jsonify({
                "error": "The uploaded image is empty."
            }), 400

        mime_type = image.mimetype or "image/jpeg"

        if not mime_type.startswith("image/"):
            return jsonify({
                "error": "Please upload a valid image."
            }), 400

        prompt = """
Analyze this image and explain what you can see.

Include:
1. A short description
2. Important objects or subjects
3. Visible text, if any
4. Useful details or observations

Answer clearly and naturally.
"""

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type
                ),
                prompt
            ]
        )

        return jsonify({
            "reply": response.text or "I couldn't analyze this image."
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ========================================
# IMAGE GENERATION
# ========================================

@app.route("/api/generate-image", methods=["POST"])
def generate_image():

    if not client:
        return jsonify({
            "error": "GEMINI_API_KEY is not configured."
        }), 500

    data = request.get_json(silent=True) or {}

    prompt = data.get("prompt", "").strip()

    if not prompt:
        return jsonify({
            "error": "Image prompt is required."
        }), 400

    try:

        response = client.models.generate_content(
            model="gemini-3.1-flash-image",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"]
            )
        )

        for candidate in response.candidates or []:

            for part in candidate.content.parts:

                if part.inline_data:

                    image_bytes = part.inline_data.data

                    image_base64 = base64.b64encode(
                        image_bytes
                    ).decode("utf-8")

                    mime_type = (
                        part.inline_data.mime_type
                        or "image/png"
                    )

                    return jsonify({
                        "image": image_base64,
                        "mime_type": mime_type
                    })

        return jsonify({
            "error": "No image was generated."
        }), 500

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ========================================
# HEALTH CHECK
# ========================================

@app.route("/api/health")
def health():

    return jsonify({
        "status": "online",
        "my_ai": True
    })


# ========================================
# RUN
# ========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        )
                    )
