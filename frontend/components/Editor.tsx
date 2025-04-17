"use client";

import { useState, useEffect, useRef } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { marked } from "marked";

// docx imports
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

interface EditorProps {
  projectName: string;
  initialContent?: string;
  language?: string;
  theme?: string;
  onSave?: (content: string) => void;
  onContentChange?: (content: string, cursorPosition: number) => void;
}

// configure marked for GFM
marked.setOptions({
  gfm: true,
  breaks: true,
});

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
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [headers, setHeaders] = useState<{ level: number; text: string; position: number }[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const [isAutocompleting, setIsAutocompleting] = useState<boolean>(false);
  const [autocompleteInProgress, setAutocompleteInProgress] = useState<boolean>(false);
  const [autocompleteSuggestion, setAutocompleteSuggestion] = useState<string | null>(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState<boolean>(false);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const previousContentRef = useRef<string>(initialContent);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPositionRef = useRef<editor.IPosition | null>(null);
  const currentSuggestionPositionRef = useRef<editor.IPosition | null>(null);

  // extract headers for outline
  useEffect(() => {
    const regex = /^(#{1,6})\s+(.+)$/gm;
    const found: typeof headers = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
      found.push({ level: m[1].length, text: m[2].trim(), position: m.index });
    }
    setHeaders(found);
  }, [content]);

  // load from server
  useEffect(() => {
    if (!projectName) return;
    setIsLoading(true);
    fetch(`http://localhost:8000/content/${projectName}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setContent(data.content || "");
          previousContentRef.current = data.content || "";
        } else {
          setError("Failed to load content");
        }
      })
      .catch(() => setError("Error connecting to server"))
      .finally(() => setIsLoading(false));
  }, [projectName]);

  // Monaco mount
  const handleEditorDidMount = (ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
    setIsLoading(false);
  };
  const handleEditorWillMount = (monaco: any) => {
    try {
      monaco.languages.registerCompletionItemProvider("markdown", {
        provideCompletionItems: () => ({ suggestions: [] }),
      });
    } catch {}
  };

  // onChange
  const handleEditorChange = (val: string | undefined) => {
    const txt = val || "";
    setContent(txt);
    const pos = editorRef.current?.getPosition();
    const cursor = pos ? pos.column + (pos.lineNumber - 1) : 0;
    onContentChange?.(txt, cursor);
  };

  // save to server
  const saveContent = async () => {
    if (!projectName) return;
    const pos = editorRef.current?.getPosition();
    const cursor = pos ? pos.column + (pos.lineNumber - 1) : 0;
    try {
      const res = await fetch("http://localhost:8000/content/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: projectName, content, cursor_position: cursor }),
      });
      const data = await res.json();
      if (data.success) {
        previousContentRef.current = content;
        onSave?.(content);
      } else {
        setError("Failed to save");
      }
    } catch {
      setError("Error connecting to server");
    }
  };

  // debounce auto‑save
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

  // outline navigation
  const navigateToHeader = (position: number) => {
    if (!editorRef.current) return;
    const lines = content.slice(0, position).split("\n");
    const lineNumber = lines.length;
    const column = lines[lines.length - 1].length + 1;
    editorRef.current.revealPositionInCenter({ lineNumber, column });
    editorRef.current.setPosition({ lineNumber, column });
    editorRef.current.focus();
  };

  // generic download helper
  const downloadFile = (data: Blob | string, filename: string, mime: string) => {
    const blob = typeof data === "string" ? new Blob([data], { type: mime }) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // export handler now async
  const handleExport = async (format: "html" | "docx" | "markdown") => {
    setExportMenuOpen(false);

    if (format === "markdown") {
      return downloadFile(content, `${projectName}.md`, "text/markdown");
    }

    // wrap markdown → HTML
    const bodyHtml = marked.parse(content);
    const fullHtml = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/><title>${projectName}</title>
<style>
body{font-family:sans-serif;margin:2em;line-height:1.6}
h1,h2,h3,h4,h5,h6{margin:1em 0 .5em}
p{margin:.75em 0}
code{font-family:monospace;background:#f0f0f0;padding:2px 4px;border-radius:3px}
pre{background:#f5f5f5;padding:1em;overflow:auto}
blockquote{margin:.75em 0;padding-left:1em;border-left:3px solid #ccc}
</style>
</head><body>${bodyHtml}</body></html>`;

    if (format === "html") {
      return downloadFile(fullHtml, `${projectName}.html`, "text/html");
    }

    // DOCX conversion via "docx"
    // 1) turn markdown tokens into docx paragraphs
    const tokens = marked.lexer(content);
    const children: any[] = [];

    tokens.forEach((tk: any) => {
      if (tk.type === "heading") {
        const lvlMap: Record<number, HeadingLevel> = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        children.push(
          new Paragraph({
            text: tk.text,
            heading: lvlMap[tk.depth] || HeadingLevel.HEADING_1,
          })
        );
      } else if (tk.type === "paragraph") {
        children.push(new Paragraph(tk.text));
      } else if (tk.type === "list") {
        tk.items.forEach((item: any) => {
          children.push(
            new Paragraph({
              text: item.text,
              bullet: { level: 0 },
            })
          );
        });
      } else if (tk.type === "code") {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: tk.text,
                font: "Courier New",
              }),
            ],
          })
        );
      }
    });

    // 2) create the doc and pack to blob
    const doc = new Document({
      sections: [{ children }],
    });
    const blob = await Packer.toBlob(doc);

    // 3) trigger download
    return downloadFile(
      blob,
      `${projectName}.docx`,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  };

  // markdown preview
  const renderMarkdownPreview = () => (
    <div className="h-full w-full p-8 prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );

  // Get context before cursor
  const getContextBeforeCursor = () => {
    if (!editorRef.current) return { previous: "", current: "" };
    
    const model = editorRef.current.getModel();
    const position = editorRef.current.getPosition();
    
    if (!model || !position) return { previous: "", current: "" };
    
    const lines = model.getLinesContent();
    const currentLine = lines[position.lineNumber - 1];
    const textBeforeCursor = currentLine.substring(0, position.column - 1);
    
    // Get previous context (up to 1000 chars)
    let previousContext = "";
    let lineIndex = position.lineNumber - 1;
    let charCount = 0;
    
    // Start with text before cursor on current line
    previousContext = textBeforeCursor;
    charCount += textBeforeCursor.length;
    
    // Add previous lines until we reach 1000 chars
    while (lineIndex > 0 && charCount < 1000) {
      lineIndex--;
      previousContext = lines[lineIndex] + "\n" + previousContext;
      charCount += lines[lineIndex].length + 1;
    }
    
    // Trim to 1000 chars if needed
    if (previousContext.length > 1000) {
      previousContext = previousContext.substring(previousContext.length - 1000);
    }
    
    return {
      previous: previousContext,
      current: textBeforeCursor
    };
  };
  
  // Apply suggestion to editor
  const applySuggestion = () => {
    if (!autocompleteSuggestion || !editorRef.current || !currentSuggestionPositionRef.current) {
      return;
    }
    
    const editor = editorRef.current;
    const position = currentSuggestionPositionRef.current;
    
    editor.executeEdits("autocomplete", [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: autocompleteSuggestion
      }
    ]);
    
    // Clear suggestion after applying
    setAutocompleteSuggestion(null);
    setSuggestionsVisible(false);
    
    // Focus back on editor
    editor.focus();
  };
  
  // Fetch autocomplete suggestion
  const fetchAutocompleteSuggestion = async () => {
    // Don't fetch if already showing suggestions or processing a request
    if (autocompleteInProgress || suggestionsVisible || !projectName) {
      console.log("Skipping autocomplete: already in progress, visible, or missing project name");
      return;
    }
    
    const { previous, current } = getContextBeforeCursor();
    if (!current.trim()) {
      console.log("Skipping autocomplete: no text before cursor");
      return;
    }
    
    console.log("Fetching autocomplete suggestion");
    setAutocompleteInProgress(true);
    
    try {
      const response = await fetch("http://localhost:8000/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memory: "", // Will implement later
          recent_edits: [], // Could fetch from history API
          previous_context: previous,
          current_snippet: current,
          project_name: projectName
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Autocomplete API error:", data.detail || "Unknown error");
        if (response.status === 500) {
          console.error("Server stacktrace:", data.detail);
        }
        return;
      }
      
      if (data.completion) {
        // Store the suggestion and current cursor position
        setAutocompleteSuggestion(data.completion);
        setSuggestionsVisible(true);
        currentSuggestionPositionRef.current = editorRef.current?.getPosition() || null;
      }
    } catch (err) {
      console.error("Autocomplete error:", err);
    } finally {
      setAutocompleteInProgress(false);
    }
  };
  
  // Monitor typing and setup idle timer
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Listen for content changes (actual typing)
    const modelChangeDisposable = editorRef.current.onDidChangeModelContent(() => {
      // User is typing - clear any existing suggestions
      if (suggestionsVisible) {
        setSuggestionsVisible(false);
        setAutocompleteSuggestion(null);
      }
      
      // Reset and restart the idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      
      // Set new timer for 5 seconds of inactivity
      idleTimerRef.current = setTimeout(() => {
        console.log("Idle timer triggered - fetching suggestion");
        fetchAutocompleteSuggestion();
      }, 5000);
    });
    
    // Listen for cursor position changes (to hide suggestions)
    const cursorDisposable = editorRef.current.onDidChangeCursorPosition(() => {
      if (suggestionsVisible) {
        setSuggestionsVisible(false);
        setAutocompleteSuggestion(null);
      }
    });
    
    return () => {
      modelChangeDisposable.dispose();
      cursorDisposable.dispose();
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [editorRef.current, projectName, suggestionsVisible]);
  
  // Alternative fix for Tab key handling
  useEffect(() => {
    if (!editorRef.current) return;
    
    const editorInstance = editorRef.current;
    const domNode = editorInstance.getDomNode();
    
    if (!domNode) return;
    
    // Function to handle keydown events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestionsVisible && autocompleteSuggestion) {
        e.preventDefault();
        e.stopPropagation();
        applySuggestion();
      }
    };
    
    // Add the event listener to the editor's DOM node
    domNode.addEventListener('keydown', handleKeyDown, true); // true for capture phase
    
    return () => {
      domNode.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editorRef.current, suggestionsVisible, autocompleteSuggestion]);
  
  // Manually trigger autocomplete with button
  const manualTriggerAutocomplete = () => {
    if (!suggestionsVisible) {
      fetchAutocompleteSuggestion();
    }
  };

  // Render the suggestion box
  const renderSuggestionBox = () => {
    if (!suggestionsVisible || !autocompleteSuggestion) {
      return null;
    }
    
    return (
      <div className="suggestion-box fixed p-3 bg-gray-800 text-white rounded shadow-lg border border-gray-600 z-50 max-w-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Suggestion</span>
          <button 
            onClick={() => setSuggestionsVisible(false)}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
        <div className="suggestion-text mb-2 text-sm">
          <span className="text-gray-400">...</span>
          <span className="text-blue-400">{autocompleteSuggestion}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Press Tab to accept</span>
          <button 
            onClick={applySuggestion}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white py-1 px-2 rounded"
          >
            Accept
          </button>
        </div>
      </div>
    );
  };

  // Add CSS for positioning the suggestion box
  useEffect(() => {
    if (suggestionsVisible && editorRef.current && currentSuggestionPositionRef.current) {
      const position = currentSuggestionPositionRef.current;
      const coordinates = editorRef.current.getScrolledVisiblePosition(position);
      
      if (coordinates) {
        const suggestionBox = document.querySelector('.suggestion-box') as HTMLElement;
        if (suggestionBox) {
          // Get editor container position
          const editorContainer = editorRef.current.getDomNode();
          if (editorContainer) {
            const rect = editorContainer.getBoundingClientRect();
            suggestionBox.style.top = `${rect.top + coordinates.top + 20}px`;
            suggestionBox.style.left = `${rect.left + coordinates.left}px`;
          }
        }
      }
    }
  }, [suggestionsVisible, editorRef.current]);

  return (
    <div className="h-full flex flex-col relative">
      {error && (
        <div className="bg-red-500 text-white p-2 mb-2 rounded flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* controls */}
      <div className="flex items-center mb-2 bg-gray-800 rounded p-1 justify-between">
        <div className="flex">
          {(["edit", "split", "preview"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 rounded ${
                viewMode === m
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              } ${m === "split" ? "mx-1" : ""}`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setShowOutline((v) => !v)}
            className="px-3 py-1 rounded text-gray-300 hover:bg-gray-700 mr-1"
          >
            {showOutline ? "Hide Outline" : "Show Outline"}
          </button>

          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((o) => !o)}
              className="px-3 py-1 rounded text-gray-300 hover:bg-gray-700"
            >
              Export
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg z-10">
                <button
                  onClick={() => handleExport("html")}
                  className="block w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700"
                >
                  Export to HTML
                </button>
                <button
                  onClick={() => handleExport("docx")}
                  className="block w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700"
                >
                  Export to DOCX
                </button>
                <button
                  onClick={() => handleExport("markdown")}
                  className="block w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700"
                >
                  Export to Markdown
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* main */}
      <div className="flex-1 border border-gray-700 rounded overflow-hidden flex">
        {/* outline */}
        {showOutline && headers.length > 0 && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-2 overflow-auto">
            <div className="text-gray-400 mb-2 text-sm font-semibold uppercase px-2">
              Outline
            </div>
            {headers.map((h, i) => (
              <button
                key={i}
                onClick={() => navigateToHeader(h.position)}
                className="w-full text-left px-2 py-1 text-gray-300 hover:bg-gray-700 rounded text-sm truncate"
                style={{ paddingLeft: `${h.level * 0.5}rem` }}
              >
                {h.text}
              </button>
            ))}
          </div>
        )}

        {/* editor */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} bg-editor-bg p-2`}>
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

        {/* preview */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`${
              viewMode === "split" ? "w-1/2" : "w-full"
            } bg-gray-900 p-2 overflow-auto`}
          >
            {renderMarkdownPreview()}
          </div>
        )}
      </div>

      {/* Render suggestion box */}
      {renderSuggestionBox()}

      {/* footer */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={saveContent}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Save
        </button>
        <button
          onClick={manualTriggerAutocomplete}
          className={`${
            autocompleteInProgress ? "bg-gray-500" : "bg-gray-600 hover:bg-gray-700"
          } text-white py-2 px-4 rounded`}
          disabled={autocompleteInProgress}
        >
          {autocompleteInProgress ? "Thinking..." : "Suggest Completion"}
        </button>
      </div>
    </div>
  );
};

// Add this CSS to your global styles
const globalStyles = `
  .suggestion-box {
    max-width: 300px;
    font-family: monospace;
  }
`;

export default Editor;
