pragma solidity ^0.4.24;
contract DataWriter {
    struct State {
        bytes32 data;
    }
    event CreateShardAggregateAddress(
        string,
        address aggregateAddress
    );
    State internal theState;
    function receiveFabcoins(uint256) public payable returns (uint256) {
        return address(this).balance;
    }
    function emitEvent() public {
        log0("KanbanAggregateSignatureUnlockScript");
        bytes32 theAddress = 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
        log0(theAddress);
        bytes32[] memory thePubKeys = new bytes32[](3);
        thePubKeys[0] = 0x1111111111111111111111111111111111111111111111111111111111111111;
        thePubKeys[1] = 0x2222222222222222222222222222222222222222222222222222222222222222;
        thePubKeys[2] = 0x3333333333333333333333333333333333333333333333333333333333333333;
        for (uint i = 0; i < 3; i ++) {
            log0(thePubKeys[i]);
        }
    }

    function bounceFabcoins() public payable returns (uint256) {
        msg.sender.send(msg.value);
        return msg.value;
    }
    function getBallance() public view returns (uint256) {
        return address(this).balance;
    }    
    function writeData(bytes32 input) public returns (bytes32) {
        theState.data = input;
        return theState.data; 
    }    
    function readData() public view returns (bytes32) {
        return theState.data;
    }    
}
