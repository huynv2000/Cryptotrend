# Crypto Analytics Dashboard Pro - Windows Installation Guide

## 📋 System Requirements

### Minimum Requirements
- **Windows**: 10 (64-bit) or later
- **Node.js**: v18.0 or later
- **Memory**: 512MB RAM minimum, 2GB+ recommended
- **Storage**: 100MB free space
- **Network**: Stable internet connection for API access

### Recommended Requirements
- **Windows**: 11 (64-bit)
- **Node.js**: v20.0 or later
- **Memory**: 4GB+ RAM
- **Storage**: 500MB+ free space
- **Network**: High-speed internet connection

## 🚀 Installation Steps

### Step 1: Install Node.js and npm

#### Option A: Using Windows Installer (Recommended)
1. Visit [Node.js official website](https://nodejs.org/)
2. Download the Windows installer (.msi)
3. Run the installer with administrator privileges
4. Follow the installation wizard:
   - Accept the license agreement
   - Choose the installation directory (default is recommended)
   - Ensure "Add to PATH" is checked
   - Click "Install" and wait for completion
5. Restart your computer

#### Option B: Using Chocolatey (Package Manager)
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js via Chocolatey
choco install nodejs

# Verify installation
node --version
npm --version
```

#### Option C: Using Winget (Windows Package Manager)
```powershell
# Install Node.js via Winget (Windows 11/10 with updated package manager)
winget install OpenJS.NodeJS

# Verify installation
node --version
npm --version
```

### Step 2: Install Git (if not already installed)

#### Using Windows Installer
1. Visit [Git official website](https://git-scm.com/)
2. Download the Windows installer
3. Run the installer with administrator privileges
4. Follow the installation wizard:
   - Select components (default is recommended)
   - Choose default editor (VS Code recommended)
   - Adjust PATH environment (recommended: "Use Git from Git Bash only")
   - Configure line endings (recommended: "Checkout Windows-style, commit Unix-style")
   - Click "Install" and wait for completion

#### Using Chocolatey
```powershell
choco install git
```

#### Verify Git Installation
```powershell
git --version
```

### Step 3: Clone the Repository

#### Using Git Bash
```bash
# Navigate to your preferred directory
cd /c/Users/YourUsername/Documents

# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd crypto-analytics-dashboard
```

#### Using Command Prompt
```cmd
# Navigate to your preferred directory
cd C:\Users\YourUsername\Documents

# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd crypto-analytics-dashboard
```

#### Using PowerShell
```powershell
# Navigate to your preferred directory
cd C:\Users\YourUsername\Documents

# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd crypto-analytics-dashboard
```

### Step 4: Install Dependencies

#### Using Command Prompt
```cmd
# Install all project dependencies
npm install
```

#### Using PowerShell
```powershell
# Install all project dependencies
npm install
```

#### Using Git Bash
```bash
# Install all project dependencies
npm install
```

**This will install:**
- Next.js 15 framework
- Prisma ORM and client
- shadcn/ui components
- AI SDKs (OpenAI, Z.AI)
- Database drivers
- Development tools
- **Important Note**: Zod version 3.25.76 (compatible version)

### Step 5: Set Up Environment Variables

#### Using Notepad
```cmd
# Copy the environment template
copy .env.example .env

# Open the environment file in Notepad
notepad .env
```

#### Using VS Code
```cmd
# Copy the environment template
copy .env.example .env

# Open the environment file in VS Code
code .env
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

### Step 6: Initialize Database

#### Using Command Prompt
```cmd
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed default cryptocurrencies (optional)
npm run db:seed
```

#### Using PowerShell
```powershell
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed default cryptocurrencies (optional)
npm run db:seed
```

### Step 7: Verify Installation

#### Using Command Prompt
```cmd
# Run development server
npm run dev
```

#### Using PowerShell
```powershell
# Run development server
npm run dev
```

**Open your web browser and navigate to http://localhost:3000**
You should see the Crypto Analytics Dashboard

## 🔧 Development Environment Setup

### VS Code Setup (Recommended)

#### Using Windows Installer
1. Visit [VS Code official website](https://code.visualstudio.com/)
2. Download the Windows installer
3. Run the installer with administrator privileges
4. Follow the installation wizard

#### Using Chocolatey
```powershell
choco install visual-studio-code
```

#### Install Recommended Extensions
```powershell
# Install VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
```

### Git Configuration

#### Using Git Bash
```bash
# Set up Git configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Configure Git credential manager
git config --global credential.helper manager
```

#### Using Command Prompt
```cmd
# Set up Git configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Configure Git credential manager
git config --global credential.helper manager
```

## 🐳 Optional: Docker Setup

### Install Docker Desktop
1. Visit [Docker Desktop official website](https://www.docker.com/products/docker-desktop)
2. Download the Windows installer
3. Run the installer with administrator privileges
4. Follow the installation wizard
5. Restart your computer
6. Start Docker Desktop

### Docker Compose Setup
```powershell
# Create docker-compose.yml (if not exists)
New-Item -Path docker-compose.yml -ItemType File

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
```cmd
# Check database file exists
dir db

# Verify database schema
npx prisma db pull
```

### 3. Health Check
```cmd
# Run linting
npm run lint

# Build the application
npm run build

# Start production server
npm start
```

## 🔄 Common Windows-Specific Issues

### Issue 1: Permission Denied
```cmd
# Run Command Prompt as Administrator
# Right-click Command Prompt > Run as administrator

# Fix permission issues
takeown /f node_modules /r /d y
icacls node_modules /grant administrators:F /t
```

### Issue 2: Port Already in Use
```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Issue 3: Node.js Version Issues
```cmd
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Reinstall dependencies
npm install
```

### Issue 4: Windows Firewall Blocks Application
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings"
4. Find Node.js in the list
5. Check both "Private" and "Public" boxes
6. Click "OK"

### Issue 5: Path Environment Variables
1. Open System Properties
2. Click "Environment Variables"
3. Under "System variables", find "Path"
4. Click "Edit"
5. Add Node.js paths:
   - `C:\Program Files\nodejs\`
   - `C:\Users\YourUsername\AppData\Roaming\npm`
6. Click "OK" on all windows
7. Restart Command Prompt/PowerShell

### Issue 6: Zod Version Conflict
```cmd
# If you encounter zod version conflicts during npm install
# Clear npm cache completely
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

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

**Note**: This guide assumes you have administrative privileges on your Windows system. If you encounter any issues during installation, please check the troubleshooting section or refer to the official documentation for each tool.

## 🔄 Windows Terminal Setup (Optional)

### Install Windows Terminal
```powershell
# Install via Microsoft Store
# Or using Winget
winget install Microsoft.WindowsTerminal
```

### Configure Windows Terminal
1. Open Windows Terminal
2. Click the dropdown arrow > Settings
3. Add your preferred profiles (PowerShell, Command Prompt, Git Bash)
4. Customize appearance and behavior

### Useful Windows Terminal Commands
```powershell
# Open new tab
Ctrl + Shift + T

# Switch between tabs
Ctrl + Tab

# Close current tab
Ctrl + Shift + W

# Split pane
Alt + Shift + + (horizontal)
Alt + Shift + - (vertical)
```