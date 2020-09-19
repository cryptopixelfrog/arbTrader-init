//pragma solidity ^0.5.0;
pragma solidity >=0.4.22 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./dydx/DyDxFlashloan.sol";
import "./curvefi/ICurveFiCurve.sol";
import "./mStable/IMStable.sol";
import "./uniswapv2/IUniswapV2Exchange.sol";
import "./uniswapv2/IUniswapV2Factory.sol";



contract IAaveToken is IERC20 {
    function underlyingAssetAddress() external view returns (IERC20);
    function redeem(uint256 amount) external;
}
interface IAaveLendingPool {
    function core() external view returns (address);
    function deposit(IERC20 token, uint256 amount, uint16 refCode) external payable;
}






// this is for CHI from 1inch
interface IFreeFromUpTo {
    function freeFromUpTo(address from, uint256 value) external returns (uint256 freed);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}


contract arbCurveFi is DyDxFlashLoan{

  using UniversalERC20 for IERC20;
  using UniswapV2ExchangeLib for IUniswapV2Exchange;

  address public arbOwner;
  address public CurveFiAddress;

  IWETH constant internal weth = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
  IERC20 constant internal dai = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
  IERC20 constant internal usdc = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
  IERC20 constant internal usdt = IERC20(0xdAC17F958D2ee523a2206206994597C13D831ec7);
  IERC20 constant internal tusd = IERC20(0x0000000000085d4780B73119b644AE5ecd22b376);
  IERC20 constant internal busd = IERC20(0x4Fabb145d64652a948d72533023f6E7A623C7C53);
  IERC20 constant internal susd = IERC20(0x57Ab1ec28D129707052df4dF418D58a2D46d5f51);
  IERC20 constant internal pax = IERC20(0x8E870D67F660D95d5be530380D0eC0bd388289E1);
  IERC20 constant internal renbtc = IERC20(0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D);
  IERC20 constant internal wbtc = IERC20(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599);
  IERC20 constant internal tbtc = IERC20(0x1bBE271d15Bb64dF0bc6CD28Df9Ff322F2eBD847);
  IERC20 constant internal hbtc = IERC20(0x0316EB71485b0Ab14103307bf65a021042c6d380);
  IERC20 constant internal sbtc = IERC20(0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6);

  // Curve.fi: sUSD v2 Swap - DAI/USDC/USDT/SUSD - https://www.curve.fi/susdv2/
  address constant internal curveSUSDCAddress = address(0xA5407eAE9Ba41422680e2e00537571bcC53efBfD);
  // Curve.fi: Compound Swap - DAI/USDC - https://www.curve.fi/
  address constant internal curveCompAddress = address(0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56);
  // Curve.fi: USDT Swap - USDT - https://www.curve.fi/
  address constant internal curveUSDTAddress = address(0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C);
  // Curve.fi: y Swap - http://curve.fi/
  address constant internal curveYearnAddress = address(0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51);
  // Curve.fi: BUSD Swap  - BUSD - https://www.curve.fi/busd/
  address constant internal curveBUSDAddress = address(0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27);

  ICurveFiCurve constant internal curveCompound = ICurveFiCurve(0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56);
  ICurveFiCurve constant internal curveUSDT = ICurveFiCurve(0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C);
  ICurveFiCurve constant internal curveY = ICurveFiCurve(0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51);
  ICurveFiCurve constant internal curveBinance = ICurveFiCurve(0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27);
  ICurveFiCurve constant internal curveSynthetix = ICurveFiCurve(0xA5407eAE9Ba41422680e2e00537571bcC53efBfD);
  ICurveFiCurve constant internal curvePAX = ICurveFiCurve(0x06364f10B501e868329afBc005b3492902d6C763);
  ICurveFiCurve constant internal curveRenBTC = ICurveFiCurve(0x93054188d876f558f4a66B2EF1d97d16eDf0895B);
  ICurveFiCurve constant internal curveTBTC = ICurveFiCurve(0x9726e9314eF1b96E45f40056bEd61A088897313E);
  ICurveFiCurve constant internal curveSBTC = ICurveFiCurve(0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714);

  // mStable related
  IMStable constant internal musd = IMStable(0xe2f2a5C287993345a840Db3B0845fbC70f5935a5);
  IMassetValidationHelper constant internal musd_helper = IMassetValidationHelper(0xaBcC93c3be238884cc3309C19Afd128fAfC16911);

  // uniswap v2
  IUniswapV2Factory constant internal uniswapV2 = IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

  // CHI gastoken integration for 1Inch
  IFreeFromUpTo public constant chi = IFreeFromUpTo(0x0000000000004946c0e9F43F4Dee607b0eF1fA1c);


  constructor
  (
    address _curveFi
  )
    public
    payable
  {
    arbOwner = msg.sender;
    (bool success, ) = WETH.call.value(msg.value)("");
    require(success, "fail to get weth");
    require(chi.approve(address(this), uint256(-1)));
    CurveFiAddress = _curveFi;
  }


  modifier onlyOwner () {
    require(msg.sender == arbOwner);
    _;
  }


  modifier discountCHI {
    uint256 gasStart = gasleft();
    _;
    uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
    chi.freeFromUpTo(address(this), (gasSpent + 14154) / 41947);
  }


  event swapFromTo(
    address from,
    address to,
    uint256 amountWei,
    uint _parts,
    uint _flags,
    uint256 returnAmount,
    uint256[] distribution,
    uint256 balance
  );
  event swapToFrom(
    address from,
    address to,
    uint256 amountWei,
    uint _parts,
    uint _flags,
    uint256 returnAmount,
    uint256[] distribution,
    uint256 balance
  );


  function () external payable {}


  // dydx flashloan
  function getFlashloan(
    address _flashToken,
    uint256 _flashAmount,
    address _tradeToken
  )
      public
  {
    uint256 _balanceBefore = IERC20(_flashToken).balanceOf(address(this));
    bytes memory _data = abi.encode(_flashToken, _flashAmount, _balanceBefore, _tradeToken);
    flashloan(_flashToken, _flashAmount, _data); // execution goes to `callFunction`
    // and this point we have succefully paid the dept
  }


  // dydx call back
  function callFunction(
    address, // sender
    Info calldata, // accountInfo
    bytes calldata _data
  )
      external onlyPool
  {
    (
      address flashToken,
      uint256 flashAmount,
      uint256 balanceBefore,
      address tradeToken
    ) = abi.decode(_data, (address, uint256, uint256, address));
    uint256 balanceAfter = IERC20(flashToken).balanceOf(address(this));
    require(balanceAfter - balanceBefore == flashAmount, "contract did not get the loan");

    IERC20 fromTokenTrade = IERC20(flashToken);
    IERC20 toTokenTrade = IERC20(tradeToken);

    doubleSwapOnCurveFi(fromTokenTrade, toTokenTrade, flashAmount); // fial with flashloan
    //_swapOnUniswapV2(fromTokenTrade, toTokenTrade, flashAmount); // Revert message: UniswapV2: LOCKED
    //_swapOnCurveFi(fromTokenTrade, toTokenTrade, flashAmount); // Transaction halted with a RUNTIME ERROR.
    //_swapOnMStableMUSD(fromTokenTrade, toTokenTrade, flashAmount); // Revert message: ReentrancyGuard: reentrant call

    uint256 profit = fromTokenTrade.balanceOf(address(this));
    uint256 toTokenTradeBal = toTokenTrade.balanceOf(address(this));
    fromTokenTrade.transfer(msg.sender, profit);
  }



  function doubleSwapOnCurveFiUniswapv2(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount
  )
    public
  {
    _swapOnCurveFi(fromToken, destToken, amount);
    uint256 destTokenAmount = destToken.balanceOf(address(this));
    //_swapOnUniswapV2ETH(destToken, fromToken, destTokenAmount); // does not work with double - Revert message: UniswapV2: LOCKED
    _swapOnUniswapV2(destToken, fromToken, destTokenAmount); // works with double.
  }



  function doubleSwapOnCurveFi(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount
  )
    public
  {
    _swapOnCurveFi(fromToken, destToken, amount);
    uint256 destTokenAmount = destToken.balanceOf(address(this));
    _swapOnCurveSUSDC(destToken, fromToken, destTokenAmount);
  }


  // this works. DAI->USDT
  function _swapOnCurveFi(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount
  )
    public
  {
    ICurveFiCurve curveY = ICurveFiCurve(CurveFiAddress);

    fromToken.universalApprove(address(curveY), 0);
    //fromToken.universalApprove(address(curveY), amount);
    fromToken.universalApprove(address(curveY), uint256(-1));

    int128 i = (fromToken == dai ? 1 : 0) +
              (fromToken == usdc ? 2 : 0) +
              (fromToken == usdt ? 3 : 0) +
              (fromToken == tusd ? 4 : 0);
    int128 j = (destToken == dai ? 1 : 0) +
              (destToken == usdc ? 2 : 0) +
              (destToken == usdt ? 3 : 0) +
              (destToken == tusd ? 4 : 0);
    if (i == 0 || j == 0) {
      return;
    }

    curveY.exchange_underlying(i - 1, j - 1, amount, 0);
  }

  // works for USDT->DAI
  function _swapOnCurveSUSDC(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount
  )
    public
  {
    ICurveFiCurve curveSUSDC = ICurveFiCurve(curveSUSDCAddress);

    fromToken.universalApprove(address(curveSUSDC), 0);
    //fromToken.universalApprove(address(curveY), amount);
    fromToken.universalApprove(address(curveSUSDC), uint256(-1));

    int128 i = (fromToken == dai ? 1 : 0) +
              (fromToken == usdc ? 2 : 0) +
              (fromToken == usdt ? 3 : 0) +
              (fromToken == tusd ? 4 : 0);
    int128 j = (destToken == dai ? 1 : 0) +
              (destToken == usdc ? 2 : 0) +
              (destToken == usdt ? 3 : 0) +
              (destToken == tusd ? 4 : 0);
    if (i == 0 || j == 0) {
      return;
    }

    curveSUSDC.exchange_underlying(i - 1, j - 1, amount, 0);
  }


  // mStable double swap fail.
  /* function doubleSwapOnMStableMUSD(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount
  )
    public
  {
    _swapOnMStableMUSD(fromToken, destToken, amount);
    uint256 destTokenAmount = destToken.balanceOf(address(this));
    _swapOnMStableMUSD(destToken, fromToken, destTokenAmount);
  } */


  function _swapOnMStableMUSD(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount
  )
    public
  {
    fromToken.universalApprove(address(musd), 0);
    //fromToken.universalApprove(address(musd), amount);
    fromToken.universalApprove(address(musd), uint256(-1));

    musd.swap(
      fromToken,
      destToken,
      amount,
      address(this)
    );
  }



  // uniswap v2 weth mid conversion
  function _swapOnUniswapV2ETH(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount
  )
    public
  {
    _swapOnUniswapV2OverMid(fromToken, weth, destToken, amount);
  }

  function _swapOnUniswapV2OverMid(
    IERC20 fromToken,
    IERC20 midToken,
    IERC20 destToken,
    uint256 amount
  )
    public
  {
    uint256 returnAmount = _swapOnUniswapV2(fromToken, midToken, amount);
    _swapOnUniswapV2(midToken, destToken, returnAmount);
  }

  // uniswap v2 straigt
  function _swapOnUniswapV2(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount
  )
    public
    returns
  (
    uint256 returnAmount
  )
  {
    if (fromToken.isETH()) {
      weth.deposit.value(amount)();
    }

    IERC20 fromTokenReal = fromToken.isETH() ? weth : fromToken;
    IERC20 toTokenReal = destToken.isETH() ? weth : destToken;
    IUniswapV2Exchange exchange = uniswapV2.getPair(fromTokenReal, toTokenReal);
    bool needSync;
    bool needSkim;
    (returnAmount, needSync, needSkim) = exchange.getReturn(fromTokenReal, toTokenReal, amount);
    if (needSync) {
      exchange.sync();
    }
    else if (needSkim) {
      exchange.skim(0x68a17B587CAF4f9329f0e372e3A78D23A46De6b5);
    }

    fromTokenReal.universalApprove(address(exchange), 0);
    //fromTokenReal.universalApprove(address(exchange), amount);
    fromTokenReal.universalApprove(address(exchange), uint256(-1));

    fromTokenReal.universalTransfer(address(exchange), amount);
    if (uint256(address(fromTokenReal)) < uint256(address(toTokenReal))) {
      exchange.swap(0, returnAmount, address(this), "");
    } else {
      exchange.swap(returnAmount, 0, address(this), "");
    }

    if (destToken.isETH()) {
      weth.withdraw(weth.balanceOf(address(this)));
    }
  }












  function withdrawERC20(address tokenAddress) onlyOwner public returns (bool result) {
    IERC20 token = IERC20(tokenAddress);
    token.transfer(msg.sender, token.balanceOf(address(this)));
    return true;
  }


  function withdrawETH() onlyOwner public returns (bool result) {
    msg.sender.transfer(address(this).balance);
    return true;
  }


}
