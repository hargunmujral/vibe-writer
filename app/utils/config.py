import os
import json
from pathlib import Path

# Default configuration
DEFAULT_CONFIG = {
    "app": {
        "name": "Vibe Writer",
        "version": "0.1.0",
        "theme": "dark"
    },
    "editor": {
        "font_size": 14,
        "tab_size": 4,
        "word_wrap": True,
        "auto_save": True,
        "auto_save_interval": 60  # seconds
    },
    "ai": {
        "enabled": True,
        "creativity": 0.7,
        "default_model": "gpt-4",
        "features": {
            "autocomplete": True,
            "style_consistency": True,
            "reference_suggestions": True
        }
    },
    "storage": {
        "projects_dir": "data/projects",
        "user_data_dir": "data/user_data"
    }
}

def load_config(config_path=None):
    """
    Load configuration from file or use defaults.
    
    Args:
        config_path (str, optional): Path to the config file. If None, uses default path.
        
    Returns:
        dict: The loaded configuration
    """
    if config_path is None:
        config_path = os.path.join("data", "config.json")
    
    # Create config file with defaults if it doesn't exist
    config_file = Path(config_path)
    if not config_file.exists():
        # Create parent directories if they don't exist
        config_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Write default config
        with open(config_path, 'w') as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        
        return DEFAULT_CONFIG
    
    # Load existing config
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except Exception as e:
        print(f"Error loading config: {e}")
        return DEFAULT_CONFIG

def save_config(config, config_path=None):
    """
    Save configuration to file.
    
    Args:
        config (dict): The configuration to save
        config_path (str, optional): Path to the config file. If None, uses default path.
        
    Returns:
        bool: True if successful, False otherwise
    """
    if config_path is None:
        config_path = os.path.join("data", "config.json")
    
    try:
        # Create parent directories if they don't exist
        Path(config_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Write config
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False

def update_config(updates, config_path=None):
    """
    Update specific configuration values.
    
    Args:
        updates (dict): Dictionary of updates to apply
        config_path (str, optional): Path to the config file. If None, uses default path.
        
    Returns:
        dict: The updated configuration
    """
    config = load_config(config_path)
    
    # Helper function to recursively update nested dictionaries
    def update_nested_dict(d, u):
        for k, v in u.items():
            if isinstance(v, dict) and k in d and isinstance(d[k], dict):
                d[k] = update_nested_dict(d[k], v)
            else:
                d[k] = v
        return d
    
    # Apply updates
    config = update_nested_dict(config, updates)
    
    # Save updated config
    save_config(config, config_path)
    
    return config 