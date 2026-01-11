const mineflayer = require('mineflayer');
const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');

// --- RENDER ÉBREN TARTÁS (WEB SERVER) ---
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running and controlled by Discord!\n');
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Web szerver fut a porton: ${process.env.PORT || 3000}`);
});

// --- DISCORD BOT BEÁLLÍTÁSA ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN; // Render Environment Variables-nél add meg!
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- MC BOT KONFIGURÁCIÓ ---
const options = {
    host: 'donutsmp.net',
    username: 'Patrik12130',
    auth: 'microsoft',
    version: '1.20.4'
};

let mcBot = null;
let isStopping = false;
let isJumping = false;

function createMCBot() {
    if (isStopping) return;

    console.log('Minecraft bot indítása...');
    mcBot = mineflayer.createBot(options);
    isJumping = false;

    mcBot.on('spawn', () => {
        console.log('MC Bot bent van a szerveren!');
        setTimeout(() => {
            if (isStopping || !mcBot) return;
            mcBot.chat('/afk 56');
            setTimeout(() => {
                if (isStopping || !mcBot) return;
                isJumping = true;
                console.log('Ugrálás aktiválva.');
            }, 10000);
        }, 5000);
    });

    mcBot.on('physicsTick', () => {
        if (mcBot && isJumping && !isStopping) {
            mcBot.setControlState('jump', true);
        }
    });

    mcBot.on('end', () => {
        console.log('MC Bot lecsatlakozott.');
        if (!isStopping) {
            setTimeout(createMCBot, 15000);
        }
    });

    mcBot.on('error', (err) => console.log('MC Hiba:', err));
}

// --- DISCORD PARANCSOK ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Egyszerű szöveges parancsok (pl. !start, !stop)
    if (message.content === '!start') {
        if (isStopping || mcBot) {
            isStopping = false;
            if (!mcBot) createMCBot();
            return message.reply('Minecraft bot indítása folyamatban...');
        }
        message.reply('A bot már fut vagy indul!');
    }

    if (message.content === '!stop') {
        if (mcBot) {
            isStopping = true;
            isJumping = false;
            mcBot.quit();
            mcBot = null;
            return message.reply('Minecraft bot leállítva és leléptetve.');
        }
        message.reply('A bot jelenleg nem fut.');
    }
});

client.once('ready', () => {
    console.log(`Discord bot online: ${client.user.tag}`);
});

// Indítás
client.login(DISCORD_TOKEN);
createMCBot();

