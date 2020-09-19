/*
https://github.com/Chxpz/DeFi_APIs/blob/master/1inch-exchange-api.js
https://github.com/UMAprotocol/protocol/blob/master/liquidator/OneInchExchange.js
*/
require('dotenv').config();
const fs = require('fs');
const childProcess = require('child_process');
const process = require('process');
const rdl = require('readline');
const std = process.stdout;

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURENDPOINT));

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";
const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";

const oneSplitAddr = "0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E";
const oneSplitAbi = JSON.parse(fs.readFileSync('./script/abi/OneSplit.abi'));
const oneSplitContract = new web3.eth.Contract(oneSplitAbi, oneSplitAddr);


// More info: https://github.com/CryptoManiacsZone/1inchProtocol#getexpectedreturn
const fromToken = DAI_ADDRESS;
const toToken = USDT_ADDRESS;
const amountWei = web3.utils.toWei("100");
// Number of pieces source volume could be splitted
const parts = 2;
// Enables all exchanges - 0x0
const flags = 0x0;
const splitExchanges = [
    "Uniswap", "Kyber", "Bancor", "Oasis", "CurveCompound", "CurveUsdt", "CurveY", "CurveBinance", "CurveSynthetix", "UniswapCompound", "UniswapChai", "UniswapAave", "Mooniswap", "UniswapV2", "UniswapV2ETH", "UniswapV2DAI", "UniswapV2USDC", "CurvePax", "CurveRenBtc", "CurveTBtc", "DforceSwap", "Shellexchangers"
];


let arbitriage;
const minProfit = 1; // for stable coin, 1 means $1.


async function getExchangeRate () {


  let startReturnAmount;
  await oneSplitContract.methods.getExpectedReturn(fromToken, toToken, amountWei, parts, flags).call().then(data => {
    startReturnAmount = data.returnAmount;
    // data.distribution.forEach(function(value, index) {
    //   console.log(`${splitExchanges[index]}: ${value*100/parts}%`)
    // })
  });
  //console.log("startReturnAmount:", web3.utils.fromWei(startReturnAmount), startReturnAmount);

  let endReturnAmount;
  await oneSplitContract.methods.getExpectedReturn(toToken, fromToken, startReturnAmount, parts, flags).call().then(data => {
    endReturnAmount = data.returnAmount;
    // data.distribution.forEach(function(value, index) {
    //   console.log(`${splitExchanges[index]}: ${value*100/parts}%`)
    // })
  });
  //console.log("endReturnAmount:", web3.utils.fromWei(endReturnAmount), endReturnAmount);


  //////////////////////
  // calculate arbitriage
  let originalInvestBN = new web3.utils.BN(amountWei.toString());
  let endReturnAmountBN = new web3.utils.BN(endReturnAmount.toString());
  var profitTemp = endReturnAmountBN.sub(originalInvestBN);
  arbitriage = web3.utils.fromWei(profitTemp.toString());
  //console.log("arb = " + originalInvestBN.toString() + " - " + endReturnAmountBN.toString() + " = " + arbitriage);

  std.write("arb = " + originalInvestBN.toString() + " - " + endReturnAmountBN.toString() + " = " + arbitriage);
  rdl.cursorTo(std, 0);


}
getExchangeRate();



let cron = setCron();

function setCron(){
  setInterval(function(){
    getExchangeRate();
    if(arbitriage >= minProfit){
      console.log(arbitriage + "is larger than $" + minProfit);
    } else {
      std.clearLine();
    }
  },5000)
}
