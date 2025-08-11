# 📚 Crypto Analytics Dashboard Pro - Documentation Index

Welcome to the comprehensive documentation for **Crypto Analytics Dashboard Pro**. This index provides quick access to all installation, configuration, and troubleshooting guides.

## 🚀 Quick Navigation

### 📋 Installation Guides
Choose your platform for detailed installation instructions:

| Platform | Guide | Status | Est. Time |
|----------|-------|--------|-----------|
| [🍎 macOS](./INSTALLATION_MACOS.md) | Complete macOS installation guide | ✅ Complete | 15-20 min |
| [🪟 Windows](./INSTALLATION_WINDOWS.md) | Comprehensive Windows setup | ✅ Complete | 20-30 min |
| [🐧 Linux](./INSTALLATION_LINUX.md) | Linux distribution guide | ✅ Complete | 15-25 min |

### 🔧 Configuration & Setup
Essential configuration and setup documentation:

| Document | Purpose | Status |
|----------|---------|--------|
| [⚙️ Configuration Guide](./CONFIGURATION_GUIDE.md) | Complete system configuration | ✅ Complete |
| [🔧 Troubleshooting Guide](./TROUBLESHOOTING.md) | Error resolution & debugging | ✅ Complete |
| [📖 README](./README.md) | Overview & quick start | ✅ Complete |

## 🎯 Getting Started

### 1. System Requirements
Before installing, ensure your system meets these requirements:

**Minimum Requirements:**
- **OS**: macOS 10.15+, Windows 10+, Linux (Ubuntu 20.04+)
- **Node.js**: v18.0 or later
- **Memory**: 512MB RAM
- **Storage**: 100MB free space
- **Network**: Stable internet connection

**Recommended Requirements:**
- **OS**: Latest version of your preferred OS
- **Node.js**: v20.0 or later
- **Memory**: 4GB+ RAM
- **Storage**: 500MB+ free space
- **Network**: High-speed internet connection

### 2. Required API Keys
You'll need API keys from these services:

**Essential (Minimum Required):**
- [OpenAI](https://platform.openai.com/api-keys) - AI analysis
- [Z.AI](https://z-ai.dev) - Alternative AI analysis
- [CoinGecko](https://www.coingecko.com/api) - Market data

**Optional (Enhanced Features):**
- Alternative.me - Fear & Greed Index
- Glassnode - On-chain metrics
- CryptoQuant - On-chain data
- Coinglass - Derivatives data
- LunarCrush - Social sentiment
- News APIs - Market news
- Twitter/X - Social sentiment
- Reddit - Community sentiment

### 3. Installation Process
The installation process follows these steps:

1. **Install Node.js and npm**
2. **Install Git** (if not already installed)
3. **Clone the repository**
4. **Install project dependencies**
5. **Set up environment variables**
6. **Initialize the database**
7. **Verify the installation**

## 📚 Documentation Structure

### 🚀 Installation Guides
Each installation guide provides:
- **System Requirements**: Detailed requirements for each platform
- **Step-by-Step Installation**: Complete installation process
- **Development Setup**: IDE and tool configuration
- **Optional Components**: Docker and additional tools
- **Platform-Specific Issues**: Common problems and solutions
- **Post-Installation**: Configuration and verification steps

### ⚙️ Configuration Guide
The configuration guide covers:
- **Environment Variables**: Complete variable reference
- **API Key Setup**: Step-by-step API key configuration
- **Database Configuration**: SQLite setup and optimization
- **Application Settings**: Performance and behavior configuration
- **Data Collection**: Scheduling and source configuration
- **AI Analysis**: Model and parameter configuration
- **Security Settings**: Authentication and access control

### 🔧 Troubleshooting Guide
The troubleshooting guide includes:
- **Quick Diagnosis**: Health checks and log analysis
- **Installation Issues**: Node.js, database, and environment problems
- **Network Issues**: Connectivity and API problems
- **AI Issues**: OpenAI and Z.AI specific problems
- **Data Collection Issues**: API and data source problems
- **Performance Issues**: Memory, CPU, and optimization
- **Critical Issues**: Crashes, corruption, and recovery
- **Advanced Troubleshooting**: Debugging and profiling

## 🔍 Quick Reference

### Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push database schema
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed default data
npm run db:reset     # Reset database

# Health Checks
npm run health-check # System health check
npm run api:check    # API connectivity check
npm run db:check     # Database connection check
```

### Environment Variables
```bash
# Essential
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./db/custom.db

# API Keys
OPENAI_API_KEY=your-openai-key
ZAI_API_KEY=your-z-ai-key
COINGECKO_API_KEY=your-coingecko-key
```

### Common Issues
- **Port 3000 in use**: Change port or stop conflicting service
- **Permission denied**: Run with appropriate permissions
- **API key errors**: Verify API key format and validity
- **Database errors**: Check file permissions and path
- **Memory issues**: Adjust Node.js memory allocation

## 🎯 Platform-Specific Quick Start

### macOS (Homebrew)
```bash
brew install node git
git clone <repo-url>
cd crypto-analytics-dashboard
npm install
cp .env.example .env
# Edit .env with API keys
npm run db:push
npm run dev
```

### Windows (Chocolatey)
```powershell
choco install nodejs git
git clone <repo-url>
cd crypto-analytics-dashboard
npm install
copy .env.example .env
# Edit .env with API keys
npm run db:push
npm run dev
```

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
git clone <repo-url>
cd crypto-analytics-dashboard
npm install
cp .env.example .env
# Edit .env with API keys
npm run db:push
npm run dev
```

## 📊 System Features

### Core Functionality
- **Real-time Data Collection**: Price, volume, technical indicators, on-chain metrics
- **AI-Powered Analysis**: Multiple AI providers with consensus mechanisms
- **Interactive Dashboard**: Responsive charts and real-time updates
- **Alert System**: Price and metric alerts with notifications
- **Portfolio Management**: Track and analyze your crypto portfolio
- **Watchlist**: Monitor your favorite cryptocurrencies

### Data Sources
- **CoinGecko**: Price and market data
- **OpenAI**: AI analysis and insights
- **Z.AI**: Alternative AI analysis
- **Alternative.me**: Fear & Greed Index
- **Glassnode**: On-chain metrics
- **CryptoQuant**: On-chain data
- **Coinglass**: Derivatives data
- **LunarCrush**: Social sentiment
- **News APIs**: Market news
- **Twitter/X**: Social sentiment
- **Reddit**: Community sentiment

## 🔧 Advanced Configuration

### Performance Optimization
- **Caching**: Configure Redis or memory caching
- **Database**: Optimize queries and add indexes
- **API**: Implement rate limiting and backoff
- **Frontend**: Optimize bundle size and images

### Security Configuration
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **CORS**: Configure cross-origin resource sharing
- **Headers**: Security headers and CSP policies

### Monitoring and Logging
- **Health Checks**: System and API health monitoring
- **Logging**: Structured logging with different levels
- **Metrics**: Performance and usage metrics
- **Alerts**: System and application alerts

## 🚨 Emergency Procedures

### System Recovery
```bash
# Complete system reset (warning: deletes all data)
rm -rf .next node_modules db/custom.db
npm install
npm run db:push
npm run db:seed
```

### Data Recovery
```bash
# Restore from backup
cp db/custom.db.backup db/custom.db

# Extract data from logs
grep -i "price.*bitcoin" dev.log > bitcoin_prices.log
```

## 📞 Support and Community

### Getting Help
1. **Documentation**: Read through all guides thoroughly
2. **Search**: Look for similar issues in existing documentation
3. **Community**: Ask questions in community forums
4. **GitHub Issues**: Create detailed issue reports
5. **Professional Support**: Contact for enterprise support

### Contributing
- **Bug Reports**: Submit detailed bug reports with reproduction steps
- **Feature Requests**: Suggest new features and improvements
- **Documentation**: Help improve documentation
- **Code Contributions**: Submit pull requests for bug fixes and features

## 📈 Production Deployment

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start

# Or use process manager
pm2 start ecosystem.config.js
```

### Docker Deployment
```bash
# Build Docker image
docker build -t crypto-analytics .

# Run with Docker
docker run -p 3000:3000 crypto-analytics

# Or use Docker Compose
docker-compose up -d
```

## 🔄 Maintenance

### Regular Tasks
- **Database Backups**: Regular database file backups
- **Log Rotation**: Configure log rotation
- **API Key Rotation**: Regularly rotate API keys
- **System Updates**: Keep dependencies updated

### Update Process
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Rebuild if necessary
npm run build

# Restart application
npm start
```

---

## 📚 Additional Resources

### Official Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### API Documentation
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [CoinGecko API](https://www.coingecko.com/api/documentation)
- [Z.AI API](https://z-ai.dev/docs)

### Community
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma GitHub](https://github.com/prisma/prisma)
- [shadcn/ui GitHub](https://github.com/shadcn/ui)

---

**Note**: This documentation is continuously updated. For the latest information, always refer to the latest version of these documents. If you encounter any issues during installation or configuration, please refer to the troubleshooting guide or seek assistance from the community.