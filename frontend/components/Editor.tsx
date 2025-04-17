"use client";

import { useState, useEffect, useRef } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface EditorProps {
  projectName: string;
  initialContent?: string;
  language?: string;
  theme?: string;
  onSave?: (content: string) => void;
  onContentChange?: (content: string, cursorPosition: number) => void;
}

const Editor: React.FC<EditorProps> = ({
  projectName,
  initialContent = "",
  language = "markdown",
  theme = "vs-dark",
  onSave,
  onContentChange,
}) => {
  const [content, setContent] = useState<string>(initialContent);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("split");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const previousContentRef = useRef<string>(initialContent);

  // load
  useEffect(() => {
    const fetchContent = async () => {
      if (!projectName) return;
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/content/${projectName}`);
        const data = await res.json();
        if (data.success) {
          setContent(data.content || "");
          previousContentRef.current = data.content || "";
        } else {
          setError("Failed to load content");
        }
      } catch {
        setError("Error connecting to the server");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [projectName]);

  // editor mount
  const handleEditorDidMount = (ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
    setIsLoading(false);
  };

  // disable suggestions
  const handleEditorWillMount = (monaco: any) => {
    try {
      monaco.languages.registerCompletionItemProvider("markdown", {
        provideCompletionItems: () => ({ suggestions: [] }),
      });
    } catch {
      /* ignore */
    }
  };

  // on change
  const handleEditorChange = (value: string | undefined) => {
    const txt = value || "";
    setContent(txt);
    const pos = editorRef.current?.getPosition();
    const cursor = pos ? pos.column + (pos.lineNumber - 1) : 0;
    onContentChange?.(txt, cursor);
  };

  // save
  const saveContent = async () => {
    if (!projectName) return;
    const pos = editorRef.current?.getPosition();
    const cursor = pos ? pos.column + (pos.lineNumber - 1) : 0;
    try {
      const res = await fetch("http://localhost:8000/content/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          content,
          cursor_position: cursor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        previousContentRef.current = content;
        onSave?.(content);
      } else {
        setError("Failed to save content");
      }
    } catch {
      setError("Error connecting to the server");
    }
  };

  // auto‑save after 2s
  useEffect(() => {
    const t = setTimeout(() => {
      if (content !== previousContentRef.current) saveContent();
    }, 2000);
    return () => clearTimeout(t);
  }, [content, projectName]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveContent();
      }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [content, projectName]);

  const renderMarkdownPreview = () => (
    <div className="h-full w-full p-8 prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="bg-red-500 text-white p-2 mb-2 rounded">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* view controls */}
      <div className="flex mb-2 bg-gray-800 rounded p-1">
        {(["edit", "split", "preview"] as const).map((mode) => (
          <button
            key={mode}
            className={`px-3 py-1 rounded ${
              viewMode === mode ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
            } ${mode === "split" ? "mx-1" : ""}`}
            onClick={() => setViewMode(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 border border-gray-700 rounded overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="h-full flex">
            {/* Editor */}
            {(viewMode === "edit" || viewMode === "split") && (
              <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} h-full bg-editor-bg p-2`}>
                <MonacoEditor
                  width="100%"
                  height="100%"
                  language={language}
                  theme={theme}
                  value={content}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  beforeMount={handleEditorWillMount}
                  options={{
                    fontSize: 14,
                    lineHeight: 22,
                    wordWrap: "on",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: "off",
                    folding: false,
                    glyphMargin: false,
                    renderLineHighlight: "none",
                    overviewRulerBorder: false,
                    scrollbar: { vertical: "visible", horizontal: "visible" },
                    suggestOnTriggerCharacters: false,
                    quickSuggestions: false,
                    parameterHints: { enabled: false },
                    suggest: { showWords: false },
                  }}
                />
              </div>
            )}

            {/* Preview */}
            {(viewMode === "preview" || viewMode === "split") && (
              <div
                className={`${
                  viewMode === "split" ? "w-1/2 border-l border-gray-700" : "w-full"
                } h-full bg-gray-900 p-2`}
              >
                {renderMarkdownPreview()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={saveContent}
        >
          Save
        </button>
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
          onClick={() => alert("AI Assist feature coming soon!")}
        >
          AI Assist
        </button>
      </div>
    </div>
  );
};

export default Editor;
