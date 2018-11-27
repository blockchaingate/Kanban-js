pragma solidity ^0.4.24;

import "./SafeMath.sol";

contract LoyalPoints {
    using SafeMath for uint256;

    // predefined exchange methods
    bytes1 private constant NO_EXCHANGE = 0x00;
    bytes1 private constant MULTIPLICATION = 0x01;
    bytes1 private constant DIVISION = 0x02;

    // defaults
    bytes1 private constant DEFAULT_EXCHANGE_METHOD = DIVISION;
    uint256 private constant DEFAULT_EXCHANGE_RATIO = 1;

    uint256 private nonce = 0;

    struct ExchangeRatio {
        bytes1 method;
        uint256 ratio;
    }

    struct Company {
        address account;
        bytes1 publicKeyPrefix;
        bytes32 publicKeyCurvePoint;
        bytes32 name;
        uint256 rewardRatio;
        bytes32 fabAddress;
        uint256 creationNumber;
    }

    struct Transaction {
        bytes32 companyName;
        uint256 nonce;
        uint256 rewardPoints;
        bool isRedeemed;
        address beneficiary;
        bytes signature;
    }

    mapping(address => mapping(bytes32 => uint256)) private userPoints; // stores user points
    mapping(bytes32 => mapping(bytes32 => ExchangeRatio)) private pointsExchangeRate; // stores the points exchange rate among company

    mapping(bytes32 => Company) private companyInfo; // stores the company registration info
    mapping(uint256 => Transaction) private transactionLookUp; // saves the transaction info for rewards redeem
    bytes32[] private companyNameList;

    function registerCompany(bytes1 _publicKeyPrefix, bytes32 _publicKeyCurvePoint, bytes32 _companyName, uint256 _rewardRatio, bytes32 _fabAddress) external returns(bool success) {
        if (companyInfo[_companyName].creationNumber > 0) {
          return false;
        }
        companyInfo[_companyName] = Company({
            account: msg.sender,
            publicKeyPrefix: _publicKeyPrefix,
            publicKeyCurvePoint: _publicKeyCurvePoint,
            name: _companyName,
            rewardRatio: _rewardRatio,
            fabAddress: _fabAddress,
            creationNumber: companyNameList.length + 1
            });
        companyNameList.push(_companyName);
        return true;
    }

    function getNonce() public view returns (uint256 nonceCurrent) {
      return nonce;
    }

    function getExchangeRate(bytes32 _from, bytes32 _to) public view returns(bytes1 method, uint256 ratio) {
        return (pointsExchangeRate[_from][_to].method, pointsExchangeRate[_from][_to].ratio);
    }

    function getAllCompanies() public view returns(bytes1[] publicKeyPrefixes, bytes32[] publicKeyCurvePoints, bytes32[] companyNames, uint256[] companyCreationNumbers, bytes32[] fabAddresses) {
        uint256 numCompanies = companyNameList.length;
        publicKeyPrefixes = new bytes1[](numCompanies);
        publicKeyCurvePoints = new bytes32[](numCompanies);
        companyNames = new bytes32[](numCompanies);
        fabAddresses = new bytes32[](numCompanies);
        companyCreationNumbers = new uint256[](numCompanies);

        for (uint256 i = 0; i < numCompanies; i++) {
            Company storage company = companyInfo[companyNameList[i]];
            publicKeyPrefixes[i] = company.publicKeyPrefix;
            publicKeyCurvePoints[i] = company.publicKeyCurvePoint;
            companyNames[i] = company.name;
            fabAddresses[i] = company.fabAddress;
            companyCreationNumbers[i] = company.creationNumber;
        }
    }

    function issuePoints(bytes32 _company, uint256 _moneySpent, address _beneficiary, uint256 _nonce, bytes32 _fabAddress, bytes _signature) external returns(bytes32 hash) {
        //require(_fabAddress == companyInfo[_company].fabAddress, "You are not allowed to issue points for this company");
        //require(_nonce == nonce, "Nonce does not match");
        uint256 rewardPoints = _moneySpent.div(companyInfo[_company].rewardRatio);
        hash = keccak256(abi.encodePacked(_signature, _company, nonce, rewardPoints, _beneficiary));
        transactionLookUp[nonce] = Transaction({
            signature: _signature,
            companyName: _company,
            nonce: _nonce,
            rewardPoints: rewardPoints,
            isRedeemed: false,
            beneficiary: _beneficiary
        });
        nonce = nonce.add(1);
    }

    function redeemPoints(uint256 _nonce, address _beneficiary) external returns(bool success) {
        Transaction storage transaction = transactionLookUp[_nonce];
        require(!transaction.isRedeemed, "this reward has already been redeemed");
        if (transaction.beneficiary != address(0)) {
            require(transaction.beneficiary == msg.sender, "you are not the points owner");
        } else {
            transaction.beneficiary = _beneficiary;
        }
        transaction.isRedeemed = true;
        userPoints[transaction.beneficiary][transaction.companyName] = userPoints[transaction.beneficiary][transaction.companyName].add(transaction.rewardPoints);
        return true;
    }

    function getBalances() public view returns(uint256[] balances) {
        balances = new uint256[](companyNameList.length);
        for (uint256 i = 0; i < companyNameList.length; i++) {
            balances[i] = userPoints[msg.sender][companyNameList[i]];
        }
    }

    function spendPoints(bytes32 _company, uint256 _amount) external returns(bool success) {
        userPoints[msg.sender][_company] = userPoints[msg.sender][_company].sub(_amount);
        return true;
    }

    function convertPoints(bytes32 _from, bytes32 _to, uint256 _amount) private view returns(uint256 convertAmount) {
        ExchangeRatio storage rewardRatio = pointsExchangeRate[_from][_to];
        require(rewardRatio.method == NO_EXCHANGE || rewardRatio.method == MULTIPLICATION || rewardRatio.method == DIVISION, "unknown exchange method");

        if (rewardRatio.method == NO_EXCHANGE) {
            return _amount.mul(DEFAULT_EXCHANGE_RATIO);
        } else if (rewardRatio.method == MULTIPLICATION) {
            return _amount.mul(rewardRatio.ratio);
        } else if (rewardRatio.method == DIVISION) {
            return _amount.div(rewardRatio.ratio);
        }

        return 0;
    }

    function transferPointsSelf(bytes32 _from, bytes32 _to, uint256 _amount) external returns(bool success) {
        userPoints[msg.sender][_from] = userPoints[msg.sender][_from].sub(_amount);
        uint256 rewardAmount = convertPoints(_from, _to, _amount);
        userPoints[msg.sender][_to] = userPoints[msg.sender][_to].add(rewardAmount);
        return true;
    }

    function transferPointsOthers(bytes32 _fromPoints, address _toUser, bytes32 _toPoints, uint256 _amount) external returns(bool success) {
        userPoints[msg.sender][_fromPoints] = userPoints[msg.sender][_fromPoints].sub(_amount);
        uint256 transferAmount = convertPoints(_fromPoints, _toPoints, _amount);
        userPoints[_toUser][_toPoints] = userPoints[_toUser][_toPoints].add(transferAmount);
        return true;
    }
}
