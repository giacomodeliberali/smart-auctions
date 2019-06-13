const truffleAssert = require('truffle-assertions');
const DutchAuction = artifacts.require("DutchAuction");
const LinearStrategy = artifacts.require("LinearStrategy");

contract("DutchAuction", accounts => {

  var linearStrategy;
  var dutchAuction;

  beforeEach(async () => {
    linearStrategy = await LinearStrategy.new();
    dutchAuction = await DutchAuction.new(100, 1000, 5, linearStrategy.address);
  });

  it("Should be deployed correctly", async () => {
    assert.equal(
      await dutchAuction.isClosed(),
      false,
      "Should be opened"
    );
  });

  it("Should not be terminated by someone who is not the owner", async () => {
    await dutchAuction.terminate({ from: accounts[1] })
    assert.equal(
      await dutchAuction.isClosed(),
      false,
      "Should remain opened"
    );
  });

  it("Should be terminated by the owner", async () => {
    await dutchAuction.terminate({ from: accounts[0] })
    assert.equal(
      await dutchAuction.isClosed(),
      true,
      "Should be closed #2"
    );
  });

  it("Should reject invalid bids", async () => {

    var currentPrice = await dutchAuction.getCurrentPrice();

    await truffleAssert.reverts(
      dutchAuction.makeBid({ from: accounts[1], value: currentPrice - 1 }),
      null,
      "Should revert wrong price"
    );

  });

  it("Should accept valid bids", async () => {

    var currentPrice = await dutchAuction.getCurrentPrice();
    var result = await dutchAuction.makeBid({ from: accounts[1], value: currentPrice + 1 });

    assert.equal(
      result.logs[0].event,
      "hasBidder",
      "Should accept the valid bid"
    );

    assert.equal(
      await dutchAuction.isClosed(),
      true,
      "Should be closed after last bid"
    );
  });

  it("Should accept first valid bid", async () => {

    var currentPrice = await dutchAuction.getCurrentPrice();
    var result = await dutchAuction.makeBid({ from: accounts[1], value: currentPrice + 1 });
    
    assert.equal(
      await dutchAuction.isClosed(),
      true,
      "Should be closed after first bid"
    );

    await truffleAssert.reverts(
      dutchAuction.makeBid({ from: accounts[2], value: currentPrice + 2 }),
      null,
      "Should not accept this bid"
    );

    assert.equal(
      result.logs[0].event,
      "hasBidder",
      "Should accept the first bid"
    );
  });


});