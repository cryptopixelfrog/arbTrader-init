require('dotenv').config();
const fs = require('fs');
const childProcess = require('child_process');
const process = require('process');
const rdl = require('readline');
const std = process.stdout;
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');


const Web3 = require('web3');
//const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALFORK));
//const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAFORK));
////////////////////////////////////////////////////////////////////////////////
// you sure? if this is a test, then wait until the gas is lower.
//const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MAINNET));
////////////////////////////////////////////////////////////////////////////////

const {
  CHI_ADDRESS,
  ETH_ADDRESS,
  DAI_ADDRESS,
  USDT_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
  ATUSD_ADDRESS,
  oneProtoAddr,
  arbCandidates,
  daiABI,
  ercABI,
  FLAGS,
  SWAP_FLAGS,
  dydxFlashTokens,
} = require('./utils/constant');
const chiContract = new web3.eth.Contract(ercABI, CHI_ADDRESS);
const usdtContract = new web3.eth.Contract(ercABI, USDT_ADDRESS);
const wethContract = new web3.eth.Contract(ercABI, WETH_ADDRESS);

const Util = require('./utils/utils');
const oneProtoAbi = JSON.parse(fs.readFileSync('./script/abi/1proto.eth.abi'));
const oneProtoContract = new web3.eth.Contract(oneProtoAbi, oneProtoAddr);

const arbTraderAddr = "0xeEe72239252faf7Dd536b77c36685895629B924B"; // this is main net address
const arbTraderAbi = JSON.parse(fs.readFileSync('./script/abi/arbTrader_remix.abi'));
const arbTraderInstance = new web3.eth.Contract(arbTraderAbi, arbTraderAddr);


const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));

let gasLimit = web3.utils.toHex(1000000);
let gasPrice = web3.utils.toHex(100000000000); // 220 Gwei(220000000000), 100Gwei(100000000000)

let arbitriage = null;
let minProfit = 0.0; // for stable coin, 1 means $1.
// let minProfitWeth = new web3.utils.BN(minProfit.toString());




// const daiABI = require('../script/abi/dai');
// const ercABI = require('../script/abi/erc20');
const traderAddress = process.env.WALLETADDR;
const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
const daiContract = new web3.eth.Contract(daiABI, daiAddress);
async function init(){
  await web3.eth.sendTransaction({
    from: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    to: traderAddress,
    value: web3.utils.toWei('10', 'ether')
  });
  var ethBalance = await web3.eth.getBalance(traderAddress).then(function(ethBalance){
    console.log('ETH balance in traderAddress: ', ethBalance);
  });

  // unlock 0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699 for DAI
  await daiContract.methods
  .transfer(arbTraderAddr, web3.utils.toWei('10000', 'ether'))
  .send({ from: "0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699", gasLimit: 800000 });
  const daiBalance = await daiContract.methods.balanceOf(arbTraderAddr).call();
  console.log('DAI balance in ' + arbTraderAddr + ': ', daiBalance);

  await chiContract.methods
  .transfer(arbTraderAddr, 400)
  .send({ from: "0xCF2C6580E9798c09246CEB6cb8bC99613964a805", gasLimit: 1000000 });
  const chiBalance = await chiContract.methods.balanceOf(arbTraderAddr).call();
  console.log('CHI balance in ' + arbTraderAddr + ': ', chiBalance);

  await wethContract.methods
    .transfer(arbTraderAddr, web3.utils.toWei('10', 'ether'))
    .send({ from: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", gasLimit: 1000000 });
  const wethBalance = await wethContract.methods.balanceOf(arbTraderAddr).call();
  console.log('WETH balance in ' + arbTraderAddr + ': ', wethBalance);
}




async function getExchangeRate () {

  let baseAmount = 0.1; // 1000 means $1000 for DAI and USDT

  await init();
  // uniswap v2 fails most of swap somehow. This may only issue with ganache fork.
  // for now, disable uniswap v2. Later, have chance to activate US v2,
  // since, I saw some huge arb($50/$1000) envolved with US v2.

  //let flags = 0x0;
  //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
  let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAP_ALL']).add(FLAGS['IEARN']).add(FLAGS['MOONISWAP_ALL']);
  let endFlags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAP']).add(FLAGS['MOONISWAP_ALL']).add(FLAGS['UNISWAP_ALL']);
  //let flags = 0x400000000000; // disable UNISWAPV2_ALL.
  //let flags = 0x2000000; // disable only UNISWAP v2
  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let parts = 1;

  let fromToken = DAI_ADDRESS;
  let swapAmount = amountDAI;
  //let toToken = USDT_ADDRESS;
  let toToken = ATUSD_ADDRESS;
  let startFlagsForSwap = flags;
  let startReturnAmount = 0x0;
  let startDistribution = [];
  let endFlagsForSwap = flags;
  let endReturnAmount = 0x0;
  let endDistribution = [];

  startReturnAmount = 0x0;
  startDistribution = [];
  endReturnAmount = 0x0;
  endDistribution = [];

  startReturnAmount = 0x1;
  endReturnAmount = 0x1;

  if(fromToken == DAI_ADDRESS){
    fromAmount = amountDAI;
  } else if(fromToken == USDC_ADDRESS) {
    fromAmount = amountUSDC;
  }

  // let startTx = await arbTraderInstance.methods._swapFromTo(
  //   fromToken,
  //   toToken,
  //   fromAmount,
  //   parts,
  //   startFlagsForSwap,
  //   startReturnAmount,
  //   startDistribution
  // );
  // await Util.sendTransaction(web3, startTx, arbTraderAddr, gasPrice, gasLimit);
  // const usdtBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  // console.log("usdtBalance:", usdtBalance);
  // let endTx = await arbTraderInstance.methods._swapToFrom(
  //   toToken,
  //   fromToken,
  //   usdtBalance,
  //   parts,
  //   endFlagsForSwap,
  //   endReturnAmount,
  //   endDistribution
  // );
  // let rp2 = await Util.sendTransaction(web3, endTx, arbTraderAddr, gasPrice, gasLimit);

  // let tradeTx = await arbTraderInstance.methods.trade(
  //   fromToken,
  //   toToken,
  //   fromAmount,
  //   parts,
  //   startFlagsForSwap,
  //   startReturnAmount,
  //   startDistribution,
  //   endFlagsForSwap,
  //   endReturnAmount,
  //   endDistribution
  // );
  // await Util.sendTransaction(web3, tradeTx, arbTraderAddr, gasPrice, gasLimit);


  let tradeTx = await arbTraderInstance.methods.getFlashloan(
    fromToken,
    fromAmount,
    toToken,
    parts,
    startFlagsForSwap,
    startReturnAmount,
    startDistribution,
    endFlagsForSwap,
    endReturnAmount,
    endDistribution
  );
  await Util.sendTransaction(web3, tradeTx, arbTraderAddr, gasPrice, gasLimit);


  await Util.getPastEvent(arbTraderInstance, "swapToFrom");
};
getExchangeRate();



// async function approveToken(tokenInstance, receiver, amount, callback) {
//     tokenInstance.methods.approve(receiver, amount).send({ from: traderAddress }, async function(error, txHash) {
//         if (error) {
//             console.log("ERC20 could not be approved", error);
//             return;
//         }
//         console.log("ERC20 token approved to " + receiver);
//         const status = await waitTransaction(txHash);
//         if (!status) {
//             console.log("Approval transaction failed.");
//             return;
//         }
//         callback();
//     })
// }
// async function waitTransaction(txHash) {
//     let tx = null;
//     while (tx == null) {
//         tx = await web3.eth.getTransactionReceipt(txHash);
//         await sleep(2000);
//     }
//     console.log("Transaction " + txHash + " was mined.");
//     return (tx.status);
// }
//
// const sleep = ms => {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// let cron = setCron();
//
// function setCron(){
//   setInterval(function(){
//     //getExchangeRate();
//     // if(arbitriage >= minProfit){
//     //   console.log(arbitriage + "is larger than $" + minProfit);
//     // } else {
//     //   std.clearLine();
//     // }
//   },15000) // 15 sec
// }
