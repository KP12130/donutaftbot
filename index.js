const mineflayer = require('mineflayer');
const http = require('http');

http.createServer((req, res) => {
  res.write('A bot fut!');
  res.end();
}).listen(process.env.PORT || 3000);

const botArgs = {
    host: 'donutsmp.net',
    username: 'KP12130',
    auth: 'microsoft',
    version: '1.20.4'
};

const createBot = () => {
    const bot = mineflayer.createBot(botArgs);
    let afkAttemptCounter = 1;
    let inAfkZone = false;
    let isTeleporting = false; // Új változó a teleportálási időhöz
    let searchTimer = null;

    bot.on('spawn', () => {
        console.log('Bot belépett. Kezdem a keresést...');
        inAfkZone = false;
        isTeleporting = false;
        afkAttemptCounter = 1;

        startSearching();
    });

    function startSearching() {
        if (searchTimer) clearInterval(searchTimer);
        searchTimer = setInterval(() => {
            if (!inAfkZone && !isTeleporting) {
                console.log(`Próbálkozás: /afk ${afkAttemptCounter}`);
                bot.chat(`/afk ${afkAttemptCounter}`);
                
                afkAttemptCounter++;
                if (afkAttemptCounter > 38) afkAttemptCounter = 1;
            }
        }, 1200); // 1.2 mp delay, hogy biztosan ne spameld túl
    }

    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString();
        
        // Ha elindult a teleportálás
        if (message.includes('You teleported to the AFK')) {
            console.log('Sikerült! Várakozás 5 másodpercig (mozdulatlanság)...');
            isTeleporting = true;
            inAfkZone = true;
            if (searchTimer) clearInterval(searchTimer);

            // 6 másodpercre állítom a biztonság kedvéért, utána kezdheti az anti-AFK-t
            setTimeout(() => {
                console.log('Teleportálás kész, bot aktív az AFK zónában.');
                isTeleporting = false;
            }, 6000);
        }

        // Ha tele van a szoba vagy hiba van, folytassa a keresést
        if (message.includes('full') || message.includes('error')) {
            isTeleporting = false;
            inAfkZone = false;
        }
    });

    // Anti-AFK rutin (csak ha már bent van és nem teleportál éppen)
    setInterval(() => {
        if (inAfkZone && !isTeleporting) {
            // Véletlenszerű mozgás: ugrás vagy fejmozgatás
            const rand = Math.random();
            if (rand < 0.5) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
            } else {
                bot.look(Math.random() * Math.PI, (Math.random() - 0.5) * Math.PI);
            }
        }
    }, 40000); // 40 másodpercenként

    bot.on('end', () => {
        console.log('Lecsatlakozva. Újraindítás 10 mp múlva...');
        if (searchTimer) clearInterval(searchTimer);
        setTimeout(createBot, 10000);
    });

    bot.on('error', err => console.log('Hiba:', err));
};

createBot();