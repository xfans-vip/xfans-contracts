//SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    //0x2e1a7d4d
    function withdraw(uint) external;
}
