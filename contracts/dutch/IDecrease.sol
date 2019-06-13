pragma solidity >=0.4.21 <0.6.0;

interface IDecrease {
    function getPrice(uint initialAmount, uint reservePrice, uint start, uint end, uint currentBlockNumber) pure external returns(uint);
}