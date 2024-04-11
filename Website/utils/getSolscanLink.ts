import { CollectionKeys, LaunchKeys, Config } from "../components/Solana/constants";
import { LaunchData } from "../components/Solana/state";
import { CollectionData } from "../components/collection/collectionState";

export const getSolscanLink = (launch: CollectionData | LaunchData, type: string) => {
    if (type === "Token") {
        return `https://solscan.io/account/${
            launch && launch.keys && launch.keys[LaunchKeys.MintAddress] ? launch.keys[LaunchKeys.MintAddress].toString() : ""
        }${Config.PROD ? "" : `?cluster=devnet`}`;
    }

    if (type === "Collection") {
        return `https://solscan.io/account/${
            launch && launch.keys && launch.keys[CollectionKeys.CollectionMint] ? launch.keys[CollectionKeys.CollectionMint].toString() : ""
        }${Config.PROD ? "" : `?cluster=devnet`}`;
    }
};