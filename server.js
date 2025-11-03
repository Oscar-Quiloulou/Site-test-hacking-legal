
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'events-server.json');

app.use(express.json());
app.use(express.static(__dirname)); // sert index.html depuis le workspace

function loadEvents(){
    try { return JSON.parse(fs.readFileSync(DATA_FILE,'utf8') || '[]'); }
    catch(e){ return []; }
}
function saveEvents(events){
    fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
}

// POST endpoint pour les soumissions de formulaire
app.post('/api/submit', (req, res) => {
    const { name, email, message } = req.body || {};
    if (!name || !email) {
        return res.status(400).json({ ok: false, error: 'name and email required' });
    }
    const ev = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
        ts: Date.now(),
        type: 'contact_submit',
        clientIp: req.ip,
        input: { name, email, message },
        note: 'Données reçues via /api/submit'
    };
    const events = loadEvents();
    events.unshift(ev);
    if (events.length > 1000) events.length = 1000;
    saveEvents(events);

    // réponse simulée (ici on renvoie un objet de confirmation)
    const output = { ok: true, id: ev.id, receivedAt: ev.ts, message: 'Message reçu (simulation)' };

    // journaliser la sortie
    events.unshift({
        id: (Date.now()+1).toString(36),
        ts: Date.now(),
        type: 'contact_response',
        clientIp: req.ip,
        output
    });
    saveEvents(events);

    res.json(output);
});

// GET pour consulter les événements stockés côté serveur (local seulement)
app.get('/api/events', (req, res) => {
    res.json(loadEvents());
});

app.listen(PORT, () => {
    console.log(`API serveur démarré sur http://127.0.0.1:${PORT}`);
});
