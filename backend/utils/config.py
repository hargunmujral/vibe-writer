import os
import json
import yaml
from pathlib import Path
from typing import Dict, Any

def load_config(config_path: str = None) -> Dict[str, Any]:
    """
    Load configuration from a file. Supports JSON and YAML.
    
    Args:
        config_path (str, optional): Path to the configuration file. 
                                     If None, looks in default locations.
    
    Returns:
        dict: The loaded configuration
    """
    # Default configuration
    default_config = {
        "app": {
            "name": "Vibe Writer",
            "description": "An AI-powered writing assistant for long-form storytelling",
            "version": "0.1.0"
        },
        "editor": {
            "default_language": "markdown",
            "theme": "vs-dark",
            "font_size": 14,
            "line_height": 22,
            "tab_size": 4,
            "auto_save": True
        },
        "paths": {
            "data_dir": "data",
            "projects_dir": "data/projects"
        },
        "features": {
            "edit_history_enabled": True,
            "ai_suggestions_enabled": True
        }
    }
    
    # If config path is provided, try to load it
    if config_path:
        config_file = Path(config_path)
        if config_file.exists():
            try:
                return _load_config_file(config_path)
            except Exception as e:
                print(f"Error loading config from {config_path}: {e}")
                return default_config
    
    # Try to load from default locations
    config_paths = [
        "config.json",
        "config.yaml",
        "config.yml",
        os.path.join("config", "config.json"),
        os.path.join("config", "config.yaml"),
        os.path.join("config", "config.yml")
    ]
    
    for path in config_paths:
        try:
            if Path(path).exists():
                return _load_config_file(path)
        except Exception as e:
            print(f"Error loading config from {path}: {e}")
            continue
    
    # Return default config if no configuration file found
    return default_config

def _load_config_file(path: str) -> Dict[str, Any]:
    """
    Load configuration from a file based on its extension.
    
    Args:
        path (str): Path to the configuration file
    
    Returns:
        dict: The loaded configuration
    
    Raises:
        ValueError: If the file extension is not supported
    """
    path_obj = Path(path)
    extension = path_obj.suffix.lower()
    
    if extension in ['.json']:
        with open(path, 'r') as f:
            return json.load(f)
    elif extension in ['.yaml', '.yml']:
        with open(path, 'r') as f:
            return yaml.safe_load(f)
    else:
        raise ValueError(f"Unsupported configuration file format: {extension}")

def save_config(config: Dict[str, Any], path: str = "config.json") -> bool:
    """
    Save configuration to a file.
    
    Args:
        config (dict): The configuration to save
        path (str, optional): Path to save the configuration to. Defaults to "config.json".
    
    Returns:
        bool: True if the configuration was saved successfully, False otherwise
    """
    try:
        # Create parent directories if they don't exist
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        
        extension = Path(path).suffix.lower()
        
        if extension in ['.json']:
            with open(path, 'w') as f:
                json.dump(config, f, indent=2)
        elif extension in ['.yaml', '.yml']:
            with open(path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
        else:
            raise ValueError(f"Unsupported configuration file format: {extension}")
            
        return True
    except Exception as e:
        print(f"Error saving configuration: {e}")
        return False 