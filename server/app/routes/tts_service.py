from flask import request, jsonify, send_file
import os
import wave
from app.tools.tts_service import SarvamTTS

def register(app):
    # Initialize TTS with your API key
    tts = SarvamTTS(api_key="5299349c-e3cc-4863-97aa-bd3e3e4e947a")

    @app.route('/api/tts', methods=['POST'])
    def text_to_speech():
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text parameter'}), 400
        
        audio_data, error = tts.generate_speech(data['text'], data.get('params', {}))
        if error:
            return jsonify({'error': error}), 500
        
        # Save temporary WAV file
        temp_input = os.path.join('uploads', f"temp_{uuid.uuid4()}.wav")
        with wave.open(temp_input, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(22050)
            wav_file.writeframes(audio_data)
        
        return send_file(
            temp_input,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )