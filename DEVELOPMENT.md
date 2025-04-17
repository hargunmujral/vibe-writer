# Vibe Writer Development Guide

This document provides detailed information for developers working on the Vibe Writer project.

## Project Architecture

### Backend (FastAPI)

The backend is built with FastAPI, a modern Python web framework that makes it easy to build APIs.

#### Key Components:

- **main.py**: Main application entry point and API routes
- **utils/edit_history.py**: Tracks and manages edit history
- **utils/config.py**: Handles configuration loading and saving

#### API Endpoints:

- `/projects`: List and create projects
- `/content/{project_name}`: Get and save content
- `/history/edits/{project_name}`: Get edit history
- `/history/deletions/{project_name}`: Get deletion history
- `/history/restore`: Restore deleted text

### Frontend (Next.js & TypeScript)

The frontend is built with Next.js and TypeScript, using the App Router pattern.

#### Key Components:

- **app/**: Next.js App Router pages and layouts
- **components/**: React components
  - **Editor.tsx**: Monaco editor component
  - **Sidebar.tsx**: Project management sidebar
  - **TabsContainer.tsx**: Tab navigation
  - **StoryMemory.tsx**: Story elements management (placeholder)
  - **KnowledgeGraph.tsx**: Knowledge graph visualization (placeholder)
  - **EditHistory.tsx**: Edit history display and management
- **types/**: TypeScript type definitions

## Development Setup

### Prerequisites

- Node.js 16+
- Python 3.8+
- npm or yarn

### First-time Setup

1. Clone the repository and navigate to the project folder
2. Make the start script executable: `chmod +x start.sh`
3. Run the start script: `./start.sh`

### Development Workflow

1. Frontend development:

   - Make changes to the files in the `frontend` directory
   - The Next.js dev server will automatically reload

2. Backend development:
   - Make changes to the files in the `backend` directory
   - The uvicorn server will automatically reload

## Common Issues and Solutions

### TypeScript Errors

If you're getting TypeScript errors related to React or JSX:

1. Check that the `frontend/types/react.d.ts` and `frontend/types/events.d.ts` files exist
2. Make sure your editor is using the project's TypeScript configuration
3. Try running `npm install` in the frontend directory to ensure all dependencies are installed

### Import Issues

If you're having problems with imports in the frontend:

1. Make sure to use the `@/` prefix for imports from the root of the frontend directory
2. Example: `import { ProjectInfo } from "@/types/api";`

### Babel and Next.js Setup Issues

If you encounter errors related to Babel or Next.js compilation:

1. Error: `Failed to resolve "@babel/runtime/regenerator"`:

   - Run `npm install --save @babel/runtime` in the frontend directory
   - Run `npm install --save-dev @babel/core @babel/plugin-transform-runtime` in the frontend directory
   - Make sure your `.babelrc` includes the transform-runtime plugin

2. Error: `ENOENT: no such file or directory, open '.next/fallback-build-manifest.json'`:

   - Delete the `.next` directory: `rm -rf frontend/.next`
   - Reinstall dependencies: `cd frontend && npm install`
   - Restart the development server

3. If you see warnings about SWC being disabled:
   - This is expected since we're using a custom Babel configuration
   - You can modify `next.config.js` to adjust settings if needed

### Backend Connection Issues

If the frontend can't connect to the backend:

1. Check that the backend server is running on port 8000
2. Verify the API endpoints in the browser at `http://localhost:8000/docs`
3. Check the browser console for CORS errors

## Deployment

### Containerization with Docker

To build a Docker container for production:

```bash
docker build -t vibe-writer .
docker run -p 3000:3000 -p 8000:8000 vibe-writer
```

### Manual Deployment

1. Build the frontend:

   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the backend:

   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. Serve the frontend with a static file server or reverse proxy

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
