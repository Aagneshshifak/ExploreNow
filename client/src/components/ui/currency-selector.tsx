import React from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency, currencies } from '@/contexts/CurrencyContext';

interface CurrencySelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  variant = 'default', 
  className = '' 
}) => {
  const { currency, setCurrency } = useCurrency();

  const selectedCurrency = currencies.find(c => c.code === currency);

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className={`${variant === 'compact' ? 'w-32' : 'w-48'} ${className}`}>
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <SelectValue>
            {variant === 'compact' 
              ? `${selectedCurrency?.symbol} ${currency}`
              : `${selectedCurrency?.symbol} ${selectedCurrency?.name}`
            }
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{curr.symbol}</span>
              <span>{curr.name}</span>
              <span className="text-muted-foreground">({curr.code})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};