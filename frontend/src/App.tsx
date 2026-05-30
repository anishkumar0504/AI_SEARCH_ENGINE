import { useAuth } from "./hooks/useAuth";
import { useSearch } from "./hooks/useSearch";
import { Auth } from "./components/Auth";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./components/HomePage";
import { ResultView } from "./components/ResultView";

export default function App() {
  const { user, token, loading: authLoading, signOut } = useAuth();

  const {
    state,
    conversations,
    loadingConversations,
    search,
    followUp,
    fetchConversations,
    loadConversation,
    removeConversation,
    newSearch,
  } = useSearch(token);

  if (authLoading) {
    return (
      <div className="app-loading">
        <span className="app-loading-icon">⬡</span>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const name =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "there";

  const hasResult = !!(state.query && (state.answer || state.loading || state.error));

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        loading={loadingConversations}
        activeConversationId={state.conversationId}
        user={user}
        onSelectConversation={loadConversation}
        onDeleteConversation={removeConversation}
        onNewSearch={newSearch}
        onSignOut={signOut}
        onLoad={fetchConversations}
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