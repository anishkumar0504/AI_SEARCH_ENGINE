import { useState, useRef, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  onSearch,
  loading,
  placeholder = "Ask anything...",
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [query]);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    onSearch(trimmed);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`searchbar ${loading ? "searchbar--loading" : ""}`}>
      <textarea
        ref={textareaRef}
        className="searchbar-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={loading}
      />
      <button
        className="searchbar-btn"
        onClick={handleSubmit}
        disabled={!query.trim() || loading}
        aria-label="Search"
      >
        {loading ? (
          <span className="searchbar-spinner" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
      </button>
    </div>
  );
}