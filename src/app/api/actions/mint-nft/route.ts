import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
} from '@solana/actions';
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);

    const baseHref = new URL(
      `/api/actions/mint-nft?`,
      requestUrl.origin,
    ).toString();    
    console.log(baseHref);
    

    const payload: ActionGetResponse = {
      type: 'action',
      title: 'Mint Your NFT',
      icon: 'https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/',
      description:
        'Congratulations on reaching Milestone 🎉🎉',
      label: 'Transfer',  // will be ignored but needs to be here
      links: {
        actions: [
          {
            label: 'Mint Silver NFT', // button text
            href: `${baseHref}&type=${'Silver'}`,
          },
          {
            label: 'Mint Gold NFT', // button text
            href: `${baseHref}&type=${'Gold'}`,
          },
          {
            label: 'Mint NFT for Fun', // button text
            href: `${baseHref}&type=${'Default'}`,
          },
        ],
      },
    };

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let message = 'An unknown error occurred';
    if (typeof err == 'string') message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
// export const OPTIONS = async (req: Request) => {
//   return new Response(null, { headers });
// };

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    // const { type } = validatedQueryParams(requestUrl);
    // console.log(requestUrl.searchParams.get('to')!);
    const type = requestUrl.searchParams.get('type')!
    console.log(type);
    
    

    const body: ActionPostRequest = await req.json();
    console.log(body);
    

    // validate the client provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers,
      });
    }

    const connection = new Connection(
      process.env.SOLANA_RPC! || clusterApiUrl('devnet'),
    );

    // ensure the receiving account will be rent exempt
    const minimumBalance = await connection.getMinimumBalanceForRentExemption(
      0, // note: simple accounts that just store native SOL have `0` bytes of data
    );
    // if (amount * LAMPORTS_PER_SOL < minimumBalance) {
    //   throw `account may not be rent exempt`;
    // }

    // // create an instruction to transfer native SOL from one wallet to another
    // const transferSolInstruction = SystemProgram.transfer({
    //   fromPubkey: account,
    //   toPubkey: toPubkey,
    //   lamports: amount * LAMPORTS_PER_SOL,
    // });

    // get the latest blockhash amd block height
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    // // create a legacy transaction
    // const transaction = new Transaction({
    //   feePayer: account,
    //   blockhash,
    //   lastValidBlockHeight,
    // }).add(transferSolInstruction);

    // versioned transactions are also supported
    // const transaction = new VersionedTransaction(
    //   new TransactionMessage({
    //     payerKey: account,
    //     recentBlockhash: blockhash,
    //     instructions: [transferSolInstruction],
    //   }).compileToV0Message(),
    //   // note: you can also use `compileToLegacyMessage`
    // );

    // // const payload: ActionPostResponse = await createPostResponse({
    //   fields: {
    //     transaction,
    //     message: `Sent ${amount} SOL to Alice: ${toPubkey.toBase58()}`,
    //   },
    //   // note: no additional signers are needed
    //   // signers: [],
    // });

    // return Response.json(payload, {
    //   headers,
    // });
    return Response.json("payload", {
      headers,
    });
  } catch (err) {
    console.log(err);
    let message = 'An unknown error occurred';
    if (typeof err == 'string') message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

function validatedQueryParams(requestUrl: URL) {
  let amount: number = 0.1;

  try {
    if (requestUrl.searchParams.get('amount')) {
      amount = parseFloat(requestUrl.searchParams.get('amount')!);
    }

    if (amount <= 0) throw 'amount is too small';
  } catch (err) {
    throw 'Invalid input query parameter: amount';
  }

  return {
    amount,
  };
}