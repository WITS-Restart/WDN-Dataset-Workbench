// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract DifferentialContract {
    // Variable declaration
    string public hour;
    string public nodeID;
    int public baseDemand; //water demand at each node
    int public demandValue; //actual amound of water provided
    string public headValue;
    string public pressureValue;
    string public xPos;
    string public yPos;
    string public nodeType;
    string public hasLeak;
    string public leakAreaValue;
    string public leakDischargeValue;
    string public leakDemandValue;
    string public set;
    bool public satisfied;

    address public owner;
    uint256 public balance; //contract balance

    event MoneySent(address _to, uint _amount);

    constructor(int _baseDemand) {
        baseDemand = _baseDemand;
        owner = msg.sender;
    }
    function recordBaseDemand(int _baseDemand) public {
        baseDemand = _baseDemand;
        satisfied = baseDemand <= demandValue;
    }

    function recordDemandValue(int _demandValue) public {
        demandValue = _demandValue;
        satisfied = baseDemand <= demandValue;
    }

    function getBalance() public returns (uint256){
        return address(this).balance;
    }

    /**
     * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    fallback() external payable {}

    receive() external payable {
        balance += msg.value;
    }

    event Transfer(address indexed from, address indexed to, uint256 value);


    function withdrawFromWalletBalance(address payable to) public onlyOwner returns (bool){
//        require(address(this).balance >= amount, "Wallet balance too low to fund withdraw");
//        addr.transfer(amount);
        to.transfer(address(this).balance);

//        emit Transfer(address(this), addr, amount);

//        emit MoneySent(msg.sender, amount);
        return true;
    }

}


