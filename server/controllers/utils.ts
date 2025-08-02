import { Request, Response } from "express";
import { createResponse } from "../middleware";

const EXCHANGE_RATE_API_KEY = "dd21573e9c12baacd4eaf6bb014c9349";
const EXCHANGE_RATE_BASE_URL = "https://v6.exchangerate-api.com/v6";

export const convertCurrency = async (req: Request, res: Response) => {
  try {
    const { from, to, amount } = req.query;

    // Validate required parameters
    if (!from || !to || !amount) {
      return res.status(400).json(
        createResponse(false, null, "Missing required parameters: from, to, amount")
      );
    }

    // Validate amount is a number
    const numAmount = parseFloat(amount as string);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json(
        createResponse(false, null, "Amount must be a valid positive number")
      );
    }

    // Validate currency codes (should be 3 letters)
    const fromCurrency = (from as string).toUpperCase();
    const toCurrency = (to as string).toUpperCase();
    
    if (fromCurrency.length !== 3 || toCurrency.length !== 3) {
      return res.status(400).json(
        createResponse(false, null, "Currency codes must be 3 letters (e.g., USD, EUR)")
      );
    }

    // Build API URL
    const apiUrl = `${EXCHANGE_RATE_BASE_URL}/${EXCHANGE_RATE_API_KEY}/pair/${fromCurrency}/${toCurrency}/${numAmount}`;

    // Fetch exchange rate data
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if the API returned an error
    if (data.result !== "success") {
      return res.status(400).json(
        createResponse(false, null, `Currency conversion failed: ${data["error-type"] || "Unknown error"}`)
      );
    }

    // Return the converted amount
    res.json(
      createResponse(true, {
        convertedAmount: data.conversion_result,
        from: fromCurrency,
        to: toCurrency,
        originalAmount: numAmount,
        exchangeRate: data.conversion_rate
      }, "Currency converted successfully")
    );

  } catch (error) {
    console.error("Currency conversion error:", error);
    res.status(500).json(
      createResponse(false, null, "Failed to convert currency. Please try again later.")
    );
  }
};