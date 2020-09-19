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

const DyDxTxManagerAddr = process.env.DYDXTXMANAGER;
const DyDxTxManagerAbi = JSON.parse(fs.readFileSync('./build/contracts/DyDxTxManager.json'));
const DyDxTxManagerInstance = new web3.eth.Contract(DyDxTxManagerAbi.abi, DyDxTxManagerAddr);

const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));

let gasLimit = web3.utils.toHex(1000000);
let gasPrice = web3.utils.toHex(220000000000); // 220 Gwei

const traderAddress = process.env.WALLETADDR;
const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
const daiContract = new web3.eth.Contract(daiABI, daiAddress);

var byteMemoryData = '0x';

const arbTraderAddr = process.env.ARBCURVEFI;
const arbTraderAbi = JSON.parse(fs.readFileSync('./build/contracts/arbCurveFi.json'));
const arbTraderInstance = new web3.eth.Contract(arbTraderAbi.abi, arbTraderAddr);




async function init(){
  await web3.eth.sendTransaction({
    from: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    to: traderAddress,
    value: web3.utils.toWei('1', 'ether')
  });
  var ethBalance = await web3.eth.getBalance(traderAddress).then(function(ethBalance){
    console.log('ETH balance in traderAddress: ', ethBalance);
  });

	await web3.eth.sendTransaction({
    from: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    to: DyDxTxManagerAddr,
    value: web3.utils.toWei('2', 'ether')
  });
	var ethBalanceSC = await web3.eth.getBalance(DyDxTxManagerAddr).then(function(ethBalanceSC){
    console.log('ETH balance in ' + DyDxTxManagerAddr + ":", ethBalanceSC);
  });

  // unlock 0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699 for DAI
  await daiContract.methods
  .transfer(DyDxTxManagerAddr, web3.utils.toWei('10000', 'ether'))
  .send({ from: "0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699", gasLimit: 800000 });
  const daiBalance = await daiContract.methods.balanceOf(DyDxTxManagerAddr).call();
  console.log('DAI balance in ' + DyDxTxManagerAddr + ': ', daiBalance);

  await chiContract.methods
  .transfer(DyDxTxManagerAddr, 400)
  .send({ from: "0xCF2C6580E9798c09246CEB6cb8bC99613964a805", gasLimit: 1000000 });
  const chiBalance = await chiContract.methods.balanceOf(DyDxTxManagerAddr).call();
  console.log('CHI balance in ' + DyDxTxManagerAddr + ': ', chiBalance);
}





// single swap: good
async function txManagerCall () {

  await init();

  const usdcBalance = await usdtContract.methods.balanceOf(DyDxTxManagerAddr).call();
  console.log('USDT balance in ' + DyDxTxManagerAddr + ' SC: ', usdcBalance);

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


	let txOne = await arbTraderInstance.methods.doubleSwapOnCurveFiUniswapv2(
    fromToken,
    toToken,
    fromAmount
  ).encodeABI();
	console.log("txOne:", txOne);
	//let script = "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2Bf70e62a50000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec700000000000000000000000000000000000000000000010f0cf064dd59200000"; // _swapOnCurveFi
	let script = "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2Be983a9f30000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec700000000000000000000000000000000000000000000010f0cf064dd59200000"; // doubleSwapOnCurveFiUniswapv2

	// let txOne = await DyDxTxManagerInstance.methods._swapOnUniswapV2(
	// 	fromToken,
	// 	toToken,
	// 	fromAmount
	// ).encodeABI();
	// console.log("txOne:", txOne);
	//let script = "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B6c79d7bb0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec700000000000000000000000000000000000000000000010f0cf064dd59200000";


	byteMemoryData = web3.eth.abi.encodeParameters(
    ['bool','bytes'],
    [false, script]
  );
	await daiContract.methods
	.transfer(process.env.ARBCURVEFI, web3.utils.toWei('5000', 'ether'))
	.send({ from: "0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699", gasLimit: 800000 });
	const daiBalanceArb = await daiContract.methods.balanceOf(process.env.ARBCURVEFI).call();
	console.log('DAI balance in ' + process.env.ARBCURVEFI + ': ', daiBalanceArb);
	await web3.eth.sendTransaction({
    from: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    to: process.env.ARBCURVEFI,
    value: web3.utils.toWei('1', 'ether')
  });
	var ethBalanceArb = await web3.eth.getBalance(process.env.ARBCURVEFI).then(function(ethBalanceArb){
    console.log('ETH balance in ' + process.env.ARBCURVEFI + ":", ethBalanceArb);
  });
	let tx = await DyDxTxManagerInstance.methods.directContractCall(
		byteMemoryData
  );

  // let tx = await DyDxTxManagerInstance.methods.getFlashloan(
  //   fromToken,
	// 	fromAmount,
  //   toToken,
	// 	script
  // );

  await Util.sendTransaction(web3, tx, DyDxTxManagerAddr, gasPrice, gasLimit);
  await checkBalances();
};
txManagerCall();






async function checkBalances(){
  const ethBalance = await web3.eth.getBalance(traderAddress).then(function(ethBalance){
    console.log('ETH balance in traderAddress: ', ethBalance);
  });

  const daiBalance = await daiContract.methods.balanceOf(DyDxTxManagerAddr).call();
  console.log('DAI balance in ' + DyDxTxManagerAddr + ' SC: ', daiBalance);

  const usdtBalance = await usdtContract.methods.balanceOf(DyDxTxManagerAddr).call();
  console.log('USDT balance in ' + DyDxTxManagerAddr + ' SC: ', usdtBalance);

  const chiBalance = await chiContract.methods.balanceOf(DyDxTxManagerAddr).call();
  console.log('CHI balance in ' + DyDxTxManagerAddr + ' SC: ', chiBalance);
}
