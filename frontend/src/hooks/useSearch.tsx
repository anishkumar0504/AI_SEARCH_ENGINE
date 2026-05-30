import { useState, useCallback, useEffect } from "react";
import {
  streamAsk,
  streamFollowup,
  getConversations,
  getConversation,
  deleteConversation,
} from "../lib/api";
import type { Conversation, Source } from "../lib/api";

export interface SearchState {
  query: string;
  answer: string;
  sources: Source[];
  followUps: string[];
  loading: boolean;
  error: string | null;
  conversationId: string | null;
}

const EMPTY_STATE: SearchState = {
  query: "",
  answer: "",
  sources: [],
  followUps: [],
  loading: false,
  error: null,
  conversationId: null,
};

const CACHE_KEY = "nexus_conversations";

function readCache(): Conversation[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(conversations: Conversation[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(conversations));
  } catch {}
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function useSearch(token: string | null) {
  const [state, setState] = useState<SearchState>(EMPTY_STATE);
  // Init from localStorage immediately — no flash of empty sidebar
  const [conversations, setConversations] = useState<Conversation[]>(readCache);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Fetch all conversations from backend and update cache
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoadingConversations(true);
    try {
      const data = await getConversations(token);
      setConversations(data);
      writeCache(data);
    } catch {
      // Keep showing cached data on failure
    } finally {
      setLoadingConversations(false);
    }
  }, [token]);

  // Fetch on mount and whenever token changes (new login session)
  useEffect(() => {
    if (token) fetchConversations();
    else {
      // Logged out — clear everything
      setConversations([]);
      clearCache();
      setState(EMPTY_STATE);
    }
  }, [token]);

  const search = useCallback(
    async (query: string) => {
      if (!token || !query.trim()) return;

      setState({
        query,
        answer: "",
        sources: [],
        followUps: [],
        loading: true,
        error: null,
        conversationId: null,
      });

      try {
        await streamAsk(
          token,
          query,
          (chunk) => setState((s) => ({ ...s, answer: chunk })),
          (sources) => setState((s) => ({ ...s, sources, loading: false })),
          (followUps) => setState((s) => ({ ...s, followUps })),
          (id) => {
            setState((s) => ({ ...s, conversationId: id }));
            // Refetch sidebar and update cache after new conversation saved
            setTimeout(fetchConversations, 600);
          }
        );
      } catch (err: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err.message || "Something went wrong",
        }));
      }
    },
    [token, fetchConversations]
  );

  const followUp = useCallback(
    async (query: string) => {
      if (!token || !state.conversationId || !query.trim()) return;

      setState((s) => ({
        ...s,
        query,
        answer: "",
        sources: [],
        followUps: [],
        loading: true,
        error: null,
      }));

      try {
        await streamFollowup(
          token,
          state.conversationId,
          query,
          (chunk) => setState((s) => ({ ...s, answer: chunk })),
          (sources) => setState((s) => ({ ...s, sources, loading: false })),
          (followUps) => setState((s) => ({ ...s, followUps }))
        );
        setTimeout(fetchConversations, 600);
      } catch (err: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err.message || "Something went wrong",
        }));
      }
    },
    [token, state.conversationId, fetchConversations]
  );

  const loadConversation = useCallback(
    async (conversationId: string) => {
      if (!token) return;

      // Check localStorage cache first
      const cached = readCache();
      const cachedConv = cached.find((c) => c.id === conversationId);

      // Use cache immediately for instant switch, then fetch full messages
      if (cachedConv && cachedConv.messages?.length > 1) {
        applyConversation(cachedConv);
      }

      // Always fetch full conversation from backend (cache only has 1 preview message)
      try {
        const conv = await getConversation(token, conversationId);
        applyConversation(conv);

        // Update this conversation's full data in cache
        const updated = cached.map((c) => (c.id === conversationId ? conv : c));
        writeCache(updated);
        setConversations(updated);
      } catch {
        // If fetch fails, cached version is still shown
      }
    },
    [token]
  );

  function applyConversation(conv: Conversation) {
    const messages = conv.messages;
    const lastUser = [...messages].reverse().find((m) => m.role === "USER");
    const lastAssistant = [...messages].reverse().find((m) => m.role === "ASSISTANT");

    if (lastUser && lastAssistant) {
      // Strip <ANSWER> tags if present (raw DB content)
      const rawContent = lastAssistant.content;
      const answerMatch = rawContent.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/);
      const cleanAnswer = answerMatch ? answerMatch[1].trim() : rawContent.trim();

      const followUpMatches: string[] = [];
      const re = /<question>([\s\S]*?)<\/question>/g;
      let m;
      while ((m = re.exec(rawContent)) !== null) {
        followUpMatches.push(m[1].trim());
      }

      setState({
        query: lastUser.content,
        answer: cleanAnswer,
        sources: (lastAssistant.sources as Source[]) || [],
        followUps: followUpMatches,
        loading: false,
        error: null,
        conversationId: conv.id,
      });
    }
  }

  const removeConversation = useCallback(
    async (conversationId: string) => {
      if (!token) return;
      try {
        await deleteConversation(token, conversationId);
        const updated = conversations.filter((c) => c.id !== conversationId);
        setConversations(updated);
        writeCache(updated);
        if (state.conversationId === conversationId) newSearch();
      } catch {}
    },
    [token, conversations, state.conversationId]
  );

  const newSearch = useCallback(() => {
    setState(EMPTY_STATE);
  }, []);

  return {
    state,
    conversations,
    loadingConversations,
    search,
    followUp,
    fetchConversations,
    loadConversation,
    removeConversation,
    newSearch,
  };
}