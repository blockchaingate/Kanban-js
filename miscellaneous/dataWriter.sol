pragma solidity ^0.4.24;
contract DataWriter {

    struct State {
        bytes32 data;
    }

    State internal theState;
    function writeData(bytes32 input) public {
        theState.data = input;
    }
    function readData() public view returns (bytes32) {
        return theState.data;
    }
}
