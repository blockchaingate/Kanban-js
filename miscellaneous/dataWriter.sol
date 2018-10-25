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
        log0("KanbanAggregateSignatureUnlock");
        bytes32[] memory thePubKeys = new bytes32[](2);
        thePubKeys[0] = 0xfabfabfabfabfabfabfabfabfabfabfabfabfabfabfabfab1111111111111111;
        thePubKeys[1] = 0xfabfabfabfabfabfabfabfabfabfabfabfabfabfabfabfab2222222222222222;
        for (uint i = 0; i < 2; i ++) {
            log0(thePubKeys[i]);
        }
    }

    function bounceFabcoins() public payable returns (uint256) {
        msg.sender.send(msg.value);
        return msg.value;
    }
    function sendFabcoinsToBadAddress() public payable returns (uint256) {
        address(0x1212121212121212121212121212121212121212).send(msg.value);
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
