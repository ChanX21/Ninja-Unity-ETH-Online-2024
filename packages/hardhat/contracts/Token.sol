// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
	constructor() ERC20("Ninja Token", "NINJA") {
		_mint(msg.sender, 100_000 ether);
	}
}
