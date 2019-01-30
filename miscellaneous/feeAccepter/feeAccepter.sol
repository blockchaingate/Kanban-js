pragma solidity ^0.4.24;
contract FeeAccepter {
    function acceptFees() public returns (bool) {
        require(address(this).balance >= 100, "Insufficient funds");        
        bytes32 acceptString = bytes32("__________________Fees accepted.");
        log0(acceptString);
        log0(700000);
        return true;
    }
    function sendToContract() public payable {
    }
    function returnHalf() public payable {
        msg.sender.transfer(msg.value / 2);
    }
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
