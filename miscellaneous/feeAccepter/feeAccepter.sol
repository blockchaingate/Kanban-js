pragma solidity ^0.4.24;
contract FeeAccepter {
    function acceptFees() public returns (bool) {
        require(address(this).balance >= 700000, "Insufficient funds");        
        bytes32 acceptString = bytes32("__________________Fees accepted.");
        log0(acceptString);
        log0(700000);
        return true;
    }
    //function sendToContract() public payable {
    //}
    //function returnHalf() public payable {
    //    msg.sender.transfer(msg.value / 2);
    //}
    //function getBalance() public view returns (uint256) {
    //    return address(this).balance;
    //}
    function crash() public payable {
        log0("Test of the crashing mechanism.");
        //require(false);
        require(false, "Test of the crashing mechanism.");
    }
}
