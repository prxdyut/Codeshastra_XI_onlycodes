import requests
import base64
import wave
import os
import uuid

class SarvamTTS:
    def __init__(self, api_key):
        self.api_url = "https://api.sarvam.ai/text-to-speech"
        self.headers = {
            "Content-Type": "application/json",
            "api-subscription-key": api_key
        }
    
    def generate_speech(self, text, params):
        chunk_size = 500
        chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
        
        all_audio_data = []
        
        for chunk in chunks:
            payload = {
                "inputs": [chunk],
                "target_language_code": params.get('target_language_code', 'kn-IN'),
                "speaker": params.get('speaker', 'meera'),
                "model": params.get('model', 'bulbul:v1'),
                "pitch": params.get('pitch', 0),
                "pace": params.get('pace', 1.0),
                "loudness": params.get('loudness', 1.0),
                "enable_preprocessing": params.get('enable_preprocessing', True)
            }
            
            try:
                response = requests.post(self.api_url, json=payload, headers=self.headers)
                response.raise_for_status()
                
                audio = response.json()["audios"][0]
                audio_data = base64.b64decode(audio)
                all_audio_data.append(audio_data)
                
            except requests.exceptions.RequestException as e:
                return None, f"TTS API error: {str(e)}"
        
        if all_audio_data:
            combined_audio = b''.join(all_audio_data)
            return combined_audio, None
        return None, "No audio data generated"