import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useSearch } from "./hooks/useSearch";
import { Auth } from "./components/Auth";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./components/HomePage";
import { ResultView } from "./components/ResultView";

export default function App() {
  const { user, token, loading: authLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    state,
    conversations,
    loadingConversations,
    search,
    followUp,
    loadConversation,
    removeConversation,
    newSearch,
  } = useSearch(token);

  // On mount, check if URL has a conversation ID and load it
  useEffect(() => {
    if (!token) return;
    const match = window.location.pathname.match(/^\/c\/(.+)$/);
    if (match) {
      loadConversation(match[1]);
    }
  }, [token]);

  // When conversation changes, update the URL
  useEffect(() => {
    if (state.conversationId) {
      window.history.pushState({}, "", `/c/${state.conversationId}`);
    }
  }, [state.conversationId]);

  const handleNewSearch = () => {
    setSidebarOpen(false);
    window.history.pushState({}, "", "/");
    newSearch();
  };

  const handleSelectConversation = (id: string) => {
    setSidebarOpen(false);
    window.history.pushState({}, "", `/c/${id}`);
    loadConversation(id);
  };

  if (authLoading) {
    return (
      <div className="app-loading">
        <span className="app-loading-icon">⬡</span>
      </div>
    );
  }

  if (!user) return <Auth />;

  const name =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "there";

const hasResult = !!(
  state.query && (
    state.answer ||
    state.loading ||
    state.error ||
    state.allMessages.length > 0
  )
);
  return (
    <div className="app">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(prev => !prev)}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <Sidebar
        conversations={conversations}
        loading={loadingConversations}
        activeConversationId={state.conversationId}
        user={user}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={removeConversation}
        onNewSearch={handleNewSearch}
        onSignOut={signOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        {hasResult ? (
          <ResultView
            query={state.query}
            answer={state.answer}
            sources={state.sources}
            followUps={state.followUps}
            loading={state.loading}
            error={state.error}
            allMessages={state.allMessages}
            onFollowUp={followUp}
          />
        ) : (
          <HomePage
            onSearch={search}
            loading={state.loading}
            userName={name}
          />
        )}
      </main>
    </div>
  );
}