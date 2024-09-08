"use client";

import { useEffect, useMemo, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import axios from "axios";
import { BrowserProvider, JsonRpcSigner, Wallet } from "ethers";
import type { Account, Chain, Client as ClientViem, Transport } from "viem";
import { useAccount, useConnectorClient, useSignMessage } from "wagmi";
import { type Config } from "wagmi";

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

const CHATBOT_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const BOT_PRIVATE_KEY = process.env.NEXT_PUBLIC_BOT_PK;

if (!BOT_PRIVATE_KEY) {
  throw new Error("NEXT_PUBLIC_BOT_PK is not defined in environment variables");
}

const botSigner = new Wallet(BOT_PRIVATE_KEY);

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
  const [senderAddresses, setSenderAddresses] = useState<string[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>("");
  const [filter, setFilter] = useState<string>("");
  const [manualFilter, setManualFilter] = useState<string>("");

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
            convos.map(async conversation => {
              const msgs = await conversation.messages();
              return msgs.map(msg => ({
                sender: msg.senderAddress,
                content: msg.content,
                sent: msg.sent,
              }));
            }),
          );
          const flatMessages = allMessages.flat();
          setMessages(flatMessages);

          const uniqueSenders = Array.from(new Set(flatMessages.map(msg => msg.sender)));
          setSenderAddresses(uniqueSenders);

          // Start listening for new messages
          for (const conversation of convos) {
            listenForMessages(xmtp, conversation);
          }
        } catch (error) {
          console.error("Failed to initialize XMTP client:", error);
        }
      }
    };

    initXMTP();
  }, [signer]);

  const listenForMessages = (xmtp: Client, conversation: any) => {
    const stream = conversation.streamMessages();
    stream.on("message", async (msg: any) => {
      if (msg.senderAddress === CHATBOT_ADDRESS) {
        // This is a message from the chatbot, process it
        const chatbotResponse = await processChatbotMessage(msg.content);
        setMessages(prevMessages => [
          ...prevMessages,
          {
            sender: msg.senderAddress,
            content: msg.content,
            sent: msg.sent,
          },
          {
            sender: address,
            content: chatbotResponse,
            sent: new Date(),
          },
        ]);
        // Send the chatbot's response back to the conversation
        await conversation.send(chatbotResponse);
      } else {
        // This is a regular message, just add it to the messages
        setMessages(prevMessages => [
          ...prevMessages,
          {
            sender: msg.senderAddress,
            content: msg.content,
            sent: msg.sent,
          },
        ]);
      }
    });
  };

  const processChatbotMessage = async (message: string) => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo", // This is currently one of the cheapest models
          messages: [{ role: "user", content: message }],
          max_tokens: 150, // Limit the response length to reduce costs
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_CHATGPT}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error communicating with ChatGPT:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return "Error: Unauthorized. Please check your OpenAI API key.";
        } else {
          return `Error: ${error.message}. Please try again later.`;
        }
      }
      return "Sorry, I couldn't process that request due to an unexpected error.";
    }
  };

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
        convos.map(async conv => {
          const msgs = await conv.messages();
          return msgs.map(msg => ({
            sender: msg.senderAddress,
            content: msg.content,
            sent: msg.sent,
          }));
        }),
      );
      const flatMessages = allMessages.flat();
      setMessages(flatMessages);

      // Update unique sender addresses
      const uniqueSenders = Array.from(new Set(flatMessages.map(msg => msg.sender)));
      setSenderAddresses(uniqueSenders);

      // If the recipient is the chatbot, process the message
      if (recipientAddress === CHATBOT_ADDRESS) {
        const chatbotResponse = await processChatbotMessage(newMessage);
        setMessages(prevMessages => [
          ...prevMessages,
          {
            sender: CHATBOT_ADDRESS,
            content: chatbotResponse,
            sent: new Date(),
          },
        ]);
        await conversation.send(chatbotResponse);
      }
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

  const applyManualFilter = () => {
    setSelectedSender("");
    setManualFilter(filter);
  };

  const filteredMessages = useMemo(() => {
    if (selectedSender) {
      return messages.filter(msg => msg.sender.toLowerCase() === selectedSender.toLowerCase());
    }
    if (manualFilter) {
      return messages.filter(msg => msg.sender.toLowerCase().includes(manualFilter.toLowerCase()));
    }
    return messages;
  }, [messages, selectedSender, manualFilter]);

  const testChatbotPrompt = async () => {
    const testPrompt =
      "Describe the game Ninja Strike. It's a game with 10 ninjas on a 10x10 grid, and the winner is the first player to hit all ninjas.";
    setMessages(prevMessages => [
      ...prevMessages,
      {
        sender: address,
        content: testPrompt,
        sent: new Date(),
      },
    ]);
    const chatbotResponse = await processChatbotMessage(testPrompt);
    setMessages(prevMessages => [
      ...prevMessages,
      {
        sender: CHATBOT_ADDRESS,
        content: chatbotResponse,
        sent: new Date(),
      },
    ]);
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center">
          <span className="block text-2xl mb-2">XMTP Messages with ChatGPT Integration</span>
          <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
        </h1>
        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <h2 className="text-xl font-bold">Messages</h2>

              <div className="mt-4 max-h-60 overflow-y-auto w-full">
                {senderAddresses.map((sender, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer p-2 my-2 rounded text-left truncate ${selectedSender === sender ? "bg-blue-200" : "bg-base-200"
                      }`}
                    onClick={() => {
                      setSelectedSender(sender);
                      setManualFilter("");
                    }}
                    title={sender}
                  >
                    {sender}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex w-full">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Filter by address"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                />
                <button className="btn btn-primary ml-2" onClick={applyManualFilter}>
                  Filter
                </button>
              </div>

              <div className="mt-4 max-h-60 overflow-y-auto w-full">
                {filteredMessages.map((msg, index) => (
                  <div key={index} className="bg-base-200 p-2 my-2 rounded text-left">
                    <p>
                      <strong>
                        {msg.sender === address ? "You" : msg.sender === CHATBOT_ADDRESS ? "Chatbot" : "From"}:
                      </strong>{" "}
                      {msg.content}
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
                  onChange={e => setRecipientAddress(e.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered w-full mb-2"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button className="btn btn-primary" onClick={sendMessageWithXMTP}>
                  Send
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-500">{response}</div>
              <button className="btn btn-secondary mt-4" onClick={testChatbotPrompt}>
                Test Chatbot Prompt
              </button>
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
