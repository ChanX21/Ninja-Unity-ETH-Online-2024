import { EndpointId } from "@layerzerolabs/lz-definitions";
const base_testnetContract = {
    eid: EndpointId.BASESEP_V2_TESTNET,
    contractName: "LZ"
};
const hedera_testnetContract = {
    eid: EndpointId.HEDERA_V2_TESTNET,
    contractName: "LZ"
};
export default { contracts: [{ contract: base_testnetContract }, { contract: hedera_testnetContract }], connections: [{ from: base_testnetContract, to: hedera_testnetContract, config: { sendLibrary: "0xC1868e054425D378095A003EcbA3823a5D0135C9", receiveLibraryConfig: { receiveLibrary: "0x12523de19dc41c91F7d2093E0CFbB76b17012C8d", gracePeriod: 0 }, sendConfig: { executorConfig: { maxMessageSize: 10000, executor: "0x8A3D588D9f6AC041476b094f97FF94ec30169d3D" }, ulnConfig: { confirmations: 1, requiredDVNs: ["0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6"], optionalDVNs: [], optionalDVNThreshold: 0 } }, receiveConfig: { ulnConfig: { confirmations: 1, requiredDVNs: ["0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6"], optionalDVNs: [], optionalDVNThreshold: 0 } } } }, { from: hedera_testnetContract, to: base_testnetContract, config: { sendLibrary: "0x1707575F7cEcdC0Ad53fde9ba9bda3Ed5d4440f4", receiveLibraryConfig: { receiveLibrary: "0xc0c34919A04d69415EF2637A3Db5D637a7126cd0", gracePeriod: 0 }, sendConfig: { executorConfig: { maxMessageSize: 10000, executor: "0xe514D331c54d7339108045bF4794F8d71cad110e" }, ulnConfig: { confirmations: 1, requiredDVNs: ["0xEc7Ee1f9e9060e08dF969Dc08EE72674AfD5E14D"], optionalDVNs: [], optionalDVNThreshold: 0 } }, receiveConfig: { ulnConfig: { confirmations: 1, requiredDVNs: ["0xEc7Ee1f9e9060e08dF969Dc08EE72674AfD5E14D"], optionalDVNs: [], optionalDVNThreshold: 0 } } } }] };
