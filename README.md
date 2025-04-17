# Vibe Writer

An AI-powered writing assistant/IDE designed to support long-form storytelling by providing context-aware writing tools and ensuring consistency across a manuscript.

For a more detailed design overview, see [DesignPlan.md](DesignPlan.md).

## Features

- **Rich Text Editor**: Monaco-based editor with markdown support
- **Sentence Autocomplete**: Real-time, context-sensitive suggestions
- **Text Referencing**: Quick access to earlier sections for continuity
- **Editable Story Memory**: Dynamic repository of characters, plots, settings, and themes
- **Refactoring Tools**: Both large-scale and small-scale text modifications
- **Tone & Style Emulation**: Match established tone and voice
- **Integrated Knowledge Base**: Structured map of story elements
- **Edit History**: Track the edit history of the story

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js with TypeScript, TailwindCSS
- **Editor**: Monaco Editor (as used in VS Code)

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository

```
git clone https://github.com/yourusername/vibe-writer.git
cd vibe-writer
```

2. Make the start script executable

```
chmod +x start.sh
```

3. Start the application

```
./start.sh
```

This will:

- Set up a Python virtual environment
- Install backend dependencies
- Install frontend dependencies
- Start the FastAPI backend server
- Start the Next.js frontend development server

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Troubleshooting

If you encounter issues with the frontend, there's a script to fix common dependency problems:

```
cd frontend
chmod +x fix-deps.sh
./fix-deps.sh
```

This will clean up build artifacts, reinstall dependencies, and add the required Babel packages.

For more detailed troubleshooting, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Project Structure

- `backend/`: FastAPI backend code
  - `main.py`: Main application entry point
  - `utils/`: Helper functions and utilities
- `frontend/`: Next.js frontend code
  - `app/`: Next.js application files
  - `components/`: React components
  - `types/`: TypeScript type definitions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
