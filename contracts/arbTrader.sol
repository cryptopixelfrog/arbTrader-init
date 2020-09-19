//pragma solidity ^0.5.0;
pragma solidity >=0.4.22 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./dydx/DyDxFlashloan.sol";
import "./1inch/IOneProto.sol";
import "./1inch/IOneProto.sol";



library UniversalERC20 {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 private constant ZERO_ADDRESS = IERC20(0x0000000000000000000000000000000000000000);
    IERC20 private constant ETH_ADDRESS = IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    function universalTransfer(IERC20 token, address to, uint256 amount) internal returns(bool) {
        if (amount == 0) {
            return true;
        }

        if (isETH(token)) {
            address(uint160(to)).transfer(amount);
        } else {
            token.safeTransfer(to, amount);
            return true;
        }
    }

    function universalTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        if (amount == 0) {
            return;
        }

        if (isETH(token)) {
            require(from == msg.sender && msg.value >= amount, "Wrong useage of ETH.universalTransferFrom()");
            if (to != address(this)) {
                address(uint160(to)).transfer(amount);
            }
            if (msg.value > amount) {
                msg.sender.transfer(msg.value.sub(amount));
            }
        } else {
            token.safeTransferFrom(from, to, amount);
        }
    }

    function universalTransferFromSenderToThis(IERC20 token, uint256 amount) internal {
        if (amount == 0) {
            return;
        }

        if (isETH(token)) {
            if (msg.value > amount) {
                // Return remainder if exist
                msg.sender.transfer(msg.value.sub(amount));
            }
        } else {
            token.safeTransferFrom(msg.sender, address(this), amount);
        }
    }

    function universalApprove(IERC20 token, address to, uint256 amount) internal {
        if (!isETH(token)) {
            if (amount == 0) {
                token.safeApprove(to, 0);
                return;
            }

            uint256 allowance = token.allowance(address(this), to);
            if (allowance < amount) {
                if (allowance > 0) {
                    token.safeApprove(to, 0);
                }
                token.safeApprove(to, amount);
            }
        }
    }

    function universalBalanceOf(IERC20 token, address who) internal view returns (uint256) {
        if (isETH(token)) {
            return who.balance;
        } else {
            return token.balanceOf(who);
        }
    }

    function universalDecimals(IERC20 token) internal view returns (uint256) {

        if (isETH(token)) {
            return 18;
        }

        (bool success, bytes memory data) = address(token).staticcall.gas(10000)(
            abi.encodeWithSignature("decimals()")
        );
        if (!success || data.length == 0) {
            (success, data) = address(token).staticcall.gas(10000)(
                abi.encodeWithSignature("DECIMALS()")
            );
        }

        return (success && data.length > 0) ? abi.decode(data, (uint256)) : 18;
    }

    function isETH(IERC20 token) internal pure returns(bool) {
        return (address(token) == address(ZERO_ADDRESS) || address(token) == address(ETH_ADDRESS));
    }

    function notExist(IERC20 token) internal pure returns(bool) {
        return (address(token) == address(-1));
    }
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


contract arbTrader is DyDxFlashLoan{

  using UniversalERC20 for IERC20;

  address public arbOwner;
  address public OneProtoAddress;

  // CHI gastoken integration for 1Inch
  IFreeFromUpTo public constant chi = IFreeFromUpTo(0x0000000000004946c0e9F43F4Dee607b0eF1fA1c);

  constructor
  (
    address _oneProto
  )
    public
    payable
  {
    arbOwner = msg.sender;
    (bool success, ) = WETH.call.value(msg.value)("");
    require(success, "fail to get weth");
    require(chi.approve(address(this), uint256(-1)));
    OneProtoAddress = _oneProto;
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
    address _tradeToken,
    uint _parts,
    uint _flags,
    uint256 returnAmount,
    uint256[] memory distribution,
    uint _endFlags,
    uint256 endReturnAmount,
    uint256[] memory endDistribution
  )
      public
      discountCHI
  {
    uint256 _balanceBefore = IERC20(_flashToken).balanceOf(address(this));
    bytes memory _data = abi.encode(_flashToken, _flashAmount, _balanceBefore, _tradeToken, _parts, _flags, returnAmount, distribution, _endFlags, endReturnAmount, endDistribution);
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
      address tradeToken,
      uint parts,
      uint flags,
      uint256 returnAmount,
      uint256[] memory distribution,
      uint _endFlags,
      uint256 endReturnAmount,
      uint256[] memory endDistribution
    ) = abi.decode(_data, (address, uint256, uint256, address, uint, uint, uint256, uint256[], uint, uint256, uint256[]));
    uint256 balanceAfter = IERC20(flashToken).balanceOf(address(this));
    require(balanceAfter - balanceBefore == flashAmount, "contract did not get the loan");
    trade(flashToken, tradeToken, flashAmount, parts, flags, returnAmount, distribution, _endFlags, endReturnAmount, endDistribution);
  }



  function trade(
    address from,
    address to,
    uint256 amountWei,
    uint _parts,
    uint _flags,
    uint256 returnAmount,
    uint256[] memory distribution,
    uint _endFlags,
    uint256 endReturnAmount,
    uint256[] memory endDistribution
  )
    public
    discountCHI
  {
    // first swap from -> to
    _swapFromTo(from, to, amountWei, _parts, _flags, returnAmount, distribution);

    // second swap to -> from
    IERC20 toIERC20 = IERC20(to);
    uint256 toFromAmount = toIERC20.balanceOf(address(this));

    _swapToFrom(to, from, toFromAmount, _parts, _endFlags, endReturnAmount, endDistribution);
  }


  function _swapFromTo(
    address from,
    address to,
    uint256 amountWei,
    uint _parts,
    uint _flags,
    uint256 returnAmount,
    uint256[] memory distribution
  )
    public
    discountCHI
  {
    IERC20 fromIERC20 = IERC20(from);
    IERC20 toIERC20 = IERC20(to);

    // If returnAmount is set to 0(null) or distribution is set to [](null),
    // then use returnAmountBk or distributionBkfrom backup.
    // This looks stupid, but way of save extra gas.
    if(returnAmount == 0 || distribution.length == 0){
      (uint256 returnAmountFromBk, uint256[] memory distributionFromBk) = IOneProto(OneProtoAddress).getExpectedReturn(
          fromIERC20,
          toIERC20,
          amountWei,
          _parts,
          _flags
      );
      if(returnAmount == 0){
        returnAmount = returnAmountFromBk;
      }
      if(distribution.length == 0){
        distribution = distributionFromBk;
      }
    }

    fromIERC20.universalApprove(OneProtoAddress, 0);
    //fromIERC20.universalApprove(OneProtoAddress, amountWei);
    fromIERC20.universalApprove(OneProtoAddress, uint256(-1));

    IOneProto(OneProtoAddress).swap(
        fromIERC20,
        toIERC20,
        amountWei,
        returnAmount,
        distribution,
        _flags
    );

    emit swapFromTo(
      from,
      to,
      amountWei,
      _parts,
      _flags,
      returnAmount,
      distribution,
      toIERC20.balanceOf(address(this))
    );

  }


  function _swapToFrom(
    address from,
    address to,
    uint256 amountWei,
    uint _parts,
    uint flags,
    uint256 returnAmount,
    uint256[] memory distribution
  )
    public
    discountCHI
  {
    IERC20 fromIERC20 = IERC20(from);
    IERC20 toIERC20 = IERC20(to);

    // If returnAmount is set to 0(null) or distribution is set to [](null),
    // then use returnAmountBk or distributionBkfrom backup.
    // This looks stupid, but way of save extra gas.
    if(returnAmount == 0 || distribution.length == 0){
      (uint256 returnAmountBk, uint256[] memory distributionBk) = IOneProto(OneProtoAddress).getExpectedReturn(
          fromIERC20,
          toIERC20,
          amountWei,
          _parts,
          flags
      );
      if(returnAmount == 0){
        returnAmount = returnAmountBk;
      }
      if(distribution.length == 0){
        distribution = distributionBk;
      }
    }

    fromIERC20.universalApprove(OneProtoAddress, 0);
    //fromIERC20.universalApprove(OneProtoAddress, amountWei);
    fromIERC20.universalApprove(OneProtoAddress, uint256(-1));

    IOneProto(OneProtoAddress).swap(
        fromIERC20,
        toIERC20,
        amountWei,
        returnAmount,
        distribution,
        flags
    );

    emit swapToFrom(
      from,
      to,
      amountWei,
      _parts,
      flags,
      returnAmount,
      distribution,
      toIERC20.balanceOf(address(this))
    );
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
