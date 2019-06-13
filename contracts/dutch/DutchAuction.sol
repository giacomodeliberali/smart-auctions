pragma solidity >= 0.4 .21 < 0.6 .0;

import "./IDecrease.sol";

contract DutchAuction {
    // The address of the winning bidder
    address bidder;

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

    // The owner of this auction
    address payable public owner;

    // Indicate if this auction has been closed by the owner
    bool isClosedByOwner;

    // Indicate if the reserve price has been reached
    bool isReservePriceReached;

    // Fired when the bidder submits the winning bid
    event hasBidder(address, uint, uint);

    /// Create a new instance    
    constructor(uint _reservePrice, uint _initialPrice, uint _lastForBlocks, IDecrease _strategy) public {
        reservePrice = _reservePrice;
        initialPrice = _initialPrice;
        lastForBlocks = _lastForBlocks;
        strategy = _strategy;
        deployBlockNumber = block.number;
        isClosedByOwner = false;
        isReservePriceReached = false;
        owner = msg.sender;
    }

    // Indicate if this auction is still open or not
    function isClosed() public view returns(bool) {

        if(isClosedByOwner)
            return true;

        if(block.number >= (deployBlockNumber + lastForBlocks))
            return true;
            
        if(isReservePriceReached)
            return true;

        if(bidder != address(0x0))
            return true;

        return false;
    }

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
            owner.transfer(msg.value);
            emit hasBidder(msg.sender, currentPrice, msg.value);
        }
    }

    // Terminate this auction (only the owner can call this function)
    function terminate() external {
        if (msg.sender == owner) {
            isClosedByOwner = true;
        }
    }

}