const AppState = {
    language: 'it',
    isListening: false,
    isPaused: false,
    transcript: '',
    pendingText: '', // Testo non ancora scritto definitivamente
    currentNotebook: null,
    aiMode: 'groq',
    apiConfig: null,
    interimTranscript: ''
};

const Translations = {
    it: {
        statusReady: 'Pronto',
        statusListening: 'Ascoltando...',
        statusPaused: 'In pausa',
        statusFinished: 'Completato',
        commandPause: 'PAUSA',
        commandStop: 'STOP',
        commandResume: 'CONTINUA'
    },
    en: {
        statusReady: 'Ready',
        statusListening: 'Listening...',
        statusPaused: 'Paused',
        statusFinished: 'Completed',
        commandPause: 'PAUSE',
        commandStop: 'STOP',
        commandResume: 'CONTINUE'
    }
};

async function initializeSpeechRecognition() {
    try {
        await SpeechManager.initialize();
        updateStatusIndicator('ready');
    } catch (error) {
        showNotification('Errore nell\'inizializzazione vocale', 'error');
    }
}

async function startListening() {
    if (AppState.isListening) return;
    
    try {
        await SpeechManager.startListening((transcript, isFinal, confidence) => {
            if (!isFinal) {
                // Testo intermedio - mostra in grigio
                AppState.interimTranscript = transcript;
                updateTranscript();
            } else {
                // Testo finale - aggiungi al transcript permanente
                AppState.transcript += transcript + ' ';
                AppState.interimTranscript = '';
                
                // Aggiungi alla visualizzazione con effetto di scrittura
                appendToTranscript(transcript);
                updateWordCount();
                
                // Controlla comandi vocali
                if (checkForCommands(transcript)) {
                    return;
                }
            }
            
            // Aggiorna visualizzatore vocale
            updateVoiceVisualizer(confidence);
            updateConfidence(confidence);
        });
        
        AppState.isListening = true;
        AppState.isPaused = false;
        updateUI();
        updateStatusIndicator('listening');
        startVoiceVisualizer();
    } catch (error) {
        showNotification('Errore microfono', 'error');
    }
}

function checkForCommands(transcript) {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    if (lowerTranscript === 'pausa' || lowerTranscript === 'pause') {
        pauseListening();
        return true;
    }
    
    if (lowerTranscript === 'stop' || lowerTranscript === 'termina') {
        stopListening();
        return true;
    }
    
    if (lowerTranscript === 'continua' || lowerTranscript === 'continue' || lowerTranscript === 'riprendi') {
        resumeListening();
        return true;
    }
    
    return false;
}

function pauseListening() {
    if (AppState.isListening) {
        SpeechManager.pause();
        AppState.isListening = false;
        AppState.isPaused = true;
        
        // Quando mette in pausa, scrivi definitivamente il testo intermedio
        if (AppState.interimTranscript) {
            AppState.transcript += AppState.interimTranscript + ' ';
            AppState.interimTranscript = '';
            updateTranscript();
        }
        
        updateUI();
        updateStatusIndicator('paused');
        stopVoiceVisualizer();
        showNotification('Pausa - Testo salvato', 'info');
    }
}

function resumeListening() {
    if (AppState.isPaused) {
        startListening();
    }
}

function stopListening() {
    SpeechManager.stop();
    AppState.isListening = false;
    AppState.isPaused = false;
    
    // Allo stop, scrivi definitivamente tutto il testo
    if (AppState.interimTranscript) {
        AppState.transcript += AppState.interimTranscript + ' ';
        AppState.interimTranscript = '';
        updateTranscript();
    }
    
    updateUI();
    updateStatusIndicator('ready');
    stopVoiceVisualizer();
    enableChatFeatures();
    showNotification('Lettura completata!', 'success');
}

function updateUI() {
    const t = Translations[AppState.language];
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const saveBtn = document.getElementById('saveBtn');
    const statusText = document.getElementById('statusText');
    
    if (AppState.isListening) {
        statusText.textContent = t.statusListening;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        saveBtn.disabled = true;
    } else if (AppState.isPaused) {
        statusText.textContent = t.statusPaused;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = false;
        saveBtn.disabled = false;
    } else {
        statusText.textContent = AppState.transcript ? t.statusFinished : t.statusReady;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        saveBtn.disabled = !AppState.transcript.trim();
    }
    
    updateWordCount();
}

function updateTranscript() {
    const transcriptElement = document.getElementById('transcriptText');
    const container = document.getElementById('transcriptContainer');
    
    let displayText = AppState.transcript;
    
    // Aggiungi testo intermedio in grigio se presente
    if (AppState.interimTranscript) {
        displayText += '<span class="interim-text">' + AppState.interimTranscript + '</span>';
    }
    
    if (!displayText.trim() && !AppState.interimTranscript) {
        transcriptElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-dots"></i>
                <p>Inizia a leggere ad alta voce<br>Il testo apparirà qui in tempo reale</p>
            </div>
        `;
    } else {
        transcriptElement.innerHTML = displayText;
        
        // Evidenzia l'ultima frase aggiunta
        const spans = transcriptElement.querySelectorAll('span');
        if (spans.length > 0) {
            const lastSpan = spans[spans.length - 1];
            lastSpan.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }
    
    container.scrollTop = container.scrollHeight;
}

function appendToTranscript(text) {
    const transcriptElement = document.getElementById('transcriptText');
    
    // Rimuovi lo stato vuoto se presente
    if (transcriptElement.querySelector('.empty-state')) {
        transcriptElement.innerHTML = '';
    }
    
    // Aggiungi il testo con animazione
    const span = document.createElement('span');
    span.className = 'new-text';
    span.textContent = text + ' ';
    span.style.opacity = '0';
    span.style.transform = 'translateY(10px)';
    
    transcriptElement.appendChild(span);
    
    // Animazione di entrata
    setTimeout(() => {
        span.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
    }, 10);
    
    // Scroll automatico
    const container = document.getElementById('transcriptContainer');
    container.scrollTop = container.scrollHeight;
}

function updateWordCount() {
    const wordCount = AppState.transcript.trim().split(/\s+/).filter(w => w.length > 0).length;
    document.getElementById('wordCount').textContent = `${wordCount} parole`;
}

function updateConfidence(confidence) {
    const percent = Math.round(confidence * 100);
    document.getElementById('confidence').textContent = `${percent}% accuratezza`;
}

function updateVoiceVisualizer(confidence) {
    const visualizer = document.getElementById('voiceVisualizer');
    const bars = visualizer.querySelectorAll('.bar');
    
    const intensity = Math.min(confidence * 1.5, 1);
    
    bars.forEach((bar, index) => {
        const height = 20 + (Math.sin(Date.now() / 200 + index) * 40 * intensity);
        bar.style.height = `${height}px`;
        bar.style.background = `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`;
        bar.style.opacity = 0.5 + (intensity * 0.5);
    });
}

function startVoiceVisualizer() {
    const visualizer = document.getElementById('voiceVisualizer');
    visualizer.classList.add('listening');
}

function stopVoiceVisualizer() {
    const visualizer = document.getElementById('voiceVisualizer');
    visualizer.classList.remove('listening');
    
    const bars = visualizer.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.style.height = '20px';
        bar.style.opacity = '0.3';
    });
}

function updateStatusIndicator(status) {
    const dot = document.querySelector('.status-dot');
    const statusText = document.getElementById('statusText');
    
    switch(status) {
        case 'ready':
            dot.style.background = 'var(--success)';
            statusText.textContent = 'Pronto';
            break;
        case 'listening':
            dot.style.background = 'var(--primary)';
            statusText.textContent = 'Ascoltando...';
            break;
        case 'paused':
            dot.style.background = 'var(--warning)';
            statusText.textContent = 'In pausa';
            break;
        case 'finished':
            dot.style.background = 'var(--success)';
            statusText.textContent = 'Completato';
            break;
    }
}

function clearTranscript() {
    if (!AppState.isListening) {
        AppState.transcript = '';
        AppState.interimTranscript = '';
        updateTranscript();
        updateUI();
        showNotification('Testo cancellato', 'info');
    } else {
        showNotification('Fermati prima di cancellare', 'warning');
    }
}

function copyTranscript() {
    if (AppState.transcript) {
        navigator.clipboard.writeText(AppState.transcript).then(() => {
            showNotification('Testo copiato!', 'success');
        });
    }
}

function enableChatFeatures() {
    document.getElementById('chatInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    document.querySelectorAll('.btn-quick').forEach(btn => {
        btn.disabled = false;
    });
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage('user', message);
    input.value = '';
    
    try {
        const response = await ChatbotManager.generateOnlineResponse(message, AppState.transcript, AppState.apiConfig);
        addChatMessage('ai', response);
    } catch (error) {
        addChatMessage('ai', 'Errore nella connessione all\'IA. Riprova.');
    }
}

function askQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
}

function addChatMessage(sender, text) {
    const container = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = sender === 'user' ? 
        '<i class="fas fa-user"></i>' : 
        '<i class="fas fa-robot"></i>';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-text">${text}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animazione entrata
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function setLanguage(lang) {
    AppState.language = lang;
    SpeechManager.setLanguage(lang);
    updateUI();
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', initializeSpeechRecognition);