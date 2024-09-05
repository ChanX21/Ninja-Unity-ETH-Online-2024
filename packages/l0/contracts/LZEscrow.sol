// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OptionsBuilder} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Escrow} from "./Escrow.sol";

contract LZ is OApp {
    address escrow;
    Escrow escrowContract;
    struct IFees {
        uint128 gasLimit;
        uint128 gas;
    }
    IFees public fees = IFees(500000,50000);
    constructor(address _endpoint, address _owner)
        OApp(_endpoint, _owner)
        Ownable(_owner)
    {}

    using OptionsBuilder for bytes;
    modifier onlyescrow() {
        require(msg.sender == escrow);
        _;
    }

    function setEscrow(address payable _escrow) public onlyOwner {
        escrow = _escrow;
        escrowContract = Escrow(_escrow);
    }

       function setFees(uint128  _gasLimit, uint128 _gas) public onlyOwner {
        IFees memory newFees;
        newFees.gasLimit = _gasLimit;
        newFees.gas = _gas;
        fees = newFees;
    }

    /**
     * @notice Sends a message from the source to destination chain.
     * @param _dstEid Destination chain's endpoint ID.
     * @param _payload The message to send.
     */
    function send(uint32 _dstEid, bytes memory _payload)
        external
        payable
        onlyescrow
    {
        // Encodes the message before invoking _lzSend.
        // Replace with whatever data you want to send!
        _lzSend(
            _dstEid,
            _payload,
            createLzReceiveOption(fees.gasLimit,fees.gas),
            // Fee in native gas and ZRO token.
            MessagingFee(msg.value, 0),
            // Refund address in case of failed source message.
            payable(msg.sender)
        );
    }

    /// @notice Creates options for executing `lzReceive` on the destination chain.
    /// @param _gas The gas amount for the `lzReceive` execution.
    /// @return bytes-encoded option set for `lzReceive` executor.
    function createLzReceiveOption(uint128 _gas, uint128 _value)
        public
        pure
        returns (bytes memory)
    {
        return OptionsBuilder.newOptions().addExecutorLzReceiveOption(_gas, _value);
    }

    function _lzReceive(
        Origin calldata,
        bytes32,
        bytes calldata payload,
        address, // Executor address as specified by the OApp.
        bytes calldata // Any extra data or options to trigger on receipt.
    ) internal virtual override {
        // Decode the payload to get the message
        // In this case, type is string, but depends on your encoding!
        escrowContract.lzReceive(payload);
    }

    function quote(
        uint32 _dstEid, // destination endpoint id
        bytes memory payload, // message payload being sent
        bytes memory _options, // your message execution options
        bool _payInLzToken // boolean for which token to return fee in
    ) public view returns (uint256 nativeFee) {
        MessagingFee memory gas = _quote(
            _dstEid,
            payload,
            _options,
            _payInLzToken
        );
        return gas.nativeFee;
    }
}