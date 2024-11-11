export function getBaseOutput(
    quote_input_amount: number,
    amm_base_balance: number,
    amm_quote_balance: number,
    fee: number,
    baseDecimals: number,
): number[] {
    let amm_quote_fee = Math.ceil((quote_input_amount * fee) / 100 / 100);
    let input_ex_fees = quote_input_amount - amm_quote_fee;

    let base_output = (input_ex_fees * amm_base_balance) / (amm_quote_balance + input_ex_fees) / Math.pow(10, baseDecimals);

    let price = amm_quote_balance / Math.pow(10, 9) / (amm_base_balance / Math.pow(10, baseDecimals));
    let base_no_slip = input_ex_fees / Math.pow(10, 9) / price;

    return [base_output, base_no_slip];
}

export function getQuoteOutput(
    base_input_amount: number,
    amm_base_balance: number,
    amm_quote_balance: number,
    fee: number,
    quoteDecimals: number,
    baseDecimals: number,
): number[] {
    let amm_base_fee = Math.ceil((base_input_amount * fee) / 100 / 100);
    let input_ex_fees = base_input_amount - amm_base_fee;

    let quote_output = (input_ex_fees * amm_quote_balance) / (amm_base_balance + input_ex_fees) / Math.pow(10, quoteDecimals);

    let price = amm_quote_balance / Math.pow(10, quoteDecimals) / (amm_base_balance / Math.pow(10, baseDecimals));
    let quoteNoSlip = (input_ex_fees / Math.pow(10, baseDecimals)) * price;

    return [quote_output, quoteNoSlip];
}
