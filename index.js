const fs = require('fs');
const colors = require('colors');
const solana = require('@solana/web3.js');
const axios = require('axios').default;
const base58 = require('bs58');
const nacl = require('tweetnacl');
const moment = require('moment');

const {
  sendSol,
  generateRandomAddresses,
  getKeypairFromPrivateKey,
  PublicKey,
  connection,
  LAMPORTS_PER_SOL,
  delay,
} = require('./src/solanaUtils');

const { HEADERS } = require('./src/headers');
const { displayHeader } = require('./src/displayUtils');

async function main() {
  displayHeader();

  const privateKeys = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));

  for (const [index, privateKey] of privateKeys.entries()) {
    console.log(colors.yellow(`Processing account ${index + 1}`));

    // Transfer SOL
    await transferSOL(privateKey);

    // Perform Sonic Odyssey operations
    await sonicOdysseyOperations(privateKey);

    if (index < privateKeys.length - 1) {
      console.log(colors.cyan('Proceeding to next account in 5 seconds...'));
      await delay(5000);
    }
  }

  console.log(colors.cyan('All accounts processed.'));
}

async function transferSOL(privateKey) {
  const fromKeypair = getKeypairFromPrivateKey(privateKey);
  const addressCount = 100;
  const amountToSend = 0.001;
  const delayBetweenTx = 1000;

  const randomAddresses = generateRandomAddresses(addressCount);

  for (const address of randomAddresses) {
    const toPublicKey = new PublicKey(address);
    try {
      await sendSol(fromKeypair, toPublicKey, amountToSend);
      console.log(colors.green(`Successfully sent ${amountToSend} SOL to ${address}`));
    } catch (error) {
      console.error(colors.red(`Failed to send SOL to ${address}:`), error);
    }
    await delay(delayBetweenTx);
  }
}

async function sonicOdysseyOperations(privateKey) {
  const keypair = getKeypairFromPrivateKey(privateKey);
  const publicKey = keypair.publicKey.toBase58();
  const token = await getToken(privateKey);
  const profile = await getProfile(token);

  console.log(colors.green(`Processing Sonic Odyssey operations for ${publicKey}`));
  console.log(colors.green(`SOL Balance: ${profile.wallet_balance / LAMPORTS_PER_SOL}`));
  console.log(colors.green(`Ring Balance: ${profile.ring}`));
  console.log(colors.green(`Available Boxes: ${profile.ring_monitor}`));

  // Perform daily claim
  await dailyClaim(token);

  // Perform daily login
  await dailyLogin(token, keypair);

  // Open all available mystery boxes
  const availableBoxes = profile.ring_monitor;
  for (let i = 0; i < availableBoxes; i++) {
    await openMysteryBox(token, keypair);
  }
}

async function getToken(privateKey) {
  try {
    const keypair = getKeypairFromPrivateKey(privateKey);
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/auth/sonic/challenge',
      params: { wallet: keypair.publicKey },
      headers: HEADERS,
    });

    const sign = nacl.sign.detached(
      Buffer.from(data.data),
      keypair.secretKey
    );
    const signature = Buffer.from(sign).toString('base64');
    const publicKey = keypair.publicKey;
    const encodedPublicKey = Buffer.from(publicKey.toBytes()).toString('base64');
    const response = await axios({
      url: 'https://odyssey-api-beta.sonic.game/auth/sonic/authorize',
      method: 'POST',
      headers: HEADERS,
      data: {
        address: publicKey,
        address_encoded: encodedPublicKey,
        signature,
      },
    });

    return response.data.data.token;
  } catch (error) {
    console.log(`Error fetching token: ${error}`.red);
  }
}

async function getProfile(token) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/info',
      method: 'GET',
      headers: { ...HEADERS, Authorization: token },
    });

    return data.data;
  } catch (error) {
    console.log(`Error fetching profile: ${error}`.red);
  }
}

async function dailyClaim(token) {
  // Implementation from claim.js
  console.log(colors.yellow('Performing daily claim...'));
  // Add your daily claim logic here
}

async function openMysteryBox(token, keypair) {
  try {
    console.log(colors.yellow('Opening mystery box...'));
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/mystery-box/build-tx',
      method: 'GET',
      headers: { ...HEADERS, Authorization: token },
    });

    const txBuffer = Buffer.from(data.data.hash, 'base64');
    const tx = solana.Transaction.from(txBuffer);
    tx.partialSign(keypair);
    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(signature);

    const response = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/mystery-box/open',
      method: 'POST',
      headers: { ...HEADERS, Authorization: token },
      data: { hash: signature },
    });

    console.log(colors.green(`Mystery box opened successfully! Amount: ${response.data.data.amount}`));
  } catch (error) {
    console.log(`Error opening mystery box: ${error}`.red);
  }
}

async function dailyLogin(token, keypair) {
  try {
    console.log(colors.yellow('Performing daily login...'));
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/check-in/transaction',
      method: 'GET',
      headers: { ...HEADERS, Authorization: token },
    });

    const txBuffer = Buffer.from(data.data.hash, 'base64');
    const tx = solana.Transaction.from(txBuffer);
    tx.partialSign(keypair);
    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(signature);

    const response = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/check-in',
      method: 'POST',
      headers: { ...HEADERS, Authorization: token },
      data: { hash: signature },
    });

    console.log(colors.green(`Daily login successful! Accumulative days: ${response.data.data.accumulative_days}`));
  } catch (error) {
    console.log(`Error in daily login: ${error}`.red);
  }
}

main().catch(console.error);
