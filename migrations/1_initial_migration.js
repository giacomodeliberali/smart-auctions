const Migrations = artifacts.require("Migrations");
const LinearStrategy = artifacts.require("LinearStrategy");
const DutchAuction = artifacts.require("DutchAuction");
const VickeryAuction = artifacts.require("VickeryAuction");

module.exports = (deployer, network, accounts) => {
  deployer.deploy(Migrations);
  deployer.deploy(LinearStrategy).then(linearStrategy => {
    deployer.deploy(DutchAuction, "Unit Tests al KG", accounts[0], 100, 1000, 5, linearStrategy.address);
  });
  deployer.deploy(VickeryAuction, "Unit Tests al KG", accounts[0], 5, 5, 5, 1000);
};
