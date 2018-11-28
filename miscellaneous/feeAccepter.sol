pragma solidity ^0.4.24;
contract FeeAccepter {
    struct State {
        bytes32 data;
    }
    function acceptFees(bytes32 data) public returns (bool) {
        bytes6 acceptString = bytes6("accept");
        for (uint j = 0; j < 6; j ++) {
            if (data[j] != acceptString[j]) {
                return false;
            }
        }
        return true;
    }
    function sendToContract() public payable {

    }
    function runWhenFeesAccepted(bytes32 data) public {
        log0("got data!");
        log0 (data);
    }
}
