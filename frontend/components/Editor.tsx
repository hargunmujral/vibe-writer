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

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const previousContentRef = useRef<string>(initialContent);

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

  return (
    <div className="h-full flex flex-col">
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

      {/* footer */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={saveContent}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Save
        </button>
        <button
          onClick={() => alert("AI Assist coming soon!")}
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
        >
          AI Assist
        </button>
      </div>
    </div>
  );
};

export default Editor;
