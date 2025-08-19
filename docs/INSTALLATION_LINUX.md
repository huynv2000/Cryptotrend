# Crypto Analytics Dashboard Pro - Linux Installation Guide

## 📋 System Requirements

### Minimum Requirements
- **Linux**: Ubuntu 20.04+, Debian 10+, CentOS 8+, or equivalent
- **Node.js**: v18.0 or later
- **Memory**: 512MB RAM minimum, 2GB+ recommended
- **Storage**: 100MB free space
- **Network**: Stable internet connection for API access

### Recommended Requirements
- **Linux**: Ubuntu 22.04+, Debian 12+, CentOS 9+, or equivalent
- **Node.js**: v20.0 or later
- **Memory**: 4GB+ RAM
- **Storage**: 500MB+ free space
- **Network**: High-speed internet connection

## 🚀 Installation Steps

### Step 1: Update System Packages

#### Ubuntu/Debian
```bash
# Update package lists
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y
```

#### CentOS/RHEL/Fedora
```bash
# Update package lists
sudo yum update -y

# Or for newer systems
sudo dnf update -y
```

#### Arch Linux
```bash
# Update package lists
sudo pacman -Syu
```

### Step 2: Install Node.js and npm

#### Option A: Using NodeSource Repository (Recommended for Ubuntu/Debian)
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Option B: Using NVM (Node Version Manager)
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc for Zsh

# Install Node.js 20
nvm install 20
nvm use 20

# Verify installation
node --version
npm --version
```

#### Option C: Using Package Manager

**Ubuntu/Debian**
```bash
# Install Node.js
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

**CentOS/RHEL/Fedora**
```bash
# Install Node.js
sudo yum install nodejs npm

# Or for newer systems
sudo dnf install nodejs npm

# Verify installation
node --version
npm --version
```

**Arch Linux**
```bash
# Install Node.js
sudo pacman -S nodejs npm

# Verify installation
node --version
npm --version
```

#### Option D: Using Snap (Ubuntu/Debian)
```bash
# Install Node.js via Snap
sudo snap install node --classic

# Verify installation
node --version
npm --version
```

### Step 3: Install Git

#### Ubuntu/Debian
```bash
sudo apt install git
```

#### CentOS/RHEL/Fedora
```bash
sudo yum install git

# Or for newer systems
sudo dnf install git
```

#### Arch Linux
```bash
sudo pacman -S git
```

#### Verify Git Installation
```bash
git --version
```

### Step 4: Clone the Repository

```bash
# Navigate to your preferred directory
cd ~/projects

# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd crypto-analytics-dashboard
```

### Step 5: Install Dependencies

```bash
# Install all project dependencies
npm install

# This will install:
# - Next.js 15 framework
# - Prisma ORM and client
# - shadcn/ui components
# - AI SDKs (OpenAI, Z.AI)
# - Database drivers
# - Development tools
# - **Important Note**: Zod version 3.25.76 (compatible version)
```

### Step 6: Set Up Environment Variables

```bash
# Copy the environment template
cp .env.example .env

# Edit the environment file
nano .env
# or use vim: vim .env
# or use VS Code: code .env
```

**Required Environment Variables:**
```bash
# Database Configuration
DATABASE_URL=file:./db/custom.db

# AI API Keys (Minimum Required)
OPENAI_API_KEY=your-openai-api-key-here
ZAI_API_KEY=your-z-ai-api-key-here

# Crypto API Keys (Minimum Required)
COINGECKO_API_KEY=your-coingecko-api-key-here

# Application Configuration
NODE_ENV=development
PORT=3000
```

### Step 7: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed default cryptocurrencies (optional)
npm run db:seed
```

### Step 8: Verify Installation

```bash
# Run development server
npm run dev

# Open browser to http://localhost:3000
# You should see the Crypto Analytics Dashboard
```

## 🔧 Development Environment Setup

### VS Code Setup (Recommended)

#### Ubuntu/Debian
```bash
# Download VS Code
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list

# Update package lists and install
sudo apt update
sudo apt install code
```

#### CentOS/RHEL/Fedora
```bash
# Import Microsoft GPG key
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc

# Add VS Code repository
sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'

# Install VS Code
sudo yum install code

# Or for newer systems
sudo dnf install code
```

#### Install Recommended Extensions
```bash
# Install VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
```

### Git Configuration

```bash
# Set up Git configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Configure Git credential helper
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'
```

## 🐳 Optional: Docker Setup

### Install Docker

#### Ubuntu/Debian
```bash
# Install Docker
sudo apt install docker.io docker-compose

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in
```

#### CentOS/RHEL/Fedora
```bash
# Install Docker
sudo yum install docker docker-compose

# Or for newer systems
sudo dnf install docker docker-compose

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in
```

#### Verify Docker Installation
```bash
docker --version
docker-compose --version
```

### Docker Compose Setup
```bash
# Create docker-compose.yml (if not exists)
touch docker-compose.yml

# Build and run with Docker
docker-compose up --build
```

## 📝 Post-Installation Configuration

### 1. API Key Configuration
Obtain API keys from:
- **OpenAI**: [OpenAI Dashboard](https://platform.openai.com/api-keys)
- **Z.AI**: [Z.AI Dashboard](https://z-ai.dev)
- **CoinGecko**: [CoinGecko API](https://www.coingecko.com/api)

### 2. Database Verification
```bash
# Check database file exists
ls -la db/

# Verify database schema
npx prisma db pull
```

### 3. Health Check
```bash
# Run linting
npm run lint

# Build the application
npm run build

# Start production server
npm start
```

## 🔄 Common Linux-Specific Issues

### Issue 1: Permission Denied
```bash
# Fix permission issues
sudo chown -R $USER:$USER node_modules
sudo chown -R $USER:$USER .next
```

### Issue 2: Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Issue 3: Node.js Version Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

### Issue 4: Firewall Blocks Application
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3000/tcp

# CentOS/RHEL/Fedora (Firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Or disable firewall (not recommended for production)
sudo ufw disable  # Ubuntu/Debian
sudo systemctl stop firewalld  # CentOS/RHEL/Fedora
```

### Issue 5: Missing Dependencies
```bash
# Ubuntu/Debian
sudo apt install build-essential

# CentOS/RHEL/Fedora
sudo yum groupinstall "Development Tools"

# Or for newer systems
sudo dnf groupinstall "Development Tools"
```

### Issue 6: SQLite Permission Issues
```bash
# Create db directory if it doesn't exist
mkdir -p db

# Set proper permissions
chmod 755 db
```

### Issue 7: Zod Version Conflict
```bash
# If you encounter zod version conflicts during npm install
# Clear npm cache completely
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Force install specific zod version
npm install zod@3.25.76

# Reinstall all dependencies
npm install
```

**Note**: The project uses zod version 3.25.76 which is compatible with the current stack. If you see errors about zod version 4.0.2, follow the steps above to resolve the conflict.

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community Support
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma GitHub](https://github.com/prisma/prisma)
- [shadcn/ui GitHub](https://github.com/shadcn/ui)

### Troubleshooting
- Check the `dev.log` file for development server logs
- Check the `server.log` file for production server logs
- Use `console.log` for debugging
- Check browser developer tools for client-side issues

## 🎯 Next Steps

1. **Configure API Keys**: Add your actual API keys to `.env`
2. **Test Data Collection**: Verify that data collection works
3. **Customize Dashboard**: Modify the dashboard to your needs
4. **Set Up Monitoring**: Configure logging and monitoring
5. **Deploy to Production**: Follow the production deployment guide

---

## 🐧 Linux Distribution-Specific Notes

### Ubuntu/Debian
- Uses `apt` package manager
- Default shell is `bash`
- Firewall: `ufw` (Uncomplicated Firewall)
- Service management: `systemd`

### CentOS/RHEL/Fedora
- Uses `yum`/`dnf` package manager
- Default shell is `bash`
- Firewall: `firewalld`
- Service management: `systemd`

### Arch Linux
- Uses `pacman` package manager
- Default shell is `bash`
- Firewall: `ufw` or `iptables`
- Service management: `systemd`

### SUSE/openSUSE
- Uses `zypper` package manager
- Default shell is `bash`
- Firewall: `SuSEfirewall2`
- Service management: `systemd`

## 🔄 System Service Setup (Optional)

### Create Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/crypto-analytics.service
```

**Service Configuration:**
```ini
[Unit]
Description=Crypto Analytics Dashboard
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/crypto-analytics-dashboard
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

**Enable and Start Service:**
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable crypto-analytics

# Start service
sudo systemctl start crypto-analytics

# Check service status
sudo systemctl status crypto-analytics
```

---

**Note**: This guide assumes you have sudo privileges on your Linux system. If you encounter any issues during installation, please check the troubleshooting section or refer to the official documentation for each tool.