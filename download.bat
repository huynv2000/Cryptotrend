@echo off
echo ========================================
echo   CRYPTO DASHBOARD DOWNLOADER
echo ========================================
echo.
echo Downloading crypto-dashboard-complete.tar.gz...
echo.

REM Download using PowerShell
powershell -Command "Invoke-WebRequest -Uri 'http://localhost:8080/crypto-dashboard-complete.tar.gz' -OutFile 'crypto-dashboard-complete.tar.gz'"

if exist "crypto-dashboard-complete.tar.gz" (
    echo.
    echo ✅ Download completed successfully!
    echo File size: 
    dir crypto-dashboard-complete.tar.gz | find "crypto-dashboard-complete.tar.gz"
    echo.
    echo File location: %CD%\crypto-dashboard-complete.tar.gz
    echo.
    echo Next steps:
    echo 1. Extract the file using 7-Zip or WinRAR
    echo 2. Read DOWNLOAD_INSTRUCTIONS.md for usage guide
    echo.
) else (
    echo.
    echo ❌ Download failed!
    echo Please check:
    echo 1. Internet connection
    echo 2. Server is running at localhost:8080
    echo 3. Firewall settings
    echo.
)

pause