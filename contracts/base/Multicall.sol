// SPDX-License-Identifier:MIT
pragma solidity =0.8.15;

// pragma abicoder v2;

// import "../interfaces/IMulticall.sol";

/// @title Multicall
/// @notice Enables calling multiple methods in a single call to the contract
contract Multicall {
    
    /// @param data The encoded function data for each of the calls to make to this contract
    function multicall(bytes[] calldata data) external payable {

        // (bool success, ) = to.call{value: value}(new bytes(0));

        for (uint256 i = 0; i < data.length; i++) {
            
            if(i==0 && msg.value>0){
                (bool success, bytes memory result) = address(this).call{value:msg.value}(data[i]);

                if (!success) {
                    // Next 5 lines from https://ethereum.stackexchange.com/a/83577
                    if (result.length < 68) revert();
                    assembly {
                        result := add(result, 0x04)
                    }
                    revert(abi.decode(result, (string)));
                }
            }else{
                (bool success, bytes memory result) = address(this).call(data[i]);

                if (!success) {
                    // Next 5 lines from https://ethereum.stackexchange.com/a/83577
                    if (result.length < 68) revert();
                    assembly {
                        result := add(result, 0x04)
                    }
                    revert(abi.decode(result, (string)));
                }
            }
 
        }
    }



    function multicall2(address[] memory targets,bytes[] memory datas) external {

        for (uint256 i = 0; i < targets.length; i++) {
         
            (bool success, bytes memory result) = targets[i].call(datas[i]);
           

                if (!success) {
                    // Next 5 lines from https://ethereum.stackexchange.com/a/83577
                    if (result.length < 68) revert();
                    assembly {
                        result := add(result, 0x04)
                    }
                    revert(abi.decode(result, (string)));
                }
        }
    }
}
