from pydub import AudioSegment
import os
import uuid

class AudioConverter:
    ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac', 'aiff'}
    SUPPORTED_OUTPUT_FORMATS = ['wav', 'mp3', 'ogg', 'flac', 'aiff']

    @staticmethod
    def allowed_file(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in AudioConverter.ALLOWED_EXTENSIONS

    @staticmethod
    def convert_audio(input_path, output_format="wav", sample_rate=None):
        try:
            audio = AudioSegment.from_file(input_path)
            
            if sample_rate:
                audio = audio.set_frame_rate(sample_rate)
            
            output_filename = f"{str(uuid.uuid4())}.{output_format}"
            output_path = os.path.join('outputs', output_filename)
            
            params = {'format': output_format}
            if output_format == 'mp3':
                params['bitrate'] = '192k'
            
            audio.export(output_path, **params)
            return output_path, None
        except Exception as e:
            return None, f"Audio conversion error: {str(e)}"