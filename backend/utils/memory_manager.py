import os
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

class MemoryManager:
    """Simple class to manage story memories for a project"""
    
    def __init__(self, project_name):
        """Initialize the memory manager"""
        self.project_name = project_name
        self.memory_path = os.path.join("data", "projects", project_name, "memories.json")
        
        # Initialize empty memories structure
        self.memories = {
            "chunks": [],
            "metadata": {
                "project_name": project_name,
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat()
            }
        }
        
        # Load memories if they exist
        self.load_memories()

   
    def load_memories(self):
        """Load memories from file or initialize new ones"""
        memory_file = Path(self.memory_path)
        
        if memory_file.exists():
            try:
                with open(self.memory_path, 'r') as f:
                    self.memories = json.load(f)
                return True
            except Exception as e:
                print(f"Error loading memories: {e}")
                return False
        else:
            # Create directories and save empty memories
            memory_file.parent.mkdir(parents=True, exist_ok=True)
            self.save_memories()
            return True

    def save_memories(self):
        """Save memories to file"""
        try:
            # Update timestamp
            self.memories["metadata"]["last_updated"] = datetime.now().isoformat()
            
            # Create parent directories if they don't exist
            Path(self.memory_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Write memories
            with open(self.memory_path, 'w') as f:
                json.dump(self.memories, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving memories: {e}")
            return False
        
    def add_memory(self, memory_text: str, text_position: int):
        """
        Add a new memory.
        
        Args:
            memory_text (str): The memory text
            text_position (int): Position in the document
            
        Returns:
            dict: The created memory
        """
        timestamp = int(datetime.now().timestamp())
        memory = {
            "id": f"mem_{timestamp}",
            "text": memory_text,
            "position": text_position,
            "created_at": timestamp,
            "user_edited": False
        }
        
        # Add to memories and save
        self.memories["chunks"].append(memory)
        self.save_memories()
        
        return memory
    
    def get_all_memories(self):
        """Get all memories"""
        return self.memories["chunks"]
    
    def edit_memory(self, memory_id: str, new_text: str):
        """Edit an existing memory"""
        for i, memory in enumerate(self.memories["chunks"]):
            if memory["id"] == memory_id:
                self.memories["chunks"][i]["text"] = new_text
                self.memories["chunks"][i]["user_edited"] = True
                self.save_memories()
                return self.memories["chunks"][i]
        
        return None
    
    def delete_memory(self, memory_id: str):
        """Delete a memory"""
        for i, memory in enumerate(self.memories["chunks"]):
            if memory["id"] == memory_id:
                del self.memories["chunks"][i]
                self.save_memories()
                return True
        
        return False
    