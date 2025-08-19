# Blockchain Analytics Metrics Catalog

## Overview

This document provides a comprehensive catalog of all metrics collected and displayed in our blockchain analytics dashboard. Each metric includes its definition, data source, calculation method, and business relevance.

## Metric Categories

### 1. Price Metrics
#### 1.1 Current Price
- **Definition**: The current market price of the cryptocurrency
- **Data Source**: CoinGecko API
- **Unit**: USD
- **Update Frequency**: Real-time (every 5 minutes)
- **Business Relevance**: Primary indicator of market value and trading decisions

#### 1.2 Price Change 24h
- **Definition**: Percentage change in price over the last 24 hours
- **Data Source**: CoinGecko API
- **Unit**: Percentage (%)
- **Update Frequency**: Real-time (every 5 minutes)
- **Business Relevance**: Short-term market sentiment and volatility indicator

#### 1.3 Market Cap
- **Definition**: Total market value of all circulating tokens
- **Data Source**: CoinGecko API
- **Unit**: USD
- **Update Frequency**: Real-time (every 5 minutes)
- **Business Relevance**: Relative size and importance of the cryptocurrency

#### 1.4 24h Volume
- **Definition**: Total trading volume over the last 24 hours
- **Data Source**: CoinGecko API
- **Unit**: USD
- **Update Frequency**: Real-time (every 5 minutes)
- **Business Relevance**: Market liquidity and trading activity indicator

### 2. On-Chain Metrics
#### 2.1 Daily Active Addresses (DAA)
- **Definition**: Number of unique addresses active on the network daily
- **Data Source**: Artemis (primary), Token Terminal (secondary), Estimation (fallback)
- **Unit**: Count
- **Update Frequency**: Daily
- **Business Relevance**: Network adoption and user activity indicator
- **Calculation Method**: 
  ```typescript
  // Primary: Direct from Artemis API
  // Secondary: Token Terminal user metrics
  // Fallback: Estimate based on market cap and network maturity
  const estimatedDAA = Math.floor(marketCap / 10000 * networkMaturityFactor);
  ```

#### 2.2 Daily Transactions
- **Definition**: Number of transactions processed on the network daily
- **Data Source**: Blockchain RPC calls, Artemis
- **Unit**: Count
- **Update Frequency**: Daily
- **Business Relevance**: Network utilization and throughput indicator

#### 2.3 Average Transaction Fee
- **Definition**: Average fee paid per transaction
- **Data Source**: Blockchain RPC calls, Glassnode
- **Unit**: Native token units
- **Update Frequency**: Daily
- **Business Relevance**: Network congestion and cost of usage indicator

#### 2.4 Hash Rate
- **Definition**: Total computational power securing the network (Proof-of-Work only)
- **Data Source**: Blockchain RPC calls, Glassnode
- **Unit**: TH/s (Terahashes per second)
- **Update Frequency**: Daily
- **Business Relevance**: Network security and mining activity indicator

#### 2.5 MVRV Ratio (Market Value to Realized Value)
- **Definition**: Ratio of market cap to realized value
- **Data Source**: Glassnode, Calculation from on-chain data
- **Unit**: Ratio
- **Update Frequency**: Daily
- **Business Relevance**: Market valuation relative to cost basis
- **Calculation Method**:
  ```typescript
  const mvrv = marketCap / realizedValue;
  // Interpretation:
  // MVRV > 3: Overvalued territory
  // MVRV < 1: Undervalued territory
  ```

#### 2.6 NUPL (Net Unrealized Profit/Loss)
- **Definition**: Net profit/loss of all tokens in circulation
- **Data Source**: Glassnode, Calculation from on-chain data
- **Unit**: Percentage (%)
- **Update Frequency**: Daily
- **Business Relevance**: Overall market profitability and sentiment

#### 2.7 SOPR (Spent Output Profit Ratio)
- **Definition**: Ratio of coin value at spending vs. acquisition
- **Data Source**: Glassnode, Calculation from on-chain data
- **Unit**: Ratio
- **Update Frequency**: Daily
- **Business Relevance**: Profit-taking behavior and market cycles

### 3. DeFi Metrics
#### 3.1 Total Value Locked (TVL)
- **Definition**: Total value of assets locked in DeFi protocols
- **Data Source**: DeFi Llama
- **Unit**: USD
- **Update Frequency**: Hourly
- **Business Relevance**: DeFi ecosystem growth and adoption

#### 3.2 DeFi Market Cap
- **Definition**: Total market cap of DeFi tokens
- **Data Source**: DeFi Llama, CoinGecko
- **Unit**: USD
- **Update Frequency**: Hourly
- **Business Relevance**: DeFi sector market size

#### 3.3 DeFi Dominance
- **Definition**: DeFi market cap as percentage of total crypto market cap
- **Data Source**: Calculation from TVL and market cap data
- **Unit**: Percentage (%)
- **Update Frequency**: Hourly
- **Business Relevance**: DeFi sector importance in overall market

#### 3.4 Protocol-Specific TVL
- **Definition**: TVL broken down by major DeFi protocols
- **Data Source**: DeFi Llama
- **Unit**: USD
- **Update Frequency**: Hourly
- **Business Relevance**: Individual protocol performance and market share

### 4. Derivative Metrics
#### 4.1 Open Interest
- **Definition**: Total value of outstanding derivative contracts
- **Data Source**: Derivative exchanges API, Estimation
- **Unit**: USD
- **Update Frequency**: Hourly
- **Business Relevance**: Derivative market activity and leverage

#### 4.2 Funding Rate
- **Definition**: Cost of holding long/short positions in perpetual futures
- **Data Source**: Derivative exchanges API
- **Unit**: Percentage (%)
- **Update Frequency**: 8 hours
- **Business Relevance**: Market sentiment and leverage cost

#### 4.3 Liquidation Volume
- **Definition**: Total value of positions liquidated
- **Data Source**: Derivative exchanges API, Estimation
- **Unit**: USD
- **Update Frequency**: Daily
- **Business Relevance**: Market volatility and risk levels

### 5. Technical Indicators
#### 5.1 RSI (Relative Strength Index)
- **Definition**: Momentum oscillator measuring overbought/oversold conditions
- **Data Source**: Calculation from price data
- **Unit**: Index (0-100)
- **Update Frequency**: Real-time
- **Business Relevance**: Short-term trading signals and momentum

#### 5.2 MACD (Moving Average Convergence Divergence)
- **Definition**: Trend-following momentum indicator
- **Data Source**: Calculation from price data
- **Unit**: Price units
- **Update Frequency**: Real-time
- **Business Relevance**: Trend identification and momentum changes

#### 5.3 Bollinger Bands
- **Definition**: Volatility bands based on standard deviations
- **Data Source**: Calculation from price data
- **Unit**: Price units
- **Update Frequency**: Real-time
- **Business Relevance**: Volatility measurement and price extremes

#### 5.4 Moving Averages
- **Definition**: Average price over specified time periods
- **Data Source**: Calculation from price data
- **Unit**: Price units
- **Update Frequency**: Real-time
- **Business Relevance**: Trend identification and support/resistance levels

### 6. Volume Metrics
#### 6.1 Exchange Volume
- **Definition**: Trading volume on centralized exchanges
- **Data Source**: CoinGecko, Exchange APIs
- **Unit**: USD
- **Update Frequency**: Hourly
- **Business Relevance**: Market liquidity and trading activity

#### 6.2 DEX Volume
- **Definition**: Trading volume on decentralized exchanges
- **Data Source**: DeFi Llama, DEX APIs
- **Unit**: USD
- **Update Frequency**: Hourly
- **Business Relevance**: DeFi adoption and trading activity

#### 6.3 Volume Profile
- **Definition**: Volume distribution across price levels
- **Data Source**: Calculation from exchange data
- **Unit**: USD
- **Update Frequency**: Hourly
- **Business Relevance**: Support/resistance levels and market structure

### 7. Sentiment Metrics
#### 7.1 Fear & Greed Index
- **Definition**: Market sentiment indicator
- **Data Source**: Alternative.me
- **Unit**: Index (0-100)
- **Update Frequency**: Daily
- **Business Relevance**: Overall market sentiment and psychology

#### 7.2 Social Sentiment
- **Definition**: Sentiment analysis from social media and news
- **Data Source**: Social media APIs, News APIs
- **Unit**: Score (-1 to 1)
- **Update Frequency**: Hourly
- **Business Relevance**: Public perception and market mood

#### 7.3 News Sentiment
- **Definition**: Sentiment analysis from news articles
- **Data Source**: News APIs, NLP analysis
- **Unit**: Score (-1 to 1)
- **Update Frequency**: Hourly
- **Business Relevance**: Media influence on market perception

### 8. Advanced Metrics
#### 8.1 Network Value to Transactions (NVT)
- **Definition**: Ratio of network value to transaction volume
- **Data Source**: Calculation from on-chain and market data
- **Unit**: Ratio
- **Update Frequency**: Daily
- **Business Relevance**: Network valuation relative to economic activity

#### 8.2 HODL Waves
- **Definition**: Distribution of tokens by holding time
- **Data Source**: Glassnode, On-chain analysis
- **Unit**: Percentage (%)
- **Update Frequency**: Weekly
- **Business Relevance**: Long-term holder behavior and market maturity

#### 8.3 Supply Distribution
- **Definition**: Distribution of token supply across wallet sizes
- **Data Source**: On-chain analysis, Glassnode
- **Unit**: Percentage (%)
- **Update Frequency**: Weekly
- **Business Relevance**: Market centralization and whale activity

## Data Quality Indicators

### Freshness Score
- **Definition**: How recent the data is
- **Calculation**: `(current_time - data_timestamp) / max_acceptable_age`
- **Range**: 0-100 (100 = most recent)

### Reliability Score
- **Definition**: Historical reliability of the data source
- **Calculation**: Based on uptime, error rates, and data consistency
- **Range**: 0-100 (100 = most reliable)

### Validation Score
- **Definition**: How well the data passes validation checks
- **Calculation**: Based on range checks, trend validation, and cross-source validation
- **Range**: 0-100 (100 = most valid)

### Overall Quality Score
- **Definition**: Combined quality metric
- **Calculation**: `0.4 * Freshness + 0.4 * Reliability + 0.2 * Validation`
- **Range**: 0-100 (100 = highest quality)

## Metric Dependencies

### Critical Dependencies
- **Price Metrics**: Depend on CoinGecko API availability
- **On-Chain Metrics**: Depend on blockchain RPC and Artemis API
- **DeFi Metrics**: Depend on DeFi Llama API
- **Derivative Metrics**: Depend on exchange APIs and estimation algorithms

### Fallback Hierarchies
1. **Primary Source**: Direct API call
2. **Secondary Source**: Alternative API
3. **Estimation**: Algorithmic estimation based on correlated metrics
4. **Last Resort**: Historical averages and trends

## Usage Guidelines

### For Dashboard Display
- Use quality scores to determine data reliability
- Implement color coding for quality levels (green >80, yellow 60-80, red <60)
- Show data freshness timestamps
- Provide fallback indicators when using estimated data

### For Analysis
- Consider quality scores when making decisions
- Use multiple correlated metrics for confirmation
- Be aware of estimation limitations
- Monitor data source performance trends

### For System Development
- Implement proper error handling and fallback mechanisms
- Monitor data quality scores continuously
- Log all data source interactions and errors
- Implement automated alerts for quality degradation

---

*Document Version: 1.0*  
*Last Updated: 2025-06-18*  
*Author: Financial Systems Expert (20 years experience)*