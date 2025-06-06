from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import json
from datetime import datetime
from pathlib import Path
import openai
from dotenv import load_dotenv

from utils.edit_history import EditHistory
from utils.config import load_config
from utils.llm import request_llm
app = FastAPI(title="Vibe Writer API", description="Backend API for Vibe Writer application")

# Load environment variables
load_dotenv()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class TextContent(BaseModel):
    content: str
    project_name: str
    cursor_position: Optional[int] = None

class EditResponse(BaseModel):
    success: bool
    message: str
    content: Optional[str] = None

class ProjectInfo(BaseModel):
    project_name: str
    description: Optional[str] = None

class DeletedTextInfo(BaseModel):
    deleted_text: str
    project_name: str

class AutocompleteRequest(BaseModel):
    memory: str
    recent_edits: List[Dict[str, Any]]
    previous_context: str
    current_snippet: str
    project_name: str

class AutocompleteResponse(BaseModel):
    completion: str

class MemoryRequest(BaseModel):
    project_name: str
    text_chunk: str
    past_memory: List[str]
# Helper functions
def get_edit_history(project_name: str) -> EditHistory:
    return EditHistory(project_name)

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to Vibe Writer API"}

@app.get("/config")
async def get_config():
    config = load_config()
    return config

@app.post("/content/save")
async def save_content(content_data: TextContent):
    try:
        # Load existing content
        project_path = Path(f"data/projects/{content_data.project_name}/content.json")
        
        old_content = ""
        if project_path.exists():
            with open(project_path, "r") as f:
                data = json.load(f)
                old_content = data.get("content", "")
        
        # Create directory if doesn't exist
        project_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save new content
        with open(project_path, "w") as f:
            json.dump({
                "content": content_data.content,
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)
        
        # Record edit in history
        history = get_edit_history(content_data.project_name)
        history.record_edit(
            old_content, 
            content_data.content, 
            location={"cursor_position": content_data.cursor_position}
        )
        
        return EditResponse(
            success=True,
            message="Content saved successfully",
            content=content_data.content
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving content: {str(e)}")

@app.get("/content/{project_name}")
async def get_content(project_name: str):
    try:
        project_path = Path(f"data/projects/{project_name}/content.json")
        
        if not project_path.exists():
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Project '{project_name}' not found"}
            )
        
        with open(project_path, "r") as f:
            data = json.load(f)
        
        return {"success": True, "content": data.get("content", ""), "last_updated": data.get("last_updated")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving content: {str(e)}")

@app.get("/history/edits/{project_name}")
async def get_edit_history_endpoint(project_name: str, count: int = 10):
    try:
        history = get_edit_history(project_name)
        edits = history.get_recent_edits(count)
        return {"success": True, "edits": edits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving edit history: {str(e)}")

@app.get("/history/deletions/{project_name}")
async def get_deletion_history(project_name: str, count: int = 10):
    try:
        history = get_edit_history(project_name)
        deletions = history.get_recent_deletions(count)
        return {"success": True, "deletions": deletions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving deletion history: {str(e)}")

@app.post("/history/restore")
async def restore_deleted_text(deletion_info: DeletedTextInfo):
    try:
        # Load existing content
        project_path = Path(f"data/projects/{deletion_info.project_name}/content.json")
        
        if not project_path.exists():
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Project '{deletion_info.project_name}' not found"}
            )
            
        with open(project_path, "r") as f:
            data = json.load(f)
            current_content = data.get("content", "")
        
        # Append deleted text to the end for now
        # In a real application, you might want to insert at cursor position
        new_content = current_content + "\n\n" + deletion_info.deleted_text
        
        # Save updated content
        with open(project_path, "w") as f:
            json.dump({
                "content": new_content,
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)
        
        # Record edit in history
        history = get_edit_history(deletion_info.project_name)
        history.record_edit(
            current_content, 
            new_content, 
            edit_type="restore_deletion"
        )
        
        return EditResponse(
            success=True,
            message="Deleted text restored successfully",
            content=new_content
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error restoring deleted text: {str(e)}")

@app.get("/projects")
async def list_projects():
    try:
        projects_dir = Path("data/projects")
        if not projects_dir.exists():
            return {"success": True, "projects": []}
            
        projects = []
        for project_dir in projects_dir.iterdir():
            if project_dir.is_dir():
                info_path = project_dir / "info.json"
                project_info = {"project_name": project_dir.name}
                
                if info_path.exists():
                    with open(info_path, "r") as f:
                        info = json.load(f)
                        project_info.update(info)
                        
                projects.append(project_info)
                
        return {"success": True, "projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing projects: {str(e)}")

@app.post("/projects")
async def create_project(project_info: ProjectInfo):
    try:
        project_dir = Path(f"data/projects/{project_info.project_name}")
        
        if project_dir.exists():
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"Project '{project_info.project_name}' already exists"}
            )
            
        # Create project directory
        project_dir.mkdir(parents=True, exist_ok=True)
        
        # Save project info
        with open(project_dir / "info.json", "w") as f:
            json.dump({
                "project_name": project_info.project_name,
                "description": project_info.description,
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)
            
        # Create empty content file
        with open(project_dir / "content.json", "w") as f:
            json.dump({
                "content": "",
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)
            
        # Initialize edit history
        history = get_edit_history(project_info.project_name)
        
        return {"success": True, "message": f"Project '{project_info.project_name}' created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@app.post("/autocomplete")
async def autocomplete(request: AutocompleteRequest):
    print(f"Received autocomplete request: {request}")  
    try:
        # Create prompt for the model
        prompt = f"""You are an AI writing assistant helping a user complete their current sentence.
        USER INFORMATION:
        {request.memory}

        RECENT EDITING HISTORY:
        {json.dumps(request.recent_edits, indent=2)}

        PREVIOUS CONTEXT:
        {request.previous_context}

        TASK:
        Complete ONLY the current sentence in a way that flows naturally from what has been written. 
        Do not add any additional sentences, paragraphs, or explanations. 
        Return ONLY the suggested text completion that would finish the current sentence.
        """
        
        current_text = f"CURRENT TEXT (incomplete sentence, just continue on): {request.current_snippet}"

        # Call the Llama model
        completion = request_llm(user_prompt=current_text, system_prompt=prompt, max_tokens=100, temperature=0.7, model="llama-3.3-70b-versatile")
        
        return AutocompleteResponse(completion=completion)
    
    except Exception as e:
        print(f"Error generating autocomplete: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating autocomplete: {str(e)}")

@app.post("/memory/generate")
async def generate_memory(request: MemoryRequest):
    system_prompt = """
    Read the following segment of a story. Create a brief memory (about 100 characters) 
    that captures the most important information from this segment.
    If nothing significant happened, respond with "NO MEMORY".
        
    Story segment:
    """
    try:
        user_prompt = f"{request.text_chunk}\n\nMemory (keep under 100 characters):"
        
        memory = request_llm(
            user_prompt=user_prompt, 
            system_prompt=system_prompt, 
            max_tokens=100, 
            temperature=0.7, 
            model="llama-3.3-70b-versatile"
        )

        # Strip and check if it's a "NO MEMORY" response
        memory_text = memory.strip()
        if memory_text.upper() == "NO MEMORY":
            return {"generated": False, "memory": None}
        return {"generated": True, "memory": memory_text}
    
    except Exception as e:
        print(f"Error generating memory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating memory: {str(e)}")
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True) 