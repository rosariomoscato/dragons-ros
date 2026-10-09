# Signal Lost — Episodio 01

Un’avventura sci-fi cinematografica a scelte a tempo. MILO, un piccolo robot di manutenzione, deve ripristinare una stazione orbitale controllata dall’AI NEXUS. Personaggi e ambientazione originali, con direzione artistica cartoon scelta dai concept.

Il livello è giocabile: quattro ambienti illustrati, otto ostacoli con tre comandi consecutivi ciascuno, una scelta tra due percorsi, combo, tre vite e checkpoint a ogni nuovo settore. Una partita senza errori dura circa un minuto, in base al tempo impiegato per reagire. Nel finale bisogna mantenere premuta Azione per completare il ripristino.

MILO usa un rig SVG: braccia, gomiti, gambe, ginocchia, testa e sciarpa si muovono separatamente. Salti, scivolate, scatti e interazioni durano 0,8–1,05 secondi, con anticipazione, contatto e recupero. Le pose sono interpolate continuamente e ogni comando parte dalla posa precedente; la posizione si conserva lungo il settore. I fondali cambiano con una sovrapposizione e un passaggio di servizio animato. Resta un PoC: per ottenere l’animazione tradizionale di un film servono sequenze disegnate fotogramma per fotogramma.

## Avvio

Node.js 20.9 o successivo (Node.js 24 verificato).

```sh
npm ci
npm run dev
```

Il server di sviluppo usa la porta 3000. Per verificare la versione di produzione:

```sh
npm run build
npm run start
```

In questa macchina cloud, usa una cache scrivibile:

```sh
npm --cache /tmp/dragons-npm-cache ci
```

## Comandi

- Frecce o WASD: sinistra, salto, abbassati, destra.
- Spazio: azione (recuperare la memoria, collegare il nucleo). Nel finale mantienilo premuto per 0,9 secondi; su touch tieni premuto il pulsante Azione.
- Pulsanti sullo schermo: stessi comandi su touch e con il mouse.
- Esc o P: pausa/ripresa. Il cambio di scheda mette automaticamente in pausa; la ripresa è manuale.
- Storia: 3 secondi per comando. Arcade: 1,7 secondi. Nella scorciatoia il tempo per i comandi successivi è ridotto di 0,35 secondi, con un bonus di 60 punti per la scelta.
- Segui i tre comandi mostrati in alto. Ogni risposta corretta aumenta la combo; le risposte più rapide ottengono più punti.
- Una scelta errata o il tempo scaduto costa una vita, azzera la combo e riavvia l’ostacolo riportando il punteggio al suo inizio. Finite le vite, puoi ripartire dal checkpoint di settore con tre vite e il relativo punteggio, senza duplicare punti.
- Il record è locale al browser e separato per modalità. Non serve un account. Se lo storage è indisponibile, la partita funziona comunque.
- Audio facoltativo, attivato tramite interazione. L’impostazione del sistema per ridurre il movimento viene rispettata.

## Verifica

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Sei test di logica e nove test browser verificano: completamento dei 24 comandi, percorsi alternativi, combo, record persistente, timeout, game over, checkpoint, pausa, visibilità della pagina, audio disattivabile, storage indisponibile e comandi touch, incluso il mantenimento del pulsante finale. I test di movimento verificano anche continuità della posa, ombra a terra, sovrapposizione dei fondali, pausa delle animazioni e movimento ridotto. Sono stati eseguiti su Chromium, inclusi viewport mobile da 390 e 320 px; Safari e Firefox non sono ancora verificati.

Il runner browser avvia la build di produzione sulla porta 3000. Se Chromium non è installato, esegui `npx playwright install chromium`. Puoi indicare un binario già presente con `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Nella macchina cloud viene usato `/usr/bin/chromium`. Esegui nuovamente la build dopo modifiche al codice, prima dei test E2E.

## Deploy su Vercel

1. Salva il progetto in un repository Git e importalo in Vercel.
2. Seleziona il preset **Next.js**; imposta come Root Directory la directory che contiene `package.json`.
3. Usa `npm ci` come comando di installazione e `npm run build` come Build Command. Mantieni la directory di output predefinita di Next.js.
4. Seleziona Node.js 24, o un’altra versione supportata compatibile con il requisito del progetto.
5. Esegui il deploy e verifica una partita in entrambe le modalità sul dominio di Vercel.

Non servono variabili d’ambiente, API key, database o backend di gioco. Tutti gli asset sono locali; non vengono richiesti font o servizi esterni dal gameplay. Il progetto acquisito dall’utente è collegato al repository GitHub: un push a `main` avvia l’aggiornamento su Vercel. Il sito è [snappy-oxygen-1pi01y4.vercel.app](https://snappy-oxygen-1pi01y4.vercel.app). Per tornare a una versione precedente, usa Instant Rollback nella pagina Deployments di Vercel. Dopo un rollback, usa Undo Rollback o promuovi un deployment per ripristinare l’aggiornamento automatico dell’indirizzo pubblico.

## Struttura

- `components/game.tsx`: interfaccia, input, orologio, precaricamento delle scene e persistenza del record.
- `lib/game.ts`: livello e macchina a stati pura. Per cambiare il livello, modifica `beats`.
- `components/robot.tsx`: rig articolato e riproduzione delle sequenze tramite Web Animations API, con pausa e movimento ridotto.
- `lib/motion.ts`: pose delle azioni e interpolazione delle coreografie.
- `components/scenery.tsx`: sovrapposizione dei fondali senza riavviare quelli dello stesso settore.
- `app/motion.css`: passaggi tra settori, ombre, luce, detriti e impatti.
- `lib/audio.ts`: effetti audio tramite Web Audio.
- `app/globals.css`: layout responsive, animazioni e impostazione reduced-motion.
- `public/scenes`: cinque illustrazioni WebP e lo sprite trasparente di MILO, circa 2 MB in totale.
- `public/concepts`: le tre proposte visive iniziali, conservate per riferimento.
- `tests`: test di logica e browser.
- `docs`: schermate desktop e mobile della build verificata.

## Limiti del PoC

Un livello, progressione tra quattro settori con una biforcazione locale, checkpoint durante la sessione e record locale. I due percorsi si ricongiungono prima della griglia laser. Non sono inclusi salvataggi della partita, filmati animati, doppiaggio, livelli aggiuntivi o backend. Il personaggio è un rig 2D con articolazioni animate; non è ancora un’animazione disegnata fotogramma per fotogramma. Lo sprite illustrato originale rimane negli asset come riferimento visivo. I test automatizzati usano il clock controllato di Playwright per attraversare le stesse transizioni del gioco più rapidamente.

## Skill di progetto

Le nove skill di `leonvanzyl/skills` sono installate per Codex in `.agents/skills/`. `skills-lock.json` registra origine e hash. Le cartelle contengono anche riferimenti, template e script originali. Per reinstallarle dalla radice del progetto:

```sh
npx skills add leonvanzyl/skills --skill '*' --agent codex --yes
```

Per esempio, puoi chiedere «Usa la skill deploy-an-app per pubblicare questo progetto» oppure «Usa review-an-app per controllare il progetto». Le skill sono istruzioni per gli agenti; eventuali servizi, credenziali o programmi richiesti dalle singole procedure vanno predisposti quando vengono utilizzate. I file delle skill sono esclusi dagli upload Vercel tramite `.vercelignore`.
