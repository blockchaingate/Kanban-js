pragma solidity ^0.4.24;
contract FeeAccepter {
    function acceptFees() public returns (bool) {
        require(address(this).balance >= 100, "Insufficient funds");        
        bytes32 acceptString = bytes32("__________________Pay miner fee.");
        log0(acceptString);
        log0(100);
        return true;
    }
    function sendToContract() public payable {
    }
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
