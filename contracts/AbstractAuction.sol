pragma solidity >= 0.4 .21 < 0.6 .0;

contract AbstractAuction {

    // The owner of this auction
    address payable public owner;

    // The seller of this auction
    address payable public seller;

    // The item that we are selling
    string public itemName;

    // The auction type
    string public auctionType;

    bool public isOver;


    /// Create a new instance    
    constructor(string memory _itemName, address payable _seller, address payable _owner, string memory _type) public {
        
        itemName = _itemName;
        seller = _seller;
        auctionType = _type;
        owner = _owner;
        isOver = false;
    }


    // Terminate this auction (only the owner can call this function)
    function terminate() external {
        if (msg.sender == owner || msg.sender == seller) {
            isOver = true;
        }
    }

}