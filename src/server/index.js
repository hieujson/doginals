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
    let chunks = [
        bufferToChunk('ord'),
        numberToChunk(1),
        bufferToChunk(contentType),
        numberToChunk(0),
        bufferToChunk(data)
    ];

    let script = new Script();
    for (let chunk of chunks) {
        if (chunk.buf) {
            script.add(chunk.buf);
        } else if (chunk.opcodenum) {
            script.add(Opcode(chunk.opcodenum));
        }
    }

    let tx = new Transaction()
        .from(wallet.utxos)
        .addOutput(new Transaction.Output({
            script: script,
            satoshis: 1000
        }))
        .change(address)
        .sign(wallet.privkey);

    return [tx];
}

async function fund(wallet, tx) {
    let balance = wallet.utxos.reduce((a, b) => a + b.satoshis, 0);
    let needed = tx.outputAmount + tx._estimateFee();
    if (balance < needed) {
        throw new Error(`Insufficient balance. Have ${balance}, need ${needed}`);
    }
    tx.from(wallet.utxos);
    tx.change(wallet.address);
    tx.sign(wallet.privkey);
}

function updateWallet(wallet, tx) {
    wallet.utxos = wallet.utxos.filter(utxo => !tx.inputs.some(input => input.prevTxId.toString('hex') === utxo.txid && input.outputIndex === utxo.vout));
    tx.outputs.forEach((output, index) => {
        if (output.script.toAddress().toString() === wallet.address) {
            wallet.utxos.push({
                txid: tx.hash,
                vout: index,
                address: wallet.address,
                script: output.script.toHex(),
                satoshis: output.satoshis
            });
        }
    });
}

async function broadcast(tx, retry) {
    let res = await axios.post('https://api.blockcypher.com/v1/doge/main/txs/push', {
        tx: tx.serialize()
    });
    if (res.data.tx && res.data.tx.hash) {
        return res.data.tx.hash;
    } else {
        throw new Error('Failed to broadcast transaction');
    }
}

async function walletSync() {
    let wallet = JSON.parse(fs.readFileSync(WALLET_PATH));
    let res = await axios.get(`https://api.blockcypher.com/v1/doge/main/addrs/${wallet.address}/full?unspentOnly=true`);
    wallet.utxos = res.data.txs.flatMap(tx => tx.outputs
        .filter(output => output.addresses[0] === wallet.address)
        .map(output => ({
            txid: tx.hash,
            vout: output.n,
            address: wallet.address,
            script: output.script,
            satoshis: output.value
        }))
    );
    fs.writeFileSync(WALLET_PATH, JSON.stringify(wallet));
    return wallet.utxos.reduce((a, b) => a + b.satoshis, 0);
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
        await fund(wallet, tx);
        
        const txid = await broadcast(tx, true);
        updateWallet(wallet, tx);
        fs.writeFileSync(WALLET_PATH, JSON.stringify(wallet));
        res.json({ success: true, txid });
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

app.post('/api/wallet/import', (req, res) => {
    try {
        const { privateKey, seedPhrase } = req.body;
        let wallet;

        if (privateKey) {
            const importedPrivateKey = new PrivateKey(privateKey);
            const privkey = importedPrivateKey.toWIF();
            const address = importedPrivateKey.toAddress().toString();
            wallet = { privkey, address, utxos: [] };
        } else if (seedPhrase) {
            // Implement BIP39 for seed phrase
            const hdPrivateKey = dogecore.HDPrivateKey.fromSeed(seedPhrase);
            const derived = hdPrivateKey.derive("m/44'/3'/0'/0/0");
            const privkey = derived.privateKey.toWIF();
            const address = derived.privateKey.toAddress().toString();
            wallet = { privkey, address, utxos: [] };
        } else {
            throw new Error('Either private key or seed phrase is required');
        }

        res.json({ success: true, wallet });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});