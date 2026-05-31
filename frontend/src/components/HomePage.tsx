import { SearchBar } from "./SearchBar";

interface HomePageProps {
  onSearch: (query: string) => void;
  loading: boolean;
  userName: string;
}

const SUGGESTIONS = [
  "What is the future of AI agents?",
  "How does React Server Components work?",
  "Best practices for PostgreSQL indexing",
  "Explain WebRTC in simple terms",
];

export function HomePage({ onSearch, loading, userName }: HomePageProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="home-greeting">
          <span className="home-greeting-text">
            {greeting}, <span className="home-greeting-name">{userName}</span>
          </span>
        </div>
        <h1 className="home-headline">What do you want to know?</h1>

        <div className="home-searchbar">
          <SearchBar
            onSearch={onSearch}
            loading={loading}
            placeholder="Ask anything..."
            autoFocus
          />
        </div>

        <div className="home-suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="suggestion-chip"
              onClick={() => onSearch(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}