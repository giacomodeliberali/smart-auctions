pragma solidity >=0.4.21 <0.6.0;

import "./HashGenerator.sol";

contract VickeryAuction is HashGenerator {

    // The auction state enum
    enum PhaseType {
        Commitment,
        Withdrawal,
        Opening,
        Closed
    }

    // Represent a bid performed by an address
    struct BlindBid {
        address payable bidder; // The payable address of who submitted the bilind bid
        uint deposit; // The amount of the deposit he put
        uint bidAmount; // The amount of the bid (filled after open)
        bytes32 hash; // The hash of the value concatenated with nonce
        uint nonce; // The nonce used in the hash (filled after open)
        uint refoundedAmount; // The refounded amount after the withdrawal (0 if not requested)
        bool isHashMatching; // Indicate if the submitted nonce matches the hash
        bool isOpened; // Indicate if this bis has already be oepened
        bool exists; // Indicate if this mapping address => BlindBid exists
    }

    // The commitment phase length in blocks
    uint commitmentPhaseLength;

    // The withdrawal phase length in blocks
    uint whithdrawlPhaseLength;

    // The bid phase length in blocks
    uint bidPhaseLangth;

    // The min mandatory deposit to make a commitment
    uint deposit;

    // The block number when this contract is deployed at
    uint deployBlockNumber;

    // The owner of this auction
    address payable owner;

    // Contains the mapping of all the people that make a commitment
    mapping(address => BlindBid) deposits;

    // Contains the addresses of all people that made a commitment
    address[] bidders;

    // The status of the auction
    PhaseType public state;

    // Indicate if this contract has been finalized by the owner
    bool isFinalized;

    // Indicate if there are at least 2 valid bidders in the before the finalize()
    bool haveEnoughBidders;

    // Indicates the number of bidders that opened their bid correctly
    uint validBidders;

    // Indicate that the state of the auction has beemn updated
    event stateUpdatedEvent(PhaseType indexed state);

    // Indicate that a bidder requested his withdrawal
    event withdrawalEvent(address, uint);

    // Indicate that a bidder committed a blind bid
    event BidEvent(address);

    // Indicate that a bidder opened his blind bid
    event openBidEvent(address, uint, uint);

    // Indicate that a bidder submitted the wrong nonce/amount
    event invalidNonceEvent(address, uint, uint);

    // Indicate that the auction has been finalized
    event finalizeEvent(uint);

    // Fired whenever a refound is returned to a bidder
    event refoundEvent(address, uint indexed amount, string);

    // Fired when in finalize there is less than 2 valid bidders
    event notEnoughValidBiddersEvent(uint);

    // Initializ the contract with required parameters
    constructor(uint _commitmentPhaseLength, uint _whithdrawlPhaseLength, uint _bidPhaseLangth, uint _deposit) public {
        commitmentPhaseLength = _commitmentPhaseLength;
        whithdrawlPhaseLength = _whithdrawlPhaseLength;
        bidPhaseLangth = _bidPhaseLangth;
        deposit = _deposit;
        deployBlockNumber = block.number;
        owner = msg.sender;
        state = PhaseType.Commitment;
        isFinalized = false;
        haveEnoughBidders = false;
        validBidders = 0;
    }

    function updateState(PhaseType newstate) private {
        if (state != newstate) {
            state = newstate;
            emit stateUpdatedEvent(state);
        }
    }

    // Ensure that the state property is updated up to the current block.number
    modifier ensureFreshState() {

        require(!isFinalized, "This aution has already been finalized.");

        if (block.number < deployBlockNumber + commitmentPhaseLength) {
            updateState(PhaseType.Commitment);
        } else if (block.number >= deployBlockNumber + commitmentPhaseLength &&
            block.number < deployBlockNumber + commitmentPhaseLength + whithdrawlPhaseLength) {
            updateState(PhaseType.Withdrawal);
        } else if (block.number >= deployBlockNumber + commitmentPhaseLength + whithdrawlPhaseLength &&
            block.number < deployBlockNumber + commitmentPhaseLength + whithdrawlPhaseLength + bidPhaseLangth) {
            updateState(PhaseType.Opening);
        } else {
            updateState(PhaseType.Closed);
        }

        _;
    }

    // Make a blind bid submitting the hash of the amount and the nonce
    function makeBid(bytes32 hash) external ensureFreshState payable {

        require(state == PhaseType.Commitment, "You can not submit bid anymore.");
        require(msg.value >= deposit, "You need to send the deposit.");
        require(!deposits[msg.sender].exists, "You already submitted a bid.");

        // Save it to the mapping
        deposits[msg.sender] = BlindBid({
            deposit: msg.value,
            bidAmount: 0,
            nonce: 0,
            refoundedAmount: 0,
            isHashMatching: false,
            isOpened: false,
            bidder: msg.sender,
            exists: true,
            hash: hash
        });

        // Save in the array to know the existing mapping entries
        bidders.push(msg.sender);

        emit BidEvent(msg.sender);
    }

    // Withdrawal half of your deposit
    function withdrawal() external ensureFreshState payable {

        require(state == PhaseType.Withdrawal, "You can not withdrawal.");
        require(deposits[msg.sender].exists, "You have no deposit.");

        uint refoundedAmount = deposits[msg.sender].deposit / 2;
        deposits[msg.sender].refoundedAmount = refoundedAmount;
        msg.sender.transfer(refoundedAmount);

        emit withdrawalEvent(msg.sender, deposits[msg.sender].refoundedAmount);
    }

    // Open your bid by submitting the valid nonce
    function openBid(uint32 nonce) external ensureFreshState payable {

        require(state == PhaseType.Opening, "You can not open your bid now.");
        require(deposits[msg.sender].exists, "You have no bid.");
        require(!deposits[msg.sender].isOpened, "You already opened your bid.");

        bytes32 calculatedHash = super.generateHash(msg.value, nonce);
        deposits[msg.sender].isHashMatching = calculatedHash == deposits[msg.sender].hash;
        deposits[msg.sender].isOpened = true;

        if(!deposits[msg.sender].isHashMatching){
            // You submitted an invalid hash
            msg.sender.transfer(msg.value);
            emit refoundEvent(msg.sender, msg.value, "Refound msg.value since hash mismatch.");
            emit invalidNonceEvent(msg.sender, msg.value, nonce);
            return;
        }

        deposits[msg.sender].bidAmount = msg.value;
        validBidders += 1;

        emit openBidEvent(msg.sender, nonce, msg.value);
    }

    function finalize() external ensureFreshState payable {

        require(state == PhaseType.Closed, "You can not finalize the auction now.");
        require(msg.sender == owner, "Only the owner can finalize this auction.");

        haveEnoughBidders = true;
        if (validBidders < 2) {
            for (uint i = 0; i < bidders.length; i++) {
                if (deposits[bidders[i]].refoundedAmount == 0) {
                    uint refoundTotal = deposits[bidders[i]].deposit + deposits[bidders[i]].bidAmount;
                    deposits[bidders[i]].bidder.transfer(refoundTotal);
                    emit refoundEvent(deposits[bidders[i]].bidder, refoundTotal, "Not enough bidders.");
                }
            }
            haveEnoughBidders = false;
        }

        if(!haveEnoughBidders){
            // No enough valid bidders. All have been refounded
            emit notEnoughValidBiddersEvent(validBidders);
            return;
        }

        // find the first bidder with a matching hash which has not been refounded with a withdrawal
        address payable maxBidder;
        uint maxBidderAmount;
        uint secondPrice;

        // find winner
        for(uint i = 0; i < bidders.length; i++){
            if(deposits[bidders[i]].isHashMatching && deposits[bidders[i]].refoundedAmount == 0){
                if(maxBidder == address(0x0) || deposits[bidders[i]].bidAmount > maxBidderAmount){
                    maxBidder = deposits[bidders[i]].bidder;
                    maxBidderAmount = deposits[bidders[i]].bidAmount;
                }
            }
        }

        // find second price
        for(uint i = 0; i < bidders.length; i++){
            if(deposits[bidders[i]].isHashMatching && deposits[bidders[i]].refoundedAmount == 0){
                if(deposits[bidders[i]].bidAmount > secondPrice && deposits[bidders[i]].bidAmount < maxBidderAmount){
                   secondPrice = deposits[bidders[i]].bidAmount;
                }
            }
        }

        for(uint i = 0; i < bidders.length; i++){
            if(deposits[bidders[i]].isHashMatching && deposits[bidders[i]].refoundedAmount == 0){
                if(deposits[bidders[i]].bidder == maxBidder){
                   // pay only second price
                   uint totalRefound = deposits[bidders[i]].deposit + (deposits[bidders[i]].bidAmount - secondPrice);
                   maxBidder.transfer(totalRefound);
                   emit refoundEvent(deposits[bidders[i]].bidder, totalRefound, "Refound winning bidder with deposit and second price difference.");
                } else {
                    // refound deposit and commitment
                    uint totalRefound = deposits[bidders[i]].deposit + deposits[bidders[i]].bidAmount;
                    deposits[bidders[i]].bidder.transfer(totalRefound);
                    emit refoundEvent(deposits[bidders[i]].bidder, totalRefound, "Refound loosing bidder with deposit and bid amount.");
                }
            }
        }

        isFinalized = true;

        emit finalizeEvent(validBidders);

    }



}