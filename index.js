const mineflayer = require('mineflayer');
const http = require('http');

// --- RENDER ÉBREN TARTÁS (WEB SERVER) ---
// Ez szükséges, hogy a Render ingyenes szintjén ne álljon le a folyamat
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running and farming shards!\n');
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Web szerver fut a porton: ${process.env.PORT || 3000}`);
});

// --- BOT KONFIGURÁCIÓ ---
const options = {
    host: 'donutsmp.net',
    username: 'Patrik12130', // Microsoft email vagy username (auth: microsoft esetén a login során dől el)
    auth: 'microsoft',
    version: '1.20.4'
};

function createBot() {
    console.log('Bot indítása...');
    const bot = mineflayer.createBot(options);

    let afkAttemptCounter = 20; // 20-as szobától indul
    let inAfkZone = false;
    let isTeleporting = false;
    let searchTimer = null;

    bot.on('spawn', () => {
        console.log('Bot belépett a lobbyba! AFK keresés indítása 20-as szobától...');
        inAfkZone = false;
        isTeleporting = false;
        afkAttemptCounter = 20;

        // Töröljük a korábbi időzítőt, ha van
        if (searchTimer) clearInterval(searchTimer);

        // 10 másodpercenként próbálkozik
        searchTimer = setInterval(() => {
            if (!inAfkZone && !isTeleporting) {
                console.log(`Keresés: /afk ${afkAttemptCounter}`);
                bot.chat(`/afk ${afkAttemptCounter}`);
                
                // Következő szoba kiválasztása (1-38 között körforgásban)
                afkAttemptCounter++;
                if (afkAttemptCounter > 38) {
                    afkAttemptCounter = 1;
                }
            }
        }, 10000); // 10 másodperces várakozás a próbálkozások között
    });

    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString();
        
        // Logoljuk a szerver üzeneteit a konzolra (Render Logs-ban látni fogod)
        if (message.trim().length > 0) {
            console.log(`[Szerver] ${message}`);
        }

        // SIKERES TELEPORT FIGYELÉSE
        // Frissítve: Figyeli a normál "AFK" és a szerver által használt speciális "ᴀꜰᴋ" karaktereket is
        if (message.includes('You teleported to the AFK') || message.includes('You teleported to the ᴀꜰᴋ')) {
            console.log('>>> SIKER! Megkezdődött a teleportálás az AFK zónába.');
            isTeleporting = true;
            inAfkZone = true;
            
            // Azonnal leállítjuk a keresést
            if (searchTimer) {
                clearInterval(searchTimer);
                searchTimer = null;
            }

            // 7 másodperces teljes mozdulatlanság, hogy a TP ne szakadjon meg
            setTimeout(() => {
                console.log('>>> Teleportálás befejezve. Bot aktív az AFK zónában.');
                isTeleporting = false;
            }, 7000);
        }

        // Ha kidobna a szobából vagy nem sikerülne (pl. tele van)
        if (message.includes('full') || message.includes('is full') || message.includes('kick')) {
            if (inAfkZone) {
                console.log('Valami hiba történt vagy kidobtak. Keresés újraindítása...');
                inAfkZone = false;
                isTeleporting = false;
                
                // Ha nincs aktív kereső, indítsuk újra a logikát
                if (!searchTimer) {
                    bot.emit('spawn');
                }
            }
        }
    });

    // ANTI-AFK MOZGÁS (Csak ha már bent van a zónában és nem teleportál éppen)
    setInterval(() => {
        if (inAfkZone && !isTeleporting) {
            // Egy kis ugrás és fejmozgás, hogy ne dobjon ki a rendszer
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 500);
            
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() - 0.5) * Math.PI;
            bot.look(yaw, pitch);
        }
    }, 30000); // 30 másodpercenként mozog

    // HIBAKEZELÉS ÉS ÚJRAINDÍTÁS
    bot.on('error', (err) => {
        console.log(`Hiba történt: ${err.message}`);
    });

    bot.on('end', () => {
        console.log('Bot lecsatlakozott. Újracsatlakozás 15 másodperc múlva...');
        if (searchTimer) clearInterval(searchTimer);
        setTimeout(createBot, 15000);
    });
}

// Bot indítása
createBot();
