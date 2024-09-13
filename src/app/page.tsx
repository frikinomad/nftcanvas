'use client';

import React, { useState, useMemo, useEffect, act } from "react";
import { CanvasClient } from "@dscvr-one/canvas-client-sdk";
import '@dialectlabs/blinks/index.css';
import { Action, Blink, type ActionAdapter, useActionsRegistryInterval, MultiValueActionComponent } from "@dialectlabs/blinks";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";

const Home: React.FC = () => {
  const [user, setUser] = useState<string | null>('');
  const [reactionCount, setReactionCount] = useState<number>(0);

  const { isRegistryLoaded } = useActionsRegistryInterval();
  const { adapter } = useActionSolanaWalletAdapter('https://api.devnet.solana.com');

  useEffect(() => {
    async function fetchData() {
      try {
        const canvasClient = new CanvasClient();
        const response = await canvasClient.ready();

        const handleContentReaction = async (reactionResponse: { untrusted: { status: any; }; }) => {
          console.log('Reaction received:', reactionResponse);
          const status = reactionResponse.untrusted.status;
          console.log('Reaction status:', status);

          if (status === 'reacted') {
              // Use functional form of setReactionCount to update based on the previous value
              await setReactionCount(prevCount => {
                  const new_count = prevCount + 1;
                  console.log('New reaction count:', new_count);
                  return new_count; // Return the updated value
              });

              // console.log('User reacted to the content!');
          }
        };

        canvasClient.onContentReaction(handleContentReaction);

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

  return (
    <div>
      {isRegistryLoaded ? <ManyActions adapter={adapter} reactionCount={reactionCount} user={user ?? 'defaultUser'} /> : <p>Loading actions...</p>}
    </div> 
  );
};

const ManyActions: React.FC<{ adapter: ActionAdapter, reactionCount: number, user: string }> = ({ adapter, reactionCount, user }) => {
  const apiUrls = useMemo(() => [
    'http://localhost:3000/api/actions/mint-nft', // Your localhost link
  ], []);
  
  const [actions, setActions] = useState<Action[]>([]);
  
  useEffect(() => {
    const fetchActions = async () => {
      // fetch all URLs & then wait for them to be completed
      const promises = apiUrls.map(url => {
        const modifiedUrl = new URL(url);

        if (reactionCount == 1) {
          modifiedUrl.searchParams.append('param', 'Gold');
        } else if (reactionCount == 0) {
          modifiedUrl.searchParams.append('param', 'Silver');
        } else {
          modifiedUrl.searchParams.append('param', 'Default');
        }
        modifiedUrl.searchParams.append('user', user);
        return Action.fetch(modifiedUrl.toString()).catch(() => null);
      });
      const actions = await Promise.all(promises);
      console.log(actions);
      
      
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
