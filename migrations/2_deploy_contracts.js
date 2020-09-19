require('dotenv').config();
const arbTrader = artifacts.require("arbTrader");
const arbCurveFi = artifacts.require("arbCurveFi");
const DyDxTxManager = artifacts.require("DyDxTxManager");


const oneProtoAddress = "0x6cb2291A3c3794fcA0F5b6E34a8E6eA7933CA667"; // 1proto.eth (OneSplitWrap)
//const oneProtoAddress = "0x50FDA034C0Ce7a8f7EFDAebDA7Aa7cA21CC1267e";
//const oneSplitWrapAddress = "0x8e41C855B975322f5C80265f8d8b6D4cb0207036";
const oneSplitAuditAddress = "0x763Ff35A46dc5BF092737cd400c76D0871bD64B2"; //
//https://etherscan.io/address/0x9021c84f3900b610ab8625d26d739e3b7bff86ab
//const oneSplitAuditAddress = "0x9021c84f3900b610ab8625d26d739e3b7bff86ab";m

const curveFiAddress = "0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51"; // curveY

module.exports = async function(deployer) {

  await deployer.deploy(
    arbTrader,
    oneProtoAddress,
    { value:'2', sender:process.env.WALLETADDR }
  );
  const _arbTrader = await arbTrader.deployed();
  console.log("Deployed arbTrader=> ", _arbTrader.address);

  // Curve specific arb sc
  await deployer.deploy(
    arbCurveFi,
    curveFiAddress,
    { value:'2', sender:process.env.WALLETADDR }
  );
  const _arbCurveFi = await arbCurveFi.deployed();
  console.log("Deployed arbCurveFi=> ", _arbCurveFi.address);

  // TxManager sc
  await deployer.deploy(
    DyDxTxManager,
    curveFiAddress,
    { value:'2', sender:process.env.WALLETADDR }
  );
  const _DyDxTxManager = await DyDxTxManager.deployed();
  console.log("Deployed DyDxTxManager=> ", _DyDxTxManager.address);


};
