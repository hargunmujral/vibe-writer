import os
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

# Initialize OpenAI client
try:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    client = None

def generate_text_completion(prompt, max_tokens=100, temperature=0.7, model="gpt-4", edit_history=None):
    """
    Generate text completion using OpenAI API.
    
    Args:
        prompt (str): The text prompt to complete
        max_tokens (int): Maximum number of tokens to generate
        temperature (float): Controls randomness of output (0.0-1.0)
        model (str): The AI model to use
        edit_history (dict, optional): Recent edit history for context
        
    Returns:
        str: The generated text completion or empty string if error
    """
    if client is None:
        return "API key not configured. Please add your OpenAI API key to the .env file."
    
    # Prepare system prompt with context from edit history if available
    system_prompt = "You are a helpful writing assistant."
    
    if edit_history:
        # Include insights from edit history in the system prompt
        recent_edits = edit_history.get("recent_edits", [])
        edit_patterns = edit_history.get("edit_patterns", {})
        
        if recent_edits or edit_patterns:
            system_prompt += "\n\nRecent editing context:"
            
            if edit_patterns:
                avg_edit_size = edit_patterns.get("average_edit_size", 0)
                system_prompt += f"\n- The writer typically makes edits of around {avg_edit_size:.1f} characters."
            
            if recent_edits:
                # Extract key information from recent edits
                edit_types = set()
                for edit in recent_edits[:3]:  # Look at most recent 3 edits
                    if "edit_type" in edit:
                        edit_types.add(edit["edit_type"])
                
                system_prompt += f"\n- Recent edit types: {', '.join(edit_types)}"
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating text completion: {e}")
        return ""

def get_sentence_suggestions(current_text, num_suggestions=3, temperature=0.7, edit_history=None):
    """
    Generate sentence completion suggestions based on the current text.
    
    Args:
        current_text (str): The current text in the editor
        num_suggestions (int): Number of different suggestions to generate
        temperature (float): Controls randomness of output (0.0-1.0)
        edit_history (dict, optional): Recent edit history for context
        
    Returns:
        list: A list of text suggestions
    """
    if client is None:
        return ["API key not configured. Please add your OpenAI API key."]
    
    # Prepare system prompt with context
    system_prompt = "You are a helpful writing assistant. Provide brief, creative sentence continuations."
    
    # If we have edit history, enhance the prompt
    context_info = ""
    if edit_history:
        # Check for relevant deletions that could inform suggestions
        recent_deletions = edit_history.get("recent_deletions", [])
        if recent_deletions:
            deletion_content = "\n".join([
                f"- {d.get('deleted_text', '')[:50]}..." 
                for d in recent_deletions[:2]
            ])
            context_info += f"\nRecently deleted content that might be relevant:\n{deletion_content}\n"
        
        # Include edit patterns for style consistency
        edit_patterns = edit_history.get("edit_patterns", {})
        if edit_patterns:
            context_info += "\nWriter's editing patterns suggest maintaining a consistent style."
    
    # Prepare prompt for getting sentence completions
    prompt = f"""
    The following is a piece of writing. Provide {num_suggestions} different ways to continue 
    the next sentence or paragraph:
    
    {current_text}
    
    {context_info}
    
    Continuations:
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=temperature,
            n=num_suggestions
        )
        
        suggestions = [choice.message.content.strip() for choice in response.choices]
        return suggestions
    except Exception as e:
        print(f"Error generating sentence suggestions: {e}")
        return ["Unable to generate suggestions at this time."]

def analyze_text_style(text):
    """
    Analyze the writing style of a text.
    
    Args:
        text (str): The text to analyze
        
    Returns:
        dict: A dictionary containing style metrics
    """
    if client is None:
        return {"error": "API key not configured"}
    
    if not text or len(text) < 100:
        return {"error": "Text too short for meaningful analysis"}
    
    prompt = f"""
    Analyze the writing style of the following text and return a JSON object with these properties:
    - tone: the overall tone (formal, informal, conversational, academic, etc.)
    - voice: the narrative voice (first person, third person, etc.)
    - pacing: how fast or slow the narrative moves
    - vocabulary_level: simple, moderate, advanced
    - sentence_structure: simple, complex, varied, etc.
    
    Text to analyze:
    {text[:2000]}  # Limiting to first 2000 chars for API efficiency
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a literary analyst. Respond only with the requested JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.2
        )
        
        analysis_text = response.choices[0].message.content.strip()
        
        # Extract JSON from response if needed
        import json
        import re
        
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
        if json_match:
            try:
                analysis = json.loads(json_match.group(0))
                return analysis
            except json.JSONDecodeError:
                pass
        
        # If parsing failed, return the raw text
        return {"raw_analysis": analysis_text}
    except Exception as e:
        print(f"Error analyzing text style: {e}")
        return {"error": str(e)} 