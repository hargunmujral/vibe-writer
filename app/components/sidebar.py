import streamlit as st

def render_sidebar():
    """
    Renders the sidebar with navigation and settings options.
    """
    st.sidebar.title("Vibe Writer")
    
    # Project section
    st.sidebar.header("Project")
    
    # Project name input
    if "project_name" not in st.session_state:
        st.session_state.project_name = "default_project"
    
    project_name = st.sidebar.text_input("Project Name", value=st.session_state.project_name)
    if project_name != st.session_state.project_name:
        st.session_state.project_name = project_name
    
    # New/Open project buttons
    col1, col2 = st.sidebar.columns(2)
    with col1:
        if st.button("New", use_container_width=True):
            st.session_state.editor_content = ""
            st.toast("New project created!")
    with col2:
        if st.button("Open", use_container_width=True):
            st.toast("Open project feature coming soon!")
    
    # Project save section
    if st.sidebar.button("Save Project", use_container_width=True):
        st.toast("Project saved successfully!")
    
    st.sidebar.divider()
    
    # AI Assistant Settings
    st.sidebar.header("AI Assistant")
    
    # Toggle for AI features
    ai_enabled = st.sidebar.toggle("Enable AI Features", value=True)
    
    if ai_enabled:
        # AI feature settings
        st.sidebar.subheader("Features")
        
        st.sidebar.checkbox("Sentence Autocomplete", value=True)
        st.sidebar.checkbox("Style Consistency", value=True)
        st.sidebar.checkbox("Reference Suggestions", value=True)
        
        # AI behavior slider
        st.sidebar.subheader("Behavior")
        creativity = st.sidebar.slider(
            "Creativity", 
            min_value=0.0, 
            max_value=1.0, 
            value=0.7,
            help="Higher values produce more creative but possibly less relevant suggestions"
        )
        
        # AI model selection
        st.sidebar.subheader("Model")
        model = st.sidebar.selectbox(
            "AI Model",
            options=["Default (GPT-4)", "Fast (GPT-3.5)", "Creative (Claude)"],
            index=0
        )
    
    st.sidebar.divider()
    
    # Edit History Settings
    st.sidebar.header("Edit History")
    
    edit_history_enabled = st.sidebar.toggle("Track Edit History", value=True)
    
    if edit_history_enabled:
        max_history = st.sidebar.slider(
            "Maximum History Size", 
            min_value=10, 
            max_value=500, 
            value=100,
            help="Maximum number of edits to store in history"
        )
        
        st.sidebar.checkbox("Auto-suggest from deletions", value=True, 
                            help="Suggest content from your recently deleted text when relevant")
        
        st.sidebar.checkbox("Track edit patterns", value=True,
                           help="Analyze your editing patterns to provide insights")
    
    st.sidebar.divider()
    
    # Application settings
    st.sidebar.header("Settings")
    
    # Theme selection
    theme = st.sidebar.selectbox(
        "Theme",
        options=["Dark", "Light", "System Default"],
        index=0
    )
    
    # Editor settings
    font_size = st.sidebar.slider("Font Size", min_value=10, max_value=24, value=14)
    
    st.sidebar.divider()
    
    # Help and About
    with st.sidebar.expander("About"):
        st.write("""
        Vibe Writer is an AI-powered writing assistant designed to support long-form storytelling 
        by providing context-aware writing tools and ensuring consistency across a manuscript.
        """)
        st.write("Version: 0.1.0 (Alpha)")
    
    with st.sidebar.expander("Help"):
        st.write("""
        **Getting Started**
        
        1. Create a new project or open an existing one
        2. Write in the editor tab
        3. Use the Story Memory tab to track characters, settings, and plot points
        4. The Knowledge Graph shows relationships between story elements
        5. The Edit History tab shows your recent changes and deletions
        
        For more help, visit [documentation](#).
        """)
    
    return {
        "project_name": project_name,
        "ai_enabled": ai_enabled,
        "creativity": creativity if ai_enabled else 0.5,
        "model": model if ai_enabled else "Default (GPT-4)",
        "edit_history_enabled": edit_history_enabled,
        "max_history": max_history if edit_history_enabled else 100,
        "theme": theme,
        "font_size": font_size
    } 