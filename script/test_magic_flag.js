require('dotenv').config();
const fs = require('fs');
const childProcess = require('child_process');
const process = require('process');
const rdl = require('readline');
const std = process.stdout;
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');


const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALFORK));
//const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LIVEMAINNET));

const {
  CHI_ADDRESS,
  ETH_ADDRESS,
  BAT_ADDRESS,
  DAI_ADDRESS,
  YDAI_ADDRESS,
  CDAI_ADDRESS,
  USDT_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
  daiABI,
  ercABI,
  usdKind,
  daiKind,
  FLAGS,
  SWAP_FLAGS,
  dydxFlashTokens,
  arbCandidates,
  oneProtoAddr,
  //splitExchanges
} = require('./utils/constant');
const chiContract = new web3.eth.Contract(ercABI, CHI_ADDRESS);
const usdtContract = new web3.eth.Contract(ercABI, USDT_ADDRESS);

const Util = require('./utils/utils');
const oneProtoAbi = JSON.parse(fs.readFileSync('./script/abi/1proto.eth.abi'));
const oneProtoContract = new web3.eth.Contract(oneProtoAbi, oneProtoAddr);

const arbTraderAddr = process.env.ARBTRADER;
const arbTraderAbi = JSON.parse(fs.readFileSync('./build/contracts/arbTrader.json'));
const arbTraderInstance = new web3.eth.Contract(arbTraderAbi.abi, arbTraderAddr);


const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));

// short dex name version
const splitExchanges = [
  "Uniswap","Kyber","Bancor","Oasis","Cur Comp","Cur USDT","Cur Y","Cur Binan","Cur Syn","Uniswap Comp","Uniswap CHAI","Uniswap Aave","Mooniswap","UniswapV2","UniswapV2 ETH","UniswapV2 DAI","UniswapV2 USDC","Cur Pax","Cur renBTC","Cur tBTC","Dforce","Shell","mStable mUSD","Cur sBTC","Bal 1","Bal 2","Bal 3","Kyber 1","Kyber 2","Kyber 3","Kyber 4","Mooni ETH","Mooni DAI","Mooni USDC"
];



let arbitriage = null;
let minProfit = 0.0; // for stable coin, 1 means $1.
// let minProfitWeth = new web3.utils.BN(minProfit.toString());




// const daiABI = require('../script/abi/dai');
// const ercABI = require('../script/abi/erc20');
const traderAddress = mainAccount = process.env.WALLETADDR;
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
  .transfer(arbTraderAddr, web3.utils.toWei('10000', 'ether'))
  .send({ from: "0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699", gasLimit: 800000 });
  const daiBalance = await daiContract.methods.balanceOf(arbTraderAddr).call();
  console.log('DAI balance in ' + arbTraderAddr + ': ', daiBalance);

  await chiContract.methods
  .transfer(arbTraderAddr, 400)
  .send({ from: "0xCF2C6580E9798c09246CEB6cb8bC99613964a805", gasLimit: 1000000 });
  const chiBalance = await chiContract.methods.balanceOf(arbTraderAddr).call();
  console.log('CHI balance in ' + arbTraderAddr + ': ', chiBalance);
}




async function getExchangeRate () {

  await init();

  let baseAmount = 10;
  //let flashLoanAmount = web3.utils.toHex(loanAmount * 10 ** 18);
  //let flashLoanAmount = web3.utils.toWei('10000', 'ether');

  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let amountWETH = web3.utils.toWei("30"); // for WETH
  let flashLoanAmount;

  //let amountWei = web3.utils.toWei("100");
  let parts = 2;
  let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']).add(FLAGS['COMPOUND']);
  //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAP_ALL']).add(FLAGS['IEARN']).add(FLAGS['MOONISWAP_ALL']);
  let flashLoanToken; // this is fromToken too

  let startFlagsForSwap = flags;
  let startReturnAmount = 0x0;
  let startDistribution = [];
  let endFlagsForSwap = flags;
  let endReturnAmount = 0x0;
  let endDistribution = [];

  for(let fToken in dydxFlashTokens){
    flashLoanToken = dydxFlashTokens[fToken];

    if(fToken == "DAI"){
      flashLoanAmount = amountDAI;
    } else if(fToken == "USDC") {
      flashLoanAmount = amountUSDC;
    }

    console.log("Flashloan -", flashLoanAmount, fToken);

    let toToken;
    let toTokenName;
    let successTokens = [];
    let failedTokens = [];
    for(let key in arbCandidates){
      toToken = arbCandidates[key];
      toTokenName = key;
      console.log(" " + fToken,"->",toTokenName,"->",fToken);
      try {
        const tx = await arbTraderInstance.methods.getFlashloan(
            flashLoanToken,
            flashLoanAmount,
            toToken,
            parts,
            startFlagsForSwap,
            startReturnAmount,
            startDistribution,
            endFlagsForSwap,
            endReturnAmount,
            endDistribution
          );
        // let tx = await arbTraderInstance.methods._swapFromTo(
        //   flashLoanToken,
        //   toToken,
        //   flashLoanAmount,
        //   parts,
        //   startFlagsForSwap,
        //   startReturnAmount,
        //   startDistribution
        // );
        let gasLimit = web3.utils.toHex(1000000);
        let gasPrice = web3.utils.toHex(10000000000); // 22 Gwei
        let rp2 = await Util.sendTransaction(web3, tx, arbTraderAddr, gasPrice, gasLimit);
        // await Util.getPastEvent(arbTraderInstance, "swapFromTo");
        successTokens.push(key);
      } catch(error){
        console.log(error);
        failedTokens.push(key);
      }
    }
    console.log(successTokens);
    console.log(failedTokens);

  }// flashloand forloop

};
getExchangeRate();











const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let cron = setCron();

function setCron(){
  setInterval(function(){
    //getExchangeRate();
    // if(arbitriage >= minProfit){
    //   console.log(arbitriage + "is larger than $" + minProfit);
    // } else {
    //   std.clearLine();
    // }
  },15000) // 15 sec
}
