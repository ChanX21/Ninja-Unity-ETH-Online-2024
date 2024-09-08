"use client";

import { useEffect, useMemo, useState, KeyboardEvent } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useAccount, useConnectorClient, useSignMessage } from "wagmi";
import { BrowserProvider, JsonRpcSigner, Wallet } from "ethers";
import axios from 'axios';

const CHATBOT_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const BOT_PRIVATE_KEY = process.env.NEXT_PUBLIC_BOT_PK;

if (!BOT_PRIVATE_KEY) {
  throw new Error("NEXT_PUBLIC_BOT_PK is not defined in environment variables");
}

function clientToSigner(client: Client<Transport, Chain, Account>) {
  console.log("clientToSigner called with client:", client);
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
  console.log("useEthersSigner called with client:", client);
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}

const botSigner = new Wallet(BOT_PRIVATE_KEY);

const XMTPChatGPTBot = () => {
  const { address, chain } = useAccount();
  const signer = useEthersSigner({ chainId: chain?.id });
  const [messages, setMessages] = useState<{ sender: string; content: string; sent: Date }[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [conversation, setConversation] = useState<any>(null);

  useEffect(() => {
    const initXMTP = async () => {
      if (signer) {
        try {
          console.log("Initializing XMTP client with signer:", signer);
          const client = await Client.create(signer, { env: "production" });
          console.log("XMTP client initialized:", client);
          setXmtpClient(client);
          const convo = await client.conversations.newConversation(CHATBOT_ADDRESS);
          console.log("New conversation created:", convo);
          setConversation(convo);

          // Send initial greeting
          const initialPrompt = "You are a chatbot for the game Ninja Strike. Introduce yourself and briefly explain the game's concept.";
          const initialGreeting = await processChatbotMessage(initialPrompt);
          console.log("Initial greeting processed:", initialGreeting);
          await convo.send(initialGreeting);
          setMessages([{ sender: CHATBOT_ADDRESS, content: initialGreeting, sent: new Date() }]);

          // Listen for new messages
          const stream = await convo.streamMessages();
          console.log("Message stream started");
          for await (const msg of stream) {
            console.log("New message received:", msg);
            if (msg.senderAddress !== address) {
              setMessages((prevMessages) => [
                ...prevMessages,
                { sender: msg.senderAddress, content: msg.content, sent: msg.sent },
              ]);
            }
          }
        } catch (error) {
          console.error("Failed to initialize XMTP client:", error);
        }
      }
    };

    initXMTP();
  }, [signer, address]);

  const processChatbotMessage = async (message: string) => {
    try {
      console.log("Processing chatbot message:", message);
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a chatbot for the game Ninja Strike. The game is played on a 10x10 grid where each player hides 10 ninjas and tries to find the opponent's ninjas. Respond as if you're guiding players through the game." },
            { role: "user", content: message }
          ],
          max_tokens: 150,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CHATGPT}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log("Chatbot response received:", response.data.choices[0].message.content);
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error communicating with ChatGPT:", error);
      return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() && conversation) {
      console.log("Sending new message:", newMessage);
      await conversation.send(newMessage);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: address || "You", content: newMessage, sent: new Date() },
      ]);
      setNewMessage("");

      // Process the message with the chatbot
      const botResponse = await processChatbotMessage(newMessage);
      console.log("Sending bot response:", botResponse);
      await conversation.send(botResponse);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: CHATBOT_ADDRESS, content: botResponse, sent: new Date() },
      ]);
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-grow overflow-auto p-4">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.sender === CHATBOT_ADDRESS ? 'text-left' : 'text-right'}`}>
            <div className={`inline-block p-2 rounded-lg ${msg.sender === CHATBOT_ADDRESS ? 'bg-blue-200' : 'bg-green-200'}`}>
              <p>{msg.content}</p>
              <p className="text-xs text-gray-500">{msg.sent.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow mr-2 p-2 border rounded"
            placeholder="Type your message..."
          />
          <button onClick={sendMessage} className="px-4 py-2 bg-blue-500 text-white rounded">Send</button>
        </div>
      </div>
    </div>
  );
};

export default XMTPChatGPTBot;