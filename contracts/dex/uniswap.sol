// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.6;
pragma abicoder v2;

import "../libraries/TransferHelper.sol";
import "./ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
interface IUniswapRouter is ISwapRouter {
    function refundETH() external payable;
}
library Uniswap {
    // For the scope of these swap examples,
    // we will detail the design considerations when using
    // `exactInput`, `exactInputSingle`, `exactOutput`, and  `exactOutputSingle`.

    // It should be noted that for the sake of these examples, we purposefully pass in the swap router instead of inherit the swap router for simplicity.
    // More advanced example contracts will detail how to inherit the swap router safely.
    event SwapEthToUsdc(address indexed sender,uint amountIn,uint amountOut,uint refundEth);
    // ISwapRouter public immutable swapRouter;
    IUniswapRouter public constant swapRouter =
        IUniswapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    // This example swaps DAI/WETH9 for single path swaps and DAI/USDC/WETH9 for multi path swaps.

    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant WETH9 = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6; //geoli
    // address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C;
    // address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;//mainet

    // For this example, we will set the pool fee to 0.3%.
    uint24 public constant poolFee = 3000;

 

    

    /// @notice swapExactInputSingle swaps a fixed amount of DAI for a maximum possible amount of WETH9
    /// using the DAI/WETH9 0.3% pool by calling `exactInputSingle` in the swap router.
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its DAI for this function to succeed.
    /// @param amountIn The exact amount of DAI that will be swapped for WETH9.
    /// @return amountOut The amount of WETH9 received.
    function swapExactInputSingle(uint256 amountIn)
        external
        returns (uint256 amountOut)
    {
        // msg.sender must approve this contract

        // Approve the router to spend DAI.
        TransferHelper.approve(USDC, address(this), amountIn);

        // Transfer the specified amount of DAI to this contract.
        TransferHelper.safeTransferFrom(
            USDC,
            msg.sender,
            address(this),
            amountIn
        );

        // Approve the router to spend DAI.
        TransferHelper.approve(USDC, address(swapRouter), amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: USDC,
                tokenOut: WETH9,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    }

    /// @notice swapExactOutputSingle swaps a minimum possible amount of DAI for a fixed amount of WETH.
    /// @dev The calling address must approve this contract to spend its DAI for this function to succeed. As the amount of input DAI is variable,
    /// the calling address will need to approve for a slightly higher amount, anticipating some variance.
    /// @param amountOut The exact amount of WETH9 to receive from the swap.
    /// @param amountInMaximum The amount of DAI we are willing to spend to receive the specified amount of WETH9.
    /// @return amountIn The amount of DAI actually spent in the swap.
    function swapExactOutputSingle(uint256 amountOut, uint256 amountInMaximum)
        external
        returns (uint256 amountIn)
    {
        // Transfer the specified amount of DAI to this contract.
        TransferHelper.safeTransferFrom(
            USDC,
            msg.sender,
            address(this),
            amountInMaximum
        );

        // Approve the router to spend the specifed `amountInMaximum` of DAI.
        // In production, you should choose the maximum amount to spend based on oracles or other data sources to acheive a better swap.
        TransferHelper.approve(USDC, address(swapRouter), amountInMaximum);

        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter
            .ExactOutputSingleParams({
                tokenIn: USDC,
                tokenOut: WETH9,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                sqrtPriceLimitX96: 0
            });

        // Executes the swap returning the amountIn needed to spend to receive the desired amountOut.
        amountIn = swapRouter.exactOutputSingle(params);

        // For exact output swaps, the amountInMaximum may not have all been spent.
        // If the actual amount spent (amountIn) is less than the specified maximum amount, we must refund the msg.sender and approve the swapRouter to spend 0.
        if (amountIn < amountInMaximum) {
            TransferHelper.approve(USDC, address(swapRouter), 0);
            TransferHelper.safeTransfer(
                USDC,
                msg.sender,
                amountInMaximum - amountIn
            );
                
        }
    }

 


 

  ///      uint24 FeeAmount = 10000;3000;500
  /// tokenIn tokenOut fee => pool
  function exactOutputSingleETH(address to, address tokenOut, uint256 amountOut,uint24 FeeAmount)
        external
        //payable library cannot be payable
        returns (uint256 amountIn)
    { 
        require(amountOut > 0, "tokenOut amount 0");
        require(msg.value > 0, "ETH amount 0");

        uint256 amountInMax = msg.value;
        
        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter
            .ExactOutputSingleParams({
                tokenIn: WETH9,
                tokenOut: tokenOut,
                fee: FeeAmount,
                recipient: to,//msg.sender,
                deadline: block.timestamp+15,
                amountOut: amountOut,
                amountInMaximum: amountInMax,
                sqrtPriceLimitX96: 0
            });

        // Executes the swap returning the amountIn needed to spend to receive the desired amountOut.
        //amountIn = swapRouter.exactOutputSingle(params);
        amountIn = swapRouter.exactOutputSingle{ value: amountInMax}(params);

        // For exact output swaps, the amountInMaximum may not have all been spent.
        // If the actual amount spent (amountIn) is less than the specified maximum amount, we must refund the msg.sender and approve the swapRouter to spend 0.
        uint diffIn = amountInMax -amountIn;
        if (diffIn > 0) {
            swapRouter.refundETH();
            // // refund leftover ETH to user
             TransferHelper.transferETH(to, diffIn);//msg.sender
        }

        emit SwapEthToUsdc(msg.sender,amountInMax,amountOut,diffIn);
    }

  /// uint24 FeeAmount = 10000;3000;500
  /// tokenIn tokenOut fee => pool
  /// tokenOut usdt usdc
  function exactInputSingleETH(address to, address tokenOut, uint24 FeeAmount)
        external
        //payable library cannot be payable
        returns (uint256 amountOut)
    { 
        require(msg.value > 0, "ETH amount 0");
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: WETH9,
                tokenOut: tokenOut,
                fee: FeeAmount,
                recipient: to,//msg.sender, sender is contract if a contract call
                deadline: block.timestamp+15,
                amountIn: msg.value,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle{ value: msg.value}(params);

        //emit SwapEthToUsdc(msg.sender,amountInMax,amountOut,diffIn);
    }

      // important to receive ETH
    //receive() payable external {}
}
