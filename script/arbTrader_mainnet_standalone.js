require('dotenv').config();
const fs = require('fs');
const childProcess = require('child_process');
const process = require('process');
const rdl = require('readline');
const std = process.stdout;
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');


const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALFORK));
//const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURAFORK));

const {
  CHI_ADDRESS,
  ETH_ADDRESS,
  DAI_ADDRESS,
  USDT_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
  //oneProtoAddr,
  arbCandidates,
  daiABI,
  ercABI,
  FLAGS,
  SWAP_FLAGS,
  dydxFlashTokens,
  //splitExchanges
} = require('./utils/constant');
const Util = require('./utils/utils');
const chiContract = new web3.eth.Contract(ercABI, CHI_ADDRESS);
const usdcContract = new web3.eth.Contract(ercABI, USDC_ADDRESS);

// const oneProtoAddr = "0x6cb2291A3c3794fcA0F5b6E34a8E6eA7933CA667";
// const oneProtoAbi = JSON.parse(fs.readFileSync('./script/abi/OneSplitWrap.abi'));
// const oneProtoContract = new web3.eth.Contract(oneProtoAbi, oneProtoAddr);

const oneSplitABI = require('./abi/onesplit.json');
//const onesplitAddress = "0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E"; // 1plit contract address on Main net
const onesplitAddress = "0x6cb2291A3c3794fcA0F5b6E34a8E6eA7933CA667";
const oneProtoContract = new web3.eth.Contract(oneSplitABI, onesplitAddress);

const arbTraderAddr = process.env.ARBTRADER;
const arbTraderAbi = JSON.parse(fs.readFileSync('./build/contracts/arbTrader.json'));
const arbTraderInstance = new web3.eth.Contract(arbTraderAbi.abi, arbTraderAddr);


const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));

// short dex name version
const splitExchanges = [
  "Uniswap","Kyber","Bancor","Oasis","Cur Comp","Cur USDT","Cur Y","Cur Binan","Cur Syn","Uniswap Comp","Uniswap CHAI","Uniswap Aave","Mooniswap","UniswapV2","UniswapV2 ETH","UniswapV2 DAI","UniswapV2 USDC","Cur Pax","Cur renBTC","Cur tBTC","Dforce","Shell","mStable mUSD","Cur sBTC","Bal 1","Bal 2","Bal 3","Kyber 1","Kyber 2","Kyber 3","Kyber 4","Mooni ETH","Mooni DAI","Mooni USDC"
];


let stopLoop = false;
let arbitriage = null;
let minProfit = 0.0; // for stable coin, 1 means $1.
let baseAmount = 10; // means $1000 for DAI and USDT
// let minProfitWeth = new web3.utils.BN(minProfit.toString());




const traderAddress = process.env.WALLETADDR;
const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
const daiContract = new web3.eth.Contract(daiABI, daiAddress);
async function init(){
  await web3.eth.sendTransaction({
    from: "0x82c42D62776C0087619eE5d9C0b4Fc953196Ef22",
    to: traderAddress,
    value: web3.utils.toWei('10', 'ether')
  });
  var ethBalance = await web3.eth.getBalance(traderAddress).then(function(ethBalance){
    console.log('ETH balance in traderAddress: ', ethBalance);
  });

  // unlock 0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699 for DAI
  await daiContract.methods
  .transfer(traderAddress, web3.utils.toWei('1000', 'ether'))
  .send({ from: "0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699", gasLimit: 800000 });
  const daiBalance = await daiContract.methods.balanceOf(traderAddress).call();
  console.log('DAI balance in ' + traderAddress + ': ', daiBalance);

  await chiContract.methods
  .transfer(traderAddress, 400)
  .send({ from: "0xCF2C6580E9798c09246CEB6cb8bC99613964a805", gasLimit: 1000000 });
  const chiBalance = await chiContract.methods.balanceOf(traderAddress).call();
  console.log('CHI balance in ' + traderAddress + ': ', chiBalance);
}




async function getExchangeRate () {

  await init();

  // uniswap v2 fails most of swap somehow. This may only issue with ganache fork.
  // for now, disable uniswap v2. Later, have chance to activate US v2,
  // since, I saw some huge arb($50/$1000) envolved with US v2.
  let flags = 0; // enalbe all
  //let flags = 0x400000000000; // disable UNISWAPV2_ALL.
  //let flags = 0x2000000; // disable only UNISWAP v2, not
  //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAP_ALL']).add(FLAGS['IEARN']).add(FLAGS['MOONISWAP_ALL']);
  //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);

  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let amountWETH = web3.utils.toWei("10"); // for WETH
  let parts = 1;

  ////this is magic flag. change it to all possible flag for scanning possible arb chance.
  // let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);

  for(let fToken in dydxFlashTokens){

    fromToken = dydxFlashTokens[fToken];
    fromTokenName = fToken;
    if(fToken == "DAI"){
      fromAmount = amountDAI;
    } else if(fToken == "USDC") {
      fromAmount = amountUSDC;
    }

    let toToken;
    let toTokenName;

    let successTokens = [];
    let failedTokens = [];

    for(let key in arbCandidates){
      toToken = arbCandidates[key];
      toTokenName = key;
      console.log(" " + fToken,"->",toTokenName,"->",fToken);
      //let rp = await fromToToFrom (fromToken, toToken, fromAmount, parts, flags, toTokenName, fromTokenName);
      //toToken = "0x80fB784B7eD66730e8b1DBd9820aFD29931aab03";

      let dexFrom = [];
      let dexTo = [];
      let dexFromSwap = [];
      let dexToSwap = [];

      let flashLoanToken = fromToken;
      let flashLoanAmount = fromAmount;

      try {
        ////////////////////////////////////////////
        // from -> to //////////////////////////////
        let startReturnAmount = null;
        let startDistribution = null;
        let startFlagsForSwap = null;
        let TMPFLAG = new BN('0', 16); // 0
        // get startDistribution from getExpectedReturn for fromTo swap.
        await oneProtoContract.methods.getExpectedReturn(fromToken, toToken, fromAmount, parts, flags).call().then(data => {
          startReturnAmount = data.returnAmount;
          startDistribution = data.distribution;
          data.distribution.forEach(function(value, index) {
            if(value > 0){
              // now we need to construct startFlagsForSwap based on dexFrom.
              dexFrom.push(`${splitExchanges[index]}: ${value*100/parts}%`);
              // based on startDistribution, prepare flags for swap
              Object.entries(SWAP_FLAGS).forEach(([keySwap,valSwap],indexSwap)=>{
                if(indexSwap == index){
                  console.log(indexSwap,index);
                  TMPFLAG = TMPFLAG.add(valSwap);
                  dexFromSwap.push(keySwap);
                }
              });
            }
          })
        });
        console.log("dexFrom:", dexFrom);
        console.log("dexFromSwap:", dexFromSwap);
        console.log("startReturnAmount:", startReturnAmount);
        // console.log("startDistribution:", startDistribution);
        // console.log("startFlagsForSwap:", TMPFLAG.toString());

        startFlagsForSwap = DISABLE_ALL.add(TMPFLAG);
        //let startFlagsForSwap = 0; // this never works for swap.
        //startReturnAmount = 0x0; // giving re-entrance on mooniswap <- dont do this at here.

        ////////////////////////////////////////////
        // to -> from //////////////////////////////
        let endReturnAmount = null;
        let endDistribution = null;
        let endFlagsForSwap = null;
        TMPFLAG = new BN('0', 16); // reset to 0
        // get endDistribution from getExpectedReturn for fromTo swap.
        await oneProtoContract.methods.getExpectedReturn(toToken, fromToken, startReturnAmount, parts, flags).call().then(data => {
          endReturnAmount = data.returnAmount;
          endDistribution = data.distribution;
          data.distribution.forEach(function(value, index) {
            if(value > 0){
              // now we need to construct endFlagsForSwap based on dexTo.
              dexTo.push(`${splitExchanges[index]}: ${value*100/parts}%`);
              // based on endDistribution, prepare flags for swap
              Object.entries(SWAP_FLAGS).forEach(([keySwap,valSwap],indexSwap)=>{
                if(indexSwap == index){
                  console.log(indexSwap,index);
                  TMPFLAG = TMPFLAG.add(valSwap);
                  dexToSwap.push(keySwap);
                }
              });
            }
          })
        });
        console.log("dexTo:", dexTo);
        console.log("dexToSwap:", dexToSwap);
        console.log("endReturnAmount:", endReturnAmount);
        // console.log("endDistribution:", endDistribution);
        // console.log("endFlagsForSwap:", TMPFLAG.toString());

        endFlagsForSwap = DISABLE_ALL.add(TMPFLAG);
        // if we set endReturnAmount and endDistribution like below,
        // getExpectedReturn in sc will have those two data dynamically.
        // startReturnAmount = 0x0;
        // startDistribution = [];
        // endReturnAmount = 0x0;
        // endDistribution = [];

        // startReturnAmount = 0x1;
        // endReturnAmount = 0x1;


        ////////////////////////////////////////////
        // calculate arbitriage
        let originalInvestBN = new web3.utils.BN(fromAmount.toString());
        let endReturnAmountBN = new web3.utils.BN(endReturnAmount.toString());
        var profitTemp = endReturnAmountBN.sub(originalInvestBN);


        if(fromToken == dydxFlashTokens['USDC']){
          arbitriage = await Util.f6(profitTemp);
          console.log(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " = " + await Util.f6(originalInvestBN) + " - " + await Util.f6(endReturnAmountBN) + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
          //std.write(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
        } else if(fromToken == dydxFlashTokens['DAI']) {
          arbitriage = web3.utils.fromWei(profitTemp.toString());
          console.log(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " = " + originalInvestBN.toString() + " - " + endReturnAmountBN.toString() + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
          //std.write(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage  + " | (" + dexFrom + ")->" + "(" + dexTo + ")");
        }
        //rdl.cursorTo(std, 0);


        ////////////////////////////////////////////
        // excute flashloan if condition meets.
        //if(arbitriage >= minProfit){
          //std.clearLine();
          let date_start = new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'});
          console.log("---------------------" + date_start);
          console.log(" "+ fromTokenName + "->" + toTokenName + " : " + arbitriage + " | (" + dexFrom + ")->" + "(" + dexTo + ")");

          console.log("startReturnAmount:", startReturnAmount);
          console.log("startDistribution:", startDistribution);


          await approveToken(daiContract, onesplitAddress, fromAmount);


          console.log("Execut Start Swap!");
          //startFlagsForSwap = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
          //let startTx = await oneProtoContract.methods.swap(
          let startTx = await arbTraderInstance.methods._swapFromTo(
            fromToken,
            toToken,
            fromAmount,
            startReturnAmount, // 0, //
            startDistribution, // [], //
            startFlagsForSwap
          );
          let gasLimit = web3.utils.toHex(1000000);
          let gasPrice = web3.utils.toHex(220000000000); // 220 Gwei
          let startRp = await Util.sendTransaction(web3, startTx, arbTraderAddr, gasPrice, gasLimit);
          console.log("startRp:", startRp);

          stopLoop = true;
          break;
        //}
        arbitriage = null; // reset arbitriage, so it recognize DAI and USDC decimal again.

        successTokens.push(toTokenName);
      } catch(error){
        console.log(error);
        failedTokens.push(toTokenName);
      }




      // stop cron.
      // delete cron;
      // clearInterval(cron);

    };
    console.log(successTokens);
    console.log(failedTokens);

    if(stopLoop){
      break;
    }

  }

await checkBalances();

};
getExchangeRate();



async function checkBalances(){
  const ethBalance = await web3.eth.getBalance(traderAddress).then(function(ethBalance){
    console.log('ETH balance in traderAddress: ', ethBalance);
  });

  const daiBalance = await daiContract.methods.balanceOf(traderAddress).call();
  console.log('DAI balance in ' + traderAddress + ': ', daiBalance);

  const usdcBalance = await usdcContract.methods.balanceOf(traderAddress).call();
  console.log('USDC balance in ' + traderAddress + ': ', usdcBalance);

  const chiBalance = await chiContract.methods.balanceOf(traderAddress).call();
  console.log('CHI balance in ' + traderAddress + ': ', chiBalance);
}




async function approveToken(tokenInstance, receiver, amount, callback) {
    tokenInstance.methods.approve(receiver, amount).send({ from: traderAddress }, async function(error, txHash) {
        if (error) {
            console.log("ERC20 could not be approved", error);
            return;
        }
        console.log("ERC20 token approved to " + receiver);
        const status = await waitTransaction(txHash);
        if (!status) {
            console.log("Approval transaction failed.");
            return;
        }
        callback();
    })
}
async function waitTransaction(txHash) {
    let tx = null;
    while (tx == null) {
        tx = await web3.eth.getTransactionReceipt(txHash);
        await sleep(2000);
    }
    console.log("Transaction " + txHash + " was mined.");
    return (tx.status);
}


// let cron = setCron();
//
// function setCron(){
//   setInterval(function(){
//     getExchangeRate();
//     // if(arbitriage >= minProfit){
//     //   console.log(arbitriage + "is larger than $" + minProfit);
//     // } else {
//     //   std.clearLine();
//     // }
//   },15000) // 15 sec
// }
