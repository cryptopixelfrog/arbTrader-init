const fs = require('fs');
require('dotenv').config();
const https = require('https');
const request = require('request');
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LIVEMAINNET));


exports.sendTransaction = async function (web3, tx, ToAddress, gasPrice, gasLimit){

  var encodedABI = tx.encodeABI();
  var txCount = await web3.eth.getTransactionCount(process.env.WALLETADDR);
  var networkId = await web3.eth.net.getId();

  var txData = {
    //nonce: web3.utils.toHex(txCount),
    gasLimit: gasLimit,
    gasPrice: gasPrice,
    to: ToAddress,
    from: process.env.WALLETADDR,
    data: encodedABI
  }
  var signedTx = await web3.eth.accounts.signTransaction(txData, '0x' + process.env.PRIVATEKEY);

  const receipt = await web3.eth.sendSignedTransaction(
    signedTx.rawTransaction,
    async (err, data) => {
      if (err) {
        console.error("sendSignedTransaction error", err);
      }
    }
  ).on("receipt", receipt => console.log("receipt", receipt));

  console.log('Transaction done.');
}


exports.sendTransactionWithGasPrice = async function (web3, tx, Account, PrivateKey, ToAddress, gasPrice){

  var encodedABI = tx.encodeABI();
  var txCount = await web3.eth.getTransactionCount(Account);
  var networkId = await web3.eth.net.getId();
  var gasLimit;
  await web3.eth.getBlock("latest", false, (error, result) => {
    gasLimit = result.gasLimit;
  });
  console.log("Recent Block gasLimit: " + gasLimit);
  // Recent Block gasLimit: 9980423
  // hey this is gasLimit for one block, not one tx.
  // should we use this at here??

  var txData = {
    nonce: web3.utils.toHex(txCount),
    gasLimit: gasLimit, // web3.utils.toHex(1000000), // watch out, changing this will affect main net too.
    gasPrice: web3.utils.toHex(gasPrice),  // 22000000000 = 22 Gwei, // web3.utils.toHex(50000), // watch out, changing this will affect main net too.
    to: ToAddress,
    from: Account,
    data: encodedABI,
    chainId: networkId
  }
  var signedTx = await web3.eth.accounts.signTransaction(txData, '0x' + process.env.PRIVATEKEY);

  const receipt = await web3.eth.sendSignedTransaction(
    signedTx.rawTransaction,
    async (err, data) => {
      if (err) {
        console.error("sendSignedTransaction error", err);
      }
    }
  ).on("receipt", receipt => console.log("receipt", receipt));

  console.log('Transaction done.');
}


exports.estimateGasFor = async function (web3, tx, Account, ToAddress){
  var encodedABI = tx.encodeABI();
  var txCount = await web3.eth.getTransactionCount(Account);
  var networkId = await web3.eth.net.getId();

  let gasEst = web3.eth.estimateGas({
    nonce: web3.utils.toHex(txCount),
    to: ToAddress,
    from: Account,
    data: encodedABI,
  });

  return gasEst;
}


exports.d18 = async function (amount) {
  amount = new BN(amount)
  return web3.utils.toWei(amount.toString(), "ether")
}

exports.d6 = async function (amount) {
  amount = new BN(amount)
  return web3.utils.toWei(amount.toString(), "mwei")
}

exports.f18 = async function (amount) {
  amount = new BN(amount)
  return web3.utils.fromWei(amount.toString(), "ether")
}

exports.f6 = async function (amount) {
  amount = new BN(amount)
  return web3.utils.fromWei(amount.toString(), "mwei")
}


exports.getPastEvent = async function (contractInstance, eventname){
  await contractInstance.getPastEvents(eventname, {
      fromBlock: 'latest',
      toBlock: 'latest'
  }, (error, events) => {
      if (!error){
        var obj=JSON.parse(JSON.stringify(events));
        // console.log(obj);
        var array = Object.keys(obj)
        console.log("Event-" + eventname, obj[array[0]].returnValues);
      } else {
        console.log(error.message)
      }})
};
