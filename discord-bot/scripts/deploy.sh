#!/bin/bash

echo "Deploying Dusk and Dawn Discord Bot Commands..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found"
    echo "Please copy .env.example to .env and configure your Discord bot settings"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
    echo
fi

# Deploy commands
echo "Registering slash commands with Discord..."
echo "This may take a few moments..."
echo

node commands/registerCommands.js

if [ $? -eq 0 ]; then
    echo
    echo "✅ Commands deployed successfully!"
    echo
    echo "Your Discord bot slash commands are now available."
    echo "You can start the bot using ./scripts/run.sh or npm start"
    echo
else
    echo
    echo "❌ Command deployment failed!"
    echo "Please check your .env configuration and try again."
    echo
    exit 1
fi
