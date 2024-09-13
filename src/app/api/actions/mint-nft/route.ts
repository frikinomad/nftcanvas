import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
} from '@solana/actions';
import { create, mplCore } from '@metaplex-foundation/mpl-core'
import {
  base58,
  createGenericFile,
  generateSigner,
  keypairIdentity,
  sol,
} from '@metaplex-foundation/umi'
// import { Transaction, VersionedTransaction } from '@solana/web3.js'; // Adjust import based on your library
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import fs from 'fs'
import path from 'path'


const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const typeParam = requestUrl.searchParams.get('param')!
    const userParam = requestUrl.searchParams.get('user')!
    

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
        "Congratulations on reaching Milestone 🎉🎉 Unlock exclusive NFTs by hitting engagement milestones: 🌟 Silver NFT: Available at 0 reactions 🏆 Gold NFT: Available at 1 reaction ",
      label: 'Transfer',  // will be ignored but needs to be here
      links: {
        actions: [
          {
            label: `Mint  ${typeParam} NFT`, // button text
            href: `${baseHref}&type=${typeParam}&user=${userParam}`,
          },
          // {
          //   label: 'Mint Gold NFT', // button text
          //   href: `${baseHref}&type=${'Gold'}`,
          // }
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
export const OPTIONS = async (req: Request) => {
  return new Response(null, { headers });
};

export const POST = async (req: Request) => {
  try {

    const requestUrl = new URL(req.url);
    
    const mintType = requestUrl.searchParams.get('type')!
    const user = requestUrl.searchParams.get('user')!
    
    
    const umi = createUmi('https://api.devnet.solana.com')
    .use(mplCore())
    .use(irysUploader())
    
    const walletFilePath = path.join(process.cwd(), 'src', '..', 'wallet.json');
    const walletFile = fs.readFileSync(walletFilePath, 'utf8');
    const secretKeyArray = new Uint8Array(JSON.parse(walletFile));
    const keypair = umi.eddsa.createKeypairFromSecretKey(secretKeyArray);
    umi.use(keypairIdentity(keypair));
    
    const balance = await umi.rpc.getBalance(umi.identity.publicKey);
    if (balance < sol(1)) {
      console.log('Balance is less than 1 SOL, airdropping 1 SOL...');
      await umi.rpc.airdrop(umi.identity.publicKey, sol(1));
      console.log('Airdrop complete.');
    } else {
      console.log('Balance is sufficient:', balance );
    }


    // ** using uploaded images on Arweave **
    let imageUriString = '' 
    if(mintType == "Silver"){
      imageUriString = 'https://arweave.net/02hEPqsjtuiRTWxmUjH4pG7DhHcWhkgvQV4xJz6mCdM'
    }else if(mintType == "Gold"){
      imageUriString = 'https://arweave.net/tcWkmCJ-veSF0VMsYN0DhdOOHXaMKd_RTFKzYoIYLuA'
    }else if(mintType == "Default"){
      imageUriString = 'https://arweave.net/w39YFAUdVfHnlGjoGoL2idOFyfN6P75RMLKbykF8kK4'
      console.log("imageUriString", imageUriString);
    }
    

    // ** Upload Metadata to Arweave **
    const metadata = {
      name: user || 'My NFT Core',
      description: `Congratulations on ${mintType} Milestone`,
      image: imageUriString,
      external_url: 'https://example.com',
      attributes: [
        {
          trait_type: 'trait1',
          value: 'value1',
        },
        {
          trait_type: 'trait2',
          value: 'value2',
        },
      ],
      properties: {
        files: [
          {
            uri: imageUriString,
            type: 'image/jpeg',
          },
        ],
        category: 'image',
      },
    }
    
    console.log('Uploading Metadata...')
    const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
      throw new Error(err)
    })


    // We generate a signer for the NFT
    const nftSigner = generateSigner(umi)
    console.log('Creating NFT...')
    await create(umi, { asset: nftSigner, name: user ? `My ${user} Core` : "My NFT Core", uri: metadataUri,}).sendAndConfirm(umi)

    console.log('View NFT on Metaplex Explorer')
    console.log(`https://core.metaplex.com/explorer/${nftSigner.publicKey}?env=devnet`)
    const metaplexExplorerUrl = `https://core.metaplex.com/explorer/${nftSigner.publicKey}?env=devnet`;
    console.log(nftSigner.publicKey);
    

    // Connect to the Solana cluster
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Fetch recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create a new transaction
    const fakeTransaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey('FWXHZxDocgchBjADAxSuyPCVhh6fNLT7DUggabAsuz1y') });

    // Create fake instructions
    const fakeInstruction = new TransactionInstruction({
        keys: [{ pubkey: new PublicKey('FWXHZxDocgchBjADAxSuyPCVhh6fNLT7DUggabAsuz1y'), isSigner: false, isWritable: true }],
        programId: new PublicKey('FWXHZxDocgchBjADAxSuyPCVhh6fNLT7DUggabAsuz1y'),
        data: Buffer.from('YourInstructionDataHere'), // Replace with actual data if needed
    });

    // Add the fake instruction to the transaction
    fakeTransaction.add(fakeInstruction);


    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: fakeTransaction,
        message: `metaplexUrl = ${metaplexExplorerUrl}`,
      },
    });

    
    // TODO: see if this is alright
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
