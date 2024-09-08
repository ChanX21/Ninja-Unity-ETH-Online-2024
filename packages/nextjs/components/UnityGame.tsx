"use client";

import React, { useEffect, useRef, useState } from "react";
// import { createUnityInstance } from "../Build/BuildTest.loader.js";
import "../styles/UnityGame.css";

const UnityGame = () => {
    const canvasRef = useRef(null);
    const loadingBarRef = useRef(null);
    const progressBarFullRef = useRef(null);
    const fullscreenButtonRef = useRef(null);
    const warningBannerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unityShowBanner = (msg, type) => {
            const updateBannerVisibility = () => {
                if (warningBannerRef.current) {
                    warningBannerRef.current.style.display = warningBannerRef.current.children.length ? "block" : "none";
                }
            };

            const div = document.createElement("div");
            div.innerHTML = msg;
            if (warningBannerRef.current) {
                warningBannerRef.current.appendChild(div);
            }

            if (type === "error") div.style = "background: red; padding: 10px;";
            else if (type === "warning") {
                div.style = "background: yellow; padding: 10px;";
                setTimeout(() => {
                    if (warningBannerRef.current) {
                        warningBannerRef.current.removeChild(div);
                        updateBannerVisibility();
                    }
                }, 5000);
            }
            updateBannerVisibility();
        };

        const buildUrl = "../Build"; // Updated to reflect the true path
        const config = {
            dataUrl: buildUrl + "/BuildTest.data.br",
            frameworkUrl: buildUrl + "/BuildTest.framework.js.br",
            codeUrl: buildUrl + "/BuildTest.wasm.br",
            streamingAssetsUrl: "StreamingAssets",
            companyName: "DefaultCompany",
            productName: "WebGLTest",
            productVersion: "1.0",
            showBanner: unityShowBanner,
        };

        console.log("Unity config:", config);

        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            unityShowBanner("WebGL builds are not supported on mobile devices.");
        } else if (canvasRef.current) {
            canvasRef.current.style.width = "960px";
            canvasRef.current.style.height = "600px";
        }

        if (loadingBarRef.current) {
            loadingBarRef.current.style.display = "block";
        }

        if (typeof createUnityInstance === "function" && canvasRef.current) {
            console.log("createUnityInstance is a function and canvas is available");
            createUnityInstance(canvasRef.current, config, progress => {
                if (progressBarFullRef.current) {
                    progressBarFullRef.current.style.width = 100 * progress + "%";
                }
            })
                .then(unityInstance => {
                    console.log("Unity instance created successfully");
                    if (loadingBarRef.current) {
                        loadingBarRef.current.style.display = "none";
                    }
                    if (fullscreenButtonRef.current) {
                        fullscreenButtonRef.current.onclick = () => {
                            unityInstance.SetFullscreen(1);
                        };
                    }
                })
                .catch(message => {
                    console.error("Unity instance creation error:", message);
                    setError("Unity instance creation error: " + message);
                });
        } else {
            console.error("createUnityInstance is not a function or canvas is not available");
            setError("createUnityInstance is not a function or canvas is not available");
        }
    }, []);

    return (
        <div
            style={{
                padding: "20px 0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "calc(100vh - 200px)",
            }}
        >
            {error ? (
                <div style={{ color: "red" }}>{error}</div>
            ) : (
                <div id="unity-container" className="unity-desktop">
                    <canvas ref={canvasRef} id="unity-canvas" width={960} height={600}></canvas>
                    <div ref={loadingBarRef} id="unity-loading-bar">
                        <div id="unity-logo"></div>
                        <div id="unity-progress-bar-empty">
                            <div ref={progressBarFullRef} id="unity-progress-bar-full"></div>
                        </div>
                    </div>
                    <div ref={warningBannerRef} id="unity-warning">
                        {" "}
                    </div>
                    <div id="unity-footer">
                        <div id="unity-webgl-logo"></div>
                        <div ref={fullscreenButtonRef} id="unity-fullscreen-button"></div>
                        <div id="unity-build-title">WebGLTest</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnityGame;