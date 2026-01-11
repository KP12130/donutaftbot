const mineflayer = require('mineflayer');
const http = require('http');

// --- RENDER ÉBREN TARTÁS (WEB SERVER) ---
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running and jumping!\n');
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Web szerver fut a porton: ${process.env.PORT || 3000}`);
});

// --- BOT KONFIGURÁCIÓ ---
const options = {
    host: 'donutsmp.net',
    username: 'Patrik12130',
    auth: 'microsoft',
    version: '1.20.4'
};

function createBot() {
    console.log('Bot indítása...');
    const bot = mineflayer.createBot(options);

    let isJumping = false;

    bot.on('spawn', () => {
        console.log('Bot belépett! 5 másodperc múlva küldöm a parancsot...');
        isJumping = false;

        // Várunk egy kicsit a belépés után, mielőtt elküldjük a parancsot
        setTimeout(() => {
            console.log('Parancs küldése: /afk 56');
            bot.chat('/afk 56');

            // 10 másodperc várakozás a teleportra, utána kezdődik az ugrálás
            console.log('Várakozás 10 másodpercig a teleportálásra...');
            setTimeout(() => {
                console.log('Ugrálás indítása!');
                isJumping = true;
            }, 10000);
        }, 5000);
    });

    // Folyamatos ugrálás kezelése
    bot.on('physicsTick', () => {
        if (isJumping) {
            bot.setControlState('jump', true);
        } else {
            bot.setControlState('jump', false);
        }
    });

    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString();
        if (message.trim().length > 0) {
            console.log(`[Szerver] ${message}`);
        }
    });

    bot.on('error', (err) => {
        console.log(`Hiba történt: ${err.message}`);
    });

    bot.on('end', () => {
        console.log('Bot lecsatlakozott. Újracsatlakozás 15 másodperc múlva...');
        isJumping = false;
        setTimeout(createBot, 15000);
    });
}

// Bot indítása
createBot();

