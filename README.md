# Signal Lost — Episodio 01

Un’avventura sci-fi cinematografica a scelte a tempo. MILO, un piccolo robot di manutenzione, deve ripristinare una stazione orbitale controllata dall’AI NEXUS. Personaggi e ambientazione originali, con direzione artistica cartoon scelta dai concept.

Il livello è giocabile: quattro ambienti illustrati, otto situazioni, animazioni 2D del personaggio, effetti luminosi, suoni sintetizzati, tre vite e checkpoint a ogni nuova stanza. Una partita dura circa 1–2 minuti senza errori; i tentativi possono allungarla. È un PoC con illustrazioni animate tramite CSS, da sviluppare ulteriormente per ottenere sequenze d’animazione cinematografica complete.

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
- Spazio: azione (recuperare la memoria, collegare il nucleo).
- Pulsanti sullo schermo: stessi comandi su touch e con il mouse.
- Esc o P: pausa/ripresa. Il cambio di scheda mette automaticamente in pausa; la ripresa è manuale.
- Storia: 4,2 secondi per scegliere. Arcade: 2,4 secondi.
- Una scelta errata o il tempo scaduto costa una vita. Finite le vite, puoi ripartire dal checkpoint con tre vite. Il punteggio torna al valore di inizio stanza, senza duplicare i punti già ottenuti.
- Il record è locale al browser e separato per modalità. Non serve un account. Se lo storage è indisponibile, la partita funziona comunque.
- Audio facoltativo, attivato tramite interazione. L’impostazione del sistema per ridurre il movimento viene rispettata.

## Verifica

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Cinque test di logica e quattro test browser verificano: completamento di tutte le otto scelte da tastiera, record persistente, timeout, game over, checkpoint, pausa, visibilità della pagina, audio disattivabile, storage indisponibile e comandi touch. Sono stati eseguiti su Chromium, inclusi viewport mobile da 390 e 320 px; Safari e Firefox non sono ancora verificati.

Il runner browser avvia la build di produzione sulla porta 3000. Se Chromium non è installato, esegui `npx playwright install chromium`. Puoi indicare un binario già presente con `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Nella macchina cloud viene usato `/usr/bin/chromium`. Esegui nuovamente la build dopo modifiche al codice, prima dei test E2E.

## Deploy su Vercel

1. Salva il progetto in un repository Git e importalo in Vercel.
2. Seleziona il preset **Next.js**; imposta come Root Directory la directory che contiene `package.json`.
3. Usa `npm ci` come comando di installazione e `npm run build` come Build Command. Mantieni la directory di output predefinita di Next.js.
4. Seleziona Node.js 24, o un’altra versione supportata compatibile con il requisito del progetto.
5. Esegui il deploy e verifica una partita in entrambe le modalità sul dominio di Vercel.

Non servono variabili d’ambiente, API key, database o backend di gioco. Tutti gli asset sono locali; non vengono richiesti font o servizi esterni dal gameplay. Il deploy su Vercel non è stato eseguito in questa sessione.

## Struttura

- `components/game.tsx`: interfaccia, input, orologio, precaricamento delle scene e persistenza del record.
- `lib/game.ts`: livello e macchina a stati pura. Per cambiare il livello, modifica `beats`.
- `lib/audio.ts`: effetti audio tramite Web Audio.
- `app/globals.css`: layout responsive, animazioni e impostazione reduced-motion.
- `public/scenes`: cinque illustrazioni WebP e lo sprite trasparente di MILO, circa 2 MB in totale.
- `public/concepts`: le tre proposte visive iniziali, conservate per riferimento.
- `tests`: test di logica e browser.
- `docs`: schermate desktop e mobile della build verificata.

## Limiti del PoC

Un livello, sequenza lineare, checkpoint durante la sessione e record locale. Non sono inclusi salvataggi della partita, filmati animati, doppiaggio, livelli aggiuntivi o backend. Le animazioni del personaggio sono trasformazioni di uno sprite; non è ancora un’animazione fotogramma per fotogramma. I test automatizzati usano il clock controllato di Playwright per attraversare le stesse transizioni del gioco più rapidamente.

## Skill di progetto

Le nove skill di `leonvanzyl/skills` sono installate per Codex in `.agents/skills/`. `skills-lock.json` registra origine e hash. Le cartelle contengono anche riferimenti, template e script originali. Per reinstallarle dalla radice del progetto:

```sh
npx skills add leonvanzyl/skills --skill '*' --agent codex --yes
```

Per esempio, puoi chiedere «Usa la skill deploy-an-app per pubblicare questo progetto» oppure «Usa review-an-app per controllare il progetto». Le skill sono istruzioni per gli agenti; eventuali servizi, credenziali o programmi richiesti dalle singole procedure vanno predisposti quando vengono utilizzate. I file delle skill sono esclusi dagli upload Vercel tramite `.vercelignore`.
