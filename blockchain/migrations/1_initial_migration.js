var BalanceContract = artifacts.require("./BalanceContract.sol");

module.exports = function (deployer) {
    deployer.deploy(BalanceContract, 30);
};
