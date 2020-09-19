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
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');


const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LIVEMAINNET));

const {
  ETH_ADDRESS,
  DAI_ADDRESS,
  USDT_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
  oneProtoAddr,
  arbCandidates,
  FLAGS,
  dydxFlashTokens
} = require('./utils/constant');
const Util = require('./utils/utils');
const oneProtoAbi = JSON.parse(fs.readFileSync('./script/abi/1proto.eth.abi'));
const oneProtoContract = new web3.eth.Contract(oneProtoAbi, oneProtoAddr);

const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));
// total 34 dexa
const splitExchanges = [
  "Uniswap","Kyber","Bancor","Oasis","Cur Comp","Cur USDT","Cur Y","Cur Binan","Cur Syn","Uniswap Comp","Uniswap CHAI","Uniswap Aave","Mooniswap","UniswapV2","UniswapV2 ETH","UniswapV2 DAI","UniswapV2 USDC","Cur Pax","Cur renBTC","Cur tBTC","Dforce","Shell","mStable mUSD","Cur sBTC","Bal 1","Bal 2","Bal 3","Kyber 1","Kyber 2","Kyber 3","Kyber 4","Mooni ETH","Mooni DAI","Mooni USDC"
];


let arbitriage = null;
let minProfit = 20.0; // for stable coin, 1 means $1.
let baseAmount = 1000; // means $1000 for DAI and USDT
// let minProfitWeth = new web3.utils.BN(minProfit.toString());



async function getExchangeRate () {
  ////this is magic flag. change it to all possible flag for scanning possible arb chance.
  //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);

  // for(let flagKey in FLAGS){
  //   //console.log("<<<<", flagKey, ">>>>");
  //   let flags = DISABLE_ALL.add(FLAGS[flagKey]);
      let flags = 0; // all

    //const fromAmount = web3.utils.toWei("1");
    let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
    let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
    let amountWETH = web3.utils.toWei("10"); // for WETH
    let parts = 1;

    let fromToken;
    let fromTokenName;
    for(let fToken in dydxFlashTokens){
      fromToken = dydxFlashTokens[fToken];
      fromTokenName = fToken;
      if(fToken == "DAI"){
        fromAmount = amountDAI;
      } else if(fToken == "USDC") {
        fromAmount = amountUSDC;
      }
      else if(fToken == "WETH") {
        fromAmount = amountWETH;
      }
      let toToken;
      let toTokenName;
      for(let key in arbCandidates){
        toToken = arbCandidates[key];
        toTokenName = key;
        try{
          await fromToToFrom (fromToken, toToken, fromAmount, parts, flags, toTokenName, fromTokenName);
        } catch (error) {
          console.log(error);
        };
      };
    }
  // }

};
getExchangeRate();




async function fromToToFrom (fromToken, toToken, fromAmount, parts, flags, toTokenName, fromTokenName){

  let dexFrom = [];
  let dexTo = [];

  let startReturnAmount;
  await oneProtoContract.methods.getExpectedReturn(fromToken, toToken, fromAmount, parts, flags).call().then(data => {
    startReturnAmount = data.returnAmount;
    data.distribution.forEach(function(value, index) {
      if(value > 0){
        dexFrom.push(`${splitExchanges[index]}: ${value*100/parts}%`);
      }
    })
  });
  //console.log("startReturnAmount:", await Util.d6(startReturnAmount), startReturnAmount);
  //console.log("startReturnAmount:", web3.utils.fromWei(startReturnAmount), startReturnAmount);

  //startReturnAmount = await Util.d6(startReturnAmount);
  // const destTokenEthPriceTimesGasPrice = web3.utils.toBN(startReturnAmount).mul(web3.utils.toBN(200*Math.pow(10, 9)));
  // //console.log(destTokenEthPriceTimesGasPrice.toString());

  let endReturnAmount;
  await oneProtoContract.methods.getExpectedReturn(toToken, fromToken, startReturnAmount, parts, flags).call().then(data => {
    endReturnAmount = data.returnAmount;
    data.distribution.forEach(function(value, index) {
      if(value > 0){
        dexTo.push(`${splitExchanges[index]}:${value*100/parts}%`);
      }
    })
  });
  //console.log("endReturnAmount:", web3.utils.fromWei(endReturnAmount), endReturnAmount);


  //////////////////////
  // calculate arbitriage
  // let originalInvestBN = new web3.utils.BN(fromAmount.toString());
  // let endReturnAmountBN = new web3.utils.BN(endReturnAmount.toString());
  // var profitTemp = endReturnAmountBN.sub(originalInvestBN);

  let originalInvestBN = new web3.utils.BN(fromAmount.toString());
  let endReturnAmountBN = new web3.utils.BN(endReturnAmount.toString());
  var profitTemp = endReturnAmountBN.sub(originalInvestBN);


  if(fromToken == dydxFlashTokens['USDC']){
    arbitriage = await Util.f6(profitTemp);
    //console.log(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " = " + await Util.f6(originalInvestBN) + " - " + await Util.f6(endReturnAmountBN) + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
    std.write(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
  } else if(fromToken == dydxFlashTokens['DAI']) {
    arbitriage = web3.utils.fromWei(profitTemp.toString());
    //console.log(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " = " + originalInvestBN.toString() + " - " + endReturnAmountBN.toString() + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
    std.write(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
  }
  // else if(fromToken == dydxFlashTokens['WETH']) {
  //   minProfit = minProfitWeth.toString();
  //   arbitriage = web3.utils.fromWei(profitTemp.toString());
  //   //console.log(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " = " + web3.utils.fromWei(originalInvestBN) + " - " + web3.utils.fromWei(endReturnAmountBN) + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
  //   std.write(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
  // }

  // std.write(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " = " + originalInvestBN.toString() + " - " + endReturnAmountBN.toString());
  rdl.cursorTo(std, 0);


  if(arbitriage >= minProfit){
    std.clearLine();
    let date_start = new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'});
    console.log("---------------------" + date_start);
    console.log(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
  }
  arbitriage = null; // rest arbitriage, so it recognize DAI and USDC decimal again.

}





let cron = setCron();

function setCron(){
  setInterval(function(){
    getExchangeRate();
    if(arbitriage >= minProfit){
      console.log(arbitriage + "is larger than $" + minProfit);
    } else {
      std.clearLine();
    }
  },15000) // 15 sec
}
