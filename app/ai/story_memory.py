import os
import json
from pathlib import Path

class StoryMemory:
    """Class to manage story elements memory"""
    
    def __init__(self, project_name, memory_path=None):
        """
        Initialize the story memory.
        
        Args:
            project_name (str): Name of the project
            memory_path (str, optional): Path to the memory file. If None, uses default path.
        """
        self.project_name = project_name
        
        if memory_path is None:
            # Default path in data/projects/{project_name}/memory.json
            self.memory_path = os.path.join("data", "projects", project_name, "memory.json")
        else:
            self.memory_path = memory_path
        
        # Default empty memory structure
        self.memory = {
            "characters": [],
            "settings": [],
            "plot_points": [],
            "themes": [],
            "relationships": [],
            "items": [],
            "metadata": {
                "project_name": project_name,
                "created_at": None,
                "last_updated": None
            }
        }
        
        # Load memory if it exists
        self.load_memory()
    
    def load_memory(self):
        """Load memory from file or initialize new one"""
        memory_file = Path(self.memory_path)
        
        if memory_file.exists():
            try:
                with open(self.memory_path, 'r') as f:
                    self.memory = json.load(f)
                return True
            except Exception as e:
                print(f"Error loading story memory: {e}")
                return False
        else:
            # Initialize with current timestamp
            from datetime import datetime
            now = datetime.now().isoformat()
            self.memory["metadata"]["created_at"] = now
            self.memory["metadata"]["last_updated"] = now
            
            # Create directories and save
            memory_file.parent.mkdir(parents=True, exist_ok=True)
            self.save_memory()
            return True
    
    def save_memory(self):
        """Save memory to file"""
        try:
            # Update timestamp
            from datetime import datetime
            self.memory["metadata"]["last_updated"] = datetime.now().isoformat()
            
            # Create parent directories if they don't exist
            Path(self.memory_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Write memory
            with open(self.memory_path, 'w') as f:
                json.dump(self.memory, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving story memory: {e}")
            return False
    
    def add_character(self, name, description, attributes=None):
        """
        Add a character to the story memory.
        
        Args:
            name (str): Character name
            description (str): Character description
            attributes (dict, optional): Additional character attributes
            
        Returns:
            dict: The added character data
        """
        if attributes is None:
            attributes = {}
        
        character = {
            "id": self._generate_id("character", name),
            "name": name,
            "description": description,
            "attributes": attributes,
            "references": []  # References to this character in the text
        }
        
        self.memory["characters"].append(character)
        self.save_memory()
        return character
    
    def add_setting(self, name, description, attributes=None):
        """
        Add a setting to the story memory.
        
        Args:
            name (str): Setting name
            description (str): Setting description
            attributes (dict, optional): Additional setting attributes
            
        Returns:
            dict: The added setting data
        """
        if attributes is None:
            attributes = {}
        
        setting = {
            "id": self._generate_id("setting", name),
            "name": name,
            "description": description,
            "attributes": attributes,
            "references": []
        }
        
        self.memory["settings"].append(setting)
        self.save_memory()
        return setting
    
    def add_plot_point(self, title, description, chapter=None, scene=None):
        """
        Add a plot point to the story memory.
        
        Args:
            title (str): Plot point title
            description (str): Plot point description
            chapter (str, optional): Associated chapter
            scene (str, optional): Associated scene
            
        Returns:
            dict: The added plot point data
        """
        plot_point = {
            "id": self._generate_id("plot", title),
            "title": title,
            "description": description,
            "chapter": chapter,
            "scene": scene,
            "connected_elements": []  # Related characters, settings, etc.
        }
        
        self.memory["plot_points"].append(plot_point)
        self.save_memory()
        return plot_point
    
    def add_theme(self, name, description):
        """
        Add a theme to the story memory.
        
        Args:
            name (str): Theme name
            description (str): Theme description
            
        Returns:
            dict: The added theme data
        """
        theme = {
            "id": self._generate_id("theme", name),
            "name": name,
            "description": description,
            "examples": []  # Text examples of this theme
        }
        
        self.memory["themes"].append(theme)
        self.save_memory()
        return theme
    
    def search_memory(self, query, categories=None):
        """
        Search through story memory for matching elements.
        
        Args:
            query (str): Search query
            categories (list, optional): Categories to search in. If None, searches all.
            
        Returns:
            list: List of matching elements
        """
        results = []
        query = query.lower()
        
        if categories is None:
            categories = ["characters", "settings", "plot_points", "themes", "items"]
        
        for category in categories:
            if category not in self.memory:
                continue
            
            for element in self.memory[category]:
                # Search in name/title
                name = element.get("name", "") or element.get("title", "")
                if query in name.lower():
                    results.append({"category": category, "element": element})
                    continue
                
                # Search in description
                description = element.get("description", "")
                if description and query in description.lower():
                    results.append({"category": category, "element": element})
                    continue
                
                # Search in attributes
                attributes = element.get("attributes", {})
                for attr_value in attributes.values():
                    if isinstance(attr_value, str) and query in attr_value.lower():
                        results.append({"category": category, "element": element})
                        break
        
        return results
    
    def _generate_id(self, prefix, name):
        """Generate a simple ID for an element"""
        import re
        from datetime import datetime
        
        # Clean the name to create a slug
        slug = re.sub(r'[^a-z0-9]', '-', name.lower())
        # Add timestamp to ensure uniqueness
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
        return f"{prefix}_{slug}_{timestamp}" 