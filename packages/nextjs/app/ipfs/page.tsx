"use client";

import React, { useEffect, useState } from "react";
import lighthouse from "@lighthouse-web3/sdk";

const IpfsPage: React.FC = () => {
  // const [fileInfo, setFileInfo] = useState(null);
  const [cid, setCid] = useState<string>("");
  const [response, setResponse] = useState<any | null>(null);
  // const [jsonData, setJsonData] = useState(null);
  const [url, setUrl] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE || "";

  const progressCallback = (progressData: { total: number; uploaded: number }) => {
    const percentageDone = 100 - Number((progressData?.total / progressData?.uploaded)?.toFixed(2));
    console.log(percentageDone);
  };

  const getFileFromUrl = async (url: RequestInfo | URL) => {
    const response = await fetch(url);
    const data = await response.blob();
    const file = new File([data], "filename", { type: data.type });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const fileList = dataTransfer.files;

    return fileList;
  };

  const uploadFile = async (file: FileList | null) => {
    console.log("Uploading file:", file);
    try {
      const output = await lighthouse.upload(file, apiKey, undefined, undefined, progressCallback);
      console.log("File Status:", output);
      console.log("Visit at https://gateway.lighthouse.storage/ipfs/" + output.data.Hash);
      setCid(output.data.Hash);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleUrlSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fileList: FileList | null = await getFileFromUrl(url);
    uploadFile(fileList);
  };
  useEffect(() => {
    const fetchData = async () => {
      const text = JSON.stringify({
        id: "gameId",
        winner: "player1Address",
        loser: "player2Address",
        winnerHands: [1, 1, 1, 2, 1, 3],
        loserHands: [3, 1, 1, 3, 1, 2],
        date: "timestamp",
      });
      const name = "shikamaru"; //Optional

      const response = await lighthouse.uploadText(text, apiKey, name);
      const cid = response.data.Hash;
      const fileInfo = await lighthouse.getFileInfo(cid);

      // Fetch the JSON data from the IPFS gateway
      const jsonRes = await fetch(`https://gateway.lighthouse.storage/ipfs/${cid}`);
      const jsonData = await jsonRes.json();

      console.log("This is the json fileInfo", jsonData);
      console.log("This is the fileInfo", fileInfo);
      console.log("This is the cid", cid);
      console.log("This the the lighthouse response", response);

      // setFileInfo(fileInfo);
      setCid(cid);
      setResponse(response);
      // setJsonData(jsonData);
    };

    fetchData();
  }, [apiKey]);

  return (
    <main>
      <div className="text-center mt-8 bg-secondary p-10">
        <h1 className="text-4xl my-0">Upload a file to IPFS</h1>
        <form onSubmit={handleUrlSubmit} className="mb-4">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Enter URL"
            className="px-4 py-2 mt-5 border rounded"
          />
          <button type="submit" className="px-4 py-2 m-2 bg-blue-500 text-white rounded mt-5 hover:bg-blue-700">
            Upload from URL
          </button>
        </form>
        <input onChange={e => uploadFile(e.target.files)} type="file" className="px-4 py-2 border rounded" />
        {response && (
          <div className="mt-4">
            File successfully uploaded, please see your file by following this link:{" "}
            <a
              href={`https://gateway.lighthouse.storage/ipfs/${cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              https://gateway.lighthouse.storage/ipfs/{cid}
            </a>
          </div>
        )}
      </div>
    </main>
  );
};

export default IpfsPage;
