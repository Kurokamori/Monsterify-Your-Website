@echo off
echo Deploying Dusk and Dawn Discord Bot Commands...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found
    echo Please copy .env.example to .env and configure your Discord bot settings
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Deploy commands
echo Registering slash commands with Discord...
echo This may take a few moments...
echo.

node commands/registerCommands.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Commands deployed successfully!
    echo.
    echo Your Discord bot slash commands are now available.
    echo You can start the bot using run.bat or npm start
    echo.
) else (
    echo.
    echo ❌ Command deployment failed!
    echo Please check your .env configuration and try again.
    echo.
)

pause
