"use client";
import { useState } from "react";
import { Copy, Check, Download, FileText, FileCode, Save, ChevronDown } from "lucide-react";

export interface SaveField {
  value: string;
  label: string;
}

interface SavePanelProps {
  content: string;
  filename?: string;
  /** Optional list of platform fields to save into (e.g. client fields) */
  saveFields?: SaveField[];
  /** Called when user picks a field and clicks Save */
  onSave?: (field: string) => void | Promise<void>;
  saving?: boolean;
  className?: string;
}

function downloadAs(content: string, filename: string, ext: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

function toHtml(content: string, title: string): string {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 820px; margin: 40px auto; line-height: 1.7; color: #111; }
    h1 { font-size: 1.4em; margin-bottom: 8px; }
    p { margin: 0 0 8px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${escaped}</p>
</body>
</html>`;
}

export default function SavePanel({
  content,
  filename = "result",
  saveFields,
  onSave,
  saving = false,
  className = "",
}: SavePanelProps) {
  const [copied, setCopied] = useState(false);
  const [saveField, setSaveField] = useState("");
  const [showSave, setShowSave] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = async () => {
    if (!saveField || !onSave) return;
    await onSave(saveField);
    setSaveField("");
    setShowSave(false);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Copy */}
      <button
        onClick={copy}
        className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
      >
        {copied ? (
          <><Check size={12} className="text-green-400" /> Скопировано</>
        ) : (
          <><Copy size={12} /> Копировать</>
        )}
      </button>

      {/* Download .txt */}
      <button
        onClick={() => downloadAs(content, filename, "txt", "text/plain")}
        className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
        title="Скачать .txt"
      >
        <Download size={12} /> .txt
      </button>

      {/* Download .md */}
      <button
        onClick={() => downloadAs(content, filename, "md", "text/markdown")}
        className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
        title="Скачать Markdown"
      >
        <FileText size={12} /> .md
      </button>

      {/* Download .html (Word-compatible) */}
      <button
        onClick={() => downloadAs(toHtml(content, filename), filename, "html", "text/html")}
        className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
        title="Скачать HTML (открывается в Word)"
      >
        <FileCode size={12} /> .html
      </button>

      {/* Save to platform field */}
      {saveFields && saveFields.length > 0 && onSave && (
        <div className="relative">
          <button
            onClick={() => setShowSave((v) => !v)}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 text-accent hover:text-accent/80"
          >
            <Save size={12} /> Сохранить в… <ChevronDown size={11} className={showSave ? "rotate-180" : ""} />
          </button>

          {showSave && (
            <div className="absolute bottom-full mb-1 left-0 z-50 bg-nav border border-border rounded-xl shadow-xl p-2 min-w-[200px] space-y-1">
              {saveFields.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setSaveField(f.value); setShowSave(false); }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                    saveField === f.value
                      ? "bg-accent/20 text-accent"
                      : "text-subtext hover:bg-white/5 hover:text-text"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm save button */}
      {saveField && onSave && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
        >
          {saving ? "Сохраняю…" : <><Save size={12} /> Подтвердить</>}
        </button>
      )}
    </div>
  );
}
