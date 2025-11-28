#!/bin/bash

echo "Starting Dusk and Dawn Discord Bot..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found"
    echo "Please copy .env.example to .env and configure your settings"
    echo
    
    if [ -f ".env.example" ]; then
        read -p "Would you like to copy .env.example to .env now? (y/n): " choice
        if [[ $choice == [Yy]* ]]; then
            cp .env.example .env
            echo ".env file created. Please edit it with your configuration."
            echo "Opening .env file..."
            
            # Try to open with different editors
            if command -v code &> /dev/null; then
                code .env
            elif command -v nano &> /dev/null; then
                nano .env
            elif command -v vim &> /dev/null; then
                vim .env
            else
                echo "Please edit .env file manually"
            fi
            
            read -p "Press Enter to continue after configuring .env..."
        fi
    fi
    
    if [ ! -f ".env" ]; then
        echo "Cannot continue without .env file"
        exit 1
    fi
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

# Start the bot
echo "Starting Discord bot..."
echo "Press Ctrl+C to stop the bot"
echo

node index.js
