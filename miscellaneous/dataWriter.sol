pragma solidity ^0.4.24;
contract DataWriter {

    struct State {
        bytes32 data;
    }

    State internal theState;
    
    function receiveFabcoins(uint256) public payable returns (uint256) {
        return this.balance;
    }
    
    function getBallance() public view returns (uint256) {
        return this.balance;
    }    
    function writeData(bytes32 input) public returns (bytes32) {
        theState.data = input;
        return theState.data;
    }    
    function readData() public view returns (bytes32) {
        return theState.data;
    }    
}
