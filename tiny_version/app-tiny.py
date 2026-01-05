import torch
import gradio as gr
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TextIteratorStreamer
from threading import Thread

from tiny_src.tts_stt_tiny import VoiceProcessorTiny
from tiny_src.rag_tiny import DocumentRetrieverTiny

device = "cuda" if torch.cuda.is_available() else "cpu"
model_id = "microsoft/Phi-3-mini-4k-instruct"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
)

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    trust_remote_code=True,
    torch_dtype=torch.float16,
    attn_implementation="eager", 
    quantization_config=bnb_config
)

model.config.use_cache = False 
model.config.pretraining_tp = 1

tokenizer = AutoTokenizer.from_pretrained(model_id)

voice = VoiceProcessorTiny(device=device)
rag = DocumentRetrieverTiny()

def tiny_process(audio):
    if audio is None: 
        return "No audio received", "", None
    
    text = voice.transcribe(audio)
    context = rag.search(text, k=1)
    prompt = f"<|system|>Use: {context}. Keep it very brief.<|end|><|user|>{text}<|end|><|assistant|>"
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    
    generation_kwargs = dict(
        inputs, 
        streamer=streamer, 
        max_new_tokens=80, 
        temperature=0.5,
        do_sample=True,
        use_cache=False 
    )
    
    thread = Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()
    
    full_res = ""
    for part in streamer:
        full_res += part
        yield text, full_res, None
        
    audio_path = voice.synthesize(full_res)
    yield text, full_res, audio_path

with gr.Blocks(theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🧊 VoxNode Pro **TINY**")
    gr.Markdown("*Optimized for legacy GPUs (T4/16GB) - No external APIs*")
    
    with gr.Row():
        audio_in = gr.Audio(sources="microphone", type="filepath", label="Speak")
    
    with gr.Column():
        transcription_out = gr.Textbox(label="Transcription")
        txt_out = gr.Textbox(label="AI Response")
        aud_out = gr.Audio(label="AI Voice", autoplay=True)
    
    audio_in.stop_recording(tiny_process, audio_in, [transcription_out, txt_out, aud_out])

if __name__ == "__main__":
    demo.launch(debug=True)