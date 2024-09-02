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

// Existing utility functions (fund, updateWallet, broadcast, etc.) go here
// Copy these functions from the original script

app.post('/api/inscribe', async (req, res) => {
    try {
        const { address, contentType, data } = req.body;
        let wallet = JSON.parse(fs.readFileSync(WALLET_PATH));
        
        const txs = inscribe(wallet, new Address(address), contentType, Buffer.from(data, 'hex'));
        await broadcastAll(txs, false);
        
        res.json({ success: true, txid: txs[1].hash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/wallet/balance', (req, res) => {
    try {
        let wallet = JSON.parse(fs.readFileSync(WALLET_PATH));
        let balance = wallet.utxos.reduce((acc, curr) => acc + curr.satoshis, 0);
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

app.post('/api/wallet/sync', async (req, res) => {
    try {
        await walletSync();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Include all necessary functions from the original script here
// Such as inscribe, broadcastAll, walletSync, etc.