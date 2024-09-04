"use client";

import { useEffect, useState, useMemo } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useAccount, useSignMessage, useConnectorClient } from "wagmi";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { Account, Chain, Client as ClientViem, Transport } from "viem";
import { type Config } from "wagmi";

// Include useEthersSigner function directly in the file
function clientToSigner(client: ClientViem<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}

const XMTPMessagesPage = () => {
  const { address, connector } = useAccount();
  const { data: signMessageData, error, isLoading, signMessage, variables } = useSignMessage();
  const { chain } = useAccount();
  const [recoveredAddress, setRecoveredAddress] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [senderAddresses, setSenderAddresses] = useState<string[]>([]); // New state for sender addresses
  const [selectedSender, setSelectedSender] = useState<string>(""); // New state for selected sender
  const [filter, setFilter] = useState<string>(""); // State for manual filter

  const signer = useEthersSigner({ chainId: chain?.id });

  useEffect(() => {
    const recoverAddress = async () => {
      if (variables?.message && signMessageData) {
        try {
          setRecoveredAddress(address || null);
        } catch (err) {
          console.error("Failed to recover address:", err);
        }
      }
    };

    recoverAddress();
  }, [signMessageData, variables?.message, address]);

  useEffect(() => {
    const initXMTP = async () => {
      if (signer) {
        try {
          const xmtp = await Client.create(signer, { env: "production" });
          const convos = await xmtp.conversations.list();
          setConversations(convos);

          const allMessages = await Promise.all(
            convos.map(async (conversation) => {
              const msgs = await conversation.messages();
              return msgs.map((msg) => ({
                sender: msg.senderAddress,
                content: msg.content,
                sent: msg.sent,
              }));
            })
          );
          const flatMessages = allMessages.flat();
          setMessages(flatMessages);

          // Extract unique sender addresses
          const uniqueSenders = Array.from(new Set(flatMessages.map((msg) => msg.sender)));
          setSenderAddresses(uniqueSenders);
        } catch (error) {
          console.error("Failed to initialize XMTP client:", error);
        }
      }
    };

    initXMTP();
  }, [signer]);

  const sendMessageWithXMTP = async () => {
    if (!address || !connector) {
      console.error("No connected address or connector found");
      return;
    }

    if (!signer) {
      console.error("No signer found");
      return;
    }

    if (!recipientAddress) {
      console.error("No recipient address provided");
      return;
    }

    try {
      const xmtp = await Client.create(signer);
      const conversation = await xmtp.conversations.newConversation(recipientAddress);
      await conversation.send(newMessage);
      setResponse(`Message sent to ${recipientAddress}`);
      setNewMessage("");

      // Refresh conversations and messages
      const convos = await xmtp.conversations.list();
      setConversations(convos);
      const allMessages = await Promise.all(
        convos.map(async (conv) => {
          const msgs = await conv.messages();
          return msgs.map((msg) => ({
            sender: msg.senderAddress,
            content: msg.content,
            sent: msg.sent,
          }));
        })
      );
      const flatMessages = allMessages.flat();
      setMessages(flatMessages);

      // Update unique sender addresses
      const uniqueSenders = Array.from(new Set(flatMessages.map((msg) => msg.sender)));
      setSenderAddresses(uniqueSenders);
    } catch (error) {
      console.error("Failed to send message:", error);
      setResponse("Failed to send message. Please try again.");
    }
  };

  const handleSignMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = formData.get("message") as string;
    signMessage({ message });
  };

  // Filter messages based on the selected sender or manual filter
  const filteredMessages = useMemo(() => {
    if (selectedSender) {
      return messages.filter((msg) => msg.sender.toLowerCase() === selectedSender.toLowerCase());
    }
    if (filter) {
      return messages.filter((msg) => msg.sender.toLowerCase().includes(filter.toLowerCase()));
    }
    return messages;
  }, [messages, selectedSender, filter]);

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center">
          <span className="block text-2xl mb-2">XMTP Messages</span>
          <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
        </h1>
        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <h2 className="text-xl font-bold">Messages</h2>

              {/* List of sender addresses */}
              <div className="mt-4 max-h-60 overflow-y-auto w-full">
                {senderAddresses.map((sender, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer p-2 my-2 rounded text-left truncate ${selectedSender === sender ? "bg-blue-200" : "bg-base-200"
                      }`}
                    onClick={() => setSelectedSender(sender)}
                    title={sender}
                  >
                    {sender}
                  </div>
                ))}
              </div>

              {/* Manual filter input */}
              <input
                type="text"
                className="input input-bordered w-full mt-4"
                placeholder="Filter by address"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />

              <div className="mt-4 max-h-60 overflow-y-auto w-full">
                {filteredMessages.map((msg, index) => (
                  <div key={index} className="bg-base-200 p-2 my-2 rounded text-left">
                    <p>
                      <strong>{msg.sender === address ? "You" : "From"}:</strong> {msg.content}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(msg.sent).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col w-full">
                <input
                  type="text"
                  className="input input-bordered w-full mb-2"
                  placeholder="Recipient address"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered w-full mb-2"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="btn btn-primary" onClick={sendMessageWithXMTP}>
                  Send
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-500">{response}</div>
              <form onSubmit={handleSignMessage} className="mt-4">
                <label htmlFor="message">Enter a message to sign</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="The quick brown fox…"
                  required
                  className="textarea textarea-bordered w-full mt-2"
                />
                <button type="submit" disabled={isLoading} className="btn btn-secondary mt-2">
                  {isLoading ? "Check Wallet" : "Sign Message"}
                </button>
              </form>
              {signMessageData && (
                <div className="mt-4 text-sm">
                  <div>Recovered Address: {recoveredAddress}</div>
                  <div>Signature: {signMessageData}</div>
                </div>
              )}
              {error && (
                <div style={{ color: "red" }} className="mt-2">
                  {error.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XMTPMessagesPage;