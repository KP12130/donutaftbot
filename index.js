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
const DISCORD_TOKEN = process.env.DISCORD_TOKEN; 
const LOG_CHANNEL_ID = '1459574891559780515'; // Ide írd annak a csatornának az ID-jét, ahová a logokat szeretnéd

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- MC BOT KONFIGURÁCIÓ ---
const options = {
    host: 'donutsmp.net',
    username: 'KP12130',
    auth: 'microsoft',
    version: '1.20.4'
};

let mcBot = null;
let isStopping = false;
let isJumping = false;

// Segédfüggvény a logoláshoz Discordra és Konzolra
async function discordLog(message) {
    console.log(message);
    try {
        const channel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (channel) {
            await channel.send(`\`[${new Date().toLocaleTimeString()}]\` ${message}`);
        }
    } catch (err) {
        console.error('Hiba a Discord logolás közben:', err.message);
    }
}

function createMCBot() {
    if (isStopping) return;

    discordLog('🚀 Minecraft bot indítása...');
    mcBot = mineflayer.createBot(options);
    isJumping = false;

    mcBot.on('spawn', () => {
        discordLog('✅ MC Bot sikeresen bent van a szerveren!');
        
        setTimeout(() => {
            if (isStopping || !mcBot) return;
            discordLog('💬 Parancs küldése: /afk 70');
            mcBot.chat('/afk 70');
            
            setTimeout(() => {
                if (isStopping || !mcBot) return;
                isJumping = true;
                discordLog('🏃 Ugrálás aktiválva és üzemkész.');
            }, 10000);
        }, 5000);
    });

    mcBot.on('physicsTick', () => {
        if (mcBot && isJumping && !isStopping) {
            mcBot.setControlState('jump', true);
        }
    });

    mcBot.on('end', () => {
        discordLog('🔌 MC Bot lecsatlakozott a szerverről.');
        if (!isStopping) {
            discordLog('🔄 Újracsatlakozás 15 másodperc múlva...');
            setTimeout(createMCBot, 15000);
        }
    });

    mcBot.on('error', (err) => {
        discordLog(`❌ MC Hiba történt: ${err.message}`);
    });
}

// --- DISCORD PARANCSOK ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!start') {
        if (isStopping || !mcBot) {
            isStopping = false;
            if (!mcBot) {
                createMCBot();
                return message.reply('▶️ Minecraft bot indítási folyamata elindítva.');
            }
        }
        message.reply('⚠️ A bot már fut vagy éppen csatlakozik!');
    }

    if (message.content === '!stop') {
        if (mcBot) {
            isStopping = true;
            isJumping = false;
            mcBot.quit();
            mcBot = null;
            return message.reply('⏹️ Minecraft bot leállítva és kijelentkeztetve.');
        }
        message.reply('❓ A bot jelenleg nem fut, így nem tudom leállítani.');
    }
});

client.once('ready', () => {
    console.log(`Discord bot online: ${client.user.tag}`);
});

// Indítás
client.login(DISCORD_TOKEN);
createMCBot();

