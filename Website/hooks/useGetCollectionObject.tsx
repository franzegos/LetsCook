import { CollectionV1, fetchCollectionV1 } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Config } from "@/components/Solana/constants";
import { useEffect, useState } from "react";

const useCollectionSnapshot = (mintAddress: string) => {
    const [snapshotCollection, setSnapshotCollection] = useState<CollectionV1 | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchSnapshot = async () => {
            try {
                const umi = createUmi(Config.RPC_NODE, "confirmed");
                const collectionUmiKey = publicKey(mintAddress);
                const fetchedCollection = await fetchCollectionV1(umi, collectionUmiKey);
                setSnapshotCollection(fetchedCollection);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        if (mintAddress) {
            fetchSnapshot();
        }
    }, [mintAddress]);

    return { snapshotCollection, error, loading };
};

export default useCollectionSnapshot;
