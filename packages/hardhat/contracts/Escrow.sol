// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {IAny2EVMMessageReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IAny2EVMMessageReceiver.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GameEscrow
 * @dev This contract allows two users to deposit tokens into escrow,
 * play a game off-chain, and have the winner receive the funds minus a fee.
 */
contract Escrow is IAny2EVMMessageReceiver, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error InvalidRouter(address router);
    error NotEnoughBalanceForFees(
        uint256 currentBalance,
        uint256 calculatedFees
    );
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error ChainNotEnabled(uint64 chainSelector);
    error SenderNotEnabled(address sender);
    error OperationNotAllowedOnCurrentChain(uint64 chainSelector);

    IERC20 public immutable escrowToken;
    uint256 public fee;
    uint256 private escrowCounter;
    uint256 public minEthRequired;

    IRouterClient internal immutable i_ccipRouter;
    LinkTokenInterface internal immutable i_linkToken;
    uint64 private immutable i_currentChainSelector;
    struct IDest {
        address contractAddress;
        uint64 chain;
        bytes ccipExtraArgsBytes;
    }
    IDest destination;

    enum PayFeesIn {
        Native,
        LINK
    }

    struct EscrowStruct {
        uint256 id;
        EscrowType escrowType;
        address depositor1;
        address depositor2;
        uint256 amount;
        bool isReleased;
        string gameData;
    }

    mapping(uint64 => IDest) public s_chains;

    event ChainEnabled(
        uint64 chainSelector,
        address xNftAddress,
        bytes ccipExtraArgs
    );
    event ChainDisabled(uint64 chainSelector);
    event CrossChainSent(
        address from,
        uint64 sourceChainSelector,
        uint64 destinationChainSelector
    );

    enum EscrowType {
        ETH,
        ERC20
    }

    modifier onlyRouter() {
        if (msg.sender != address(i_ccipRouter)) {
            revert InvalidRouter(msg.sender);
        }
        _;
    }
    modifier onlyEnabledChain(uint64 _chainSelector) {
        if (s_chains[_chainSelector].contractAddress == address(0)) {
            revert ChainNotEnabled(_chainSelector);
        }
        _;
    }
    modifier onlyEnabledSender(uint64 _chainSelector, address _sender) {
        if (s_chains[_chainSelector].contractAddress != _sender) {
            revert SenderNotEnabled(_sender);
        }
        _;
    }

    modifier onlyOtherChains(uint64 _chainSelector) {
        if (_chainSelector == i_currentChainSelector) {
            revert OperationNotAllowedOnCurrentChain(_chainSelector);
        }
        _;
    }

    function setDestination(address contractAddress, uint64 chain)
        public
        onlyOwner
    {
        destination.contractAddress = contractAddress;
        destination.chain = chain;
    }

    function isExist(uint256[] memory arr, uint256 element)
        internal
        pure
        returns (bool)
    {
        bool exists = false;
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == element) {
                exists = true;
                break;
            }
        }
        return exists;
    }

    function crossChainTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint64 destinationChainSelector,
        PayFeesIn payFeesIn
    ) external nonReentrant returns (bytes32 messageId) {}

    /// @inheritdoc IAny2EVMMessageReceiver
    function ccipReceive(Client.Any2EVMMessage calldata message)
        external
        virtual
        override
        onlyRouter
        nonReentrant
        onlyEnabledChain(message.sourceChainSelector)
        onlyEnabledSender(
            message.sourceChainSelector,
            abi.decode(message.sender, (address))
        )
    {
        EscrowStruct memory escrow = abi.decode(message.data, (EscrowStruct));
        escrows[escrow.id] = escrow;
        if (!isExist(escrowIds, escrow.id)) {
            escrowIds.push(escrow.id);
        }
        if (!isExist(userEscrows[escrow.depositor1], escrow.id)) {
            userEscrows[escrow.depositor1].push(escrow.id);
        }
        if (
            escrow.depositor2 != address(0) &&
            !isExist(userEscrows[escrow.depositor2], escrow.id)
        ) {
            userEscrows[escrow.depositor2].push(escrow.id);
        }
    }

    mapping(uint256 => EscrowStruct) public escrows;
    mapping(address => uint256[]) public userEscrows;
    uint256[] public escrowIds; // keeps track of escrows

    function getAllUserEscrows(address userAddress)
        external
        view
        returns (uint256[] memory)
    {
        return userEscrows[userAddress];
    }

    function getAllEscrows() external view returns (uint256[] memory) {
        return escrowIds;
    }

    /**
     * @dev Emitted when a deposit is made.
     * @param user The address of the user making the deposit.
     * @param amount The amount of the deposit.
     * @param escrowType The type of the deposit (ETH or ERC20).
     * @param escrowId The ID of the escrow.
     */
    event Deposited(
        address indexed user,
        uint256 amount,
        EscrowType escrowType,
        uint256 escrowId
    );

    /**
     * @dev Emitted when funds are released to the winner.
     * @param winner The address of the winner.
     * @param amount The amount released to the winner.
     * @param escrowId The ID of the escrow.
     */
    event Released(address indexed winner, uint256 amount, uint256 escrowId);

    /**
     * @dev Emitted when the minimum ETH required is updated.
     * @param oldMinEthRequired The old minimum ETH required.
     * @param newMinEthRequired The new minimum ETH required.
     */
    event MinEthRequiredUpdated(
        uint256 oldMinEthRequired,
        uint256 newMinEthRequired
    );

   constructor(address ccipRouterAddress, address linkTokenAddress, uint64 currentChainSelector, IERC20 _escrowToken, uint256 _fee, uint256 _minEthRequired) Ownable() {
        require(_fee <= 100, "Fee must be less than or equal to 100%");
        escrowToken = _escrowToken;
        fee = _fee;
        minEthRequired = _minEthRequired;    
        if (ccipRouterAddress == address(0)) revert InvalidRouter(address(0));
        i_ccipRouter = IRouterClient(ccipRouterAddress);
        i_linkToken = LinkTokenInterface(linkTokenAddress);
        i_currentChainSelector = currentChainSelector;
    }

    /**
     * @notice Updates the minimum ETH required for transactions.
     * @param _minEthRequired The new minimum ETH required.
     */
    function updateMinEthRequired(uint256 _minEthRequired) external onlyOwner {
        uint256 oldMinEthRequired = minEthRequired;
        minEthRequired = _minEthRequired;
        emit MinEthRequiredUpdated(oldMinEthRequired, _minEthRequired);
    }

    /**
     * @notice Deposits native Ether into escrow.
     * @dev User can deposit ETH, which will be tracked in the contract.
     */
    function depositEth() external payable {
        require(msg.value > 0, "Must deposit more than 0 ETH");

        uint256 feeAmount = (msg.value * fee) / 100;
        uint256 depositAmount = msg.value - feeAmount;

        // Send fee to the owner
        payable(owner()).transfer(feeAmount);

        uint256 escrowId = escrowCounter++;
        escrows[escrowId] = EscrowStruct({
            id: escrowId,
            escrowType: EscrowType.ETH,
            depositor1: msg.sender,
            depositor2: address(0),
            amount: msg.value,
            isReleased: false,
            gameData: ""
        });

        userEscrows[msg.sender].push(escrowId);
        escrowIds.push(escrowId);
        emit Deposited(msg.sender, depositAmount, EscrowType.ETH, escrowId);
    }

    function CCIPSend(EscrowStruct memory escrow) internal {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(destination),
            data: abi.encode(escrows[escrow.id]),
            feeToken: address(0),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: s_chains[destination.chain].ccipExtraArgsBytes
        });

        // Get the fee required to send the CCIP message
        uint256 fees = i_ccipRouter.getFee(destination.chain, message);
        if (fees > address(this).balance) {
            revert NotEnoughBalanceForFees(address(this).balance, fees);
        }

        // Send the message through the router and store the returned message ID
        i_ccipRouter.ccipSend{value: fees}(destination.chain, message);
        emit CrossChainSent(
            msg.sender,
            i_currentChainSelector,
            destination.chain
        );
    }

    /**
     * @notice Deposits ERC20 tokens into escrow.
     * @dev User can deposit ERC20 tokens, which will be tracked in the contract.
     * @param amount The amount of tokens to deposit.
     */
    function depositToken(uint256 amount) external payable {
        require(amount > 0, "Must deposit more than 0 tokens");
        require(
            msg.value >= minEthRequired,
            "Must send at least the minimum ETH required for gas fees"
        );
        payable(owner()).transfer(minEthRequired);

        uint256 feeAmount = (amount * fee) / 100;
        uint256 depositAmount = amount - feeAmount;

        // Send fee to the owner
        escrowToken.safeTransferFrom(msg.sender, owner(), feeAmount);
        escrowToken.safeTransferFrom(msg.sender, address(this), depositAmount);

        uint256 escrowId = escrowCounter++;
        EscrowStruct memory escrow = EscrowStruct({
            id: escrowId,
            escrowType: EscrowType.ERC20,
            depositor1: msg.sender,
            depositor2: address(0),
            amount: depositAmount,
            isReleased: false,
            gameData: ""
        });

        escrows[escrowId] = escrow;

        userEscrows[msg.sender].push(escrowId);
        escrowIds.push(escrowId);
        CCIPSend(escrow);
        emit Deposited(msg.sender, depositAmount, EscrowType.ERC20, escrowId);
    }

    /**
     * @notice Allows the second user to deposit the same amount and token type as the initial escrow.
     * @param escrowId The ID of the escrow to join.
     */
    function joinEscrow(uint256 escrowId) external payable {
        EscrowStruct storage escrow = escrows[escrowId];
        require(escrow.depositor1 != address(0), "Invalid escrow ID");
        require(escrow.depositor2 == address(0), "EscrowStruct already joined");
        require(escrow.depositor1 != msg.sender, "Cannot join your own escrow");

        uint256 feeAmount;
        uint256 depositAmount;

        if (escrow.escrowType == EscrowType.ETH) {
            require(msg.value == escrow.amount, "Incorrect Ether amount sent");
            feeAmount = (msg.value * fee) / 100;
            depositAmount = msg.value - feeAmount;

            // Send fee to the owner
            payable(owner()).transfer(feeAmount);
        } else {
            require(
                msg.value >= minEthRequired,
                "Must send at least the minimum ETH required for gas fees"
            );
            feeAmount = (escrow.amount * fee) / 100;
            depositAmount = escrow.amount - feeAmount;

            // Send fee to the owner
            escrowToken.safeTransferFrom(msg.sender, owner(), feeAmount);
            escrowToken.safeTransferFrom(
                msg.sender,
                address(this),
                depositAmount
            );
        }
        CCIPSend(escrow);
        emit Deposited(msg.sender, depositAmount, escrow.escrowType, escrowId);
    }

    /**
     * @notice Releases the escrowed funds to the winner.
     * @dev This function can only be called by the owner.
     * @param escrowId The ID of the escrow to release.
     * @param winner The address of the winner.
     * @param gameData The data from the game that was played.
     */
    function releaseFunds(
        uint256 escrowId,
        address payable winner,
        string calldata gameData
    ) external onlyOwner {
        EscrowStruct storage escrow = escrows[escrowId];
        require(!escrow.isReleased, "Funds already released");
        require(escrow.amount > 0, "No funds to release");
        require(escrow.depositor2 != address(0), "Escrow not fully funded");

        uint256 feeAmount = (escrow.amount * 2 * fee) / 100;
        uint256 totalAmount = (escrow.amount * 2) - feeAmount;

        escrow.isReleased = true;
        escrow.gameData = gameData;

        if (escrow.escrowType == EscrowType.ETH) {
            // Ensure contract has enough ETH balance
            require(
                address(this).balance >= totalAmount,
                "Insufficient ETH balance"
            );
            // Transfer the remaining amount to the winner in ETH
            (bool success, ) = winner.call{value: totalAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // Ensure contract has enough ERC20 balance
            require(
                escrowToken.balanceOf(address(this)) >= totalAmount,
                "Insufficient ERC20 token balance"
            );
            // Transfer the remaining amount to the winner in ERC20
            escrowToken.safeTransfer(winner, totalAmount);
        }
        CCIPSend(escrow);

        emit Released(winner, totalAmount, escrowId);
    }

    /**
     * @notice Allows the owner to release any stuck or unclaimed funds to an address of their choosing.
     * @param recipient The address to send the recovered funds to.
     */
    function recoverFunds(address payable recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient address");

        // Transfer the contract's ETH balance to the recipient
        uint256 contractEthBalance = address(this).balance;
        if (contractEthBalance > 0) {
            recipient.transfer(contractEthBalance);
        }

        // Transfer the contract's ERC20 token balance to the recipient
        uint256 contractTokenBalance = escrowToken.balanceOf(address(this));
        if (contractTokenBalance > 0) {
            escrowToken.safeTransfer(recipient, contractTokenBalance);
        }
    }

    fallback() external payable {
        console.log("----- fallback:", msg.value);
    }

    receive() external payable {
        console.log("----- receive:", msg.value);
    }
}
