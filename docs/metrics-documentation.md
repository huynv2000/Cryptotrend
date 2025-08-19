# Blockchain Metrics Documentation

## Overview

This document provides comprehensive documentation for all blockchain metrics collected and analyzed by our platform. Each metric includes definition, calculation methodology, data sources, and interpretation guidelines.

## Usage & Growth Metrics

### 1. Daily Active Addresses (DAA)

#### Definition
**Daily Active Addresses** measures the number of unique addresses that have transacted on-chain during a 24-hour period. This is a key indicator of network activity and user engagement.

#### Calculation Methodology
```javascript
// Direct measurement from blockchain data
dailyActiveAddresses = count(unique_addresses_with_transactions_24h)

// Alternative estimation based on network characteristics
estimatedDAA = TVL * activityFactor * networkMaturity
```

#### Data Sources (Priority Order)
1. **Primary**: Artemis Dashboard
   - Free access to real-time DAA data
   - Coverage: Major blockchains
   - Update frequency: Daily

2. **Secondary**: Blockchain.com Charts API
   - Free API for Bitcoin data
   - Endpoint: `https://blockchain.info/charts/n-unique-addresses`
   - Format: JSON time series

3. **Tertiary**: Glassnode Free Tier
   - Limited free access for BTC/ETH
   - Metric: `ActiveAddresses`
   - Update frequency: Daily

4. **Fallback**: Estimation Model
   - Based on TVL and transaction volume
   - Network-specific activity factors
   - Confidence score: 60-80%

#### Interpretation

**Bullish Signals:**
- Sustained increase in DAA over 7-30 days
- DAA growth rate exceeding price growth rate
- Higher DAA than historical averages for the cycle

**Bearish Signals:**
- Declining DAA despite price increases
- DAA below 30-day moving average
- Sudden drops in DAA (>20% daily decrease)

**Confirmation Metrics:**
- Transaction volume should correlate with DAA
- Network fees should increase with higher DAA
- New addresses should show similar trends

#### Baseline Method
```javascript
// Rolling baseline calculation
baseline_7d = average(DAA_last_7_days)
baseline_30d = average(DAA_last_30_days)
baseline_90d = average(DAA_last_90_days)

// Spike detection
spike_threshold = baseline_30d + (2 * standard_deviation_30d)
growth_threshold = 30% // 7-day growth percentage
```

#### Spike Logic
```javascript
isSpike = (current_DAA > spike_threshold) OR 
          (7_day_growth > growth_threshold)
```

### 2. New Addresses (Daily)

#### Definition
**New Addresses** represents the number of addresses that are interacting with the blockchain for the first time. This metric indicates user acquisition and network adoption.

#### Calculation Methodology
```javascript
// Direct measurement
newAddresses = count(addresses_first_seen_today)

// Estimation model
estimatedNew = totalAddresses * networkGrowthRate * adoptionCycle
```

#### Data Sources
1. **Primary**: Glassnode Free Tier
   - Metric: `NewAddresses`
   - Coverage: BTC, ETH
   - Update frequency: Daily

2. **Secondary**: Blockchain.com API
   - Endpoint: `https://blockchain.info/charts/new-addresses`
   - Coverage: Bitcoin only
   - Format: JSON time series

3. **Fallback**: Growth Model
   - Based on historical growth rates
   - Market cycle adjusted
   - Confidence: 50-70%

#### Interpretation

**Bullish Signals:**
- Consistent increase in new addresses
- New address growth exceeding active address growth
- Higher than average during accumulation phases

**Bearish Signals:**
- Declining new addresses
- New addresses < active addresses (network saturation)
- Sudden drops in new address creation

**Confirmation Metrics:**
- Should correlate with social media mentions
- Exchange inflows should increase with new addresses
- Google Trends should show similar patterns

### 3. Daily Transactions

#### Definition
**Daily Transactions** measures the total number of on-chain transactions processed in a 24-hour period. This indicates network throughput and usage intensity.

#### Calculation Methodology
```javascript
// Direct count
dailyTransactions = count(transactions_24h)

// Estimation based on network capacity
estimatedTx = (network_capacity * utilization_rate) / average_tx_size
```

#### Data Sources
1. **Primary**: Artemis Dashboard
   - Real-time transaction counts
   - Multi-chain coverage
   - Update frequency: Daily

2. **Secondary**: Blockchain.com API
   - Endpoint: `https://blockchain.info/charts/n-transactions`
   - Coverage: Bitcoin
   - Format: JSON time series

3. **Tertiary**: Chain-specific explorers
   - Etherscan, Solscan, BscScan
   - Free API access
   - Update frequency: Real-time

#### Interpretation

**Bullish Signals:**
- Increasing transaction volume
- Transactions per active address increasing
- Higher than historical averages

**Bearish Signals:**
- Declining transactions despite price increases
- Transactions per address decreasing
- Network congestion (high fees, low throughput)

**Confirmation Metrics:**
- Should correlate with active addresses
- Network fees should increase with transaction volume
- Block space utilization should be consistent

### 4. On-chain Transaction Volume (USD)

#### Definition
**On-chain Transaction Volume** represents the total USD value of all transactions processed on-chain in a 24-hour period. This measures economic activity and capital flow.

#### Calculation Methodology
```javascript
// Direct calculation
volumeUSD = sum(transaction_amounts_usd_24h)

// Winsorized calculation (to handle outliers)
volumeUSD_winsorized = sum(cap(transaction_amounts, percentile_99))
```

#### Data Sources
1. **Primary**: Artemis Dashboard
   - USD volume data
   - Multi-chain coverage
   - Update frequency: Daily

2. **Secondary**: Token Terminal
   - Volume metrics
   - Standardized USD calculation
   - Update frequency: 15-30 minutes

3. **Fallback**: Estimation Model
   - Based on market cap and transaction count
   - Network-specific multipliers
   - Confidence: 70-85%

#### Interpretation

**Bullish Signals:**
- Increasing volume with price increases
- Volume higher than 30-day average
- Volume growth exceeding price growth

**Bearish Signals:**
- Declining volume despite price increases
- Volume below 30-day average
- Large volume spikes with price declines

**Confirmation Metrics:**
- Should correlate with exchange volume
- Active addresses should increase with volume
- Network fees should correlate with volume

### 5. Fees / Network Revenue (Daily)

#### Definition
**Network Revenue** represents the total transaction fees paid by users in a 24-hour period. For PoW chains, this goes to miners; for PoS, to validators; some chains burn fees.

#### Calculation Methodology
```javascript
// Direct calculation
networkRevenue = sum(all_transaction_fees_24h)

// For deflationary chains
networkRevenue = transaction_fees + token_burned
```

#### Data Sources
1. **Primary**: DeFi Llama API
   - Fees data by chain
   - Comprehensive coverage
   - Update frequency: 5-10 minutes

2. **Secondary**: Token Terminal
   - Revenue metrics
   - Standardized calculation
   - Update frequency: 15-30 minutes

3. **Tertiary**: Glassnode Free Tier
   - Fee metrics for BTC/ETH
   - Historical data
   - Update frequency: Daily

#### Interpretation

**Bullish Signals:**
- Increasing fees with network usage
- Fees as percentage of transaction value stable
- Higher fees during bull markets (normal)

**Bearish Signals:**
- Extremely high fees (network congestion)
- Declining fees despite increasing usage
- Fees as percentage of value too high

**Confirmation Metrics:**
- Should correlate with transaction volume
- Miner/validator revenue should be healthy
- User cost should remain reasonable

### 6. TVL (Total Value Locked)

#### Definition
**Total Value Locked** represents the total USD value of assets locked in smart contracts on the blockchain. This is a key metric for DeFi adoption and ecosystem health.

#### Calculation Methodology
```javascript
// Direct calculation
TVL = sum(all_protocol_tvl_usd)

// Price-adjusted TVL
TVL_price_adjusted = sum(token_amounts * historical_prices)
```

#### Data Sources
1. **Primary**: DeFi Llama API
   - Most comprehensive TVL data
   - Real-time updates
   - Multi-chain coverage
   - Endpoint: `https://api.llama.fi/v2/chains/{chain}`

2. **Secondary**: Token Terminal
   - TVL metrics
   - Financial context
   - Update frequency: 15-30 minutes

3. **Fallback**: Estimation Model
   - Based on market cap and DeFi penetration
   - Protocol-specific multipliers
   - Confidence: 75-90%

#### Interpretation

**Bullish Signals:**
- Consistent TVL growth
- TVL growth exceeding price growth
- New protocols joining ecosystem

**Bearish Signals:**
- Declining TVL despite price stability
- TVL below 30-day average
- Large outflows from major protocols

**Confirmation Metrics:**
- Should correlate with DeFi user growth
- Stablecoin supply should support TVL
- Protocol revenue should increase with TVL

## Cash Flow Metrics

### 7. Cross-chain Net Inflow (Bridged)

#### Definition
**Cross-chain Net Inflow** measures the net value of assets bridged into the chain from other blockchains. This indicates capital rotation and ecosystem attractiveness.

#### Calculation Methodology
```javascript
// Direct calculation
netInflow = total_bridged_in - total_bridged_out

// By bridge
netInflow_by_bridge = sum(bridge_inflows - bridge_outflows)
```

#### Data Sources
1. **Primary**: Artemis Flows Dashboard
   - Cross-chain flow data
   - Bridge-specific breakdown
   - Update frequency: Daily

2. **Secondary**: DeFi Llama Bridges
   - Bridge volume data
   - Multi-chain coverage
   - Update frequency: 5-10 minutes

3. **Fallback**: TVL Change Analysis
   - Based on TVL changes excluding price effects
   - Bridge volume estimation
   - Confidence: 60-75%

#### Interpretation

**Bullish Signals:**
- Consistent positive net inflows
- Inflows from major chains (ETH, BTC)
- Increasing bridge diversity

**Bearish Signals:**
- Negative net inflows
- Outflows to competing chains
- Concentration in few bridges

**Confirmation Metrics:**
- Should correlate with TVL growth
- Stablecoin supply should increase
- DEX volume should increase with inflows

### 8. Stablecoin Supply on Chain

#### Definition
**Stablecoin Supply** measures the total USD value of stablecoins circulating on the blockchain. This represents available "dry powder" for trading and investment.

#### Calculation Methodology
```javascript
// Direct calculation
stablecoinSupply = sum(all_stablecoin_balances_usd)

// By stablecoin type
stablecoinSupply_by_type = sum(USDC_balance + USDT_balance + DAI_balance + ...)
```

#### Data Sources
1. **Primary**: DeFi Llama Stablecoins API
   - Comprehensive stablecoin data
   - Real-time updates
   - Multi-chain coverage

2. **Secondary**: Token Terminal
   - Stablecoin metrics
   - Historical trends
   - Update frequency: 15-30 minutes

3. **Fallback**: Estimation Model
   - Based on TVL and market conditions
   - Chain-specific adoption rates
   - Confidence: 80-90%

#### Interpretation

**Bullish Signals:**
- Increasing stablecoin supply
- Supply growth exceeding TVL growth
- Diverse stablecoin types

**Bearish Signals:**
- Declining stablecoin supply
- Supply concentration in few tokens
- Stablecoin redemptions accelerating

**Confirmation Metrics:**
- Should correlate with trading volume
- Exchange balances should move inversely
- Premium/discount to peg should be stable

### 9. Exchange Netflow (Native Token)

#### Definition
**Exchange Netflow** measures the net movement of native tokens to/from centralized exchanges. Positive values indicate accumulation, negative values indicate distribution.

#### Calculation Methodology
```javascript
// Direct calculation
exchangeNetflow = exchange_inflows - exchange_outflows

// By exchange
netflow_by_exchange = sum(exchange_inflows - exchange_outflows)
```

#### Data Sources
1. **Primary**: CryptoQuant Free Tier
   - Exchange flow data
   - Multiple exchanges covered
   - Update frequency: 15-30 minutes

2. **Secondary**: Glassnode Free Tier
   - Exchange metrics for BTC/ETH
   - Historical data
   - Update frequency: Daily

3. **Fallback**: On-chain Analysis
   - Labeled exchange addresses
   - Transaction pattern analysis
   - Confidence: 65-80%

#### Interpretation

**Bullish Signals:**
- Consistent negative netflow (outflows)
- Outflows exceeding inflows by >20%
- Outflows across multiple exchanges

**Bearish Signals:**
- Positive netflow (inflows)
- Large inflow spikes
- Concentration in few exchanges

**Confirmation Metrics:**
- Should correlate with price action
- Exchange reserves should decrease with outflows
- OI (Open Interest) should support flow direction

### 10. Large Transactions Volume (> $100k)

#### Definition
**Large Transactions Volume** measures the total USD value of transactions exceeding $100,000. This indicates whale and institutional activity.

#### Calculation Methodology
```javascript
// Direct calculation
largeTxVolume = sum(transactions_where_value > 100000)

// By size tier
largeTx_by_tier = {
  whales: sum(transactions > $1M),
  institutions: sum(transactions $100k - $1M)
}
```

#### Data Sources
1. **Primary**: Glassnode Free Tier
   - Large transaction metrics
   - Size distribution
   - Update frequency: Daily

2. **Secondary**: CryptoQuant Free Tier
   - Whale activity data
   - Exchange flows
   - Update frequency: 15-30 minutes

3. **Fallback**: Transaction Analysis
   - On-chain transaction size analysis
   - Statistical estimation
   - Confidence: 70-85%

#### Interpretation

**Bullish Signals:**
- Large transactions during accumulation
- Distribution of large transactions
- Correlation with price bottoms

**Bearish Signals:**
- Large transactions during price peaks
- Concentration in few addresses
- Correlation with exchange inflows

**Confirmation Metrics:**
- Should correlate with exchange flows
- Whale holdings should show trends
- Market structure should support activity

## Advanced Metrics

### 11. Realized Capitalization

#### Definition
**Realized Cap** is the sum of the value of all coins at their last transaction price. This represents the "cost basis" of all network participants.

#### Calculation Methodology
```javascript
// Direct calculation
realizedCap = sum(utxo_value * last_transaction_price)

// For account-based chains
realizedCap = sum(balance * last_movement_price)
```

#### Data Sources
1. **Primary**: Glassnode Free Tier
   - Realized cap metrics
   - Historical data
   - Update frequency: Daily

2. **Secondary**: CoinMetrics Community
   - Network valuation metrics
   - Limited free access
   - Update frequency: Daily

3. **Fallback**: Estimation Model
   - Based on market cap and age distribution
   - Network maturity factors
   - Confidence: 60-75%

#### Interpretation

**Bullish Signals:**
- Realized cap growth exceeding market cap
- Realized cap / market cap ratio decreasing
- Consistent upward trend

**Bearish Signals:**
- Market cap growing faster than realized cap
- Realized cap declining
- High realized cap / market cap ratio

**Confirmation Metrics:**
- Should correlate with MVRV
- NUPL should show similar trends
- Long-term holder behavior should support

### 12. DEX Spot Volume (Daily)

#### Definition
**DEX Spot Volume** measures the total USD volume of decentralized exchange trading on the chain. This indicates on-chain liquidity and trading activity.

#### Calculation Methodology
```javascript
// Direct calculation
dexVolume = sum(all_dex_trading_volume_24h)

// By protocol
dexVolume_by_protocol = sum(uniswap_volume + curve_volume + ...)
```

#### Data Sources
1. **Primary**: DeFi Llama DEX API
   - Comprehensive DEX data
   - Real-time updates
   - Multi-chain coverage

2. **Secondary**: Token Terminal
   - DEX volume metrics
   - Financial context
   - Update frequency: 15-30 minutes

3. **Fallback**: TVL-based Estimation
   - Based on DEX TVL and turnover rates
   - Protocol-specific multipliers
   - Confidence: 75-85%

#### Interpretation

**Bullish Signals:**
- Increasing DEX volume
- Volume growth exceeding CEX volume
- New DEX protocols gaining share

**Bearish Signals:**
- Declining DEX volume
- Volume concentration in few protocols
- DEX volume vs CEX volume declining

**Confirmation Metrics:**
- Should correlate with TVL
- Trading fees should increase with volume
- User numbers should support volume

## Conclusion

This comprehensive metrics documentation provides the foundation for blockchain data analysis at our platform. Each metric is carefully defined with multiple data sources, calculation methodologies, and interpretation guidelines to ensure accurate and actionable insights.

The multi-source approach with fallback mechanisms ensures data reliability and continuity, while the standardized interpretation framework enables consistent analysis across different blockchains and market conditions.

Regular updates to this documentation will ensure continued accuracy as new data sources become available and market dynamics evolve.