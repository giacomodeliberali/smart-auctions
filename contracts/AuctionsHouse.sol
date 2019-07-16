pragma solidity >= 0.4 .21 < 0.6 .0;

import "./dutch/DutchAuction.sol";
import "./vickery/VickeryAuction.sol";
import "./dutch/LinearStrategy.sol";

contract AuctionsHouse {

    // The owner of this house
    address public owner;

    /// Create a new instance    
    constructor() public {  
        owner = msg.sender;
    }

    event NewAuction(address);


    // Create a new DutchAuction
    function newDutch(string calldata _itemName, address payable _seller, uint _reservePrice, uint _initialPrice, uint _lastForBlocks, IDecrease _strategy) external {
       
        DutchAuction auction = new DutchAuction(
            _itemName, _seller,
            _reservePrice, _initialPrice,
            _lastForBlocks, _strategy
        );

        emit NewAuction(address(auction));
    }

    // Create a new VickeryAuction
    function newVickery(string calldata _itemName, address payable _seller,
                uint _commitmentPhaseLength, uint _whithdrawlPhaseLength,
                uint _bidPhaseLangth, uint _deposit) external {
        
        VickeryAuction auction = new VickeryAuction(
            _itemName, _seller,
            _commitmentPhaseLength, _whithdrawlPhaseLength,
            _bidPhaseLangth, _deposit
        );

        emit NewAuction(address(auction));
    }

}