require('dotenv').config();
const fs = require('fs');
const childProcess = require('child_process');
const process = require('process');
const rdl = require('readline');
const std = process.stdout;
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');

const currencies = {
	compound: {
		dai: 'cDAI',
		usdc: 'cUSDC'
	},
	usdt: {
		dai: 'cDAI',
		usdc: 'cUSDC',
		usdt: 'USDT'
	},
	iearn: {
		dai: 'yDAI',
		usdc: 'yUSDC',
		usdt: 'yUSDT',
		tusd: 'yTUSD'
	},
	busd: {
		dai: 'yDAI',
		usdc: 'yUSDC',
		usdt: 'yUSDT',
		busd: 'ybUSD'
	},
	susd: {
		susd: 'ySUSD',
		ycurve: 'yCurve',
	},
	susdv2: {
		dai: 'DAI',
		usdc: 'USDC',
		usdt: 'USDT',
		susd: 'sUSD',
	},
	pax: {
		dai: 'ycDAI',
		usdc: 'ycUSDC',
		usdt: 'ycUSDT',
		pax: 'PAX',
	},
	tbtc: {
		tbtc: 'TBTC',
		wbtc: 'wBTC',
		hbtc: 'hBTC',
	},
	ren: {
		renbtc: 'renBTC',
		wbtc: 'wBTC',
	},
	sbtc: {
		renbtc: 'renBTC',
		wbtc: 'wBTC',
		sbtc: 'sBTC',
	},
}

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALFORK));
//const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LIVEMAINNET));

const {
  CHI_ADDRESS,
  ETH_ADDRESS,
  DAI_ADDRESS,
  USDT_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
  ATUSD_ADDRESS,
  ASUSD_ADDRESS,
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

const Util = require('./utils/utils');

const arbTraderAddr = process.env.ARBCURVEFI;
const arbTraderAbi = JSON.parse(fs.readFileSync('./build/contracts/arbCurveFi.json'));
const arbTraderInstance = new web3.eth.Contract(arbTraderAbi.abi, arbTraderAddr);

const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));

let gasLimit = web3.utils.toHex(1000000);
let gasPrice = web3.utils.toHex(220000000000); // 220 Gwei

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
}




async function DyDx_doubleSwapOnCurveFi () {
  await init();

  const usdcBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log('USDT balance in ' + arbTraderAddr + ' SC: ', usdcBalance);

  let baseAmount = 5000; // means $1000 for DAI and USDT
  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let fromToken = DAI_ADDRESS;
  let toToken = USDT_ADDRESS;

  if(fromToken == DAI_ADDRESS){
    fromAmount = amountDAI;
  } else if(fromToken == USDC_ADDRESS) {
    fromAmount = amountUSDC;
  }

  let tx = await arbTraderInstance.methods.getFlashloan(
    flashLoanToken = fromToken,
    flashLoanAmount = fromAmount,
    toToken
  );
  await Util.sendTransaction(web3, tx, arbTraderAddr, gasPrice, gasLimit);
  await checkBalances();
}
DyDx_doubleSwapOnCurveFi();




// single swap: good
async function uniswapv2ETH () {

  await init();

  const usdcBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log('USDT balance in ' + arbTraderAddr + ' SC: ', usdcBalance);

  let baseAmount = 5000; // means $1000 for DAI and USDT
  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let fromToken = DAI_ADDRESS;
  let toToken = USDT_ADDRESS;

  if(fromToken == DAI_ADDRESS){
    fromAmount = amountDAI;
  } else if(fromToken == USDC_ADDRESS) {
    fromAmount = amountUSDC;
  }

  // Uniswap V2 ETH
  let ethTx = await arbTraderInstance.methods._swapOnUniswapV2ETH(
    fromToken,
    toToken,
    fromAmount
  );
  await Util.sendTransaction(web3, ethTx, arbTraderAddr, gasPrice, gasLimit);
  await checkBalances();
};
//uniswapv2ETH();




// single swap: good
async function uniswapv2 () {

  await init();

  const usdcBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log('USDT balance in ' + arbTraderAddr + ' SC: ', usdcBalance);

  let baseAmount = 5000; // means $1000 for DAI and USDT
  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let fromToken = DAI_ADDRESS;
  let toToken = USDT_ADDRESS;

  if(fromToken == DAI_ADDRESS){
    fromAmount = amountDAI;
  } else if(fromToken == USDC_ADDRESS) {
    fromAmount = amountUSDC;
  }

  let startTx = await arbTraderInstance.methods._swapOnUniswapV2(
    fromToken,
    toToken,
    fromAmount
  );
  await Util.sendTransaction(web3, startTx, arbTraderAddr, gasPrice, gasLimit);
  await checkBalances();
};
//uniswapv2();




// single swap: good, double swap: fail
async function mStable () {

  await init();

  const usdcBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log('USDT balance in ' + arbTraderAddr + ' SC: ', usdcBalance);

  let baseAmount = 5000; // means $1000 for DAI and USDT
  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let fromToken = DAI_ADDRESS;
  let toToken = USDT_ADDRESS;

  if(fromToken == DAI_ADDRESS){
    fromAmount = amountDAI;
  } else if(fromToken == USDC_ADDRESS) {
    fromAmount = amountUSDC;
  }

  // let tx = await arbTraderInstance.methods.doubleSwapOnMStableMUSD(
  //   fromToken,
  //   toToken,
  //   fromAmount
  // );
  // await Util.sendTransaction(web3, tx, arbTraderAddr, gasPrice, gasLimit);

  let startTx = await arbTraderInstance.methods._swapOnMStableMUSD(
    fromToken,
    toToken,
    fromAmount
  );
  let startRp = await Util.sendTransaction(web3, startTx, arbTraderAddr, gasPrice, gasLimit);
  console.log("startRp:", startRp);

  const usdtBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log("usdtBalance:", await Util.f6(usdtBalance));

  let endTx = await arbTraderInstance.methods._swapOnMStableMUSD(
    toToken,
    fromToken,
    usdtBalance
  );
  let rp2 = await Util.sendTransaction(web3, endTx, arbTraderAddr, gasPrice, gasLimit);

  await checkBalances();
};
//mStable();




// curveFi & Uniswap v2 straigt work.
// curveFi & Uniswap v2 ETH failes with Revert message: UniswapV2: LOCKED,
// sicne the Uniswap v2 ETH is using the swap twice for WETH mid token.
async function doubleSwapOnCurveFiUniswapv2 () {
  await init();

  const usdcBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log('USDT balance in ' + arbTraderAddr + ' SC: ', usdcBalance);

  let baseAmount = 5000; // means $1000 for DAI and USDT
  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let fromToken = DAI_ADDRESS;
  let toToken = USDT_ADDRESS;

  if(fromToken == DAI_ADDRESS){
    fromAmount = amountDAI;
  } else if(fromToken == USDC_ADDRESS) {
    fromAmount = amountUSDC;
  }

  let tx = await arbTraderInstance.methods.doubleSwapOnCurveFiUniswapv2(
    fromToken,
    toToken,
    fromAmount
  );
  await Util.sendTransaction(web3, tx, arbTraderAddr, gasPrice, gasLimit);
  await checkBalances();
};
//doubleSwapOnCurveFiUniswapv2();




// _swapOnCurveFi & _swapOnCurveSUSDC works
async function doubleSwapOnCurveFi () {
  await init();

  const usdcBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log('USDT balance in ' + arbTraderAddr + ' SC: ', usdcBalance);

  let baseAmount = 5000; // means $1000 for DAI and USDT
  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let fromToken = DAI_ADDRESS;
  let toToken = USDT_ADDRESS;

  if(fromToken == DAI_ADDRESS){
    fromAmount = amountDAI;
  } else if(fromToken == USDC_ADDRESS) {
    fromAmount = amountUSDC;
  }

  let tx = await arbTraderInstance.methods.doubleSwapOnCurveFi(
    fromToken,
    toToken,
    fromAmount
  );
  await Util.sendTransaction(web3, tx, arbTraderAddr, gasPrice, gasLimit);
  await checkBalances();
};
//doubleSwapOnCurveFi();



// sigle swap: good, double swap with different pool: good, double swap on same pool: fail
async function curveFi () {

  await init();

  const usdcBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log('USDT balance in ' + arbTraderAddr + ' SC: ', usdcBalance);

  let baseAmount = 5000; // means $1000 for DAI and USDT
  let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  let fromToken = DAI_ADDRESS;
  let toToken = USDT_ADDRESS;

  if(fromToken == DAI_ADDRESS){
    fromAmount = amountDAI;
  } else if(fromToken == USDC_ADDRESS) {
    fromAmount = amountUSDC;
  }

  let startTx = await arbTraderInstance.methods._swapOnCurveFi(
    fromToken,
    toToken,
    fromAmount
  );
  let startRp = await Util.sendTransaction(web3, startTx, arbTraderAddr, gasPrice, gasLimit);
  console.log("startRp:", startRp);

  const usdtBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log("usdtBalance:", await Util.f6(usdtBalance));
  //
  // let endTx = await arbTraderInstance.methods._swapOnCurveFi(
  //   toToken,
  //   fromToken,
  //   usdtBalance
  // );
  // let rp2 = await Util.sendTransaction(web3, endTx, arbTraderAddr, gasPrice, gasLimit);

  await checkBalances();
};
//curveFi();








async function checkBalances(){
  const ethBalance = await web3.eth.getBalance(traderAddress).then(function(ethBalance){
    console.log('ETH balance in traderAddress: ', ethBalance);
  });

  const daiBalance = await daiContract.methods.balanceOf(arbTraderAddr).call();
  console.log('DAI balance in ' + arbTraderAddr + ' SC: ', daiBalance);

  const usdtBalance = await usdtContract.methods.balanceOf(arbTraderAddr).call();
  console.log('USDT balance in ' + arbTraderAddr + ' SC: ', usdtBalance);

  const chiBalance = await chiContract.methods.balanceOf(arbTraderAddr).call();
  console.log('CHI balance in ' + arbTraderAddr + ' SC: ', chiBalance);
}
