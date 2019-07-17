pragma solidity >= 0.4 .21 < 0.6 .0;

import "./dutch/DutchAuction.sol";
import "./vickery/VickeryAuction.sol";
import "./dutch/LinearStrategy.sol";
import "./AbstractAuction.sol";

contract AuctionsHouse {

    // The owner of this house
    address public owner;

    address[] public auctions;

    /// Create a new instance    
    constructor() public { 
        owner = msg.sender;
    }

    event NewAuction(address, string, string);

    function getAuctions() external view returns(address[] memory) {
        return auctions;
    }

    function getAuctionsCount() external view returns(uint) {
        return auctions.length;
    }

    // Create a new DutchAuction
    function newDutch(
            string calldata _itemName,
            address payable _seller,
            uint _reservePrice,
            uint _initialPrice,
            uint _lastForBlocks,
            IDecrease _strategy
        ) external returns(address) {
       
        DutchAuction auction = new DutchAuction(
            _itemName, _seller,
            _reservePrice, _initialPrice,
            _lastForBlocks, _strategy
        );

        auctions.push(address(auction));

        emit NewAuction(address(auction), "Dutch", _itemName);

        return address(auction);
    }

    // Create a new VickeryAuction
    function newVickery(string calldata _itemName, address payable _seller,
                uint _commitmentPhaseLength, uint _whithdrawlPhaseLength,
                uint _bidPhaseLangth, uint _deposit) external returns(address) {
        
        VickeryAuction auction = new VickeryAuction(
            _itemName, _seller,
            _commitmentPhaseLength, _whithdrawlPhaseLength,
            _bidPhaseLangth, _deposit
        );
        
        auctions.push(address(auction));

        emit NewAuction(address(auction), "Vickery", _itemName);

        return address(auction);
    }

}