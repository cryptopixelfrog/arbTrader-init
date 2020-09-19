require('dotenv').config();
const fs = require('fs');
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');

const arbTrader = artifacts.require('arbTrader');

const userAddress = process.env.TRADERWALLETADDR;

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
  dydxFlashTokens,
  arbCandidates
} = require('../script/utils/constant.js');
console.log("DAI_ADDRESS:", DAI_ADDRESS);
const chiContract = new web3.eth.Contract(ercABI, CHI_ADDRESS);
const daiContract = new web3.eth.Contract(daiABI, DAI_ADDRESS);
const usdtContract = new web3.eth.Contract(ercABI, USDT_ADDRESS);
const ydaiContract = new web3.eth.Contract(ercABI, YDAI_ADDRESS);
const usdcContract = new web3.eth.Contract(ercABI, USDC_ADDRESS);
const wethContract = new web3.eth.Contract(ercABI, WETH_ADDRESS);




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
        from: accounts[1],
        to: mainAccount,
        value: web3.utils.toWei('1', 'ether')
      });
      var ethBalance = web3.eth.getBalance(arbTraderContract).then(function(ethBalance){
        console.log("ETH balance in executor - " + mainAccount + ":  ", ethBalance);
      });

      await web3.eth.sendTransaction({
        from: accounts[1],
        to: userAddress,
        value: web3.utils.toWei('10', 'ether')
      });
      var ethBalance = web3.eth.getBalance(arbTraderContract).then(function(ethBalance){
        console.log("ETH balance in arbTraderContract: ", ethBalance);
      });
  });


  it('Send tokens to arbTraderContract Smart Contract', async () => {
    // unlock 0x9eB7f2591ED42dEe9315b6e2AAF21bA85EA69F8C for DAI
      await daiContract.methods
        .transfer(arbTraderContract, web3.utils.toWei('1000', 'ether'))
        .send({ from: "0x9eB7f2591ED42dEe9315b6e2AAF21bA85EA69F8C", gasLimit: 800000 });
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
        .transfer(arbTraderContract, d6(19000000))
        .send({ from: "0x58E99d69613Fa715B2b61Ed19960eCBA7Ed41Cd8", gasLimit: 800000 });
      const usdcBalance = await usdcContract.methods.balanceOf(arbTraderContract).call();
      console.log('USDC balance in ' + arbTraderContract + ': ', f6(usdcBalance));

      // unlock 0x57757E3D981446D585Af0D9Ae4d7DF6D64647806
      await wethContract.methods
        .transfer(arbTraderContract, web3.utils.toWei('10', 'ether'))
        .send({ from: "0x57757E3D981446D585Af0D9Ae4d7DF6D64647806", gasLimit: 800000 });
      const wethBalance = await wethContract.methods.balanceOf(arbTraderContract).call();
      console.log('WETH balance in ' + arbTraderContract + ': ', f18(wethBalance));
  });


  it('Checking Token balance', async () => {
      const daiBalance = await daiContract.methods.balanceOf(arbTraderContract).call();
      console.log('DAI balance in ' + arbTraderContract + ': ', f18(daiBalance));

      const usdcBalance = await usdcContract.methods.balanceOf(arbTraderContract).call();
      console.log('USDC balance in ' + arbTraderContract + ': ', f6(usdcBalance));

  });



  it("Test DyDxFlashLoan & Trade USDC-USDT->USDC with magic flag", async() => {
    let flashloanAmount = Math.floor(3000 * 10**6);
    let flashLoanToken = USDC_ADDRESS;

    const tx = await arbTraderInstance.getFlashloan(
                            flashLoanToken,
                            flashloanAmount
                            { from: mainAccount }
                          );
  });



  it('Checking Token balance', async () => {
      const daiBalance = await daiContract.methods.balanceOf(arbTraderContract).call();
      console.log('DAI balance in ' + arbTraderContract + ': ', f18(daiBalance));

      const usdcBalance = await usdcContract.methods.balanceOf(arbTraderContract).call();
      console.log('USDC balance in ' + arbTraderContract + ': ', f6(usdcBalance));
  });

});
