require('dotenv').config();
const fs = require('fs');
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');


const arbTrader = artifacts.require('arbTrader');

const userAddress = process.env.WALLETADDR;

const  {
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
  splitExchanges
} = require('../script/utils/constant.js');
const chiContract = new web3.eth.Contract(ercABI, CHI_ADDRESS);
const daiContract = new web3.eth.Contract(daiABI, DAI_ADDRESS);
const usdtContract = new web3.eth.Contract(ercABI, USDT_ADDRESS);
const ydaiContract = new web3.eth.Contract(ercABI, YDAI_ADDRESS);
const usdcContract = new web3.eth.Contract(ercABI, USDC_ADDRESS);
const wethContract = new web3.eth.Contract(ercABI, WETH_ADDRESS);

const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));

const oneProtoAbi = JSON.parse(fs.readFileSync('./script/abi/1proto.eth.abi'));
const oneProtoContract = new web3.eth.Contract(oneProtoAbi, oneProtoAddr);


contract('arbTrader',  accounts  => {
  //let mainAccount = accounts[0];
  let mainAccount = userAddress;
  let arbTraderContract;

  const d18 = function (amount) {
          amount = new BN(amount)
          return web3.utils.toWei(amount.toString(), "ether")
      }

  const d6 = function (amount) {
          amount = new BN(amount)
          return web3.utils.toWei(amount.toString(), "mwei")
      }

  const f18 = function (amount) {
          amount = new BN(amount)
          return web3.utils.fromWei(amount.toString(), "ether")
      }

  const f6 = function (amount) {
          amount = new BN(amount)
          return web3.utils.fromWei(amount.toString(), "mwei")
      }


  const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  before('Setup contract for each test', async () => {
    arbTraderInstance = await arbTrader.deployed();
    console.log("arbTrader contract address:  ", arbTraderInstance.address);
    arbTraderContract = arbTraderInstance.address;
  })


  it('Send ETH to mainAccount and arbTraderContract Smart Contract', async () => {
      await web3.eth.sendTransaction({
        from: accounts[2],
        to: mainAccount,
        value: web3.utils.toWei('50', 'ether')
      });
      var ethBalance = web3.eth.getBalance(mainAccount).then(function(ethBalance){
        console.log("ETH balance in executor - " + mainAccount + ":  ", ethBalance);
      });

      await web3.eth.sendTransaction({
        from: accounts[3],
        to: arbTraderContract,
        value: web3.utils.toWei('50', 'ether')
      });
      var ethBalance = web3.eth.getBalance(arbTraderContract).then(function(ethBalance){
        console.log("ETH balance in arbTraderContract: ", ethBalance);
      });
      sleep(10000); // sleep 10 sec
  });


  it('Send tokens to arbTraderContract Smart Contract', async () => {
    // unlock 0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699 for DAI
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: "0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699",
      value: web3.utils.toWei('1', 'ether')
    });
    await daiContract.methods
      .transfer(arbTraderContract, web3.utils.toWei('10000', 'ether'))
      .send({ from: "0x131a9A36Ea25aFB4Ed1a4510eE4B36E369d0F699", gasLimit: 1000000 });
    const daiBalance = await daiContract.methods.balanceOf(arbTraderContract).call();
    console.log('DAI balance in ' + arbTraderContract + ': ', daiBalance);

    // unlock 0x58E99d69613Fa715B2b61Ed19960eCBA7Ed41Cd8 for USDC
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: "0x58E99d69613Fa715B2b61Ed19960eCBA7Ed41Cd8",
      value: web3.utils.toWei('1', 'ether')
    });
    // we need big amount for batch test
    await usdcContract.methods
      .transfer(arbTraderContract, d6(10000))
      .send({ from: "0x58E99d69613Fa715B2b61Ed19960eCBA7Ed41Cd8", gasLimit: 1000000 });
    const usdcBalance = await usdcContract.methods.balanceOf(arbTraderContract).call();
    console.log('USDC balance in ' + arbTraderContract + ': ', f6(usdcBalance));

    // unlock 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    await wethContract.methods
      .transfer(arbTraderContract, web3.utils.toWei('10', 'ether'))
      .send({ from: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", gasLimit: 1000000 });
    const wethBalance = await wethContract.methods.balanceOf(arbTraderContract).call();
    console.log('WETH balance in ' + arbTraderContract + ': ', f18(wethBalance));
    sleep(10000); // sleep 10 sec
  });


  it('Mint CHI and send to arbTraderContract Smart Contract', async () => {
    // unlock 0xCF2C6580E9798c09246CEB6cb8bC99613964a805 for CHI
    await chiContract.methods
      .transfer(arbTraderContract, 1000)
      .send({ from: "0xCF2C6580E9798c09246CEB6cb8bC99613964a805", gasLimit: 1000000 });
    const chiBalance = await chiContract.methods.balanceOf(arbTraderContract).call();
    console.log('CHI balance in ' + arbTraderContract + ': ', chiBalance);
    sleep(10000); // sleep 10 sec
  });


  it('Checking Token balance', async () => {
      const daiBalance = await daiContract.methods.balanceOf(arbTraderContract).call();
      console.log('DAI balance in ' + arbTraderContract + ': ', f18(daiBalance));

      const usdcBalance = await usdcContract.methods.balanceOf(arbTraderContract).call();
      console.log('USDC balance in ' + arbTraderContract + ': ', f6(usdcBalance));

      const chiBalance = await chiContract.methods.balanceOf(arbTraderContract).call();
      console.log('CHI balance in ' + arbTraderContract + ': ', chiBalance);
  });


  it("Testing DAI to USD kind trade", async() =>{

    // const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));
    //
    // const amountWei = web3.utils.toWei("1");
    // const fromToken = dydxFlashTokens['DAI'];
    // const parts = 1;
    //
    // //for(let flagKey in FLAGS){
    //   //console.log("<<<<", flagKey, ">>>>");
    //   //let flags = DISABLE_ALL.add(FLAGS[flagKey]);
    //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['IEARN']).add(FLAGS['CURVE_SYNTHETIX']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['MOONISWAP_ALL']).add(FLAGS['CURVE_ALL']);
    //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']);
    //   let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
    //   let toToken;
    //   let successTokens = [];
    //   let failedTokens = [];
    //   for(let key in usdKind){
    //     toToken = usdKind[key];
    //     try{
    //       console.log(fromToken, "->", key, "->", fromToken);
    //       let tx = await arbTraderInstance.trade(
    //         fromToken,
    //         toToken,
    //         amountWei,
    //         parts,
    //         flags,
    //         { from : mainAccount });
    //       //console.log(tx);
    //       successTokens.push(key);
    //     } catch (error) {
    //       //console.log(error);
    //       failedTokens.push(key);
    //     };
    //   };
    //   console.log(successTokens);
    //   console.log(failedTokens);
    // //}

  });


  it("Testing DAI to DAI kind trade", async() =>{
    //
    // const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));
    //
    // const amountWei = web3.utils.toWei("1");
    // const fromToken = dydxFlashTokens['DAI'];
    // const parts = 1;
    //
    // //for(let flagKey in FLAGS){
    //   //console.log("<<<<", flagKey, ">>>>");
    //   //let flags = DISABLE_ALL.add(FLAGS[flagKey]);
    //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['IEARN']).add(FLAGS['CURVE_SYNTHETIX']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['MOONISWAP_ALL']).add(FLAGS['CURVE_ALL']);
    //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']);
    //   let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
    //   let toToken;
    //   let successTokens = [];
    //   let failedTokens = [];
    //   for(let key in daiKind){
    //     toToken = daiKind[key];
    //     try{
    //       console.log(fromToken, "->", key, "->", fromToken);
    //       let tx = await arbTraderInstance.trade(
    //         fromToken,
    //         toToken,
    //         amountWei,
    //         parts,
    //         flags,
    //         { from : mainAccount });
    //       //console.log(tx);
    //       successTokens.push(key);
    //     } catch (error) {
    //       //console.log(error);
    //       failedTokens.push(key);
    //     };
    //   };
    //   console.log(successTokens);
    //   console.log(failedTokens);
    // //}
    //
  });


  it("Testing ETH to DAI kind trade", async() =>{

    // const DISABLE_ALL = new BN('20000000', 16).add(new BN('40000000', 16));
    //
    // const amountWei = web3.utils.toWei("1");
    // const fromToken = dydxFlashTokens['WETH'];
    // const parts = 1;
    //
    // // for(let flagKey in FLAGS){
    // //   console.log("<<<<", flagKey, ">>>>");
    // //   let flags = DISABLE_ALL.add(FLAGS[flagKey]);
    //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['IEARN']).add(FLAGS['CURVE_SYNTHETIX']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['MOONISWAP_ALL']).add(FLAGS['CURVE_ALL']);
    //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']);
    //   let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
    //   let toToken;
    //   let successTokens = [];
    //   let failedTokens = [];
    //   for(let key in daiKind){
    //     toToken = daiKind[key];
    //     try{
    //       console.log(fromToken, "->", key, "->", fromToken);
    //       let tx = await arbTraderInstance.trade(
    //         fromToken,
    //         toToken,
    //         amountWei,
    //         parts,
    //         flags,
    //         { from : mainAccount });
    //       //console.log(tx);
    //       successTokens.push(key);
    //     } catch (error) {
    //       //console.log(error);
    //       failedTokens.push(key);
    //     };
    //   };
    //   console.log(successTokens);
    //   console.log(failedTokens);
    // //}

  });


  // it("Testing 1000 VS 8k trade, DAI->xx->DAI", async() =>{
  //
  //   let amountWei = web3.utils.toWei("8000"); // 10k fials.
  //   let fromToken = DAI_ADDRESS;
  //   let parts = 1;
  //
  //
  //   for(let flagKey in FLAGS){
  //     console.log("<<<<", flagKey, ">>>>");
  //     let flags = DISABLE_ALL.add(FLAGS[flagKey]);
  //     //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
  //
  //     let toToken;
  //     let toTokenName;
  //     let successTokens = [];
  //     let failedTokens = [];
  //     for(let key in arbCandidates){
  //       toToken = arbCandidates[key];
  //       toTokenName = key;
  //       try {
  //         console.log("DAI->",toTokenName, "->DAI");
  //         const tx = await arbTraderInstance.trade(
  //           fromToken,
  //           toToken,
  //           amountWei,
  //           parts,
  //           flags,
  //           { from : mainAccount });
  //         successTokens.push(key);
  //       } catch(error){
  //         //console.log(error);
  //         failedTokens.push(key);
  //       }
  //     }
  //     console.log(successTokens);
  //     console.log(failedTokens);
  //   };
  //
  // });



  // it("Test DyDxFlashLoan Loop with over 10k with magic flag - test_magic_flag.js", async() => {
  //   let baseAmount = 10000;
  //   //let flashLoanAmount = web3.utils.toHex(loanAmount * 10 ** 18);
  //   //let flashLoanAmount = web3.utils.toWei('10000', 'ether');
  //
  //   let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  //   let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  //   let amountWETH = web3.utils.toWei("30"); // for WETH
  //   let flashLoanAmount;
  //
  //   //let amountWei = web3.utils.toWei("100");
  //   let parts = 1;
  //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
  //   let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAP_ALL']).add(FLAGS['IEARN']).add(FLAGS['MOONISWAP_ALL']);
  //   let flashLoanToken; // this is fromToken too
  //
  //   let startFlagsForSwap = flags;
  //   let startReturnAmount = 0x0;
  //   let startDistribution = [];
  //   let endFlagsForSwap = flags;
  //   let endReturnAmount = 0x0;
  //   let endDistribution = [];
  //
  //   for(let fToken in dydxFlashTokens){
  //     flashLoanToken = dydxFlashTokens[fToken];
  //
  //     if(fToken == "DAI"){
  //       flashLoanAmount = amountDAI;
  //     } else if(fToken == "USDC") {
  //       flashLoanAmount = amountUSDC;
  //     }
  //
  //     console.log("Flashloan -", flashLoanAmount, fToken);
  //
  //     let toToken;
  //     let toTokenName;
  //     let successTokens = [];
  //     let failedTokens = [];
  //     for(let key in arbCandidates){
  //       toToken = arbCandidates[key];
  //       toTokenName = key;
  //       console.log(" " + fToken,"->",toTokenName,"->",fToken);
  //       try {
  //         const tx = await arbTraderInstance.getFlashloan(
  //             flashLoanToken,
  //             flashLoanAmount,
  //             toToken,
  //             parts,
  //             startFlagsForSwap,
  //             startReturnAmount,
  //             startDistribution,
  //             endFlagsForSwap,
  //             endReturnAmount,
  //             endDistribution,
  //             { from: mainAccount }
  //           );
  //         successTokens.push(key);
  //       } catch(error){
  //         //console.log(error);
  //         failedTokens.push(key);
  //       }
  //     }
  //     console.log(successTokens);
  //     console.log(failedTokens);
  //
  //   }// flashloand forloop
  // });



  // it("Test external distribution call ", async() => {
  //   let baseAmount = 1000;
  //   let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
  //   let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
  //   let amountWETH = web3.utils.toWei("30"); // for WETH
  //
  //   let flashLoanAmount = fromAmount = amountDAI;
  //
  //   let flashLoanToken = fromToken = DAI_ADDRESS;
  //   //let toToken = USDT_ADDRESS;
  //   let parts = 1; // 2 == 50/50
  //   //let flags = DISABLE_ALL.add(FLAGS['UNISWAPV2_ALL']);
  //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
  //   //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAP_ALL']).add(FLAGS['IEARN']).add(FLAGS['MOONISWAP_ALL']);
  //   //let flags = DISABLE_ALL.add(FLAGS['CURVE_USDT']).add(FLAGS['CURVE_Y']).add(FLAGS['MOONISWAP_ALL']).add(FLAGS['MSTABLE_MUSD']).add(FLAGS['KYBER_ALL']);
  //   //let flags = DISABLE_ALL.add(FLAGS['CURVE_SYNTHETIX']).add(FLAGS['CURVE_Y']).add(FLAGS['CURVE_BINANCE']).add(FLAGS['CURVE_USDT']);
  //   // strangly, using flag with DISABLE_ALL pattern does not work for getExpectedReturn.
  //   // It gives "Error: invalid number value (arg="flags", coderType="uint256", value="400060000000")" error.
  //   // But this does not an issue for getFlashloan(swap in SC).
  //   //console.log("flags:", flags.toString()); // flags: 70370354790400 -> UNISWAPV2_ALL
  //
  //   //let flags = 0x0; // enable all dexs for getExpectedReturn, this does not work for swap.
  //   let flags = 0x400000000000; // disable UNISWAPV2_ALL.
  //
  //   let toToken;
  //   let toTokenName;
  //   let successTokens = [];
  //   let failedTokens = [];
  //
  //   for(let key in arbCandidates){
  //     toToken = arbCandidates[key];
  //     toTokenName = key;
  //     let dexFrom = [];
  //     let dexTo = [];
  //     let dexFromSwap = [];
  //     let dexToSwap = [];
  //
  //     console.log("DAI->",toTokenName,"->DAI");
  //
  //     try {
  //       // from -> to ////////////////////////////////
  //       let startReturnAmount = null;
  //       let startDistribution = null;
  //       let startFlagsForSwap = null;
  //       let TMPFLAG = new BN('0', 16); // 0
  //       // get startDistribution from getExpectedReturn for fromTo swap.
  //       await oneProtoContract.methods.getExpectedReturn(fromToken, toToken, fromAmount, parts, flags).call().then(data => {
  //         startReturnAmount = data.returnAmount;
  //         startDistribution = data.distribution;
  //         data.distribution.forEach(function(value, index) {
  //           if(value > 0){
  //             // now we need to construct startFlagsForSwap based on dexFrom.
  //             dexFrom.push(`${splitExchanges[index]}: ${value*100/parts}%`);
  //             // based on startDistribution, prepare flags for swap
  //             Object.entries(SWAP_FLAGS).forEach(([keySwap,valSwap],indexSwap)=>{
  //               if(indexSwap == index){
  //                 console.log(indexSwap,index);
  //                 TMPFLAG = TMPFLAG.add(valSwap);
  //                 dexFromSwap.push(keySwap);
  //               }
  //             });
  //           }
  //         })
  //       });
  //       console.log("dexFrom:", dexFrom);
  //       console.log("dexFromSwap:", dexFromSwap);
  //       console.log("startReturnAmount:", startReturnAmount);
  //       // console.log("startDistribution:", startDistribution);
  //       // console.log("startFlagsForSwap:", TMPFLAG.toString());
  //
  //       startFlagsForSwap = DISABLE_ALL.add(TMPFLAG);
  //       //let startFlagsForSwap = 0; // this never works for swap.
  //       //startReturnAmount = 0x0; // giving re-entrance on mooniswap <- dont do this at here.
  //
  //       // to -> from ////////////////////////////////
  //       let endReturnAmount = null;
  //       let endDistribution = null;
  //       let endFlagsForSwap = null;
  //       TMPFLAG = new BN('0', 16); // reset to 0
  //       // get endDistribution from getExpectedReturn for fromTo swap.
  //       await oneProtoContract.methods.getExpectedReturn(toToken, fromToken, startReturnAmount, parts, flags).call().then(data => {
  //         endReturnAmount = data.returnAmount;
  //         endDistribution = data.distribution;
  //         data.distribution.forEach(function(value, index) {
  //           if(value > 0){
  //             // now we need to construct endFlagsForSwap based on dexTo.
  //             dexTo.push(`${splitExchanges[index]}: ${value*100/parts}%`);
  //             // based on endDistribution, prepare flags for swap
  //             Object.entries(SWAP_FLAGS).forEach(([keySwap,valSwap],indexSwap)=>{
  //               if(indexSwap == index){
  //                 console.log(indexSwap,index);
  //                 TMPFLAG = TMPFLAG.add(valSwap);
  //                 dexToSwap.push(keySwap);
  //               }
  //             });
  //           }
  //         })
  //       });
  //       console.log("dexTo:", dexTo);
  //       console.log("dexToSwap:", dexToSwap);
  //       console.log("endReturnAmount:", endReturnAmount);
  //       // console.log("endDistribution:", endDistribution);
  //       // console.log("endFlagsForSwap:", TMPFLAG.toString());
  //
  //       endFlagsForSwap = DISABLE_ALL.add(TMPFLAG);
  //       // if we set endReturnAmount and endDistribution like below,
  //       // getExpectedReturn in sc will have those two data dynamically.
  //       // startReturnAmount = 0x0;
  //       // startDistribution = [];
  //       // endReturnAmount = 0x0;
  //       // endDistribution = [];
  //
  //       // startReturnAmount = 0x1;
  //       // endReturnAmount = 0x1;
  //
  //       const tx = await arbTraderInstance.getFlashloan(
  //             flashLoanToken,
  //             flashLoanAmount,
  //             toToken,
  //             parts,
  //             startFlagsForSwap,
  //             startReturnAmount,
  //             startDistribution,
  //             endFlagsForSwap,
  //             endReturnAmount,
  //             endDistribution,
  //             { from: mainAccount }
  //           );
  //       successTokens.push(key);
  //     } catch(error){
  //       console.log(error);
  //       failedTokens.push(key);
  //     }
  //   }
  //   console.log(successTokens);
  //   console.log(failedTokens);
  //
  // });



  // it("Test getting distribution array", async () => {
  //   let fromToken = DAI_ADDRESS;
  //   let toToken = USDT_ADDRESS;
  //   let baseAmount = 100;
  //   let fromAmount = web3.utils.toWei(baseAmount.toString()); // for DAI
  //   let parts = 1;
  //   let flags = 0x0;
  //
  //   let returnAmount;
  //   let distribution;
  //
  //   await arbTraderInstance.getDistributions(
  //           fromToken,
  //           toToken,
  //           fromAmount,
  //           parts,
  //           flags
  //   ).then((data) => {
  //     returnAmount = data.returnAmountFromBk;
  //     distribution = data.distributionFromBk
  //   });
  //
  //   console.log(returnAmount);
  //   console.log(distribution);
  // });






  it("Test all dynamics", async() => {
    let baseAmount = 100;
    let amountDAI = web3.utils.toWei(baseAmount.toString()); // for DAI
    let amountUSDC = Math.floor(baseAmount * 10**6); // for USDC
    let amountWETH = web3.utils.toWei("30"); // for WETH

    let flashLoanAmount = fromAmount = amountDAI;

    let flashLoanToken = fromToken = DAI_ADDRESS;
    //let toToken = USDT_ADDRESS;
    let parts = 1; // 2 == 50/50
    //let flags = DISABLE_ALL.add(FLAGS['UNISWAPV2_ALL']);
    //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
    let magicFlags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAP_ALL']).add(FLAGS['IEARN']).add(FLAGS['MOONISWAP_ALL']);
    //let flags = DISABLE_ALL.add(FLAGS['CURVE_USDT']).add(FLAGS['CURVE_Y']).add(FLAGS['MOONISWAP_ALL']).add(FLAGS['MSTABLE_MUSD']).add(FLAGS['KYBER_ALL']);
    //let flags = DISABLE_ALL.add(FLAGS['CURVE_SYNTHETIX']).add(FLAGS['CURVE_Y']).add(FLAGS['CURVE_BINANCE']).add(FLAGS['CURVE_USDT']);
    // strangly, using flag with DISABLE_ALL pattern does not work for getExpectedReturn.
    // It gives "Error: invalid number value (arg="flags", coderType="uint256", value="400060000000")" error.
    // But this does not an issue for getFlashloan(swap in SC).
    //console.log("flags:", flags.toString()); // flags: 70370354790400 -> UNISWAPV2_ALL

    //let flags = 0x0; // enable all dexs for getExpectedReturn, this does not work for swap.
    //let flags = 0x400000000000; // disable UNISWAPV2_ALL.
    let flags = 0x2000000; // disable only UNISWAP v2, not UNISWAP_V2_xx

    let toToken;
    let toTokenName;
    let successTokens = [];
    let failedTokens = [];

    for(let key in arbCandidates){
      toToken = arbCandidates[key];
      toTokenName = key;
      let dexFrom = [];
      let dexTo = [];
      let dexFromSwap = [];
      let dexToSwap = [];

      console.log("DAI->",toTokenName,"->DAI");

      try {
        // from -> to ////////////////////////////////
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

        // to -> from ////////////////////////////////
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

        ///////////////////////////////////////////////////////////////
        // if we set endReturnAmount and endDistribution like below,
        // getExpectedReturn in sc will have those two data dynamically.
        ///////////////////////////////////////////////////////////////
        startReturnAmount = 0x0;
        startDistribution = [];
        endReturnAmount = 0x0;
        endDistribution = [];
        startReturnAmount = 0x1;
        endReturnAmount = 0x1;

        const tx = await arbTraderInstance.getFlashloan(
              flashLoanToken,
              flashLoanAmount,
              toToken,
              parts,
              startFlagsForSwap,
              startReturnAmount,
              startDistribution,
              endFlagsForSwap,
              endReturnAmount,
              endDistribution,
              { from: mainAccount }
            );
        successTokens.push(key);
      } catch(error){
        //console.log(error);
        failedTokens.push(key);
      }
    }
    console.log(successTokens);
    console.log(failedTokens);

  });




  // it("Testing USDC _swap or Trade with magic flag", async() =>{
  //
  //   let fromToken = USDC_ADDRESS;
  //   let toToken = USDT_ADDRESS;
  //
  //   // let usdcBalance = await usdcContract.methods.balanceOf(arbTraderContract).call();
  //   // let amountWei = usdcBalance; // works - amountWei: 100000000
  //   //let amountWei = web3.utils.toWei("1"); // does not work, SafeERC20
  //
  //   //let amountWei = Math.floor(1 * 10**6); // works - amountWei: 100000
  //   //let amountWei = Math.floor(100 * 10**6); // works - amountWei: 100000000
  //   //let amountWei = Math.floor(1000 * 10**6); // works - amountWei: 1000000000
  //   //let amountWei = Math.floor(8000 * 10**6); // works - amountWei: 8000000000
  //   //let amountWei = Math.floor(10000 * 10**6); // works - amountWei: 10000000000
  //   let amountWei = Math.floor(100000 * 10**6); // works - amountWei: 100000000000
  //
  //   //let amountWei = d6(1000); // works - amountWei: 1000000000
  //   //let amountWei = web3.utils.toWei('1', 'ether'); // does not work, SafeERC20 - amountWei: 1000000000000000000
  //
  //   console.log("amountWei:", amountWei);
  //   let parts = 1;
  //
  //   // let successDex = [];
  //   // let failedDex = [];
  //   // for(let flagKey in FLAGS){
  //   //   console.log("<<<<", flagKey, ">>>>");
  //   //   let flags = DISABLE_ALL.add(FLAGS[flagKey]);
  //     let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
  //     try {
  //       //const tx = await arbTraderInstance._swap(
  //       const tx = await arbTraderInstance.trade(
  //         fromToken,
  //         toToken,
  //         amountWei,
  //         parts,
  //         flags,
  //         { from : mainAccount });
  //       //successDex.push(flagKey);
  //     } catch(error) {
  //       console.log(error);
  //       //failedDex.push(flagKey);
  //     }
  //   // };
  //   // console.log(successDex);
  //   // console.log(failedDex);
  //
  // });



  // I never made the over 8k USDC->USDT->USDC trade.
  // Still dont know which dex are able to handle over 5k trad. Need to work on more.
  // it("Testing DyDxFlashLoan & Trade 100k USDC-USDT->USDC without magic flag", async() =>{
  //
  //   let flashLoanToken = USDC_ADDRESS;
  //   let toToken = USDT_ADDRESS;
  //   let parts = 1;
  //
  //   // USDC->USDT->USDC
  //   let flashloanAmountArray = [
  //     // Math.floor(100 * 10**6),
  //     Math.floor(1000 * 10**6),
  //     //Math.floor(5000 * 10**6),
  //     //Math.floor(8000 * 10**6), // failed on all dex
  //     // Math.floor(10000 * 10**6), // failed on all dex
  //     // Math.floor(100000 * 10**6) // failed on all dex
  //   ];
  //
  //   for(let i in flashloanAmountArray){
  //     flashLoanAmount = flashloanAmountArray[i];
  //     console.log("FlashloanAmount:", f6(flashLoanAmount));
  //
  //     let successDex = [];
  //     let failedDex = [];
  //     for(let flagKey in FLAGS){
  //       //console.log("<<<<", flagKey, ">>>>");
  //       let flags = DISABLE_ALL.add(FLAGS[flagKey]);
  //       //let flags = DISABLE_ALL.add(FLAGS['AAVE']).add(FLAGS['UNISWAPV2_ALL']).add(FLAGS['IEARN']);
  //       try {
  //         const tx = await arbTraderInstance.getFlashloan(
  //                           flashLoanToken,
  //                           flashLoanAmount,
  //                           toToken,
  //                           parts,
  //                           flags,
  //                           { from: mainAccount }
  //                         );
  //         successDex.push(flagKey);
  //       } catch(error) {
  //         //console.log(error);
  //         failedDex.push(flagKey);
  //       }
  //     };
  //     console.log(successDex);
  //     console.log(failedDex);
  //   }
  //
  //
  // });


  it('Checking Token balance', async () => {
    var ethBalance = web3.eth.getBalance(arbTraderContract).then(function(ethBalance){
      console.log("ETH balance in arbTraderContract: ", ethBalance);
    });

      const daiBalance = await daiContract.methods.balanceOf(arbTraderContract).call();
      console.log('DAI balance in ' + arbTraderContract + ': ', f18(daiBalance));

      const usdcBalance = await usdcContract.methods.balanceOf(arbTraderContract).call();
      console.log('USDC balance in ' + arbTraderContract + ': ', f6(usdcBalance));

      const chiBalance = await chiContract.methods.balanceOf(arbTraderContract).call();
      console.log('CHI balance in ' + arbTraderContract + ': ', chiBalance);
  });


  it("Test withdraw ETH and ERC20", async () => {
    const tx = await arbTraderInstance.withdrawETH();
    console.log(tx);

    const erc20Tx = await arbTraderInstance.withdrawERC20(DAI_ADDRESS);
    console.log(erc20Tx);
  });


  it('Checking Final Token balance', async () => {
    var ethBalance = web3.eth.getBalance(arbTraderContract).then(function(ethBalance){
      console.log("ETH balance in arbTraderContract: ", ethBalance);
    });

      const daiBalance = await daiContract.methods.balanceOf(arbTraderContract).call();
      console.log('DAI balance in ' + arbTraderContract + ': ', f18(daiBalance));

      const usdcBalance = await usdcContract.methods.balanceOf(arbTraderContract).call();
      console.log('USDC balance in ' + arbTraderContract + ': ', f6(usdcBalance));

      const chiBalance = await chiContract.methods.balanceOf(arbTraderContract).call();
      console.log('CHI balance in ' + arbTraderContract + ': ', chiBalance);
  });

});
