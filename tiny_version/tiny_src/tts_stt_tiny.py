import whisper
import torch
from kittentts import KittenTTS
import soundfile as sf

class VoiceProcessorTiny:
    def __init__(self, device="cuda"):
        self.device = device
        self.stt_model = whisper.load_model("tiny", device=self.device)
        self.tts_model = KittenTTS("KittenML/kitten-tts-nano-0.2")

    def transcribe(self, audio_path):
        if not audio_path: return ""
        result = self.stt_model.transcribe(audio_path, language='it', fp16=True)
        return result["text"]

    def synthesize(self, text, output_path="res.wav"):
        wav = self.tts_model.generate(text, voice='expr-voice-2-f')
        sf.write(output_path, wav, 24000)
        return output_path