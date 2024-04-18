pragma solidity 0.8.19;

contract BalanceContract {
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

    constructor(int _baseDemand) {
        baseDemand = _baseDemand;
    }
    function recordDemandValue(int _demandValue) public {
        demandValue = _demandValue;
        satisfied = baseDemand <= demandValue;
    }


}


