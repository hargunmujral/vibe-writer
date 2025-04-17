"use client";

import { useState } from "react";

interface Edit {
  timestamp: string;
  edit_type: string;
  diff: {
    change_size: number;
    change_ratio: number;
  };
  context: {
    before: string;
    after: string;
  };
}

interface Deletion {
  timestamp: string;
  deleted_text: string;
  context: string;
}

interface EditHistoryProps {
  edits: Edit[];
  deletions: Deletion[];
  onRestoreDeletedText: (deletedText: string) => void;
  onToggleShowInEditor: (show: boolean) => void;
  showInEditor: boolean;
}

const EditHistory = ({
  edits = [],
  deletions = [],
  onRestoreDeletedText,
  onToggleShowInEditor,
  showInEditor,
}: EditHistoryProps) => {
  const [expandedEdit, setExpandedEdit] = useState<number | null>(null);
  const [expandedDeletion, setExpandedDeletion] = useState<number | null>(null);

  const formatTimestamp = (timestamp: string): string => {
    try {
      // Extract time portion
      return timestamp?.substring(11, 19) || "Unknown time";
    } catch (e) {
      return "Unknown time";
    }
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit History</h2>
        
        {/* Toggle for displaying edit history in the editor */}
        <div className="flex items-center">
          <label htmlFor="show-history" className="mr-2 text-gray-400">
            Show history in editor
          </label>
          <input
            id="show-history"
            type="checkbox"
            checked={showInEditor}
            onChange={(e) => onToggleShowInEditor(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent edits */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Edits</h3>
          {edits.length === 0 ? (
            <p className="text-gray-400">No edits recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {edits.map((edit, index) => {
                const isExpanded = expandedEdit === index;
                const changeSize = edit.diff?.change_size || 0;
                const changeType = changeSize > 0 
                  ? "Added" 
                  : changeSize < 0 
                    ? "Removed" 
                    : "Modified";
                
                return (
                  <div 
                    key={index} 
                    className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700"
                    onClick={() => setExpandedEdit(isExpanded ? null : index)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">
                          Edit {index + 1} - {formatTimestamp(edit.timestamp)}
                        </span>
                        <span className="ml-2 text-sm text-gray-400">
                          {changeType} {Math.abs(changeSize)} characters
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 p-2 bg-gray-900 rounded">
                        <div className="mb-2">
                          <p className="text-sm text-gray-400 mb-1">Type: {edit.edit_type}</p>
                        </div>
                        
                        {edit.context && (
                          <>
                            <div className="mb-2">
                              <p className="text-sm text-gray-400 mb-1">Context (before):</p>
                              <div className="bg-gray-800 p-2 rounded text-sm font-mono overflow-x-auto">
                                {edit.context.before || "<empty>"}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Context (after):</p>
                              <div className="bg-gray-800 p-2 rounded text-sm font-mono overflow-x-auto">
                                {edit.context.after || "<empty>"}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Recent deletions */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Deletions</h3>
          {deletions.length === 0 ? (
            <p className="text-gray-400">No deletions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {deletions.map((deletion, index) => {
                const isExpanded = expandedDeletion === index;
                const preview = deletion.deleted_text?.substring(0, 50) + 
                  (deletion.deleted_text?.length > 50 ? "..." : "");
                
                return (
                  <div 
                    key={index} 
                    className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700"
                    onClick={() => setExpandedDeletion(isExpanded ? null : index)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">
                          Deletion {index + 1} - {formatTimestamp(deletion.timestamp)}
                        </span>
                        <span className="ml-2 text-sm text-gray-400">
                          {deletion.deleted_text?.length || 0} characters
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3">
                        <div className="mb-3 p-2 bg-gray-900 rounded">
                          <p className="text-sm text-gray-400 mb-1">Preview:</p>
                          <div className="bg-gray-800 p-2 rounded text-sm font-mono overflow-x-auto">
                            {preview || "<empty>"}
                          </div>
                        </div>
                        
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreDeletedText(deletion.deleted_text);
                          }}
                        >
                          Restore this text
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Writing patterns */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Writing Patterns</h3>
        <div className="bg-gray-800 p-6 rounded-lg">
          <p className="text-gray-400">
            This section will analyze your editing patterns to provide insights into your writing process.
          </p>
          <p className="text-blue-400 mt-2">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default EditHistory; 