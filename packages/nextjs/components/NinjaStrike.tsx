"use client";

import React, { useState, useEffect } from 'react';
import { Unity, useUnityContext } from "react-unity-webgl";

const NinjaStrike = () => {
    const { unityProvider, isLoaded, loadingProgression, sendMessage } = useUnityContext({
        loaderUrl: "/NinjaStrike/Build/NinjaStrike.loader.js",
        dataUrl: "/NinjaStrike/Build/NinjaStrike.data",
        frameworkUrl: "/NinjaStrike/Build/NinjaStrike.framework.js",
        codeUrl: "/NinjaStrike/Build/NinjaStrike.wasm",
    });

    const [message, setMessage] = useState("");

    const handleSendMessage = () => {
        if (isLoaded && message) {
            sendMessage("GameManager", "ReceiveMessage", message);
            setMessage("");
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            padding: '40px',
            position: 'relative'
        }}>
            {!isLoaded && (
                <p>Loading Application... {Math.round(loadingProgression * 100)}%</p>
            )}
            <Unity
                unityProvider={unityProvider}
                style={{
                    width: '1280px',
                    height: '666px',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
            />
            <div style={{ marginTop: '20px' }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter message for Unity"
                />
                <button onClick={handleSendMessage}>Send to Unity</button>
            </div>
        </div>
    );
};

export default NinjaStrike;