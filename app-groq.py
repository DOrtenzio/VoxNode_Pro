import os
import gradio as gr
from groq import Groq
from src.tts_stt import VoiceProcessor
from src.rag import DocumentRetriever
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "IL_TUO_TOKEN_QUI")

client = Groq(api_key=GROQ_API_KEY)
voice = VoiceProcessor(device="cpu") 
rag = DocumentRetriever()

def groq_chat_process(audio):
    if not audio: 
        yield "", "No audio received", None
        return
    
    text = voice.stt_model.transcribe(audio, language='en')["text"]
    
    context = rag.search(text)
    
    stream = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "system", "content": f"Expert assistant. Context: {context}"},
            {"role": "user", "content": text}
        ],
        stream=True,
    )

    full_res = ""
    for chunk in stream:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            full_res += content
            yield text, full_res, None

    audio_path = voice.synthesize(full_res)
    yield text, full_res, audio_path

with gr.Blocks(theme=gr.themes.Soft()) as demo:
    gr.Markdown("# ⚡ VoxNode (Groq Cloud Version)")
    
    with gr.Row():
        with gr.Column():
            f_in = gr.File(label="Upload PDF")
            btn = gr.Button("Index")
            status = gr.Textbox(label="Status")
            btn.click(rag.ingest, f_in, status)
            
        with gr.Column():
            audio_in = gr.Audio(sources="microphone", type="filepath", label="Talk")
            trans_out = gr.Textbox(label="STT Transcription")
            ans_out = gr.Textbox(label="AI Response")
            aud_out = gr.Audio(label="AI Voice", autoplay=True)
            
    audio_in.stop_recording(
        groq_chat_process, 
        inputs=[audio_in], 
        outputs=[trans_out, ans_out, aud_out]
    )

demo.launch(share=True)