class SpeechManager {
    static recognition = null;
    static isInitialized = false;
    static callbacks = [];
    static currentLanguage = 'it-IT';
    static interimResults = '';
    
    static async initialize() {
        return new Promise((resolve, reject) => {
            if (this.isInitialized) {
                resolve();
                return;
            }
            
            if (!('webkitSpeechRecognition' in window)) {
                reject(new Error('Riconoscimento vocale non supportato'));
                return;
            }
            
            this.recognition = new webkitSpeechRecognition();
            
            // Configurazione ottimale per lettura continua
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 3;
            this.recognition.lang = this.currentLanguage;
            
            this.recognition.onstart = () => {
                this.isInitialized = true;
            };
            
            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    const confidence = event.results[i][0].confidence || 0.8;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                        this.interimResults = '';
                    } else {
                        interimTranscript += transcript;
                        this.interimResults = transcript;
                    }
                    
                    // Chiama le callback per entrambi i tipi di risultati
                    if (finalTranscript) {
                        this.callbacks.forEach(callback => 
                            callback(finalTranscript, true, confidence)
                        );
                    }
                    
                    if (interimTranscript) {
                        this.callbacks.forEach(callback => 
                            callback(interimTranscript, false, confidence)
                        );
                    }
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
            
            this.recognition.onend = () => {
                // Se c'era testo intermedio, lo considera finale
                if (this.interimResults) {
                    this.callbacks.forEach(callback => 
                        callback(this.interimResults, true, 0.7)
                    );
                    this.interimResults = '';
                }
            };
            
            // Richiedi permesso microfono
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => resolve())
                .catch(() => reject(new Error('Permesso microfono negato')));
        });
    }
    
    static async startListening(callback) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (callback) {
            this.callbacks.push(callback);
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            // Se già in esecuzione, riavvia
            if (error.message.includes('already started')) {
                this.recognition.stop();
                setTimeout(() => this.recognition.start(), 100);
            } else {
                throw error;
            }
        }
    }
    
    static pause() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
    
    static stop() {
        if (this.recognition) {
            this.recognition.stop();
            this.callbacks = [];
            this.interimResults = '';
        }
    }
    
    static setLanguage(lang) {
        this.currentLanguage = lang === 'it' ? 'it-IT' : 'en-US';
        if (this.recognition) {
            this.recognition.lang = this.currentLanguage;
        }
    }
}