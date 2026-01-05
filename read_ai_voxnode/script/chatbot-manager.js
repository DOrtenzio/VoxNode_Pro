class ChatbotManager {
    static async generateOnlineResponse(question, context, config) {
        if (!config || !config.apiKey) {
            throw new Error('API Key non configurata');
        }
        
        switch (config.type) {
            case 'groq':
                return await this.queryGroq(question, context, config.apiKey);
            default:
                throw new Error('API non supportata');
        }
    }
    
    static async queryGroq(question, context, apiKey) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',  // Modello corretto
                    messages: [
                        {
                            role: 'system',
                            content: 'Sei un assistente di lettura esperto. Rispondi in italiano in modo chiaro e conciso. Usa markdown per formattare le risposte.'
                        },
                        {
                            role: 'user',
                            content: `CONTESTO (testo letto dall'utente):\n${context}\n\nDOMANDA: ${question}\n\nRISPOSTA (in italiano):`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000,
                    top_p: 1,
                    stream: false,
                    reasoning_effort: 'medium'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Errore API: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error('Groq API error:', error);
            return `Errore nella comunicazione con l'IA: ${error.message}. Verifica la tua API Key.`;
        }
    }
    
    // Versione con streaming (opzionale)
    static async queryGroqStream(question, context, apiKey, onChunk) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    {
                        role: 'system',
                        content: 'Sei un assistente di lettura. Rispondi in italiano.'
                    },
                    {
                        role: 'user',
                        content: `Testo: ${context}\n\nDomanda: ${question}`
                    }
                ],
                stream: true,
                temperature: 0.7
            })
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.substring(6));
                        if (data.choices[0].delta.content) {
                            accumulatedText += data.choices[0].delta.content;
                            if (onChunk) onChunk(accumulatedText);
                        }
                    } catch (e) {
                        // Ignora errori di parsing
                    }
                }
            }
        }
        
        return accumulatedText;
    }
}