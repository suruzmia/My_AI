import os
from flask import Flask, request, jsonify, send_from_directory
from google import genai

app = Flask(__name__, static_folder=".")

API_KEY = os.environ.get("GEMINI_API_KEY")

client = genai.Client(api_key=API_KEY) if API_KEY else None


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def files(filename):
    return send_from_directory(".", filename)


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
            model="gemini-2.5-flash",
            contents=message
        )

        return jsonify({
            "reply": response.text
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
