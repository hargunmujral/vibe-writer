# Vibe Writer

An AI-powered writing assistant/IDE designed to support long-form storytelling by providing context-aware writing tools and ensuring consistency across a manuscript.

For a more detailed design overview, see [DesignPlan.md](DesignPlan.md).

## Features

- **Sentence Autocomplete**: Real-time, context-sensitive suggestions
- **Text Referencing**: Quick access to earlier sections for continuity
- **Editable Story Memory**: Dynamic repository of characters, plots, settings, and themes
- **Refactoring Tools**: Both large-scale and small-scale text modifications
- **Tone & Style Emulation**: Match established tone and voice
- **Integrated Knowledge Base**: Structured map of story elements
- **Edit History**: Track the edit history of the story

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository

```
git clone https://github.com/yourusername/vibe-writer.git
cd vibe-writer
```

2. Install dependencies and run the application

```
./setup_and_run.sh
```

## Project Structure

- `app/`: Main application code
  - `components/`: UI components
  - `ai/`: AI models and utilities
  - `utils/`: Helper functions
- `data/`: Sample data and user data storage
- `docs/`: Documentation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
