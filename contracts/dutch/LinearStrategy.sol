pragma solidity >=0.4.21 <0.6.0;

import "./IDecrease.sol";

contract LinearStrategy is IDecrease {
    
    function getPrice(uint initialAmount, uint reservePrice, uint start, uint end, uint currentBlockNumber) pure external returns(uint){
        
        require(currentBlockNumber <= end);
        require(start < end);
        
        uint blocks = end - start;
        
        uint decreasePerBlock = (initialAmount - reservePrice) / blocks;
        
        uint elapsedBlocks = currentBlockNumber - start;
        
        return initialAmount - elapsedBlocks*decreasePerBlock;
    }
    
}