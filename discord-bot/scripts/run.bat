@echo off
echo Starting Dusk and Dawn Discord Bot...
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
    echo Warning: .env file not found
    echo Please copy .env.example to .env and configure your settings
    echo.
    if exist ".env.example" (
        echo Would you like to copy .env.example to .env now? (y/n)
        set /p choice=
        if /i "%choice%"=="y" (
            copy ".env.example" ".env"
            echo .env file created. Please edit it with your configuration.
            echo Opening .env file...
            start notepad .env
            pause
        )
    )
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

REM Start the bot
echo Starting Discord bot...
echo Press Ctrl+C to stop the bot
echo.
node index.js

pause
