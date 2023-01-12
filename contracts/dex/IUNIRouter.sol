// SPDX-License-Identifier: MIT
pragma solidity =0.8.15;

import "../dex/ISwapRouter.sol";
interface IUNIRouter is ISwapRouter {
    function refundETH() external payable;
}