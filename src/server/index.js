const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dogecore = require('bitcore-lib-doge');
const { PrivateKey, Address, Transaction, Script, Opcode } = dogecore;
const { Hash, Signature } = dogecore.crypto;
const fs = require('fs');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const WALLET_PATH = process.env.WALLET || '.wallet.json';

if (process.env.TESTNET === 'true') {
    dogecore.Networks.defaultNetwork = dogecore.Networks.testnet;
}

if (process.env.FEE_PER_KB) {
    Transaction.FEE_PER_KB = parseInt(process.env.FEE_PER_KB);
} else {
    Transaction.FEE_PER_KB = 100000000;
}

const MAX_SCRIPT_ELEMENT_SIZE = 520;
const MAX_CHUNK_LEN = 240;
const MAX_PAYLOAD_LEN = 1500;

function bufferToChunk(b, type) {
    b = Buffer.from(b, type);
    return {
        buf: b.length ? b : undefined,
        len: b.length,
        opcodenum: b.length <= 75 ? b.length : b.length <= 255 ? 76 : 77
    };
}

function numberToChunk(n) {
    return {
        buf: n <= 16 ? undefined : n < 128 ? Buffer.from([n]) : Buffer.from([n % 256, n / 256]),
        len: n <= 16 ? 0 : n < 128 ? 1 : 2,
        opcodenum: n == 0 ? 0 : n <= 16 ? 80 + n : n < 128 ? 1 : 2
    };
}

function opcodeToChunk(op) {
    return { opcodenum: op };
}

function inscribe(wallet, address, contentType, data) {
    // ... (existing inscribe function code)
}

function fund(wallet, tx) {
    // ... (existing fund function code)
}

function updateWallet(wallet, tx) {
    // ... (existing updateWallet function code)
}

async function broadcast(tx, retry) {
    // ... (existing broadcast function code)
}

async function walletSync() {
    // ... (existing walletSync function code)
}

app.post('/api/inscribe', async (req, res) => {
    try {
        const { address, contentType, data } = req.body;
        let wallet = JSON.parse(fs.readFileSync(WALLET_PATH));
        
        const txs = inscribe(wallet, new Address(address), contentType, Buffer.from(data, 'hex'));
        await Promise.all(txs.map(tx => broadcast(tx, false)));
        
        res.json({ success: true, txid: txs[txs.length - 1].hash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/wallet/balance', async (req, res) => {
    try {
        const balance = await walletSync();
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/wallet/send', async (req, res) => {
    try {
        const { address, amount } = req.body;
        let wallet = JSON.parse(fs.readFileSync(WALLET_PATH));
        
        let tx = new Transaction();
        tx.to(new Address(address), parseInt(amount));
        fund(wallet, tx);
        
        await broadcast(tx, true);
        res.json({ success: true, txid: tx.hash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/wallet/new', (req, res) => {
    try {
        const privateKey = new PrivateKey();
        const privkey = privateKey.toWIF();
        const address = privateKey.toAddress().toString();
        const wallet = { privkey, address, utxos: [] };
        res.json({ success: true, wallet });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});