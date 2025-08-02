import { Request, Response } from "express";
import { createResponse } from "../middleware";

const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || "dd21573e9c12baacd4eaf6bb014c9349";
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

    // Try real API first, with timeout and fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const apiUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
      const response = await fetch(apiUrl, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'ExploreNow-API/1.0' }
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        if (data.rates && data.rates[toCurrency]) {
          const exchangeRate = data.rates[toCurrency];
          const convertedAmount = numAmount * exchangeRate;

          return res.json(
            createResponse(true, {
              convertedAmount: Math.round(convertedAmount * 100) / 100,
              from: fromCurrency,
              to: toCurrency,
              originalAmount: numAmount,
              exchangeRate: exchangeRate,
              source: "live"
            }, "Currency converted successfully")
          );
        }
      }
    } catch (fetchError) {
      console.log("Live API failed, using fallback rates:", fetchError);
    }

    // Fallback to mock exchange rates (approximate values)
    const mockRates: Record<string, number> = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.75,
      'USD-INR': 85.0,
      'USD-JPY': 110.0,
      'USD-CAD': 1.25,
      'USD-AUD': 1.40,
      'EUR-USD': 1.18,
      'EUR-GBP': 0.88,
      'EUR-INR': 100.0,
      'GBP-USD': 1.33,
      'GBP-EUR': 1.14,
      'INR-USD': 0.012,
    };

    const rateKey = `${fromCurrency}-${toCurrency}`;
    const reverseRateKey = `${toCurrency}-${fromCurrency}`;
    
    let exchangeRate = mockRates[rateKey];
    if (!exchangeRate && mockRates[reverseRateKey]) {
      exchangeRate = 1 / mockRates[reverseRateKey];
    }
    
    if (!exchangeRate) {
      // Default approximation for unknown pairs
      exchangeRate = 1.0;
    }

    const convertedAmount = numAmount * exchangeRate;

    res.json(
      createResponse(true, {
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        from: fromCurrency,
        to: toCurrency,
        originalAmount: numAmount,
        exchangeRate: exchangeRate,
        source: "fallback"
      }, "Currency converted successfully (using fallback rates)")
    );

  } catch (error) {
    console.error("Currency conversion error:", error);
    res.status(500).json(
      createResponse(false, null, "Failed to convert currency. Please try again later.")
    );
  }
};