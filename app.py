import os
import base64
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from google import genai
from google.genai import types

app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)

# Render Environment Variable থেকে API Key অটোমেটিক নেবে
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else genai.Client()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json or {}
        prompt = data.get('prompt', '')
        history = data.get('history', [])
        
        contents = []
        for msg in history:
            role = "user" if msg.get('sender') == 'user' else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.get('text', ''))]))
        
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents
        )
        
        return jsonify({"success": True, "reply": response.text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    try:
        prompt = request.form.get('prompt', 'Describe this image clearly')
        file = request.files.get('image')
        
        if not file:
            return jsonify({"success": False, "error": "No image uploaded"}), 400
            
        image_bytes = file.read()
        mime_type = file.mimetype

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ]
        )
        return jsonify({"success": True, "reply": response.text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analyze-pdf', methods=['POST'])
def analyze_pdf():
    try:
        prompt = request.form.get('prompt', 'Summarize this PDF document')
        file = request.files.get('file')
        
        if not file:
            return jsonify({"success": False, "error": "No PDF file uploaded"}), 400
            
        file_bytes = file.read()

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type='application/pdf'),
                prompt
            ]
        )
        return jsonify({"success": True, "reply": response.text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.json or {}
        prompt = data.get('prompt', '')
        if not prompt:
            return jsonify({"success": False, "error": "Prompt is required"}), 400

        # Imagen 3 API Call Fixed
        result = client.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio="1:1"
            )
        )
        
        if result.generated_images:
            generated_image = result.generated_images[0]
            base64_image = base64.b64encode(generated_image.image.image_bytes).decode('utf-8')
            image_url = f"data:image/jpeg;base64,{base64_image}"
            return jsonify({"success": True, "image_url": image_url})
        else:
            return jsonify({"success": False, "error": "Image generation failed"}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
