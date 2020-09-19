const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');


const CHI_ADDRESS = "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c";
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const BAT_ADDRESS = "0x0d8775f648430679a709e98d2b0cb6250d2887ef";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

// dai kind
const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";
const ADAI_ADDRESS = "0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d";
const BDAI_ADDRESS = "0x6a4ffaafa8dd400676df8076ad6c724867b0e2e8";
const CDAI_ADDRESS = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";
const FIDAI_ADDRESS = "0x493c57c4763932315a328269e1adad09653b9081";
const IDLEDAI_ADDRESS = "0x10ec0d497824e342bcb0edce00959142aaa766dd";
const MDAI_ADDRESS = "0x06301057d77d54b6e14c7faffb11ffc7cab4eaa7";
const OCDAI_ADDRESS = "0x98cc3bd6af1880fcfda17ac477b2f612980e5e33";
const RDAI_ADDRESS = "0x261b45d85ccfeabb11f022eba346ee8d1cd488c0";
const YDAIV2_ADDRESS = "0x16de59092dae5ccf4a1e6439d611fd0653f0bd01";
const YDAIV3_ADDRESS = "0xc2cb1040220768554cf699b0d863a3cd4324ce32";
const YDAI_ADDRESS = "0x16de59092dae5ccf4a1e6439d611fd0653f0bd01";

// usd kind
const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const ABUSD_ADDRESS = "0x6ee0f7bb50a54ab5253da0667b0dc2ee526c30a8";
const ASUSD_ADDRESS = "0x625ae63000f46200499120b906716420bd059240";
const ATUSD_ADDRESS = "0x4DA9b813057D04BAef4e5800E36083717b4a0341";
const AUSDC_ADDRESS = "0x9bA00D6856a4eDF4665BcA2C2309936572473B7E";
const AUSDT_ADDRESS = "0x71fc860f7d3a592a4a98740e39db31d25db65ae8";
const BUSD_ADDRESS = "0x4fabb145d64652a948d72533023f6e7a623c7c53";
const CUSD_ADDRESS = "0x5c406d99e04b8494dc253fcc52943ef82bca7d75";
const CUSDC_ADDRESS = "0x39AA39c021dfbaE8faC545936693aC917d5E7563";
const CUSDT_ADDRESS = "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9";
const DUSDT_ADDRESS = "0x868277d475e0e475e38ec5cda2d9c83b5e1d9fc8";
const FIUSDC_ADDRESS = "0xF013406A0B1d544238083DF0B93ad0d2cBE0f65f";
const GUSD_ADDRESS = "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd";
const HUSD_ADDRESS = "0xdf574c24545e5ffecb9a659c229253d4111d87e1";
const IDLEUSDC_ADDRESS = "0xeb66acc3d011056b00ea521f8203580c2e5d3991";
const MUSDC_ADDRESS = "0x3564ad35b9e95340e5ace2d6251dbfc76098669b";
const NUSD_ADDRESS = "0x0c6144c16af288948c8fdb37fd8fec94bff3d1d9";
const OAUSDC_ADDRESS = "0xde34d5e3f942b4543c309a0fb0461497e72c793c";
const OCUSDC_ADDRESS = "0x8ed9f862363ffdfd3a07546e618214b6d59f03d4";
const QUSD_ADDRESS = "0xa99a869a1d9f6ecbd26f7a63dcd5f5101c81d6e8";
const SUSD_ADDRESS = "0x57ab1ec28d129707052df4df418d58a2d46d5f51";
const YUSDCV2_ADDRESS = "0xd6ad7a6750a7593e092a9b218d66c0a814a3436e";
const YUSDCV3_ADDRESS = "0x26ea744e5b887e5205727f55dfbe8685e3b21951";
const YUSDTV2_ADDRESS = "0x83f798e925bcd4017eb265844fddabb448f1707d";
const YUSDTV3_ADDRESS = "0xe6354ed5bc4b393a5aad09f21c46e101e692d447";
const YBUSD_ADDRESS = "0x04bc0ab673d88ae9dbc9da2380cb6b79c4bca9ae";
const YTUSD_ADDRESS = "0x73a052500105205d34daf004eab301916da8190f";

// 1inch DAI kind stable coin
const daiKind = {
  "DAI":DAI_ADDRESS,
  "ADAI":ADAI_ADDRESS,
  "BDAI":BDAI_ADDRESS,
  "CDAI":CDAI_ADDRESS,
  "FIDAI":FIDAI_ADDRESS,
  "IDLEDAI":IDLEDAI_ADDRESS,
  "MDAI":MDAI_ADDRESS,
  "OCDAI":OCDAI_ADDRESS,
  "RDAI":RDAI_ADDRESS,
  "YDAIV2":YDAIV2_ADDRESS,
  "YDAIV3":YDAIV3_ADDRESS,
  "YDAI":YDAI_ADDRESS
}

// 1inch USD kind stable coin
const usdKind = {
  "USDT":USDT_ADDRESS,
  "USDC":USDC_ADDRESS,
  "ABUSD":ABUSD_ADDRESS,
  "ASUSD":ASUSD_ADDRESS,
  "ATUSD":ATUSD_ADDRESS,
  "AUSDC":AUSDC_ADDRESS,
  "AUSDT":AUSDT_ADDRESS,
  "BUSD":BUSD_ADDRESS,
  "CUSD":CUSD_ADDRESS,
  "CUSDC":CUSDC_ADDRESS,
  "CUSDT":CUSDT_ADDRESS,
  "DUSDT":DUSDT_ADDRESS,
  "FIUSDC":FIUSDC_ADDRESS,
  "GUSD":GUSD_ADDRESS,
  "HUSD":HUSD_ADDRESS,
  "IDLEUSDC":IDLEUSDC_ADDRESS,
  "MUSDC":MUSDC_ADDRESS,
  "NUSD":NUSD_ADDRESS,
  "OAUSDC":OAUSDC_ADDRESS,
  "OCUSDC":OCUSDC_ADDRESS,
  "QUSD":QUSD_ADDRESS,
  "SUSD":SUSD_ADDRESS,
  "YUSDCV2":YUSDCV2_ADDRESS,
  "YUSDCV3":YUSDCV3_ADDRESS,
  "YUSDTV2":YUSDTV2_ADDRESS,
  "YUSDTV3":YUSDTV3_ADDRESS,
  "YBUSD":YBUSD_ADDRESS,
  "YTUSD":YTUSD_ADDRESS
};

// dydx flashloan stable tokens
const dydxFlashTokens = {
  "DAI":DAI_ADDRESS,
  "USDC":USDC_ADDRESS,
  // "WETH":WETH_ADDRESS
};


const daiABI = require('../abi/dai');
const ercABI = require('../abi/erc20');

// 1inch 1proto.eth contract address
const oneProtoAddr = "0x6cb2291A3c3794fcA0F5b6E34a8E6eA7933CA667";
//const oneProtoAddr = "0x50FDA034C0Ce7a8f7EFDAebDA7Aa7cA21CC1267e";

// 1inch exchange list. total 34 dex.
// https://github.com/CryptoManiacsZone/1inchProtocol/blob/master/OneSplit.full.sol#L3782
let splitExchanges = [
  "Uniswap",
  "Keyber",
  "Bancor",
  "Oasis",
  "Curve Compound(Curve.fi)",
  "Curve USDT(Curve.fi v2)",
  "Curve Y(Curve.fi iearn)",
  "Curve Binance(Curve.fi BUSD)",
  "Curve Synthetix(Curve.fi sUSD)",
  "Uniswap Compound",
  "Uniswap CHAI",
  "Uniswap Aave",
  "Mooniswap",
  "Uniswap V2",
  "Uniswap V2 ETH",
  "Uniswap V2 DAI",
  "Uniswap V2 USDC",
  "Curve Pax",
  "Curve renBTC",
  "Curve tBTC",
  "Dforce XSwap",
  "PMM2(Shell)",
  "mStable mUSD",
  "Curve sBTC",
  "Balancer 1",
  "Balancer 2",
  "Balancer 3",
  "Kyber 1",
  "Kyber 2",
  "Kyber 3",
  "Kyber 4",
  "Mooniswap ETH",
  "Mooniswap DAI",
  "Mooniswap USDC"
];
/*
// list from 1inch website via js files.
"Uniswap",
"Kyber",
"Bancor",
"Oasis",
"Curve.fi",
"Curve.fi v2",
"Curve.fi iearn",
"Curve.fi BUSD",
"Curve.fi sUSD",
"cUniswap",
"dUniswap",
"aUniswap",
"Mooniswap",
"Uniswap V2",
"Uniswap V2 ETH",
"Uniswap V2 DAI",
"Uniswap V2 USDC",
"Curve.fi PAX",
"Curve.fi renBTC",
"Curve.fi tBTC",
"dForce Swap",
"PMM2",
"mStable",
"Curve sBTC",
"Balancer 1",
"Balancer 2",
"Balancer 3",
"Kyber 1",
"Kyber 2",
"Kyber 3",
"Kyber 4",
"Mooniswap ETH",
"Mooniswap DAI",
"Mooniswap USDC"
*/


// 1inch flags
// https://github.com/CryptoManiacsZone/1inchProtocol/blob/master/contracts/IOneSplit.sol
const UNISWAP =  new BN('1',16); // _swapOnUniswap : 0
const KYBER_ALL = new BN('200000000000000', 16); // _swapOnNowhere : 1
const BANCOR = new BN('4', 16); // _swapOnBancor : 2
const OASIS = new BN('8', 16); // _swapOnOasis : 3
const CURVE_COMPOUND = new BN('1000', 16); // _swapOnCurveCompound : 4
const CURVE_USDT = new BN('2000', 16); // _swapOnCurveUSDT : 5
const CURVE_Y = new BN('4000', 16); // _swapOnCurveY : 6
const CURVE_BINANCE = new BN('8000', 16); // _swapOnCurveBinance : 7
const CURVE_SYNTHETIX = new BN('40000', 16); // _swapOnCurveSynthetix : 8
const UNISWAP_COMPOUND = new BN('100000',16); // _swapOnUniswapCompound : 9
const UNISWAP_CHAI = new BN('200000', 16); // _swapOnUniswapChai : 10
const UNISWAP_AAVE = new BN('400000', 16); // _swapOnUniswapAave: 11
const UNISWAP_ALL = new BN('100000000000', 16);
const MOONISWAP = new BN('1000000', 16);  // _swapOnMooniswap : 12
const UNISWAPV2 = new BN('2000000', 16); // _swapOnUniswapV2 : 13
const UNISWAPV2_ALL = new BN('400000000000', 16);
const UNISWAP_V2_ETH = new BN('4000000', 16); // _swapOnUniswapV2ETH : 14
const UNISWAP_V2_DAI = new BN('8000000', 16); // _swapOnUniswapV2DAI : 15
const UNISWAP_V2_USDC = new BN('10000000', 16); // _swapOnUniswapV2USDC : 16
const CURVE_PAX = new BN('80000000', 16); // _swapOnCurvePAX : 17
const CURVE_RENBTC = new BN('100000000', 16); // _swapOnCurveRenBTC : 18
const CURVE_TBTC = new BN('200000000', 16); // _swapOnCurveTBTC : 19
const CURVE_ALL = new BN('200000000000', 16);
const DFORCE_SWAP = new BN('4000000000', 16); // _swapOnDforceSwap : 20
const SHELL = new BN('8000000000', 16); // _swapOnShell : 21
const MSTABLE_MUSD = new BN('20000000000', 16); // _swapOnMStableMUSD : 22
const CURVE_SBTC = new BN('40000000000',16); // _swapOnCurveSBTC : 23
const BALANCER_ALL = new BN('1000000000000', 16);
const BALANCER_1 = new BN('2000000000000',16); // _swapOnBalancer1 : 24
const BALANCER_2 = new BN('4000000000000',16); // _swapOnBalancer2 : 25
const BALANCER_3 = new BN('8000000000000',16); // _swapOnBalancer3 : 26
const KYBER_1 = new BN('400000000000000',16); // _swapOnKyber1 : 27
const KYBER_2 = new BN('800000000000000',16); // _swapOnKyber2 : 28
const KYBER_3 = new BN('1000000000000000',16); // _swapOnKyber3 : 29
const KYBER_4 = new BN('2000000000000000',16); // _swapOnKyber4 : 30
const MOONISWAP_ALL = new BN('8000000000000000', 16);
const MOONISWAP_ETH = new BN('10000000000000000',16); // _swapOnMooniswapETH : 31
const MOONISWAP_DAI = new BN('20000000000000000',16); // _swapOnMooniswapDAI : 32
const MOONISWAP_USDC = new BN('40000000000000000',16); // _swapOnMooniswapUSDC : 33

const COMPOUND = new BN('10', 16);
const FULCRUM = new BN('20', 16);
const CHAI = new BN('40', 16);
const AAVE = new BN('80', 16);
const SMART_TOKEN = new BN('10', 16);
const BDAI = new BN('400', 16);
const IEARN = new BN('800', 16);
const DMM = new BN('80000000000', 16);


const FLAGS = {
  "UNISWAP":UNISWAP,
  "MOONISWAP_ALL":MOONISWAP_ALL,
  "KYBER_ALL":KYBER_ALL,
  "CURVE_ALL":CURVE_ALL,
  "UNISWAPV2_ALL":UNISWAPV2_ALL,
  "UNISWAP_ALL":UNISWAP_ALL,
  "BALANCER_ALL":BALANCER_ALL,
  "BANCOR":BANCOR,
  "OASIS":OASIS,
  "COMPOUND":COMPOUND,
  "FULCRUM":FULCRUM,
  "CHAI":CHAI,
  "AAVE":AAVE,
  "SMART_TOKEN":SMART_TOKEN,
  "BDAI":BDAI,
  "IEARN":IEARN,
  "CURVE_SYNTHETIX":CURVE_SYNTHETIX,
  "CURVE_COMPOUND":CURVE_COMPOUND,
  "CURVE_Y":CURVE_Y,
  "CURVE_BINANCE":CURVE_BINANCE,
  "CURVE_PAX":CURVE_PAX,
  "DFORCE_SWAP":DFORCE_SWAP,
  "SHELL":SHELL,
  "MSTABLE_MUSD":MSTABLE_MUSD,
  "DMM":DMM,
  "CURVE_USDT":CURVE_USDT
}

const SWAP_FLAGS = {
  "UNISWAP":UNISWAP, // _swapOnUniswap : 0
  "KYBER_ALL":KYBER_ALL, // _swapOnNowhere : 1
  "BANCOR":BANCOR, // _swapOnBancor : 2
  "OASIS":OASIS, // _swapOnOasis : 3
  "CURVE_COMPOUND":CURVE_COMPOUND, // _swapOnCurveCompound : 4
  "CURVE_USDT":CURVE_USDT, // _swapOnCurveUSDT : 5
  "CURVE_Y":CURVE_Y, // _swapOnCurveY : 6
  "CURVE_BINANCE":CURVE_BINANCE, // _swapOnCurveBinance : 7
  "CURVE_SYNTHETIX":CURVE_SYNTHETIX, // _swapOnCurveSynthetix : 8
  "UNISWAP_COMPOUND":UNISWAP_COMPOUND, // _swapOnUniswapCompound : 9
  "UNISWAP_CHAI":UNISWAP_CHAI, // _swapOnUniswapChai : 10
  "UNISWAP_AAVE":UNISWAP_AAVE, // _swapOnUniswapAave: 11
  "MOONISWAP":MOONISWAP , // _swapOnMooniswap : 12
  "UNISWAPV2":UNISWAPV2, // _swapOnUniswapV2 : 13
  "UNISWAP_V2_ETH":UNISWAP_V2_ETH, // _swapOnUniswapV2ETH : 14
  "UNISWAP_V2_DAI":UNISWAP_V2_DAI, // _swapOnUniswapV2DAI : 15
  "UNISWAP_V2_USDC":UNISWAP_V2_USDC, // _swapOnUniswapV2USDC : 16
  "CURVE_PAX":CURVE_PAX, // _swapOnCurvePAX : 17
  "CURVE_RENBTC":CURVE_RENBTC, // _swapOnCurveRenBTC : 18
  "CURVE_TBTC":CURVE_TBTC, // _swapOnCurveTBTC : 19
  "DFORCE_SWAP":DFORCE_SWAP, // _swapOnDforceSwap : 20
  "SHELL":SHELL, // _swapOnShell : 21
  "MSTABLE_MUSD":MSTABLE_MUSD, // _swapOnMStableMUSD : 22
  "CURVE_SBTC":CURVE_SBTC, // _swapOnCurveSBTC : 23
  "BALANCER_1":BALANCER_1, // _swapOnBalancer1 : 24
  "BALANCER_2":BALANCER_2, // _swapOnBalancer2 : 25
  "BALANCER_3":BALANCER_3, // _swapOnBalancer3 : 26
  "KYBER_1":KYBER_1, // _swapOnKyber1 : 27
  "KYBER_2":KYBER_2, // _swapOnKyber2 : 28
  "KYBER_3":KYBER_3, // _swapOnKyber3 : 29
  "KYBER_4":KYBER_4, // _swapOnKyber4 : 30
  "MOONISWAP_ETH":MOONISWAP_ETH, // _swapOnMooniswapETH : 31
  "MOONISWAP_DAI":MOONISWAP_DAI, // _swapOnMooniswapDAI : 32
  "MOONISWAP_USDC":MOONISWAP_USDC, // _swapOnMooniswapUSDC : 33
}


// this is list of arb trade.
const arbCandidates = {
  "USDT":USDT_ADDRESS,
  "USDC":USDC_ADDRESS,
  "ATUSD":ATUSD_ADDRESS,
  "ABUSD":ABUSD_ADDRESS,
  "ASUSD":ASUSD_ADDRESS,
  "AUSDC":AUSDC_ADDRESS,
  "AUSDT":AUSDT_ADDRESS,
  // "BUSD":BUSD_ADDRESS,
  // "CUSD":CUSD_ADDRESS,
  // "CUSDC":CUSDC_ADDRESS,
  // "CUSDT":CUSDT_ADDRESS,
  // "GUSD":GUSD_ADDRESS,
  // "HUSD":HUSD_ADDRESS,
  // "NUSD":NUSD_ADDRESS,
  // "OCUSDC":OCUSDC_ADDRESS,
  // "SUSD":SUSD_ADDRESS,
  // "YUSDCV2":YUSDCV2_ADDRESS,
  // "YUSDCV3":YUSDCV3_ADDRESS,
  // "YUSDTV2":YUSDTV2_ADDRESS,
  // "YUSDTV3":YUSDTV3_ADDRESS,
  // "YBUSD":YBUSD_ADDRESS,
  // "YTUSD":YTUSD_ADDRESS,
  // "ADAI":ADAI_ADDRESS,
  // "BDAI":BDAI_ADDRESS,
  // "CDAI":CDAI_ADDRESS,
  // "FIDAI":FIDAI_ADDRESS,
  // "MDAI":MDAI_ADDRESS,
  // "OCDAI":OCDAI_ADDRESS,
  // "RDAI":RDAI_ADDRESS,
  // "YDAIV2":YDAIV2_ADDRESS,
  // "YDAIV3":YDAIV3_ADDRESS,
  // "YDAI":YDAI_ADDRESS
};



module.exports = {
  CHI_ADDRESS,
  ETH_ADDRESS,
  DAI_ADDRESS,
  BAT_ADDRESS,
  DAI_ADDRESS,
  YDAI_ADDRESS,
  CDAI_ADDRESS,
  USDT_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
  ATUSD_ADDRESS,
  daiABI,
  ercABI,
  usdKind,
  daiKind,
  FLAGS,
  SWAP_FLAGS,
  oneProtoAddr,
  arbCandidates,
  dydxFlashTokens,
  splitExchanges
}
