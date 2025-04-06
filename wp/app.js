const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Groq } = require('groq-sdk');
require('dotenv').config();

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});
console.log(groq);

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Generate QR Code for WhatsApp Web
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Scan it with WhatsApp to log in.');
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

// Function to transcribe audio using Groq's API
async function transcribeAudio(audioPath) {
    try {
        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(audioPath),
          model: "whisper-large-v3",
          prompt: "Specify context or spelling", // Optional
          response_format: "json", // Optional
          language: "en", // Optional
          temperature: 0.0, // Optional
        });

        return transcription.text;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return null;
    }
}

// Function to get response from DeepSeek
async function getDeepSeekResponse(text) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: text
                }
            ],
            model: "deepseek-r1-distill-llama-70b",
            temperature: 0.7,
            max_tokens: 2048,
        });

        return completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error('Error getting DeepSeek response:', error);
        return null;
    }
}

// Handle incoming messages
client.on('message', async (message) => {
    try {
        console.log(message);
        // Handle audio messages
        if (message.hasMedia && message.type === 'audio' || message.type === 'ptt') {
            console.log('Received audio message. Processing...');
            
            // Download the audio file
            const media = await message.downloadMedia();
            const audioPath = `./temp_audio_${Date.now()}.ogg`;
            
            // Save the audio file temporarily
            fs.writeFileSync(audioPath, media.data, 'base64');
            
            // Transcribe the audio
            const transcription = await transcribeAudio(audioPath);
            
            // Delete the temporary audio file
            fs.unlinkSync(audioPath);
            
            if (transcription) {
                // First send the transcription
                await message.reply(`Transcription: ${transcription}`);
                
                // Get and send the DeepSeek response
                const aiResponse = await getDeepSeekResponse(transcription);
                if (aiResponse) {
                    await message.reply(`AI Response: ${aiResponse}`);
                } else {
                    await message.reply('Sorry, I could not generate a response to your message.');
                }
            } else {
                await message.reply('Sorry, I could not transcribe the audio message.');
            }
        }
        // Handle text messages
        else if (message.type === 'chat') {
            console.log('Received text message. Processing...');
            const aiResponse = await getDeepSeekResponse(message.body);
            if (aiResponse) {
                await message.reply(aiResponse);
            } else {
                await message.reply('Sorry, I could not generate a response to your message.');
            }
        }
    } catch (error) {
        console.error('Error processing message:', error);
        await message.reply('Sorry, there was an error processing your message.');
    }
});

// Initialize the client
client.initialize();
