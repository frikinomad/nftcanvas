'use client';

import React, { useState, useMemo, useEffect } from "react";
import { CanvasClient } from "@dscvr-one/canvas-client-sdk";
import '@dialectlabs/blinks/index.css';
import { Action, Blink, type ActionAdapter, useActionsRegistryInterval } from "@dialectlabs/blinks";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";

const Home: React.FC = () => {
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [metaplexExplorerUrl, setMetaplexExplorerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [reactionCount, setReactionCount] = useState<number>(0);

  const { isRegistryLoaded } = useActionsRegistryInterval();
  const { adapter } = useActionSolanaWalletAdapter('https://api.devnet.solana.com');

  useEffect(() => {
    async function fetchData() {
      try {
        const canvasClient = new CanvasClient();
        const response = await canvasClient.ready();

        const handleContentReaction = (reactionResponse: any) => {
          console.log('Reaction received:', reactionResponse);
          const status = reactionResponse.untrusted.status;

          // Handle the reaction based on the status
          if (status === 'reacted') {
            setReactionCount((prevCount) => prevCount + 1);
            console.log('User reacted to the content!');
            console.log(reactionCount);
          }
        };

        canvasClient.onContentReaction(handleContentReaction);

        // const key = await canvasClient.connectWallet();
        // console.log(key);

        if (response) {
          const user = response.untrusted.user;
          if (user) setUser(user.username);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, [reactionCount]);

  const mintNftcore = async (type: string) => {
    try {
      const response = await fetch('/api/mint-nft-core', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mintType: type, user }),
      });
      const data = await response.json();
      console.log(data);

      if (data.success) {
        setMintAddress(data.success);
        setMetaplexExplorerUrl(data.metaplexExplorerUrl || null);
        setError(null);
      } else {
        setError(data.error);
        setMetaplexExplorerUrl(null);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setMetaplexExplorerUrl(null);
    }
  };

  return (
    <>
      <div>
        <h1>Hello, World!</h1>
        <p>Welcome to your Solana Action App</p>
        {isRegistryLoaded ? <ManyActions adapter={adapter} /> : <p>Loading actions...</p>}
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="flex gap-4 mb-6">
          <div className="mb-4">
            <button
              onClick={() => {
                  if (reactionCount === 1) {
                    mintNftcore('Silver');
                  }
                }}
                className={`px-6 py-3 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${reactionCount >= 2 ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-400'}`}
                disabled={reactionCount !== 1}
              >
              Mint NFT Silver
            </button>
            {reactionCount !== 1 && <p className="text-red-500 mt-2">Not enough reactions</p>}
          </div>

          <div className="mb-4">
            <button
              onClick={() => {
                  if (reactionCount === 2) {
                      mintNftcore('Gold');
                  }
                }}
                className={`px-6 py-3 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${reactionCount >= 2 ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-400'}`}
                disabled={reactionCount !== 1}
                >
              Mint NFT Gold
            </button>
            {reactionCount !== 2 && <p className="text-red-500 mt-2">Not enough reactions</p>}
          </div>

          <div>
            {reactionCount !== 1 && reactionCount !== 2 && (
              <button
                onClick={() => mintNftcore('Default')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Mint NFT For Fun
              </button>
            )}
          </div>
        </div>

        {mintAddress && (
          <div className="text-green-600 font-semibold text-lg">
            <p>NFT Minted: <span className="text-blue-600">{mintAddress}</span></p>
            {metaplexExplorerUrl && (
              <p>
                View your NFT on Metaplex Explorer:
                <a href={metaplexExplorerUrl} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  {metaplexExplorerUrl}
                </a>
              </p>
            )}
          </div>
        )}
        {error && <p className="text-red-600 font-semibold text-lg">Error: <span className="text-red-800">{error}</span></p>}
      </div>
    </>
  );
};

const ManyActions: React.FC<{ adapter: ActionAdapter }> = ({ adapter }) => {
  const apiUrls = useMemo(() => [
    'http://localhost:3000/api/actions/mint-nft', // Your localhost link
  ], []);
  
  const [actions, setActions] = useState<Action[]>([]);
  
  useEffect(() => {
    const fetchActions = async () => {
      const promises = apiUrls.map(url => Action.fetch(url).catch(() => null));
      const actions = await Promise.all(promises);
      setActions(actions.filter(Boolean) as Action[]);
    };
    
    fetchActions();
  }, [apiUrls]);

  useEffect(() => {
    actions.forEach((action) => action.setAdapter(adapter));
  }, [actions, adapter]);

  return (
    <>
      {actions.map(action => (
        <div key={action.url} className="flex gap-2">
          <Blink action={action} websiteText={new URL(action.url).hostname} />
        </div>
      ))}
    </>
  );
};

export default Home;
