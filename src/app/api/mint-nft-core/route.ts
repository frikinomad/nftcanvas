export const maxDuration = 10; // This function can run for a maximum of 5 seconds

import { NextRequest, NextResponse } from 'next/server'
import { create, mplCore } from '@metaplex-foundation/mpl-core'
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  signerIdentity,
  sol,
} from '@metaplex-foundation/umi'
import { base58 } from '@metaplex-foundation/umi/serializers'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import fs from 'fs'
import path from 'path'

const createNft = async () => {

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


  // ** Upload an image to Arweave **

  const imageFile = fs.readFileSync(
    path.join(process.cwd(), 'uploads', 'image.png')
  )

  const umiImageFile = createGenericFile(imageFile, 'image.png', {
    tags: [{ name: 'Content-Type', value: 'image/png' }],
  })

  console.log('Uploading Image...')
  const imageUri = await umi.uploader.upload([umiImageFile]).catch((err) => {
    throw new Error(err)
  })

  console.log('imageUri: ' + imageUri[0])

  // ** Upload Metadata to Arweave **
  const metadata = {
    name: 'My NFT',
    description: 'This is an NFT on Solana',
    image: imageUri[0],
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
          uri: imageUri[0],
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

  // ** Creating the NFT **

  // We generate a signer for the NFT
  const nftSigner = generateSigner(umi)

  console.log('Creating NFT...')
  const tx = await create(umi, {
    asset: nftSigner,
    name: 'My NFT',
    uri: metadataUri,
  }).sendAndConfirm(umi)

  const signature = base58.deserialize(tx.signature)[0]

  console.log('\nNFT Created')
  console.log('View Transaction on Solana Explorer')
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  console.log('\n')
  console.log('View NFT on Metaplex Explorer')
  console.log(`https://core.metaplex.com/explorer/${nftSigner.publicKey}?env=devnet`)

  const solanaExplorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  const metaplexExplorerUrl = `https://core.metaplex.com/explorer/${nftSigner.publicKey}?env=devnet`;

  return { solanaExplorerUrl, metaplexExplorerUrl };
}


export async function POST(req: NextRequest) {
    try {
        const { solanaExplorerUrl, metaplexExplorerUrl } = await createNft();
        return NextResponse.json({ 
            success: true,
            solanaExplorerUrl,
            metaplexExplorerUrl
        });
    } catch (error) {
        console.error('Error creating NFT:', error);

        // Ensure error is serializable
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
