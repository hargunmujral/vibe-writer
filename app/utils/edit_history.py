import os
import json
from pathlib import Path
from datetime import datetime
from difflib import SequenceMatcher

class EditHistory:
    """Class to track and manage edit history and context"""
    
    def __init__(self, project_name, max_history_size=100, history_path=None):
        """
        Initialize the edit history tracker.
        
        Args:
            project_name (str): Name of the project
            max_history_size (int): Maximum number of edits to store in history
            history_path (str, optional): Path to the history file. If None, uses default path.
        """
        self.project_name = project_name
        self.max_history_size = max_history_size
        
        if history_path is None:
            # Default path in data/projects/{project_name}/edit_history.json
            self.history_path = os.path.join("data", "projects", project_name, "edit_history.json")
        else:
            self.history_path = history_path
        
        # Initialize empty history
        self.history = {
            "edits": [],
            "deletions": [],
            "metadata": {
                "project_name": project_name,
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat()
            }
        }
        
        # Load history if it exists
        self.load_history()
    
    def load_history(self):
        """Load edit history from file or initialize new one"""
        history_file = Path(self.history_path)
        
        if history_file.exists():
            try:
                with open(self.history_path, 'r') as f:
                    self.history = json.load(f)
                return True
            except Exception as e:
                print(f"Error loading edit history: {e}")
                return False
        else:
            # Create directories and save empty history
            history_file.parent.mkdir(parents=True, exist_ok=True)
            self.save_history()
            return True
    
    def save_history(self):
        """Save edit history to file"""
        try:
            # Update timestamp
            self.history["metadata"]["last_updated"] = datetime.now().isoformat()
            
            # Create parent directories if they don't exist
            Path(self.history_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Write history
            with open(self.history_path, 'w') as f:
                json.dump(self.history, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving edit history: {e}")
            return False
    
    def record_edit(self, old_text, new_text, location=None, edit_type="text_change"):
        """
        Record an edit in the history.
        
        Args:
            old_text (str): Text before the edit
            new_text (str): Text after the edit
            location (dict, optional): Information about edit location (cursor position, section, etc.)
            edit_type (str): Type of edit (e.g., text_change, format_change, etc.)
            
        Returns:
            dict: The recorded edit
        """
        # Calculate diff
        diff = self._calculate_diff(old_text, new_text)
        
        # Create edit record
        edit = {
            "timestamp": datetime.now().isoformat(),
            "edit_type": edit_type,
            "diff": diff,
            "location": location or {},
            "context": {
                "before": old_text[-min(100, len(old_text)):] if old_text else "",
                "after": new_text[:min(100, len(new_text))] if new_text else ""
            }
        }
        
        # Add to history and trim if needed
        self.history["edits"].insert(0, edit)
        if len(self.history["edits"]) > self.max_history_size:
            self.history["edits"] = self.history["edits"][:self.max_history_size]
        
        # Save history
        self.save_history()
        
        return edit
    
    def record_deletion(self, deleted_text, location=None):
        """
        Record a deletion in the history.
        
        Args:
            deleted_text (str): Text that was deleted
            location (dict, optional): Information about deletion location
            
        Returns:
            dict: The recorded deletion
        """
        # Create deletion record
        deletion = {
            "timestamp": datetime.now().isoformat(),
            "deleted_text": deleted_text,
            "location": location or {},
            "context": deleted_text[:min(200, len(deleted_text))] if deleted_text else ""
        }
        
        # Add to history and trim if needed
        self.history["deletions"].insert(0, deletion)
        if len(self.history["deletions"]) > self.max_history_size:
            self.history["deletions"] = self.history["deletions"][:self.max_history_size]
        
        # Save history
        self.save_history()
        
        return deletion
    
    def get_recent_edits(self, count=10):
        """
        Get recent edits from history.
        
        Args:
            count (int): Number of edits to retrieve
            
        Returns:
            list: Recent edits
        """
        return self.history["edits"][:min(count, len(self.history["edits"]))]
    
    def get_recent_deletions(self, count=10):
        """
        Get recent deletions from history.
        
        Args:
            count (int): Number of deletions to retrieve
            
        Returns:
            list: Recent deletions
        """
        return self.history["deletions"][:min(count, len(self.history["deletions"]))]
    
    def get_context_for_completion(self, current_text, cursor_position):
        """
        Get relevant context for AI completion based on edit history and current text.
        
        Args:
            current_text (str): Current text in editor
            cursor_position (int): Current cursor position
            
        Returns:
            dict: Context for AI completion
        """
        # Get text before cursor for immediate context
        text_before_cursor = current_text[:cursor_position] if cursor_position <= len(current_text) else current_text
        
        # Get recent edits for additional context
        recent_edits = self.get_recent_edits(5)
        
        # Extract patterns from recent edits
        edit_patterns = self._extract_edit_patterns(recent_edits)
        
        return {
            "immediate_context": text_before_cursor[-min(200, len(text_before_cursor)):],
            "recent_edits": recent_edits,
            "edit_patterns": edit_patterns
        }
    
    def find_related_deletions(self, search_text, max_results=5):
        """
        Find deletions related to the search text.
        
        Args:
            search_text (str): Text to search for in deletions
            max_results (int): Maximum number of results to return
            
        Returns:
            list: Related deletions
        """
        search_text = search_text.lower()
        related_deletions = []
        
        for deletion in self.history["deletions"]:
            if search_text in deletion.get("deleted_text", "").lower():
                related_deletions.append(deletion)
                if len(related_deletions) >= max_results:
                    break
        
        return related_deletions
    
    def _calculate_diff(self, old_text, new_text):
        """Calculate a simple diff between old_text and new_text"""
        # For simplicity, just return lengths and a brief summary
        # In a production implementation, a more sophisticated diff algorithm would be used
        old_len = len(old_text) if old_text else 0
        new_len = len(new_text) if new_text else 0
        
        # Calculate similarity ratio
        similarity = SequenceMatcher(None, old_text or "", new_text or "").ratio()
        
        return {
            "old_length": old_len,
            "new_length": new_len,
            "change_size": new_len - old_len,
            "similarity": similarity
        }
    
    def _extract_edit_patterns(self, edits):
        """Extract patterns from recent edits"""
        # This is a placeholder for more sophisticated pattern recognition
        # In a real implementation, this would use NLP or ML techniques
        
        patterns = {
            "average_edit_size": 0,
            "common_changes": []
        }
        
        if not edits:
            return patterns
        
        # Calculate average edit size
        total_change_size = sum(abs(edit.get("diff", {}).get("change_size", 0)) for edit in edits)
        patterns["average_edit_size"] = total_change_size / len(edits)
        
        return patterns 