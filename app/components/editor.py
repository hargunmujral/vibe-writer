import streamlit as st
from streamlit_monaco import st_monaco
import json
from utils.edit_history import EditHistory

def create_editor(initial_content="", language="markdown", project_name="default"):
    """
    Creates and renders a Monaco editor in the Streamlit app.
    
    Args:
        initial_content (str): Initial text to display in the editor
        language (str): Language for syntax highlighting (default: markdown)
        project_name (str): Name of the current project
        
    Returns:
        str: The current content of the editor
    """
    # Editor settings
    height = 600  # Editor height
    
    # Apply custom CSS for Monaco editor
    st.markdown("""
    <style>
    /* Monaco editor custom styling */
    .monaco-editor {
        font-size: 14px !important;
        line-height: 22px !important;
    }
    
    /* Make sure the editor has full width */
    .stMonacoEditor > div {
        width: 100% !important;
    }
    
    /* Dark theme adjustments */
    .monaco-editor .monaco-scrollable-element {
        background-color: #1e1e1e !important;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Initialize edit history in session state if not present
    if "edit_history" not in st.session_state:
        st.session_state.edit_history = EditHistory(project_name)
    
    # Use session state to maintain content between reruns
    if "editor_content" not in st.session_state:
        st.session_state.editor_content = initial_content
        # Record initial content if not empty
        if initial_content:
            st.session_state.edit_history.record_edit("", initial_content, edit_type="initial_content")
    
    # Keep track of previous content to detect changes
    previous_content = st.session_state.editor_content
    
    # Try different approaches to pass options to Monaco editor
    try:
        # First approach: Pass theme directly with other basic parameters
        content = st_monaco(
            value=st.session_state.editor_content,
            language=language,
            height=height,
            theme="vs-dark",  # Try passing theme directly
        )
    except TypeError:
        print("******* TypeError *******")
        # Fallback to minimal parameters if theme doesn't work
        st.warning("Using simplified editor without custom options", icon="⚠️")
        content = st_monaco(
            value=st.session_state.editor_content,
            language=language,
            height=height,
        )
    
    # Update session state with current content and record edit if changed
    if content and content != previous_content:
        # Record the edit in history
        cursor_position = len(content)  # Simplified - ideally we'd get the actual cursor position
        st.session_state.edit_history.record_edit(
            previous_content, 
            content, 
            location={"cursor_position": cursor_position}
        )
        st.session_state.editor_content = content
    
    # Display edit history section if enabled
    if st.session_state.get("show_edit_history", False):
        display_edit_history()
    
    return content

def display_edit_history():
    """Display the edit history interface"""
    st.subheader("Edit History")
    
    recent_edits = st.session_state.edit_history.get_recent_edits(5)
    recent_deletions = st.session_state.edit_history.get_recent_deletions(5)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("Recent Edits")
        for i, edit in enumerate(recent_edits):
            with st.expander(f"Edit {i+1} - {edit.get('timestamp', 'Unknown time')[11:19]}"):
                st.text(f"Type: {edit.get('edit_type', 'text_change')}")
                st.text(f"Size: {edit.get('diff', {}).get('change_size', 'unknown')} characters")
                
                if "context" in edit:
                    st.text("Context (before):")
                    st.text_area("", edit["context"]["before"], height=50, key=f"edit_before_{i}")
                    st.text("Context (after):")
                    st.text_area("", edit["context"]["after"], height=50, key=f"edit_after_{i}")
    
    with col2:
        st.write("Recent Deletions")
        for i, deletion in enumerate(recent_deletions):
            with st.expander(f"Deletion {i+1} - {deletion.get('timestamp', 'Unknown time')[11:19]}"):
                deleted_text = deletion.get("deleted_text", "")
                preview = deleted_text[:100] + "..." if len(deleted_text) > 100 else deleted_text
                st.text("Preview:")
                st.text_area("", preview, height=50, key=f"deletion_{i}")
                
                # Button to restore deleted text
                if st.button("Restore this text", key=f"restore_{i}"):
                    if "editor_content" in st.session_state:
                        current_content = st.session_state.editor_content
                        # Simple append - in production, would insert at cursor position
                        st.session_state.editor_content = current_content + "\n\n" + deleted_text
                        st.info("Deleted text restored at the end of the document.")
                        st.rerun()

def get_autocomplete_suggestions(current_text, cursor_position):
    """
    Generate autocomplete suggestions based on current text and cursor position.
    Uses edit history for context-aware suggestions.
    
    Args:
        current_text (str): The current text in the editor
        cursor_position (dict): The cursor position information
        
    Returns:
        list: A list of suggestion objects
    """
    # If edit history is available, use it for context
    context = {}
    if "edit_history" in st.session_state:
        context = st.session_state.edit_history.get_context_for_completion(
            current_text, 
            cursor_position
        )
    
    # This would be replaced with actual AI logic in the future
    # Here we're just using a simple placeholder
    return [
        {"label": "Continue writing...", "kind": 17, "insertText": " This is a suggestion."},
        {"label": "Start a new paragraph", "kind": 17, "insertText": "\n\n"},
        {"label": "Reference edit history", "kind": 17, "insertText": " (as I edited earlier...)"}
    ] 