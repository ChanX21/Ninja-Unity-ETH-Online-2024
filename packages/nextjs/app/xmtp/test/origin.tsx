"use client";

import { useEffect, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useAccount, useSignMessage } from "wagmi";
import { Wallet } from "ethers";
import axios from 'axios';

const CHATBOT_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const BOT_PRIVATE_KEY = process.env.NEXT_PUBLIC_BOT_PK;

if (!BOT_PRIVATE_KEY) {
    throw new Error("NEXT_PUBLIC_BOT_PK is not defined in environment variables");
}

const botSigner = new Wallet(BOT_PRIVATE_KEY);

const NinjaStrikeChatbot = () => {
    const { address } = useAccount();
    const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
    const [conversation, setConversation] = useState<any>(null);

    useEffect(() => {
        const initXMTP = async () => {
            if (address) {
                try {
                    const client = await Client.create(botSigner, { env: "production" });
                    setXmtpClient(client);
                    const convo = await client.conversations.newConversation(address);
                    setConversation(convo);

                    // Send initial greeting
                    const initialPrompt = "Greet the player and introduce yourself as Master Splinter, the sensei of Ninja Strike. Briefly explain the game's concept.";
                    const initialGreeting = await processChatbotMessage(initialPrompt);
                    await convo.send(initialGreeting);
                    setMessages([{ sender: CHATBOT_ADDRESS, content: initialGreeting }]);

                    // Listen for new messages
                    const stream = convo.streamMessages();
                    stream.on("message", (msg: any) => {
                        setMessages((prevMessages) => [
                            ...prevMessages,
                            { sender: msg.senderAddress, content: msg.content },
                        ]);
                    });
                } catch (error) {
                    console.error("Failed to initialize XMTP client:", error);
                }
            }
        };

        initXMTP();
    }, [address]);

    const processChatbotMessage = async (message: string) => {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are Master Splinter, the wise sensei of Ninja Strike. Speak with wisdom and guide the player through the game. The game is played on a 10x10 grid where each player hides 10 ninjas and tries to find the opponent's ninjas. Use analogies and teachings that relate to ninja skills and strategy." },
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
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error("Error communicating with ChatGPT:", error);
            return "Forgive me, young ninja. The mists of communication have clouded our path. Let us try again.";
        }
    };

    const sendMessage = async () => {
        if (newMessage.trim() && conversation) {
            await conversation.send(newMessage);
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: address || "You", content: newMessage },
            ]);
            setNewMessage("");

            // Get chatbot response
            const botResponse = await processChatbotMessage(newMessage);
            await conversation.send(botResponse);
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: CHATBOT_ADDRESS, content: botResponse },
            ]);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="flex-grow overflow-auto p-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-4 ${msg.sender === CHATBOT_ADDRESS ? 'text-left' : 'text-right'}`}>
                        <div className={`inline-block p-2 rounded-lg ${msg.sender === CHATBOT_ADDRESS ? 'bg-blue-200' : 'bg-green-200'}`}>
                            <p>{msg.content}</p>
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
                        className="flex-grow mr-2 p-2 border rounded"
                        placeholder="Type your message..."
                    />
                    <button onClick={sendMessage} className="px-4 py-2 bg-blue-500 text-white rounded">Send</button>
                </div>
            </div>
        </div>
    );
};

export default NinjaStrikeChatbot;