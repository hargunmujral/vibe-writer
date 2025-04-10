import streamlit as st
from components.editor import create_editor
from components.sidebar import render_sidebar
from utils.config import load_config

def main():
    # Set page configuration
    st.set_page_config(
        page_title="Vibe Writer",
        page_icon="📝",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Load configuration
    config = load_config()
    
    # Title and description
    st.title("Vibe Writer")
    st.markdown("An AI-powered writing assistant for long-form storytelling")
    
    # Create sidebar
    sidebar_settings = render_sidebar()
    
    # Project name (simplified - would be part of project management)
    if "project_name" not in st.session_state:
        st.session_state.project_name = "default_project"
    
    # Main content area with tabs
    tab1, tab2, tab3, tab4 = st.tabs(["Editor", "Story Memory", "Knowledge Graph", "Edit History"])
    
    with tab1:
        # Create the Monaco editor component with project name
        editor_content = create_editor(
            project_name=st.session_state.project_name
        )
        
        col1, col2 = st.columns([4, 1])
        with col1:
            if st.button("Save", use_container_width=True):
                st.toast("Content saved successfully!")
        with col2:
            if st.button("AI Assist", use_container_width=True):
                st.info("AI assistance feature coming soon!")
    
    with tab2:
        st.header("Story Memory")
        st.info("This section will allow you to manage your story's characters, settings, plot points, and themes.")
        
        # Placeholder for the story memory feature
        memory_tabs = st.tabs(["Characters", "Settings", "Plot Points", "Themes"])
        with memory_tabs[0]:
            st.write("Character management coming soon...")
    
    with tab3:
        st.header("Knowledge Graph")
        st.info("This section will display a visual representation of your story elements and their relationships.")
        # Placeholder for the knowledge graph visualization
        st.markdown("Graph visualization coming soon...")
    
    with tab4:
        st.header("Edit History")
        
        # Toggle for displaying edit history in the editor
        show_history_in_editor = st.toggle("Show history in editor", value=False)
        st.session_state.show_edit_history = show_history_in_editor
        
        # Edit history section
        if "edit_history" in st.session_state:
            # Recent edits
            with st.expander("Recent Edits", expanded=True):
                recent_edits = st.session_state.edit_history.get_recent_edits(10)
                if recent_edits:
                    for i, edit in enumerate(recent_edits):
                        timestamp = edit.get("timestamp", "Unknown time")
                        diff = edit.get("diff", {})
                        change_size = diff.get("change_size", 0)
                        change_type = "Added" if change_size > 0 else "Removed" if change_size < 0 else "Modified"
                        
                        st.markdown(f"**Edit {i+1}** - {timestamp[11:19]} - {change_type} {abs(change_size)} characters")
                else:
                    st.write("No edits recorded yet.")
            
            # Recent deletions
            with st.expander("Recent Deletions", expanded=True):
                recent_deletions = st.session_state.edit_history.get_recent_deletions(10)
                if recent_deletions:
                    for i, deletion in enumerate(recent_deletions):
                        timestamp = deletion.get("timestamp", "Unknown time")
                        deleted_text = deletion.get("deleted_text", "")
                        preview = deleted_text[:50] + "..." if len(deleted_text) > 50 else deleted_text
                        
                        st.markdown(f"**Deletion {i+1}** - {timestamp[11:19]} - {len(deleted_text)} characters")
                        st.text_area(f"Preview {i+1}", preview, height=50, key=f"deletion_preview_{i}")
                        
                        # Button to restore this text
                        if st.button(f"Restore", key=f"restore_button_{i}"):
                            if "editor_content" in st.session_state:
                                current_content = st.session_state.editor_content
                                # Simple append - in production, would insert at cursor position
                                st.session_state.editor_content = current_content + "\n\n" + deleted_text
                                st.success("Deleted text restored at the end of the document.")
                                st.rerun()
                else:
                    st.write("No deletions recorded yet.")
            
            # Edit patterns and insights
            with st.expander("Writing Patterns", expanded=False):
                st.info("This section will analyze your editing patterns to provide insights into your writing process.")
                st.write("Coming soon...")
        else:
            st.info("Edit history will be available after you start writing in the editor.")

if __name__ == "__main__":
    main() 