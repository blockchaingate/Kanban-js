pragma solidity ^0.4.0;
contract DataWriter {

    struct State {
        uint8[32] data;
    }

    State internal theState;
    function writeData(uint8[32] input) public {
        theState.data = input;
    }
    function readData() public view returns (uint8[32]) {
        return theState.data;
    }
}
