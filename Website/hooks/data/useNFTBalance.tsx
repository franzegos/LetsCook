import { useEffect, useState, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import { Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, fetchAssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { Config } from "../../components/Solana/constants";
import { NewNFTListingData, NFTListingData } from "@/components/collection/collectionState";
import { DasApiAsset, dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { das }  from '@metaplex-foundation/mpl-core-das';

interface UseTokenBalanceProps {
    collectionAddress: PublicKey | null;
}

const RATE_LIMIT_INTERVAL = 1000; // we check max once a second


export async function getOwnedCollectionAssetsDAS(collectionAddress: PublicKey, owner: PublicKey): Promise<Map<string, AssetWithMetadata>> {
    try {
        let rpc = Config.NETWORK === "eclipse" ?  Config.AURA : Config.RPC_NODE;
        const umi = createUmi(rpc, "confirmed").use(dasApi());

        var start = new Date().getTime();

        let dasAssets : DasApiAsset[] = [];
        let page = 1;
        console.log("get owned das assets")
        while (true) {
            const dasPage = await umi.rpc.searchAssets({
                interface: "MplCoreAsset",
                burnt: false,
                owner: publicKey(owner.toString()),
                grouping: ["collection", collectionAddress.toString()],
                page: page,
            });
    

            page += 1;
            dasAssets = dasAssets.concat(dasPage.items);
            if (dasPage.total < 1000) {
                break;
            }
        }

        const coreAssets = await das.dasAssetsToCoreAssets(umi, dasAssets, {
            skipDerivePlugins: true})

        console.log("Owned Das assets", dasAssets.length, dasAssets)
           
           
        const assets =[]

        var end = new Date().getTime();

        var time2 = end - start;

        console.log('Execution time: ' , time2);

        // Create a Map to store unique URIs and their corresponding metadata
        const uriMap = new Map();
        // Create a Map to store URI to multiple assets mapping
        const uriToAssets = new Map();

        // Group assets by URI
        coreAssets.forEach((asset) => {
            if (!uriToAssets.has(asset.uri)) {
                uriToAssets.set(asset.uri, []);
            }
            uriToAssets.get(asset.uri).push(asset);
        });

        // Create fetch promises only for unique URIs
        const fetchPromises = Array.from(uriToAssets.keys()).map(async (uri) => {
            try {
                const uri_json = await fetch(uri).then((res) => res.json());
                uriMap.set(uri, uri_json);
            } catch (error) {
                console.error(`Error fetching metadata for URI ${uri}:`, error);
                uriMap.set(uri, null); // or some default metadata
            }
        });

        // Wait for all unique fetches to complete
        await Promise.all(fetchPromises);

        let all_assets: Map<string, AssetWithMetadata> = new Map();

        // Process all assets using the cached metadata
        coreAssets.forEach((asset) => {
            const metadata = uriMap.get(asset.uri);
            const entry: AssetWithMetadata = { asset, metadata };

            all_assets.set(asset.publicKey.toString(), entry);
        });

        return all_assets;
    } catch (err) {
        console.log(err);
    }
    return null;
}


export async function getOwnedCollectionAssets(collectionAddress: PublicKey, owner: PublicKey): Promise<Map<string, AssetWithMetadata>> {
    try {
        let rpc = Config.RPC_NODE;
        const umi = createUmi(rpc, "confirmed").use(dasApi());

        let collection_umiKey = publicKey(collectionAddress.toString());

        var start = new Date().getTime();

        let ownerUM = publicKey(owner.toString());

        const assets = await getAssetV1GpaBuilder(umi)
        .whereField("key", Key.AssetV1)
        .whereField("owner", ownerUM)
        .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
        .getDeserialized();
        

        var end = new Date().getTime();

        console.log("RPC assets", assets.length)
        var time2 = end - start;

        console.log('Execution time: ' , time2);

        // Create a Map to store unique URIs and their corresponding metadata
        const uriMap = new Map();
        // Create a Map to store URI to multiple assets mapping
        const uriToAssets = new Map();

        // Group assets by URI
        assets.forEach((asset) => {
            if (!uriToAssets.has(asset.uri)) {
                uriToAssets.set(asset.uri, []);
            }
            uriToAssets.get(asset.uri).push(asset);
        });

        // Create fetch promises only for unique URIs
        const fetchPromises = Array.from(uriToAssets.keys()).map(async (uri) => {
            try {
                const uri_json = await fetch(uri).then((res) => res.json());
                uriMap.set(uri, uri_json);
            } catch (error) {
                console.error(`Error fetching metadata for URI ${uri}:`, error);
                uriMap.set(uri, null); // or some default metadata
            }
        });

        // Wait for all unique fetches to complete
        await Promise.all(fetchPromises);

        let all_assets: Map<string, AssetWithMetadata> = new Map();

        // Process all assets using the cached metadata
        assets.forEach((asset) => {
            const metadata = uriMap.get(asset.uri);
            const entry: AssetWithMetadata = { asset, metadata };

            all_assets.set(asset.publicKey.toString(), entry);
        });

        return all_assets;
    } catch (err) {
        console.log(err);
    }
    return null;
}

export async function getCollectionAssetsDAS(collectionAddress: PublicKey): Promise<Map<string, AssetWithMetadata>> {
    try {
        let rpc = Config.NETWORK === "eclipse" ? "https://aura-eclipse-mainnet.metaplex.com/" : Config.RPC_NODE;
        const umi = createUmi(rpc, "confirmed").use(dasApi());

        let collection_umiKey = publicKey(collectionAddress.toString());

        var start = new Date().getTime();

        let dasAssets = [];
        let page = 1;
        while (true) {
            const dasPage = await das.getAssetsByCollection(umi, { collection: collection_umiKey, page: page});

            page += 1;
            dasAssets = dasAssets.concat(dasPage);
            if (dasPage.length < 1000) {
                break;
            }
        }
        console.log("Das assets", dasAssets.length)
           
        var mid = new Date().getTime();


           
        const assets = await getAssetV1GpaBuilder(umi)
            .whereField("key", Key.AssetV1)
            .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
            .getDeserialized();

        var end = new Date().getTime();

        console.log("RPC assets", assets.length)

        var time1 = mid - start;
        var time2 = end - mid;

        console.log('Execution time: ' , time1, time2);

        // Create a Map to store unique URIs and their corresponding metadata
        const uriMap = new Map();
        // Create a Map to store URI to multiple assets mapping
        const uriToAssets = new Map();

        // Group assets by URI
        assets.forEach((asset) => {
            if (!uriToAssets.has(asset.uri)) {
                uriToAssets.set(asset.uri, []);
            }
            uriToAssets.get(asset.uri).push(asset);
        });

        // Create fetch promises only for unique URIs
        const fetchPromises = Array.from(uriToAssets.keys()).map(async (uri) => {
            try {
                const uri_json = await fetch(uri).then((res) => res.json());
                uriMap.set(uri, uri_json);
            } catch (error) {
                console.error(`Error fetching metadata for URI ${uri}:`, error);
                uriMap.set(uri, null); // or some default metadata
            }
        });

        // Wait for all unique fetches to complete
        await Promise.all(fetchPromises);

        let all_assets: Map<string, AssetWithMetadata> = new Map();

        // Process all assets using the cached metadata
        assets.forEach((asset) => {
            const metadata = uriMap.get(asset.uri);
            const entry: AssetWithMetadata = { asset, metadata };

            all_assets.set(asset.publicKey.toString(), entry);
        });

        return all_assets;
    } catch (err) {
        console.log(err);
    }
    return null;
}


export async function getCollectionAssets(collectionAddress: PublicKey) {
    try {
        const umi = createUmi(Config.RPC_NODE, "confirmed");

        let collection_umiKey = publicKey(collectionAddress.toString());
        var start = new Date().getTime();
        const assets = await getAssetV1GpaBuilder(umi)
            .whereField("key", Key.AssetV1)
            .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
            .getDeserialized();

        var end = new Date().getTime();
        console.log("time to fetch all assets", end - start);

        // Create a Map to store unique URIs and their corresponding metadata
        const uriMap = new Map();
        // Create a Map to store URI to multiple assets mapping
        const uriToAssets = new Map();

        // Group assets by URI
        assets.forEach((asset) => {
            if (!uriToAssets.has(asset.uri)) {
                uriToAssets.set(asset.uri, []);
            }
            uriToAssets.get(asset.uri).push(asset);
        });

        // Create fetch promises only for unique URIs
        const fetchPromises = Array.from(uriToAssets.keys()).map(async (uri) => {
            try {
                const uri_json = await fetch(uri).then((res) => res.json());
                uriMap.set(uri, uri_json);
            } catch (error) {
                console.error(`Error fetching metadata for URI ${uri}:`, error);
                uriMap.set(uri, null); // or some default metadata
            }
        });

        // Wait for all unique fetches to complete
        await Promise.all(fetchPromises);

        let all_assets: Map<string, AssetWithMetadata> = new Map();

        // Process all assets using the cached metadata
        assets.forEach((asset) => {
            const metadata = uriMap.get(asset.uri);
            const entry: AssetWithMetadata = { asset, metadata };

            all_assets.set(asset.publicKey.toString(), entry);
        });



        return all_assets;
    } catch (err) {
        console.log(err);
    }
    return null;
}

const useNFTBalance = (props: UseTokenBalanceProps | null) => {
    // State to store the token balance and any error messages
    const [nftBalance, setNFTBalance] = useState<number>(null);
    const [ownedAssets, setOwnedAssets] = useState<AssetWithMetadata[]>([]);
    const [collectionAssets, setCollectionAssets] = useState<Map<string, AssetWithMetadata> | null>(null);
    const [listedAssets, setListedAssets] = useState<NFTListingData[]>([]);

    const [error, setError] = useState<string | null>(null);

    const checkNFTBalance = useRef<boolean>(true);
    const checkInitialNFTBalance = useRef<boolean>(true);
    const lastFetchTime = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isExecutingRef = useRef<boolean>(false);

    // Get the Solana connection and wallet
    const { connection } = useConnection();
    const wallet = useWallet();

    const collectionAddress = props?.collectionAddress || null;

    // Function to fetch the current nft balance
    const fetchNFTBalance = useCallback(async () => {
        if (!collectionAddress) return;

        if (!checkNFTBalance.current) return;

        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTime.current;

        // If a fetch is already scheduled, don't schedule another one
        if (timeoutRef.current) return;

        // If we're currently executing a fetch, don't do anything
        if (isExecutingRef.current) return;

        // If we haven't waited long enough since the last fetch
        if (timeSinceLastFetch < RATE_LIMIT_INTERVAL) {
            // Schedule the next fetch
            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = null;
                fetchNFTBalance();
            }, RATE_LIMIT_INTERVAL - timeSinceLastFetch);
            return;
        }

        // Mark that we're executing a fetch
        isExecutingRef.current = true;

        try {
            const umi = createUmi(Config.RPC_NODE, "confirmed");

            let collection_umiKey = publicKey(collectionAddress.toString());

            const assets = await getAssetV1GpaBuilder(umi)
                .whereField("key", Key.AssetV1)
                .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
                .getDeserialized();

            // Create a Map to store unique URIs and their corresponding metadata
            const uriMap = new Map();
            // Create a Map to store URI to multiple assets mapping
            const uriToAssets = new Map();

            // Group assets by URI
            assets.forEach((asset) => {
                if (!uriToAssets.has(asset.uri)) {
                    uriToAssets.set(asset.uri, []);
                }
                uriToAssets.get(asset.uri).push(asset);
            });

            // Create fetch promises only for unique URIs
            const fetchPromises = Array.from(uriToAssets.keys()).map(async (uri) => {
                try {
                    const uri_json = await fetch(uri).then((res) => res.json());
                    uriMap.set(uri, uri_json);
                } catch (error) {
                    console.error(`Error fetching metadata for URI ${uri}:`, error);
                    uriMap.set(uri, null); // or some default metadata
                }
            });

            // Wait for all unique fetches to complete
            await Promise.all(fetchPromises);

            let owned_assets: AssetWithMetadata[] = [];
            let all_assets: Map<string, AssetWithMetadata> = new Map();

            // Process all assets using the cached metadata
            assets.forEach((asset) => {
                const metadata = uriMap.get(asset.uri);
                const entry: AssetWithMetadata = { asset, metadata };

                all_assets.set(asset.publicKey.toString(), entry);

                if (wallet && wallet.publicKey && asset.owner.toString() === wallet.publicKey.toString()) {
                    owned_assets.push(entry);
                }
            });

            setOwnedAssets(owned_assets);
            setCollectionAssets(all_assets);
            setNFTBalance(owned_assets.length);
        } catch (err) {
            setError(err.message);
        } finally {
            // Update the last fetch time and reset executing status
            lastFetchTime.current = Date.now();
            isExecutingRef.current = false;
            checkNFTBalance.current = false;
        }
    }, [collectionAddress, wallet]);

    // Effect to set up the subscription and fetch initial balance
    useEffect(() => {
        if (!collectionAddress || !wallet) {
            setNFTBalance(0);
            setOwnedAssets([]);
            setError(null);
            return;
        }

        // Fetch the initial token balance
        if (checkInitialNFTBalance.current) {
            fetchNFTBalance();
            checkInitialNFTBalance.current = false;
        }

        // Cleanup function to clear any pending timeouts
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [connection, fetchNFTBalance]);

    // Return the current nfts and any error message
    return { nftBalance, ownedAssets, collectionAssets, listedAssets, checkNFTBalance, fetchNFTBalance, error };
};

export default useNFTBalance;
