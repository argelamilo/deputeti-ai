"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

type SourceKey = "eu_law" | "albanian";

interface ExplorerDocument {
  id: string;
  title: string;
  subtitle: string;
  doc_type: string;
  date: string;
  in_force: boolean;
  chunk_count: number;
}

interface ExplorerChunk {
  key: string;
  id: string;
  article_label?: string;
  article_title?: string;
  group_label?: string;
  group_title?: string;
  text?: string;
  text_preview?: string;
}

type ExplorerChunksPayload = { chunks?: Array<Partial<ExplorerChunk> & Record<string, unknown>> };

const SOURCE_OPTIONS: Array<{ id: SourceKey; label: string }> = [
  { id: "eu_law", label: "Ligji i BE-se" },
  { id: "albanian", label: "Ligji Shqiptar" },
];

const EXPLORER_SEARCH_LIMIT = 50;
const MIN_SEARCH_LENGTH = 3;

function ExplorerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSourceFromUrl = searchParams.get("source");
  const requestedDocId = searchParams.get("doc_id");
  const { user: authUser, logout } = useAuth();
  const [source, setSource] = useState<SourceKey>("eu_law");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<ExplorerDocument[]>([]);
  const [documentsSource, setDocumentsSource] = useState<SourceKey | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedChunks, setSelectedChunks] = useState<ExplorerChunk[]>([]);
  const [selectedDocDetail, setSelectedDocDetail] = useState<Record<string, unknown> | null>(null);
  const [chunkQuery, setChunkQuery] = useState("");
  const [selectedChunkKey, setSelectedChunkKey] = useState<string | null>(null);

  useEffect(() => {
    const requestedSource = searchParams.get("source");
    const requestedQuery = searchParams.get("q");
    const requestedDocId = searchParams.get("doc_id");

    if (requestedSource === "eu_law" || requestedSource === "albanian") {
      setSource(requestedSource);
    }
    if (requestedQuery) {
      setQuery(requestedQuery);
    }
    if (requestedDocId) {
      setSelectedId(requestedDocId);
    }
  }, [searchParams]);

  const userForHeader = authUser
    ? {
        id: authUser.id || "",
        email: authUser.email || "",
      }
    : undefined;

  const authedFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    return fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.headers || {}),
      },
    });
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const trimmedQuery = query.trim();
      const shouldSearch = trimmedQuery.length >= MIN_SEARCH_LENGTH;

      const url =
        shouldSearch
          ? `/api/library?source=${encodeURIComponent(source)}&q=${encodeURIComponent(trimmedQuery)}&limit=${EXPLORER_SEARCH_LIMIT}`
          : `/api/library?source=${encodeURIComponent(source)}&page=1&page_size=200`;

      const response = await authedFetch(url);
      if (!response.ok) {
        // Search endpoint can reject invalid/too-short query params. Fall back to list mode.
        if (response.status === 422 && trimmedQuery.length > 0) {
          const fallbackList = await authedFetch(`/api/library?source=${encodeURIComponent(source)}&page=1&page_size=200`);
          if (fallbackList.ok) {
            const payload = (await fallbackList.json()) as { documents: ExplorerDocument[]; total: number };
            setDocuments(payload.documents || []);
            setDocumentsSource(source);
            setTotal(payload.total || (payload.documents || []).length);
            if ((payload.documents || []).length > 0) {
              setSelectedId((prev) => prev || payload.documents[0].id);
            }
            return;
          }
        }

        const requestedDocMatchesCurrentSource = Boolean(
          requestedDocId && (!requestedSourceFromUrl || requestedSourceFromUrl === source)
        );
        if (requestedDocMatchesCurrentSource && requestedDocId) {
          const docRes = await authedFetch(`/api/library?source=${encodeURIComponent(source)}&doc_id=${encodeURIComponent(requestedDocId)}`);
          if (docRes.ok) {
            const singleDoc = (await docRes.json()) as Record<string, unknown>;
            const fallbackDoc: ExplorerDocument = {
              id: String(singleDoc.document_id || singleDoc.id || requestedDocId),
              title: String(singleDoc.title || "Pa titull"),
              subtitle: String(singleDoc.subtitle || ""),
              doc_type: String(singleDoc.doc_type || "Dokument"),
              date: String(singleDoc.date || ""),
              in_force: Boolean(singleDoc.in_force),
              chunk_count: Number(singleDoc.chunk_count || 0),
            };
            setDocuments([fallbackDoc]);
            setDocumentsSource(source);
            setTotal(1);
            setSelectedId(fallbackDoc.id);
            return;
          }
        }
        throw new Error(`Explorer request failed: ${response.status}`);
      }

      if (shouldSearch) {
        const payload = (await response.json()) as { results: Array<Record<string, unknown>>; total: number };
        const mapped = (payload.results || []).map((item) => ({
          id: String(item.document_id || item.id || ""),
          title: String(item.title || "Pa titull"),
          subtitle: String(item.subtitle || item.text_preview || ""),
          doc_type: String(item.doc_type || "Dokument"),
          date: "",
          in_force: false,
          chunk_count: 0,
        }));
        setDocuments(mapped.filter((d) => d.id));
        setDocumentsSource(source);
        setTotal(payload.total || mapped.length);
      } else {
        const payload = (await response.json()) as { documents: ExplorerDocument[]; total: number };
        setDocuments(payload.documents || []);
        setDocumentsSource(source);
        setTotal(payload.total || (payload.documents || []).length);
      }
    } catch (error) {
      console.error("Explorer load failed:", error);
      setDocuments([]);
      setDocumentsSource(source);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [authedFetch, query, requestedDocId, requestedSourceFromUrl, source]);

  useEffect(() => {
    const t = setTimeout(fetchDocuments, 180);
    return () => clearTimeout(t);
  }, [fetchDocuments]);

  useEffect(() => {
    if (!selectedId && documents.length > 0) {
      setSelectedId(documents[0].id);
    }
    if (selectedId && !documents.some((doc) => doc.id === selectedId)) {
      setSelectedId(documents[0]?.id || null);
    }
  }, [documents, selectedId]);

  const selectedDoc = useMemo(() => documents.find((doc) => doc.id === selectedId) || null, [documents, selectedId]);

  const fetchSelectedDocumentData = useCallback(async () => {
    if (!selectedId || documentsSource !== source || !documents.some((doc) => doc.id === selectedId)) {
      setSelectedChunks([]);
      setSelectedDocDetail(null);
      return;
    }

    setDetailLoading(true);
    try {
      const [detailRes, chunksRes] = await Promise.all([
        authedFetch(`/api/library?source=${encodeURIComponent(source)}&doc_id=${encodeURIComponent(selectedId)}`),
        authedFetch(`/api/library?source=${encodeURIComponent(source)}&doc_id=${encodeURIComponent(selectedId)}&mode=chunks`),
      ]);

      const detailJson = detailRes.ok ? ((await detailRes.json()) as Record<string, unknown>) : null;
      const chunksJson = chunksRes.ok ? ((await chunksRes.json()) as ExplorerChunksPayload) : { chunks: [] };
      const pickFirstString = (...values: unknown[]): string | undefined => {
        for (const value of values) {
          if (typeof value === "string" && value.trim()) return value;
        }
        return undefined;
      };

      const normalizedChunks: ExplorerChunk[] = (chunksJson.chunks || []).map((raw, index) => {
        const safeId =
          typeof raw.id === "string" && raw.id.trim()
            ? raw.id
            : [
                raw.article_label,
                raw.group_label,
                raw.article_title,
                raw.group_title,
                index.toString(),
              ]
                .filter(Boolean)
                .join("-")
                .replace(/\s+/g, "_");

        const articleLabel = pickFirstString(raw.article_label, raw.article, raw.article_id, raw.section_label);
        const articleTitle = pickFirstString(raw.article_title, raw.heading, raw.title);
        const groupLabel = pickFirstString(raw.group_label, raw.chapter_label, raw.recital_label);
        const groupTitle = pickFirstString(raw.group_title, raw.chapter_title, raw.recital_title);
        const fullText = pickFirstString(raw.text, raw.content, raw.chunk_text, raw.body, raw.section_text, raw.full_text);
        const previewText = pickFirstString(raw.text_preview, raw.preview, raw.snippet, raw.summary);

        return {
          key: `${safeId || "chunk"}-${index}`,
          id: safeId || `chunk-${index}`,
          article_label: articleLabel,
          article_title: articleTitle,
          group_label: groupLabel,
          group_title: groupTitle,
          text: fullText,
          text_preview: previewText,
        };
      });

      setSelectedDocDetail(detailJson);
      setSelectedChunks(normalizedChunks);
    } catch (error) {
      console.error("Explorer detail load failed:", error);
      setSelectedDocDetail(null);
      setSelectedChunks([]);
    } finally {
      setDetailLoading(false);
    }
  }, [authedFetch, documents, documentsSource, selectedId, source]);

  useEffect(() => {
    fetchSelectedDocumentData();
  }, [fetchSelectedDocumentData]);

  useEffect(() => {
    setChunkQuery("");
    setSelectedChunkKey(null);
  }, [selectedChunks, selectedId]);

  useEffect(() => {
    const requestedArticle = searchParams.get("article")?.trim().toLowerCase();
    if (!requestedArticle || selectedChunks.length === 0) return;

    const matched = selectedChunks.find((chunk) => {
      const articleLabel = String(chunk.article_label || chunk.group_label || "").toLowerCase();
      const articleTitle = String(chunk.article_title || chunk.group_title || "").toLowerCase();
      return articleLabel.includes(requestedArticle) || articleTitle.includes(requestedArticle);
    });

    if (matched) {
      setChunkQuery(searchParams.get("article") || "");
      setSelectedChunkKey(matched.key);
    }
  }, [searchParams, selectedChunks]);

  const filteredChunks = useMemo(() => {
    const q = chunkQuery.trim().toLowerCase();
    if (!q) return selectedChunks;
    return selectedChunks.filter((chunk) =>
      [chunk.article_label, chunk.article_title, chunk.group_label, chunk.group_title, chunk.text_preview, chunk.text]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [chunkQuery, selectedChunks]);

  const activeChunk = useMemo(() => filteredChunks.find((chunk) => chunk.key === selectedChunkKey) || null, [filteredChunks, selectedChunkKey]);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar
        items={[]}
        selectedItem="explorer"
        user={{ name: authUser?.full_name || authUser?.email || "User", email: authUser?.email || "user@deputeti.ai" }}
      />

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh" }}>
        <DashboardLayout
          header={<PageHeader breadcrumbItems={[{ label: "Asistenti Ligjor" }]} user={userForHeader} onLogout={logout} />}
        >
          <Box sx={{ px: { xs: 1, sm: 2 }, pb: 1 }}>
            <Box sx={{ mb: 1 }}>
              <Button startIcon={<ArrowBackIcon />} size="small" onClick={() => router.push("/chat")}>
                Kthehu te Chat
              </Button>
              <Typography sx={{ fontSize: "1rem", fontWeight: 600, mt: 0.4 }}>Eksploro</Typography>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 1.2, height: "calc(100dvh - 220px)" }}>
              <Paper sx={{ p: 1, borderRadius: 1.5, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mb: 0.8 }}>
                  {SOURCE_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.id}
                      label={opt.label}
                      size="small"
                      color={source === opt.id ? "primary" : "default"}
                      onClick={() => {
                        if (source === opt.id) return;
                        setSource(opt.id);
                        setSelectedId(null);
                        setSelectedDocDetail(null);
                        setSelectedChunks([]);
                      }}
                    />
                  ))}
                </Box>

                <TextField
                  size="small"
                  placeholder={`Kerko ne ${total.toLocaleString()} dokumente...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 17, color: "hsl(var(--text-muted))" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ mb: 0.8 }}
                />

                <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))", mb: 0.6 }}>
                  {total.toLocaleString()} dokumente
                </Typography>

                {loading ? (
                  <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
                    <CircularProgress size={26} />
                  </Box>
                ) : (
                  <Box sx={{ overflowY: "auto", minHeight: 0, display: "grid", gap: 0.7 }}>
                    {documents.map((doc) => (
                      <Box
                        key={doc.id}
                        onClick={() => setSelectedId(doc.id)}
                        sx={{
                          p: 0.9,
                          borderRadius: 1.5,
                          border: "1px solid hsl(var(--border-soft))",
                          bgcolor: selectedId === doc.id ? "hsl(var(--surface-muted))" : "hsl(var(--surface))",
                          cursor: "pointer",
                        }}
                      >
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.3 }}>{doc.title}</Typography>
                        <Typography sx={{ fontSize: "0.74rem", color: "hsl(var(--text-muted))", mt: 0.4 }}>
                          {doc.id} · {doc.date || "-"} · {doc.chunk_count} articles
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>

              <Paper sx={{ p: 1.2, borderRadius: 1.5, minHeight: 0, overflowY: "auto" }}>
                {selectedDoc ? (
                  <>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.25 }}>{selectedDoc.title}</Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", mt: 0.5 }}>{selectedDoc.id}</Typography>
                    <Box sx={{ mt: 1.2, display: "flex", gap: 0.6 }}>
                      <Chip label="Te gjitha kapitujt" color="primary" size="small" />
                    </Box>
                    <Divider sx={{ mt: 1.1, mb: 1.1 }} />
                    {detailLoading ? (
                      <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
                        <CircularProgress size={22} />
                      </Box>
                    ) : selectedChunks.length > 0 ? (
                      <Box>
                        <Paper sx={{ borderRadius: 1.2, overflow: "hidden", mb: 1 }}>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "110px 230px 1fr",
                              px: 1,
                              py: 0.7,
                              bgcolor: "hsl(var(--surface-muted))",
                            }}
                          >
                            <Typography sx={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Neni</Typography>
                            <Typography sx={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Titulli</Typography>
                            <Typography sx={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Parapamje</Typography>
                          </Box>
                          <Box sx={{ maxHeight: 210, overflowY: "auto" }}>
                            {filteredChunks.map((chunk) => {
                              const selected = selectedChunkKey === chunk.key;
                              return (
                                <Box
                                  key={chunk.key}
                                  onClick={() => setSelectedChunkKey((prev) => (prev === chunk.key ? null : chunk.key))}
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: "110px 230px 1fr",
                                    px: 1,
                                    py: 0.8,
                                    borderTop: "1px solid hsl(var(--border-soft))",
                                    cursor: "pointer",
                                    bgcolor: selected ? "hsl(var(--surface-muted))" : "hsl(var(--surface))",
                                  }}
                                >
                                  <Typography sx={{ fontSize: "0.82rem" }}>{chunk.article_label || chunk.group_label || "-"}</Typography>
                                  <Typography sx={{ fontSize: "0.82rem" }}>{chunk.article_title || chunk.group_title || "-"}</Typography>
                                  <Typography sx={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }} noWrap>
                                    {chunk.text_preview || chunk.text || "Nuk ka parapamje"}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                        </Paper>

                        {activeChunk ? (
                          <Paper sx={{ p: 1.1, borderRadius: 1.2 }}>
                            <Typography sx={{ fontSize: "1rem", fontWeight: 700, mb: 0.5 }}>
                              {activeChunk.article_title || activeChunk.group_title || activeChunk.article_label || "Seksioni i zgjedhur"}
                            </Typography>
                            <Typography sx={{ fontSize: "0.76rem", color: "hsl(var(--text-muted))", mb: 0.6 }}>
                              {activeChunk.article_label || activeChunk.group_label || selectedDoc.id}
                            </Typography>
                            <Typography sx={{ fontSize: "0.86rem", color: "hsl(var(--text-primary))", lineHeight: 1.65 }}>
                              {activeChunk.text || activeChunk.text_preview || "Nuk ka tekst parapamjeje."}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<ContentCopyIcon sx={{ fontSize: 15 }} />}
                              sx={{ mt: 1 }}
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `${activeChunk.article_label || activeChunk.group_label || ""}\n${
                                    activeChunk.article_title || activeChunk.group_title || ""
                                  }\n\n${activeChunk.text || activeChunk.text_preview || ""}`
                                )
                              }
                            >
                              Kopjo
                            </Button>
                          </Paper>
                        ) : null}
                      </Box>
                    ) : (
                      <>
                        <Typography sx={{ fontSize: "0.86rem", color: "hsl(var(--text-primary))", lineHeight: 1.65 }}>
                          {(selectedDocDetail?.subtitle as string) || selectedDoc.subtitle || "Nuk ka tekst parapamjeje per kete dokument."}
                        </Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", mt: 0.8 }}>
                          Ky dokument aktualisht nuk ka parapamje te indeksuara ne burimin e zgjedhur.
                        </Typography>
                      </>
                    )}
                  </>
                ) : (
                  <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
                    <Typography sx={{ fontSize: "0.92rem", color: "hsl(var(--text-muted))" }}>
                      Zgjidh nje rregullore per te pare permbajtjen
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </DashboardLayout>
      </Box>
    </Box>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <CircularProgress size={28} />
        </Box>
      }
    >
      <ExplorerPageContent />
    </Suspense>
  );
}
