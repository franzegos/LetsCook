import { Rocket, Gift, Shield } from "lucide-react";
import { Button, useDisclosure } from "@chakra-ui/react";
import { CollectionKeys, SYSTEM_KEY } from "@/components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useCollection from "@/hooks/data/useCollection";
import useAssignmentData from "@/hooks/data/useAssignmentData";
import useMintRandom from "@/hooks/collections/useMintRandom";
import useClaimNFT from "@/hooks/collections/useClaimNFT";
import useNFTBalance from "@/hooks/data/useNFTBalance";
import Loader from "@/components/loader";
import PageNotFound from "@/components/pageNotFound";
import Navigation from "@/components/solardexNavigation";
import useCollectionSnapshot from "@/hooks/useGetCollectionObject";
import ReceivedAssetModal from "@/components/genericReceiveAssetModal";
import useGetUserBalance from "@/hooks/useGetUserBalance";

const AppRootPage = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();
    const pageName = "solardex";

    const { userBalance: userSOLBalance } = useGetUserBalance();

    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();

    const { collection, tokenMint } = useCollection({ pageName: pageName });

    const { assignmentData, validRandoms, asset, assetMeta } = useAssignmentData({ collection: collection });

    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(collection);
    const { ClaimNFT, isLoading: isClaimLoading } = useClaimNFT(collection, true);

    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);

    const { snapshotCollection } = useCollectionSnapshot(collectionAddress && collectionAddress.toString());

    const { nftBalance, checkNFTBalance, fetchNFTBalance } = useNFTBalance(collectionAddress ? { collectionAddress } : null);

    let isLoading = isClaimLoading || isMintRandomLoading;

    const updateAssignment = useCallback(async () => {
        // if we are started to wait for randoms then open up the modal
        if (!assignmentData.random_address.equals(SYSTEM_KEY)) {
            openAssetModal();
        }

        if (assignmentData.status < 2) {
            return;
        } else {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [assignmentData, openAssetModal, fetchNFTBalance, checkNFTBalance]);

    useEffect(() => {
        if (!assignmentData) return;

        updateAssignment();
    }, [collection, assignmentData, updateAssignment]);

    useEffect(() => {
        if (collection && wallet && wallet.connected) {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [collection, wallet, checkNFTBalance, fetchNFTBalance]);

    if (collection === null || tokenMint === null) return <Loader />;

    if (!collection) return <PageNotFound />;

    const enoughTokenBalance = userSOLBalance > 0.000325;

    const Mint = () => {
        return (
            <div className="w-full">
                {assignmentData === null || assignmentData.status > 0 ? (
                    <Button
                        h={12}
                        className="w-full"
                        onClick={() => {
                            ClaimNFT();
                        }}
                        isDisabled={isLoading || !wallet.connected || !enoughTokenBalance}
                        isLoading={isLoading}
                    >
                        {!wallet.connected
                            ? "Connect Your Wallet"
                            : !enoughTokenBalance
                              ? "Insufficient Balance"
                              : "Mint Badge (0.0003 ETH)"}
                    </Button>
                ) : (
                    <Button
                        h={12}
                        className="w-full"
                        onClick={() => {
                            if (collection.collection_meta["__kind"] === "RandomUnlimited") {
                                MintRandom();
                            }
                        }}
                        isLoading={isLoading}
                        isDisabled={isLoading}
                    >
                        Claim Your Badge
                    </Button>
                )}
                <div className="mx-auto mt-2 w-fit text-sm text-gray-400">Unlimited supply • No maximum mint per wallet</div>
                {wallet.connected && <div className="mx-auto mt-2 w-fit text-sm text-gray-400">Your Badges: {nftBalance.toString()}</div>}
            </div>
        );
    };

    return (
        <>
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 py-16 text-white">
                <Navigation />

                <main className="mx-auto mt-8 grid max-w-6xl space-y-8 px-4 md:grid-cols-2 md:px-0">
                    <div className="relative mx-auto flex max-h-fit max-w-md flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4">
                        <div className="aspect-square w-full">
                            <Image
                                src={"/images/solardex-badge.jpeg"}
                                alt="Solar Dex Badge"
                                width={400}
                                height={400}
                                className="rounded-xl"
                            />
                        </div>
                        <p>Total Minted: {snapshotCollection ? snapshotCollection.currentSize : 0}</p>
                    </div>

                    <div className="flex md:hidden">
                        <Mint />
                    </div>

                    <div className="flex w-full flex-col justify-center space-y-6 md:w-[87.5%]">
                        <div>
                            <div className="mb-3 flex items-center gap-3">
                                <h1 className="text-4xl font-bold">Solar Dex Badge NFT</h1>
                            </div>
                            <p className="text-gray-300">
                                Secure your position in the{" "}
                                <Link
                                    className="font-bold text-white underline"
                                    href={"https://eclipse.solarstudios.co/swap/"}
                                    target="_blank"
                                >
                                    Solar Dex
                                </Link>{" "}
                                ecosystem by minting the exclusive Genesis Badge NFT.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div>
                                    <Shield className="mt-1 text-yellow-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Early Adopter Status</h3>
                                    <p className="text-gray-400">
                                        Your badge serves as proof of being among the first supporters of Solar Dex.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div>
                                    <Gift className="mt-1 text-yellow-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Guaranteed Token Airdrop</h3>
                                    <p className="text-gray-400">
                                        Badge holders will receive an airdrop of Solar Dex tokens at TGE. As you contribute by generating
                                        volume and providing liquidity in Solar Dex, your rewards will increase.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div>
                                    <Rocket className="mt-1 text-yellow-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Future Utility</h3>
                                    <p className="text-gray-400">
                                        Hold your badge for potential future benefits and governance participation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex">
                            <Mint />
                        </div>
                    </div>
                </main>

                <footer className="absolute bottom-6 right-6 mx-auto hidden w-fit md:flex md:flex-col">
                    <p className="mx-auto -mb-[6px] w-fit text-sm text-gray-400">Powered By</p>
                    <Link href={"https://eclipse.letscook.wtf"} target="_blank">
                        <Image
                            src={"https://delta-edge.ardata.tech/gw/bafybeick5fyyhnnudr3h3fdud7icaq6pap4uxyfsfii2mw2mknn6cgabde"}
                            alt="Let's Cook"
                            width={120}
                            height={100}
                        />
                    </Link>
                </footer>
            </div>

            <ReceivedAssetModal
                have_randoms={validRandoms}
                isWarningOpened={isAssetModalOpen}
                closeWarning={closeAssetModal}
                assignment_data={assignmentData}
                collection={collection}
                asset={asset}
                asset_image={assetMeta}
                isLoading={isLoading}
            />
        </>
    );
};

export default AppRootPage;
