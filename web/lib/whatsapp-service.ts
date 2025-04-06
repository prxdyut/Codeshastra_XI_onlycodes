import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';

export class WhatsAppService {
    private client: Client;
    private isReady: boolean = false;
    private qrCode: string | null = null;
    private static instance: WhatsAppService;
    private mediaPath: string;

    private constructor() {
        this.mediaPath = path.join(process.cwd(), 'media');
        this.initializeMediaDirectory();
        
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox']
            }
        });

        this.setupEventHandlers();
    }

    private async initializeMediaDirectory() {
        try {
            await fs.mkdir(this.mediaPath, { recursive: true });
            await fs.mkdir(path.join(this.mediaPath, 'audio'), { recursive: true });
            await fs.mkdir(path.join(this.mediaPath, 'images'), { recursive: true });
            await fs.mkdir(path.join(this.mediaPath, 'documents'), { recursive: true });
        } catch (error) {
            console.error('Error creating media directories:', error);
        }
    }

    public static getInstance(): WhatsAppService {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }

    private setupEventHandlers() {
        this.client.on('qr', async (qr) => {
            this.qrCode = await qrcode.toDataURL(qr);
        });

        this.client.on('ready', () => {
            this.isReady = true;
            console.log('WhatsApp client is ready!');
        });

        this.client.on('message', async (message: Message) => {
            await this.handleIncomingMessage(message);
        });

        this.client.on('disconnected', () => {
            this.isReady = false;
            console.log('Client disconnected');
        });
    }

    private async handleIncomingMessage(message: Message) {
        try {
            // Handle text messages
            if (message.type === 'chat') {
                await this.processTextMessage(message);
            }
            // Handle media messages
            else if (message.hasMedia) {
                await this.processMediaMessage(message);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    private async processTextMessage(message: Message) {
        const chat = await message.getChat();
        console.log(`New message from ${chat.name}: ${message.body}`);
        
        // Save text messages to a log file
        const logPath = path.join(this.mediaPath, 'chat_logs.txt');
        const logEntry = `[${new Date().toISOString()}] ${chat.name}: ${message.body}\n`;
        await fs.appendFile(logPath, logEntry);
    }

    private async processMediaMessage(message: Message) {
        const media = await message.downloadMedia();
        if (!media) return;

        let directory: string;
        let filename: string;

        // Determine directory based on media type
        switch (media.mimetype.split('/')[0]) {
            case 'audio':
                directory = 'audio';
                filename = `audio_${Date.now()}.${this.getExtension(media.mimetype)}`;
                break;
            case 'image':
                directory = 'images';
                filename = `image_${Date.now()}.${this.getExtension(media.mimetype)}`;
                break;
            default:
                directory = 'documents';
                filename = `doc_${Date.now()}.${this.getExtension(media.mimetype)}`;
        }

        const filePath = path.join(this.mediaPath, directory, filename);
        await fs.writeFile(filePath, Buffer.from(media.data, 'base64'));
        
        // Log media reception
        const chat = await message.getChat();
        const logPath = path.join(this.mediaPath, 'media_logs.txt');
        const logEntry = `[${new Date().toISOString()}] Received ${directory} from ${chat.name}: ${filename}\n`;
        await fs.appendFile(logPath, logEntry);
    }

    private getExtension(mimetype: string): string {
        const extensions: { [key: string]: string } = {
            'audio/mp4': 'mp4',
            'audio/mpeg': 'mp3',
            'audio/ogg': 'ogg',
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'application/pdf': 'pdf'
        };
        return extensions[mimetype] || 'unknown';
    }

    public getQRCode(): string | null {
        return this.qrCode;
    }

    public isClientReady(): boolean {
        return this.isReady;
    }

    public async initialize() {
        if (!this.isReady) {
            await this.client.initialize();
        }
    }

    public async disconnect() {
        if (this.isReady) {
            await this.client.destroy();
            this.isReady = false;
        }
    }
}
