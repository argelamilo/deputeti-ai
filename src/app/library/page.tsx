"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

type SourceKey = "eu_law" | "albanian";

interface SourceFilter {
  key: SourceKey;
  label: string;
}

interface LibraryResult {
  id: string;
  documentId?: string;
  source: SourceKey;
  title: string;
  subtitle: string;
  docType: string;
  date: string;
  score?: number;
  chunkId?: string;
}

const SOURCE_FILTERS: SourceFilter[] = [
  { key: "eu_law", label: "Ligji i BE-se" },
  { key: "albanian", label: "Ligji Shqiptar" },
];

const LIST_PAGE_SIZE = 200;
const SEARCH_LIMIT_FALLBACKS = [50, 25, 10];
const MIN_SEARCH_LENGTH = 3;
const ELI_PREFIX = /^eli:/i;

const normalizeTextValue = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const extractDateFromEli = (eliValue: string): string => {
  const segments = eliValue.trim().split(":");
  for (let idx = 0; idx <= segments.length - 3; idx += 1) {
    const year = segments[idx];
    const month = segments[idx + 1];
    const day = segments[idx + 2];
    if (/^\d{4}$/.test(year) && /^\d{2}$/.test(month) && /^\d{2}$/.test(day)) {
      return `${year}-${month}-${day}`;
    }
  }
  return "";
};

const isMetadataOnlyText = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) return true;
  if (ELI_PREFIX.test(normalized)) return true;

  // Ignore short identifier-like tokens such as CELEX/internal ids.
  return (
    !/\s/.test(normalized) &&
    /^[A-Za-z0-9._:/-]+$/.test(normalized) &&
    /\d/.test(normalized) &&
    normalized.length <= 32
  );
};

const sanitizeLibrarySubtitle = (value: unknown): string => {
  const normalized = normalizeTextValue(value);
  if (isMetadataOnlyText(normalized)) return "";
  return normalized;
};

const deriveLibraryDate = (item: Record<string, unknown>): string => {
  const directDate =
    normalizeTextValue(item.date) ||
    normalizeTextValue(item.document_date) ||
    normalizeTextValue(item.publication_date) ||
    normalizeTextValue(item.approval_date);
  if (directDate) return directDate;

  const eliCandidate = [item.eli, item.subtitle, item.id, item.document_id]
    .map((value) => normalizeTextValue(value))
    .find((value) => ELI_PREFIX.test(value));

  return eliCandidate ? extractDateFromEli(eliCandidate) : "";
};

export default function LibraryPage() {
  const { user: authUser, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LibraryResult[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceKey[]>(["eu_law", "albanian"]);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);
  const [expandedTextByItem, setExpandedTextByItem] = useState<Record<string, string>>({});
  const [loadingItemKeys, setLoadingItemKeys] = useState<Record<string, boolean>>({});

  const userForHeader = authUser
    ? {
      id: authUser.id || "",
      email: authUser.email || "",
    }
    : undefined;

  const fetchLibraryData = useCallback(async () => {
    if (selectedSources.length === 0) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      const trimmedQuery = query.trim();
      const isSearch = trimmedQuery.length >= MIN_SEARCH_LENGTH;
      if (trimmedQuery.length > 0 && trimmedQuery.length < MIN_SEARCH_LENGTH) {
        setResults([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      const normalizeSearchVariants = (raw: string): string[] => {
        const base = raw.trim();
        if (!base) return [];

        const withoutDiacritics = base
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ë/g, "e")
          .replace(/Ë/g, "E");

        const simplified = base
          .replace(/^\s*(ligji|kodi)\s+(i|te|t[eë])\s+/i, "")
          .trim();

        return Array.from(new Set([base, withoutDiacritics, simplified].filter(Boolean)));
      };

      const requests = selectedSources.map(async (source) => {
        if (isSearch) {
          const variants = normalizeSearchVariants(trimmedQuery);
          let bestPayload: { results: Array<Record<string, unknown>>; total: number } = { results: [], total: 0 };
          let lastSearchError: Error | null = null;

          for (const variant of variants) {
            let variantPayload: { results: Array<Record<string, unknown>>; total: number } | null = null;

            for (const limit of SEARCH_LIMIT_FALLBACKS) {
              const response = await fetch(
                `/api/library?source=${encodeURIComponent(source)}&q=${encodeURIComponent(variant)}&limit=${limit}`,
                { credentials: "include" }
              );

              if (response.ok) {
                variantPayload = (await response.json()) as { results: Array<Record<string, unknown>>; total: number };
                break;
              }

              // Backend can reject large limits; fall back to smaller limits.
              if (response.status === 422) {
                continue;
              }

              lastSearchError = new Error(`Search request failed: ${response.status}`);
              break;
            }

            if (!variantPayload) {
              continue;
            }

            const payload = variantPayload;
            if ((payload.results || []).length > (bestPayload.results || []).length) {
              bestPayload = payload;
            }
            if ((payload.results || []).length > 0) {
              break;
            }
          }

          if (!bestPayload.results.length && lastSearchError) {
            throw lastSearchError;
          }

          const mapped = (bestPayload.results || []).map((item, idx) => {
            const documentId = String(item.document_id || item.doc_id || item.id || "").trim();
            return {
            // Search results can include chunk-level `id`; use `document_id` for detail expansion.
            id: String(item.document_id || item.id || `${source}-search-${idx}`),
            documentId: documentId || undefined,
            source,
            title: String(item.title || "Pa titull"),
            subtitle: sanitizeLibrarySubtitle(item.text_preview || item.subtitle),
            docType: String(item.doc_type || "Dokument"),
            date: deriveLibraryDate(item),
            score: typeof item.score === "number" ? Math.round(item.score) : undefined,
            chunkId: typeof item.id === "string" ? item.id : undefined,
          }});

          return { total: bestPayload.total || mapped.length, mapped };
        }

        const response = await fetch(`/api/library?source=${encodeURIComponent(source)}&page=1&page_size=${LIST_PAGE_SIZE}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Documents request failed: ${response.status}`);
        }
        const payload = (await response.json()) as { documents: Array<Record<string, unknown>>; total: number };
        const mapped = (payload.documents || []).map((item, idx) => ({
          id: String(item.id || `${source}-list-${idx}`),
          documentId: typeof item.id === "string" ? item.id : undefined,
          source,
          title: String(item.title || "Pa titull"),
          subtitle: sanitizeLibrarySubtitle(item.subtitle),
          docType: String(item.doc_type || "Dokument"),
          date: deriveLibraryDate(item),
          score: undefined,
          chunkId: undefined,
        }));
        return { total: payload.total || mapped.length, mapped };
      });

      const responses = await Promise.all(requests);
      const merged = responses.flatMap((r) => r.mapped);
      const mergedTotal = responses.reduce((acc, curr) => acc + curr.total, 0);

      // Deduplicate by source+document ID because search can return many chunk-level
      // hits for the same law/document, which would otherwise create duplicate React keys.
      const dedupedByDocument = new Map<string, LibraryResult>();
      for (const entry of merged) {
        const dedupeKey = `${entry.source}-${entry.documentId || entry.id}`;
        const current = dedupedByDocument.get(dedupeKey);
        if (!current) {
          dedupedByDocument.set(dedupeKey, entry);
          continue;
        }

        const currentScore = typeof current.score === "number" ? current.score : -1;
        const nextScore = typeof entry.score === "number" ? entry.score : -1;
        const pickNext =
          nextScore > currentScore ||
          (nextScore === currentScore && (entry.subtitle?.length || 0) > (current.subtitle?.length || 0));

        if (pickNext) {
          dedupedByDocument.set(dedupeKey, entry);
        }
      }

      const dedupedResults = Array.from(dedupedByDocument.values());
      setResults(dedupedResults);
      setTotalCount(mergedTotal);
    } catch (error) {
      console.error("Failed to load library results:", error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSources]);

  useEffect(() => {
    const t = setTimeout(fetchLibraryData, 220);
    return () => clearTimeout(t);
  }, [fetchLibraryData]);

  useEffect(() => {
    const onTokenReady = () => {
      fetchLibraryData();
    };
    window.addEventListener("jwtTokenUpdated", onTokenReady);
    return () => window.removeEventListener("jwtTokenUpdated", onTokenReady);
  }, [fetchLibraryData]);

  const sourceCount = useMemo(
    () => ({
      eu_law: results.filter((r) => r.source === "eu_law").length,
      albanian: results.filter((r) => r.source === "albanian").length,
    }),
    [results]
  );

  useEffect(() => {
    setExpandedItemKey(null);
  }, [query, selectedSources, loading]);

  const loadExpandedText = useCallback(async (item: LibraryResult, itemKey: string, options?: { prefetch?: boolean }) => {
    setLoadingItemKeys((prev) => ({ ...prev, [itemKey]: true }));
    try {
      const maxPages = options?.prefetch ? 4 : 50; // allow full-document expansion for large laws
      const pageSize = 200;
      const fetchByDocId = async (docId: string) => {
        const detailResponse = await fetch(
          `/api/library?source=${encodeURIComponent(item.source)}&doc_id=${encodeURIComponent(docId)}`,
          { credentials: "include" }
        );
        const detailPayload = detailResponse.ok
          ? ((await detailResponse.json()) as Record<string, unknown>)
          : null;

        const assembledChunks: string[] = [];
        for (let page = 1; page <= maxPages; page += 1) {
          const chunkResponse = await fetch(
            `/api/library?source=${encodeURIComponent(item.source)}&doc_id=${encodeURIComponent(docId)}&mode=chunks&page=${page}&page_size=${pageSize}`,
            { credentials: "include" }
          );
          if (!chunkResponse.ok) break;

          const chunkPayload = (await chunkResponse.json()) as { chunks?: Array<Record<string, unknown>> };
          const pageChunks = chunkPayload.chunks || [];
          if (pageChunks.length === 0) break;

          for (const chunk of pageChunks) {
            const sectionLabel = String(chunk.article_label || chunk.group_label || "").trim();
            const sectionTitle = String(chunk.article_title || chunk.group_title || "").trim();
            const rawText = String(
              chunk.text ||
              chunk.content ||
              chunk.full_text ||
              chunk.chunk_text ||
              chunk.body ||
              ""
            ).trim();

            if (!rawText) continue;
            const heading = [sectionLabel, sectionTitle].filter(Boolean).join(" ");
            assembledChunks.push(heading ? `${heading}\n${rawText}` : rawText);
          }

          if (pageChunks.length < pageSize) break;
        }

        const deduped = Array.from(new Set(assembledChunks.filter(Boolean)));
        const fullTextFromChunks = deduped.join("\n\n");
        const detailFallback = String(
          detailPayload?.full_text ||
          detailPayload?.content ||
          detailPayload?.text ||
          sanitizeLibrarySubtitle(detailPayload?.subtitle) ||
          ""
        ).trim();

        const mergedText = fullTextFromChunks || detailFallback || "";
        return { mergedText, ok: Boolean(detailResponse.ok || fullTextFromChunks) };
      };

      let targetDocId = (item.documentId || item.id || "").trim();
      let fullText = "";
      if (targetDocId) {
        const firstPass = await fetchByDocId(targetDocId);
        fullText = firstPass.mergedText;
      }

      // Fallback: re-resolve doc_id by title when result carries a non-canonical id (common in some EU search hits).
      if (!fullText && item.title.trim()) {
        const resolveResponse = await fetch(
          `/api/library?source=${encodeURIComponent(item.source)}&q=${encodeURIComponent(item.title)}&limit=10`,
          { credentials: "include" }
        );
        if (resolveResponse.ok) {
          const resolvePayload = (await resolveResponse.json()) as { results?: Array<Record<string, unknown>> };
          const resolved = (resolvePayload.results || []).find((entry) => entry.document_id || entry.id);
          const resolvedDocId = String(resolved?.document_id || resolved?.id || "").trim();
          if (resolvedDocId && resolvedDocId !== targetDocId) {
            const secondPass = await fetchByDocId(resolvedDocId);
            fullText = secondPass.mergedText || fullText;
          }
        }
      }

      fullText = fullText || sanitizeLibrarySubtitle(item.subtitle);
      setExpandedTextByItem((prev) => ({ ...prev, [itemKey]: fullText }));
    } catch {
      setExpandedTextByItem((prev) => ({ ...prev, [itemKey]: sanitizeLibrarySubtitle(item.subtitle) }));
    } finally {
      setLoadingItemKeys((prev) => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (results.length === 0) return;
    const timer = setTimeout(() => {
      results.slice(0, 2).forEach((item) => {
        const itemKey = `${item.source}-${item.documentId || item.id}`;
        const hasLoadedText = Object.prototype.hasOwnProperty.call(expandedTextByItem, itemKey);
        if (hasLoadedText || loadingItemKeys[itemKey]) return;
        loadExpandedText(item, itemKey, { prefetch: true });
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [results, expandedTextByItem, loadingItemKeys, loadExpandedText]);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar
        items={[]}
        selectedItem="library"
        user={{
          name: authUser?.full_name || authUser?.email || "User",
          email: authUser?.email || "user@deputeti.ai",
        }}
      />

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh" }}>
        <DashboardLayout
          header={<PageHeader breadcrumbItems={[{ label: "Biblioteka" }]} user={userForHeader} onLogout={logout} />}
        >
          <Box sx={{ px: { xs: 1, sm: 2 }, pb: 0 }}>
            <Box
              sx={{
                position: "relative",
                height: "calc(100dvh - 96px)",
                minHeight: "calc(100vh - 96px)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: { xs: 0, md: 236 },
                  right: 0,
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Kerko ne te gjitha bazat ligjore..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon sx={{ color: "hsl(var(--text-muted))" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 999,
                      bgcolor: "hsl(var(--surface))",
                    },
                  }}
                />
              </Box>

              <Paper
                sx={{
                  p: 1.2,
                  borderRadius: 1,
                  position: "absolute",
                  top: { xs: 72, md: 84 },
                  left: 0,
                  width: 220,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "hsl(var(--text-muted))",
                    mb: 0.8,
                  }}
                >
                  Burimet
                </Typography>
                {SOURCE_FILTERS.map((filter) => (
                  <FormControlLabel
                    key={filter.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedSources.includes(filter.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSources((prev) => [...prev, filter.key]);
                          } else {
                            setSelectedSources((prev) => prev.filter((item) => item !== filter.key));
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: "0.86rem", color: "hsl(var(--text-primary))" }}>
                        {filter.label}
                      </Typography>
                    }
                  />
                ))}
              </Paper>

              <Box
                sx={{
                  position: "absolute",
                  top: { xs: 72, md: 84 },
                  left: { xs: 0, md: 236 },
                  right: 0,
                  bottom: 0,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
                    {totalCount} rezultate
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 8, flex: 1 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      gridAutoRows: "min-content",
                      alignContent: "start",
                      overflowY: "auto",
                      pr: 0.3,
                      minHeight: 0,
                      flex: 1,
                    }}
                  >
                    {results.map((item) => {
                      const itemKey = `${item.source}-${item.documentId || item.id}`;
                      const isExpanded = expandedItemKey === itemKey;
                      const hasLoadedText = Object.prototype.hasOwnProperty.call(expandedTextByItem, itemKey);
                      const collapsedSubtitle = item.subtitle.trim();
                      const expandedText = (expandedTextByItem[itemKey] ?? item.subtitle).trim();
                      const detailText = isExpanded
                        ? (loadingItemKeys[itemKey] ? expandedText : expandedText || "Nuk ka informacion për këtë ligj.")
                        : collapsedSubtitle;
                      return (
                        <Paper
                          key={itemKey}
                          onMouseEnter={() => {
                            if (!hasLoadedText && !loadingItemKeys[itemKey]) {
                              loadExpandedText(item, itemKey, { prefetch: true });
                            }
                          }}
                          onClick={() => {
                            setExpandedItemKey((prev) => {
                              const next = prev === itemKey ? null : itemKey;
                              if (next === itemKey && !hasLoadedText && !loadingItemKeys[itemKey]) {
                                loadExpandedText(item, itemKey);
                              }
                              return next;
                            });
                          }}
                          sx={{
                            p: 1.1,
                            borderRadius: 1.8,
                            cursor: "pointer",
                            border: "1px solid hsl(var(--border-soft))",
                            transition: "border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
                            ...(isExpanded
                              ? {
                                borderColor: "hsl(var(--primary))",
                                boxShadow: "0 0 0 1px hsl(var(--primary) / 0.15)",
                              }
                              : {
                                "&:hover": {
                                  borderColor: "hsl(var(--text-muted))",
                                  backgroundColor: "hsl(var(--surface-muted))",
                                },
                              }),
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.7 }}>
                                <Typography
                                  sx={{
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    whiteSpace: isExpanded ? "normal" : "normal",
                                    overflowWrap: "anywhere",
                                    display: isExpanded ? "block" : "-webkit-box",
                                    WebkitLineClamp: isExpanded ? "unset" : 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {item.title}
                                </Typography>
                                {loadingItemKeys[itemKey] ? <CircularProgress size={14} sx={{ color: "hsl(var(--text-muted))" }} /> : null}
                              </Box>
                              {detailText ? (
                                <Typography
                                  sx={{
                                    fontSize: "0.8rem",
                                    color: "hsl(var(--text-muted))",
                                    mt: 0.3,
                                    whiteSpace: isExpanded ? "pre-wrap" : "normal",
                                    overflowWrap: "anywhere",
                                    display: isExpanded ? "block" : "-webkit-box",
                                    WebkitLineClamp: isExpanded ? "unset" : 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {detailText}
                                </Typography>
                              ) : null}
                              {isExpanded && loadingItemKeys[itemKey] ? (
                                <Typography sx={{ mt: 0.35, fontSize: "0.76rem", color: "hsl(var(--text-muted))" }}>
                                  Po ngarkohet...
                                </Typography>
                              ) : null}
                              <Typography sx={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", mt: 0.45 }}>
                                {item.docType}
                                {item.date ? ` · ${item.date}` : ""}
                                {item.source === "eu_law" ? " · EU" : " · AL"}
                              </Typography>
                            </Box>
                            {typeof item.score === "number" ? (
                              <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>{item.score}%</Typography>
                            ) : null}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DashboardLayout>
      </Box>
    </Box>
  );
}
