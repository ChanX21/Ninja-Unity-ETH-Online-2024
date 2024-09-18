// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract InheritanceContract is ReentrancyGuard {
	address public owner;
	address public heir;
	uint256 public lastWithdrawal;
	uint256 public constant INHERITANCE_PERIOD = 30 days;

	mapping(address => uint256) public userWithdrawalCounter;

	event OwnershipTransferred(
		address indexed previousOwner,
		address indexed newOwner
	);
	event HeirChanged(address indexed previousHeir, address indexed newHeir);
	event Withdrawal(address indexed recipient, uint256 amount);

	constructor(address _heir) {
		owner = msg.sender;
		heir = _heir;
		lastWithdrawal = block.timestamp;
	}

	modifier onlyOwner() {
		require(msg.sender == owner, "Only owner can call this function");
		_;
	}

	modifier onlyHeir() {
		require(msg.sender == heir, "Only heir can call this function");
		_;
	}

	function withdraw(uint256 amount) external nonReentrant onlyOwner {
		require(address(this).balance >= amount, "Insufficient balance");
		lastWithdrawal = block.timestamp;
		payable(owner).transfer(amount);
		userWithdrawalCounter[msg.sender] += 1;
		emit Withdrawal(owner, amount);
	}

	function resetInheritancePeriod() external onlyOwner {
		lastWithdrawal = block.timestamp;
	}

	function claimOwnership() external onlyHeir {
		require(
			block.timestamp > lastWithdrawal + INHERITANCE_PERIOD,
			"Inheritance period not passed"
		);
		address previousOwner = owner;
		owner = heir;
		emit OwnershipTransferred(previousOwner, heir);
	}

	function changeHeir(address newHeir) external onlyHeir {
		require(newHeir != address(0), "New heir cannot be zero address");
		address previousHeir = heir;
		heir = newHeir;
		emit HeirChanged(previousHeir, newHeir);
	}

	function getTimeLeftBeforeHeirOwnership() public view returns (uint256) {
		uint256 timePassed = block.timestamp - lastWithdrawal;
		if (timePassed >= INHERITANCE_PERIOD) {
			return 0;
		}
		return INHERITANCE_PERIOD - timePassed;
	}

	function getTimeLeftInDays() public view returns (uint256) {
		return getTimeLeftBeforeHeirOwnership() / 1 days;
	}

	function canHeirClaimOwnership() public view returns (bool) {
		return block.timestamp > lastWithdrawal + INHERITANCE_PERIOD;
	}

	function getOwner() public view returns (address) {
		return owner;
	}

	function getHeir() public view returns (address) {
		return heir;
	}

	function getLastWithdrawal() public view returns (uint256) {
		return lastWithdrawal;
	}

	function getInheritancePeriod() public pure returns (uint256) {
		return INHERITANCE_PERIOD;
	}

	// function getUserWithdrawalCounter(
	// 	address user
	// ) public view returns (uint256) {
	// 	return userWithdrawalCounter[user];
	// }

	receive() external payable {}
}
