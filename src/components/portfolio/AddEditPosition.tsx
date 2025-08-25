// Add/Edit Position Component
// Form for adding new positions or editing existing ones

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/LoadingState';
import { cn } from '@/lib/utils';

interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  logo?: string;
  currentPrice: number;
}

interface PortfolioPosition {
  id?: string;
  cryptoId: string;
  symbol: string;
  name: string;
  amount: number;
  avgBuyPrice: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

interface AddEditPositionProps {
  positionId?: string;
  cryptoId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function AddEditPosition({ 
  positionId, 
  cryptoId, 
  onSuccess, 
  onCancel, 
  className 
}: AddEditPositionProps) {
  const [cryptocurrencies, setCryptocurrencies] = useState<Cryptocurrency[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(!!positionId);

  useEffect(() => {
    fetchCryptocurrencies();
    if (positionId) {
      fetchPositionData();
    }
  }, [positionId]);

  const fetchCryptocurrencies = async () => {
    try {
      setIsFetching(true);
      const response = await fetch('/api/cryptocurrencies');
      if (!response.ok) {
        throw new Error('Failed to fetch cryptocurrencies');
      }
      const data = await response.json();
      setCryptocurrencies(data.cryptocurrencies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching cryptocurrencies:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchPositionData = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(`/api/portfolio/positions/${positionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch position data');
      }
      const data = await response.json();
      const position = data.position;
      
      // Find the cryptocurrency
      const crypto = cryptocurrencies.find(c => c.id === position.cryptoId);
      if (crypto) {
        setSelectedCrypto(crypto);
      }
      
      setAmount(position.amount.toString());
      setPrice(position.avgBuyPrice.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching position data:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const validateForm = (): boolean => {
    if (!selectedCrypto) {
      setError('Please select a cryptocurrency');
      return false;
    }
    
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    const priceNum = parseFloat(price);
    if (!price || priceNum <= 0) {
      setError('Please enter a valid price');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        cryptoId: selectedCrypto!.id,
        amount: parseFloat(amount),
        avgBuyPrice: parseFloat(price),
      };

      const url = positionId 
        ? `/api/portfolio/positions/${positionId}`
        : '/api/portfolio';
      
      const method = positionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save position');
      }

      // Reset form
      setAmount('');
      setPrice('');
      setSelectedCrypto(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error saving position:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isFetching) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Position' : 'Add New Position'}</CardTitle>
          <CardDescription>
            {isEditing ? 'Update your existing position' : 'Add a new position to your portfolio'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <LoadingState message="Loading data..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Position' : 'Add New Position'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update your existing position' : 'Add a new position to your portfolio'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cryptocurrency Selection */}
          <div className="space-y-2">
            <Label htmlFor="cryptocurrency">Cryptocurrency</Label>
            <Select 
              value={selectedCrypto?.id || ''} 
              onValueChange={(value) => {
                const crypto = cryptocurrencies.find(c => c.id === value);
                setSelectedCrypto(crypto || null);
                if (crypto && !isEditing) {
                  setPrice(crypto.currentPrice.toString());
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cryptocurrency" />
              </SelectTrigger>
              <SelectContent>
                {cryptocurrencies.map((crypto) => (
                  <SelectItem key={crypto.id} value={crypto.id}>
                    <div className="flex items-center space-x-2">
                      {crypto.logo && (
                        <img 
                          src={crypto.logo} 
                          alt={crypto.symbol} 
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span>{crypto.symbol} - {crypto.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {formatCurrency(crypto.currentPrice)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              placeholder="0.00000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price per Unit (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {selectedCrypto && !isEditing && (
              <p className="text-sm text-muted-foreground">
                Current market price: {formatCurrency(selectedCrypto.currentPrice)}
              </p>
            )}
          </div>

          {/* Total Value Preview */}
          {selectedCrypto && amount && price && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Total Value</div>
              <div className="text-lg font-semibold">
                {formatCurrency(parseFloat(amount) * parseFloat(price))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !selectedCrypto || !amount || !price}
              className="flex-1"
            >
              {isLoading ? (
                <LoadingState message="Saving..." />
              ) : (
                isEditing ? 'Update Position' : 'Add Position'
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}