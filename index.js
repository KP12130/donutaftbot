const mineflayer = require('mineflayer');
const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');

// --- RENDER ÉBREN TARTÁS (WEB SERVER) ---
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running and controlled by Discord!\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Web szerver fut a porton: ${PORT}`);
});

// Belső "Self-Ping"
setInterval(() => {
    const url = process.env.RENDER_EXTERNAL_URL;
    if (url) {
        http.get(url, (res) => {
            console.log('Self-ping sikeres: ' + res.statusCode);
        }).on('error', (err) => {
            console.log('Self-ping hiba: ' + err.message);
        });
    }
}, 280000);

// --- DISCORD BOT BEÁLLÍTÁSA ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN; 
const LOG_CHANNEL_ID = 'IDE_MÁSOLD_A_CSATORNA_ID_T'; 

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- MC BOT KONFIGURÁCIÓ ---
const options = {
    host: 'donutsmp.net',
    username: 'Patrik12130',
    auth: 'microsoft',
    version: '1.20.4',
    // JAVÍTÁS: Kihagyjuk a hibás csomagok validációját, hogy ne haljon meg a bot
    skipValidation: true,
    hideErrors: true 
};

let mcBot = null;
let isStopping = false;
let isJumping = false;
let reconnectTimeout = 15000;

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

    // JAVÍTÁS: Zlib/Chunk hiba elkapása, hogy ne álljon le a Node folyamat
    mcBot.on('error', (err) => {
        if (err.code === 'Z_DATA_ERROR' || err.message.includes('inflating chunk')) {
            // Ezt csak csendben logoljuk, mert a bot tudja folytatni
            console.log('⚠️ Hibás adatcsomag érkezett a szervertől (Z_DATA_ERROR), figyelmen kívül hagyva.');
            return;
        }
        discordLog(`❌ MC Hiba: ${err.message}`);
        if (!isStopping && (err.message.includes('already') || err.message.includes('connect'))) {
             if (mcBot) mcBot.quit();
        }
    });

    mcBot.on('spawn', () => {
        discordLog('✅ MC Bot sikeresen bent van a szerveren!');
        reconnectTimeout = 15000;
        
        setTimeout(() => {
            if (isStopping || !mcBot) return;
            discordLog('💬 Parancs küldése: /afk 56');
            mcBot.chat('/afk 56');
            
            setTimeout(() => {
                if (isStopping || !mcBot) return;
                isJumping = true;
                discordLog('🏃 Ugrálás aktiválva.');
            }, 10000);
        }, 5000);
    });

    mcBot.on('physicsTick', () => {
        if (mcBot && isJumping && !isStopping) {
            mcBot.setControlState('jump', true);
        }
    });

    mcBot.on('end', (reason) => {
        discordLog(`🔌 MC Bot lecsatlakozott. Indok: ${reason}`);
        if (!isStopping) {
            if (reason.includes('already connected') || reason.includes('logged in')) {
                reconnectTimeout = 60000;
                discordLog('⏳ Karakter bent ragadt. Várok 1 percet...');
            } else {
                reconnectTimeout = 15000;
                discordLog(`🔄 Újracsatlakozás ${reconnectTimeout / 1000} mp múlva...`);
            }
            setTimeout(createMCBot, reconnectTimeout);
        }
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
                return message.reply('▶️ Minecraft bot indítása...');
            }
        }
        message.reply('⚠️ A bot már fut!');
    }

    if (message.content === '!stop') {
        if (mcBot) {
            isStopping = true;
            isJumping = false;
            mcBot.quit();
            mcBot = null;
            return message.reply('⏹️ Minecraft bot leállítva.');
        }
        message.reply('❓ A bot nem fut.');
    }

    if (message.content === '!kick') {
        await message.reply('💀 Folyamat leállítása...');
        process.exit(0); 
    }
});

client.once('ready', () => {
    console.log(`Discord bot online: ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);
createMCBot();

