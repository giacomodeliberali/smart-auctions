pragma solidity >=0.4.21 <0.6.0;

contract HashGenerator {
    
    function generateHash(uint amount, uint32 nonce) public pure returns(bytes32){
        return keccak256(bytes(string(abi.encodePacked(amount, nonce))));
    }
    
}