import { AMMPluginData } from "@/components/Solana/jupiter_state";
import { bignum_to_num } from "@/components/Solana/state";

export function CalculateChunkedOutput(
    inputAmount: number,
    quoteAmount: number,
    baseAmount: number,
    fee: number,
    pluginData: AMMPluginData,
    baseDecimals: number,
    quoteDecimals?: number,
): number[] {
    let maxChunks = 50;
    let min_chunk_size = 100;
    let chunks = Math.min(maxChunks, Math.floor(inputAmount / min_chunk_size) + 1);

    if (chunks === 0) return [0, 0];

    let chunkSize = inputAmount / chunks;
    let currentQuote = quoteAmount;
    let currentBase = baseAmount;
    let totalOutput = 0;
    let noSlipOutput = 0;

    for (let i = 0; i < chunks; i++) {
        let scaling = getScalingFactor(currentQuote, pluginData);
        let amm_quote_fee = (chunkSize * fee) / 100 / 100;
        let input_ex_fees = chunkSize - amm_quote_fee;
        let scaledInput = input_ex_fees * scaling;
        //console.log("chunk", i, "input", chunkSize, "fee", amm_quote_fee, "ex", input_ex_fees);
        let output = (scaledInput * currentBase) / (currentQuote + scaledInput);

        let price = currentQuote / Math.pow(10, 9) / (currentBase / Math.pow(10, baseDecimals));
        let base_no_slip = scaledInput / Math.pow(10, 9) / price;

        //console.log("chunk", i, "input", chunkSize, "output", output / Math.pow(10, baseDecimals), "NoSlip", base_no_slip, "slippage", 100 * (base_no_slip / (output / Math.pow(10, baseDecimals)) - 1));

        noSlipOutput += base_no_slip;

        totalOutput += output;
        currentQuote += chunkSize;
        currentBase -= output;
    }

    return [totalOutput / Math.pow(10, baseDecimals), noSlipOutput];
}

function getScalingFactor(quoteAmount: number, pluginData: AMMPluginData): number {
    let threshold = bignum_to_num(pluginData.liquidity_threshold);
    //console.log("Scaling factor", quoteAmount, threshold,  Math.min(1, ((pluginData.liquidity_scalar / 10) * quoteAmount) / threshold));
    if (quoteAmount > threshold) {
        return 1.0;
    }

    let scaling = Math.min(1, ((pluginData.liquidity_scalar / 10) * quoteAmount) / threshold);
    if (scaling > 1) return 1;

    if (scaling < 0.0002) return 0.0002;

    return scaling;
}
