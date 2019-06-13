const Migrations = artifacts.require("Migrations");
const LinearStrategy = artifacts.require("LinearStrategy");
const DutchAuction = artifacts.require("DutchAuction");
const VickeryAuction = artifacts.require("VickeryAuction");

module.exports = (deployer) => {
  deployer.deploy(Migrations);
  deployer.deploy(LinearStrategy).then(linearStrategy => {
    deployer.deploy(DutchAuction, 100, 1000, 5, linearStrategy.address);
  });
  deployer.deploy(VickeryAuction, 5, 5, 5, 1000);
};
