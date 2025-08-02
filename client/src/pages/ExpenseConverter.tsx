import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  ArrowLeftRight,
  Calculator,
  Globe,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface ConversionResult {
  convertedAmount: number;
  from: string;
  to: string;
  originalAmount: number;
  exchangeRate: number;
  source: string;
}

const currencies = [
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

export default function ExpenseConverter() {
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const { toast } = useToast();

  const convertMutation = useMutation({
    mutationFn: async (data: { from: string; to: string; amount: number }) => {
      const response = await fetch(
        `/api/utils/convert-currency?from=${data.from}&to=${data.to}&amount=${data.amount}`,
        {
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to convert currency');
      }
      
      const result = await response.json();
      return result.data as ConversionResult;
    },
    onError: (error) => {
      toast({
        title: "Conversion Failed",
        description: "Unable to convert currency. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConvert = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert.",
        variant: "destructive",
      });
      return;
    }

    convertMutation.mutate({
      from: fromCurrency,
      to: toCurrency,
      amount: parseFloat(amount)
    });
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const result = convertMutation.data;

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Calculator className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Currency Converter</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Convert your travel expenses with real-time exchange rates
            </p>
          </div>

          {/* Converter Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Currency Conversion</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Amount</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Currency Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSwapCurrencies}
                    className="rounded-full"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Convert Button */}
              <Button
                onClick={handleConvert}
                disabled={convertMutation.isPending || !amount}
                className="w-full"
                size="lg"
              >
                {convertMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Converting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Convert Currency
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg text-muted-foreground">{result.from}</div>
                        <div className="text-2xl font-bold">
                          {currencies.find(c => c.code === result.from)?.symbol}
                          {result.originalAmount.toLocaleString()}
                        </div>
                      </div>
                      
                      <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                      
                      <div className="text-center">
                        <div className="text-lg text-muted-foreground">{result.to}</div>
                        <div className="text-3xl font-bold text-primary">
                          {currencies.find(c => c.code === result.to)?.symbol}
                          {result.convertedAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Exchange Rate: 1 {result.from} = {result.exchangeRate} {result.to}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Data source: {result.source === 'live' ? 'Live Exchange Rates' : 'Fallback Rates'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Convert Examples */}
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold mb-4">Quick Convert</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[100, 500, 1000, 5000].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="text-sm"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}