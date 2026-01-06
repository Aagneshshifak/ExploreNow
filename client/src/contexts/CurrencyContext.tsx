import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRates: Record<string, number>;
  convertPrice: (price: number | string, fromCurrency?: string) => number;
  formatPrice: (price: number | string, fromCurrency?: string) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
];

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('preferredCurrency') || 'USD';
  });
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const fetchExchangeRates = async (baseCurrency: string = 'USD') => {
    if (baseCurrency === 'USD' && Object.keys(exchangeRates).length > 0) {
      return; // Already have USD rates
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/utils/exchange-rates?base=${baseCurrency}`);
      if (response.ok) {
        const result = await response.json();
        setExchangeRates(result.data.rates || {});
      } else {
        // Fallback rates if API fails
        setExchangeRates({
          USD: 1.0,
          EUR: 0.85,
          GBP: 0.75,
          INR: 85.0,
          JPY: 110.0,
          CAD: 1.25,
          AUD: 1.40,
          CHF: 0.92,
          CNY: 7.2,
          KRW: 1300.0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Fallback rates
      setExchangeRates({
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.75,
        INR: 85.0,
        JPY: 110.0,
        CAD: 1.25,
        AUD: 1.40,
        CHF: 0.92,
        CNY: 7.2,
        KRW: 1300.0,
      });
    } finally {
      setLoading(false);
    }
  };

  const convertPrice = (price: number | string, fromCurrency: string = 'USD'): number => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 0;

    if (fromCurrency === currency) return numPrice;

    // Convert from source currency to USD first, then to target currency
    const usdPrice = fromCurrency === 'USD' ? numPrice : numPrice / (exchangeRates[fromCurrency] || 1);
    const convertedPrice = currency === 'USD' ? usdPrice : usdPrice * (exchangeRates[currency] || 1);
    
    return Math.round(convertedPrice * 100) / 100;
  };

  const formatPrice = (price: number | string, fromCurrency: string = 'USD'): string => {
    const convertedPrice = convertPrice(price, fromCurrency);
    const currencyData = currencies.find(c => c.code === currency);
    const symbol = currencyData?.symbol || currency;
    
    // Format based on currency
    if (currency === 'JPY' || currency === 'KRW') {
      return `${symbol}${Math.round(convertedPrice).toLocaleString()}`;
    } else {
      return `${symbol}${convertedPrice.toFixed(2)}`;
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    // Re-fetch rates when currency changes if we don't have rates for the new currency
    if (currency && Object.keys(exchangeRates).length > 0 && !exchangeRates[currency]) {
      fetchExchangeRates(currency);
    }
  }, [currency]);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    exchangeRates,
    convertPrice,
    formatPrice,
    loading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};