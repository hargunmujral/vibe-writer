#!/bin/bash

# Exit on error
set -e

# Display help message
display_help() {
  echo "Vibe Writer Setup and Run Script"
  echo ""
  echo "This script sets up a Python virtual environment, installs the required"
  echo "dependencies, and runs the Vibe Writer application."
  echo ""
  echo "Usage: ./setup_and_run.sh [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help       Display this help message and exit"
  echo "  -s, --setup      Setup only (create venv and install dependencies)"
  echo "  -r, --run        Run only (don't setup, just run the app)"
  echo ""
}

# Parse command line arguments
SETUP=true
RUN=true

for arg in "$@"
do
  case $arg in
    -h|--help)
      display_help
      exit 0
      ;;
    -s|--setup)
      SETUP=true
      RUN=false
      shift
      ;;
    -r|--run)
      SETUP=false
      RUN=true
      shift
      ;;
    *)
      # Unknown option
      echo "Unknown option: $arg"
      display_help
      exit 1
      ;;
  esac
done

# Virtual environment directory
VENV_DIR="venv"

if $SETUP; then
  echo "Setting up Vibe Writer..."
  
  # Check if Python 3 is installed
  if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
  fi
  
  # Create virtual environment if it doesn't exist
  if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv $VENV_DIR
  else
    echo "Virtual environment already exists."
  fi
  
  # Activate virtual environment
  echo "Activating virtual environment..."
  source $VENV_DIR/bin/activate
  
  # Install dependencies
  echo "Installing dependencies..."
  pip install --upgrade pip
  pip install -r requirements.txt
  
  echo "Setup complete!"
else
  # Just activate the virtual environment
  source $VENV_DIR/bin/activate
fi

if $RUN; then
  echo "Running Vibe Writer..."
  
  # Run the app
  streamlit run app/main.py
fi

# Deactivate virtual environment when done
deactivate 2>/dev/null || true

echo "Done!"