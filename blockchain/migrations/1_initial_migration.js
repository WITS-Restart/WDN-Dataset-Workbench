var DifferentialContract = artifacts.require("./DifferentialContract.sol");

module.exports = async function (deployer, network, accounts) {
    console.log(accounts);
    deployer.deploy(DifferentialContract, 30);
};
