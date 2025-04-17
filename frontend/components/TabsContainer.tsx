"use client";

import { useState, useEffect } from "react";
import Editor from "./Editor";
import StoryMemory from "./StoryMemory";
import KnowledgeGraph from "./KnowledgeGraph";
import EditHistory from "./EditHistory";

interface TabsContainerProps {
  projectName: string;
}

const TabsContainer = ({ projectName }: TabsContainerProps) => {
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [editorContent, setEditorContent] = useState<string>("");
  const [showEditHistoryInEditor, setShowEditHistoryInEditor] = useState<boolean>(false);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [deletionHistory, setDeletionHistory] = useState<any[]>([]);

  // Fetch edit history when active tab changes to "edit-history"
  useEffect(() => {
    if (activeTab === "edit-history") {
      fetchEditHistory();
    }
  }, [activeTab, projectName]);

  const fetchEditHistory = async () => {
    try {
      // Fetch recent edits
      const editsResponse = await fetch(`http://localhost:8000/history/edits/${projectName}`);
      const editsData = await editsResponse.json();
      
      if (editsData.success) {
        setEditHistory(editsData.edits);
      }
      
      // Fetch recent deletions
      const deletionsResponse = await fetch(`http://localhost:8000/history/deletions/${projectName}`);
      const deletionsData = await deletionsResponse.json();
      
      if (deletionsData.success) {
        setDeletionHistory(deletionsData.deletions);
      }
    } catch (err) {
      console.error("Error fetching edit history:", err);
    }
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
  };

  const handleRestoreDeletedText = async (deletedText: string) => {
    try {
      const response = await fetch("http://localhost:8000/history/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: projectName,
          deleted_text: deletedText,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the editor content if needed
        setEditorContent(data.content);
        
        // Switch to editor tab
        setActiveTab("editor");
      }
    } catch (err) {
      console.error("Error restoring deleted text:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`tab ${activeTab === "editor" ? "active" : ""}`}
          onClick={() => setActiveTab("editor")}
        >
          Editor
        </button>
        <button
          className={`tab ${activeTab === "story-memory" ? "active" : ""}`}
          onClick={() => setActiveTab("story-memory")}
        >
          Story Memory
        </button>
        <button
          className={`tab ${activeTab === "knowledge-graph" ? "active" : ""}`}
          onClick={() => setActiveTab("knowledge-graph")}
        >
          Knowledge Graph
        </button>
        <button
          className={`tab ${activeTab === "edit-history" ? "active" : ""}`}
          onClick={() => setActiveTab("edit-history")}
        >
          Edit History
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "editor" && (
          <Editor
            projectName={projectName}
            initialContent={editorContent}
            onContentChange={handleEditorChange}
          />
        )}
        
        {activeTab === "story-memory" && (
          <StoryMemory projectName={projectName} />
        )}
        
        {activeTab === "knowledge-graph" && (
          <KnowledgeGraph projectName={projectName} />
        )}
        
        {activeTab === "edit-history" && (
          <EditHistory
            edits={editHistory}
            deletions={deletionHistory}
            onRestoreDeletedText={handleRestoreDeletedText}
            onToggleShowInEditor={(show) => setShowEditHistoryInEditor(show)}
            showInEditor={showEditHistoryInEditor}
          />
        )}
      </div>
    </div>
  );
};

export default TabsContainer; 