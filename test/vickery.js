const truffleAssert = require('truffle-assertions');
const advanceBlock = require('truffle-test-helpers').advanceBlock;

const VickeryAuction = artifacts.require("VickeryAuction");

var PhaseType = {
  Commitment: 0,
  Withdrawal: 1,
  Opening: 2,
  Closed: 3
}

contract("VickeryAuction", accounts => {

  var vickeryAuction;
  var phasesLength = 5;
  var minDeposit = "1000000000000000000"; // 1 eth

  beforeEach(async () => {
    vickeryAuction = await VickeryAuction.new(phasesLength, phasesLength, phasesLength, minDeposit);
  });

  it("Should be deployed correctly in Commitment phase", async () => {
    assert.equal(
      await vickeryAuction.state(),
      PhaseType.Commitment,
      "Should be in Commitment phase"
    );
  });

  it("Should only allow makeBid", async () => {

    await truffleAssert.reverts(
      vickeryAuction.withdrawal({ from: accounts[1] }),
      null,
      "Should revert withdrawal while in commitment"
    );

    await truffleAssert.reverts(
      vickeryAuction.openBid("0x12345", { from: accounts[1] }),
      null,
      "Should revert openBid while in commitment"
    );

    await truffleAssert.reverts(
      vickeryAuction.finalize({ from: accounts[0] }),
      null,
      "Should revert finalize while in commitment"
    );

  });

  it("Should check deposit in makeBid", async () => {

    var hash = await vickeryAuction.generateHash(10000, 12345, { from: accounts[1] });

    await truffleAssert.reverts(
      vickeryAuction.makeBid(hash, { from: accounts[1], value: 50 }),
      null,
      "Should throw since deposit is insufficient"
    );

  });

  it("Should ensure only one commitment is made by same address", async () => {

    var hash = await vickeryAuction.generateHash(10000, 12345, { from: accounts[1] });
    await vickeryAuction.makeBid(hash, { from: accounts[1], value: minDeposit });

    var hash1 = await vickeryAuction.generateHash(100000, 12345, { from: accounts[1] });
    await truffleAssert.reverts(
      vickeryAuction.makeBid(hash1, { from: accounts[1], value: minDeposit }),
      null,
      "Should throw since duplicate"
    );

  });

  it("Should accept bids", async () => {


    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];
    let user4 = accounts[4];

    // user1
    let hash = await vickeryAuction.generateHash("10000000000000000000", 12345, { from: user1 });
    let tx = await vickeryAuction.makeBid(hash, { from: user1, value: minDeposit });
    truffleAssert.eventEmitted(tx, 'BidEvent');

    // user2
    hash = await vickeryAuction.generateHash("20000000000000000000", 12345, { from: user2 });
    tx = await vickeryAuction.makeBid(hash, { from: user2, value: minDeposit });
    truffleAssert.eventEmitted(tx, 'BidEvent');


    // user3
    hash = await vickeryAuction.generateHash("30000000000000000000", 12345, { from: user3 });
    tx = await vickeryAuction.makeBid(hash, { from: user3, value: minDeposit });
    truffleAssert.eventEmitted(tx, 'BidEvent');

    // user4
    hash = await vickeryAuction.generateHash("40000000000000000000", 12345, { from: user4 });
    tx = await vickeryAuction.makeBid(hash, { from: user4, value: minDeposit });
    truffleAssert.eventEmitted(tx, 'BidEvent');

    // simulate change state
    await advanceBlock();

    let initialBalance = await web3.eth.getBalance(user3);

    tx = await vickeryAuction.withdrawal({ from: user3 });
    truffleAssert.eventEmitted(tx, 'withdrawalEvent');

    let refundedBalance = await web3.eth.getBalance(user3);

    assert.equal(
      initialBalance < refundedBalance,
      true,
      "Should have refunded half deposit"
    );

    await advanceBlock();
    await advanceBlock();
    await advanceBlock();
    await advanceBlock();

    tx = await vickeryAuction.openBid(12345, { from: user1, value: "10000000000000000000" });
    truffleAssert.eventEmitted(tx, 'openBidEvent');

    // wrong nonce
    tx = await vickeryAuction.openBid(666, { from: user2, value: "20000000000000000000" });
    truffleAssert.eventNotEmitted(tx, 'openBidEvent');
    truffleAssert.eventEmitted(tx, 'invalidNonceEvent');
    await truffleAssert.reverts(
      vickeryAuction.openBid(12345, { from: user2, value: "20000000000000000000" }),
      null,
      "Should throw since already opened"
    );

    tx = await vickeryAuction.openBid(12345, { from: user4, value: "40000000000000000000" });
    truffleAssert.eventEmitted(tx, 'openBidEvent');

    await advanceBlock();

    tx = await vickeryAuction.finalize();
    truffleAssert.eventEmitted(tx, 'finalizeEvent');
    //truffleAssert.eventEmitted(tx, 'refoundEvent', { amount: 31000000000000000000 });
    //truffleAssert.eventEmitted(tx, 'refoundEvent', { amount: 11000000000000000000 });
    truffleAssert.eventEmitted(tx, 'refoundEvent', evt => {
      let refundAmount = evt.amount.toString();
      // refund must be 11 eth and 31 eth
      return refundAmount == "31000000000000000000" || refundAmount == "11000000000000000000";
    });

    let balanceUser1 = Number((await web3.eth.getBalance(user1)).toString().substring(0,2));
    let balanceUser2 = Number((await web3.eth.getBalance(user2)).toString().substring(0,2));
    let balanceUser3 = Number((await web3.eth.getBalance(user3)).toString().substring(0,2));
    let balanceUser4 = Number((await web3.eth.getBalance(user4)).toString().substring(0,2));

     assert.equal(
      balanceUser1 < balanceUser3,
      true,
      "Should have spent few more than an eth"
    );

    assert.equal(
      balanceUser2 < balanceUser3,
      true,
      "Should have spent few more than an eth"
    );

    assert.equal(
      balanceUser4 < balanceUser1 && balanceUser4 < balanceUser2 && balanceUser4 < balanceUser2,
      true,
      "Should have spent less than an eth (withdrawal)"
    );

  });

  it("Should refund all if not enough bidders", async () => {


    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];
    let user4 = accounts[4];

    // user1
    let hash = await vickeryAuction.generateHash("10000000000000000000", 12345, { from: user1 });
    let tx = await vickeryAuction.makeBid(hash, { from: user1, value: minDeposit });
    truffleAssert.eventEmitted(tx, 'BidEvent');

    // user2
    hash = await vickeryAuction.generateHash("20000000000000000000", 12345, { from: user2 });
    tx = await vickeryAuction.makeBid(hash, { from: user2, value: minDeposit });
    truffleAssert.eventEmitted(tx, 'BidEvent');


    // user3
    hash = await vickeryAuction.generateHash("30000000000000000000", 12345, { from: user3 });
    tx = await vickeryAuction.makeBid(hash, { from: user3, value: minDeposit });
    truffleAssert.eventEmitted(tx, 'BidEvent');

    // user4
    hash = await vickeryAuction.generateHash("40000000000000000000", 12345, { from: user4 });
    tx = await vickeryAuction.makeBid(hash, { from: user4, value: minDeposit });
    truffleAssert.eventEmitted(tx, 'BidEvent');

    // simulate change state
    await advanceBlock();
    await advanceBlock();
    await advanceBlock();
    await advanceBlock();
    await advanceBlock();
    await advanceBlock();

    tx = await vickeryAuction.openBid(12345, { from: user1, value: "10000000000000000000" });
    truffleAssert.eventEmitted(tx, 'openBidEvent');

    // wrong nonce
    tx = await vickeryAuction.openBid(666, { from: user2, value: "20000000000000000000" });
    truffleAssert.eventNotEmitted(tx, 'openBidEvent');
    truffleAssert.eventEmitted(tx, 'invalidNonceEvent');

    tx = await vickeryAuction.openBid(666, { from: user4, value: "40000000000000000000" });
    truffleAssert.eventNotEmitted(tx, 'openBidEvent');
    truffleAssert.eventEmitted(tx, 'invalidNonceEvent');

    await advanceBlock();

    let balance = await web3.eth.getBalance(user1);
    tx = await vickeryAuction.finalize();
    truffleAssert.eventNotEmitted(tx, 'finalizeEvent');
    truffleAssert.eventEmitted(tx, 'notEnoughValidBiddersEvent');
    let newBalance = await web3.eth.getBalance(user1);

    assert.equal(
      newBalance > balance,
      true,
      "Should have been refunded"
    );

  });

});