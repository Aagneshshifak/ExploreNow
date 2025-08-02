import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PriceDisplayProps {
  price: number | string;
  originalCurrency?: string;
  className?: string;
  showOriginal?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  originalCurrency = 'USD', 
  className = '',
  showOriginal = false 
}) => {
  const { formatPrice, convertPrice, currency } = useCurrency();
  
  const displayPrice = formatPrice(price, originalCurrency);
  const convertedValue = convertPrice(price, originalCurrency);
  const originalValue = typeof price === 'string' ? parseFloat(price) : price;

  if (showOriginal && originalCurrency !== currency) {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="font-semibold">{displayPrice}</span>
        <span className="text-xs text-muted-foreground">
          (Originally ${originalValue.toFixed(2)} {originalCurrency})
        </span>
      </div>
    );
  }

  return (
    <span className={`font-semibold ${className}`}>
      {displayPrice}
    </span>
  );
};

interface PriceRangeDisplayProps {
  minPrice: number | string;
  maxPrice?: number | string;
  originalCurrency?: string;
  className?: string;
}

export const PriceRangeDisplay: React.FC<PriceRangeDisplayProps> = ({ 
  minPrice, 
  maxPrice, 
  originalCurrency = 'USD', 
  className = '' 
}) => {
  const { formatPrice } = useCurrency();
  
  if (maxPrice) {
    return (
      <span className={`font-semibold ${className}`}>
        {formatPrice(minPrice, originalCurrency)} - {formatPrice(maxPrice, originalCurrency)}
      </span>
    );
  }

  return (
    <span className={`font-semibold ${className}`}>
      {formatPrice(minPrice, originalCurrency)}
    </span>
  );
};