pragma solidity >= 0.4 .21 < 0.6 .0;

import "./IDecrease.sol";
import "../AbstractAuction.sol";

contract DutchAuction is AbstractAuction {
    // The address of the winning bidder
    address public bidder;

    // The initial price
    uint initialPrice;

    // The reserve price
    uint reservePrice;

    // The block number when this contract is deployed
    uint deployBlockNumber;

    // The number of blocks after deployBlockNumber for which this auction will be open
    uint lastForBlocks;

    // The decrease price strategy
    IDecrease strategy;

    // Indicate if this auction has been closed by the seller
    bool isClosedBySeller;

    // Indicate if the reserve price has been reached
    bool isReservePriceReached;

    // Fired when the bidder submits the winning bid
    event HasBidderEvent(address, uint, uint);

    /// Create a new instance    
    constructor(string memory _itemName, address payable _seller, uint _reservePrice, uint _initialPrice, uint _lastForBlocks, IDecrease _strategy) 
    AbstractAuction(_itemName, _seller, msg.sender, "Dutch") public {
        reservePrice = _reservePrice;
        initialPrice = _initialPrice;
        lastForBlocks = _lastForBlocks;
        strategy = _strategy;
        deployBlockNumber = block.number;
        isClosedBySeller = false;
        isReservePriceReached = false;        
    }

    // Indicate if this auction is still open or not
    function isClosed() public view returns(bool) {

        if(isOver)
            return true;

        if(isClosedBySeller)
            return true;

        if(block.number >= (deployBlockNumber + lastForBlocks))
            return true;
            
        if(isReservePriceReached)
            return true;

        if(bidder != address(0x0))
            return true;

        return false;
    }

    // Return the current price of the good
    function getCurrentPrice() public view returns(uint){
        return strategy.getPrice(initialPrice, reservePrice, deployBlockNumber, deployBlockNumber + lastForBlocks, block.number);
    }

    // Make a bid request
    function makeBid() payable external {
        require(!isClosed(), "This auction is closed.");

        uint currentPrice = getCurrentPrice();

        if (currentPrice < reservePrice) {
            isReservePriceReached = true;
            msg.sender.transfer(msg.value); // Refound the last bidder and close the auction
        } else {
            require(msg.value >= currentPrice, "You need to send more wei.");
            bidder = msg.sender;
            seller.transfer(msg.value);
            emit HasBidderEvent(msg.sender, currentPrice, msg.value);
        }
    }

    // Terminate this auction (only the seller can call this function)
    function terminate() external {
        if (msg.sender == owner || msg.sender == seller) {
            isClosedBySeller = true;
        }
    }

}