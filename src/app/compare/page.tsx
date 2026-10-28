"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { translateToAlbanian } from "@/lib/translation/translator";

type CompareTab = "cross" | "amendment" | "replacement";
type SourceId = "eu_law" | "albania";

type HistoryItem = {
  id: number;
  comparison_type?: string;
  title?: string;
  source_a?: string;
  source_b?: string;
  overall_alignment?: number;
  created_at?: string;
};

type ReportSection = {
  theme?: string;
  side_a?: { summary?: string; key_provisions?: string[] };
  side_b?: { summary?: string; key_provisions?: string[] };
  differences?: string;
  alignment_score?: number;
};

type ReportEnvelope = {
  report?: { title?: string; summary?: string; sections?: ReportSection[] };
  cached?: boolean;
  created_at?: string;
  source_a?: string;
  source_b?: string;
  error?: string;
};

type LawSearchResult = {
  id: string;
  title?: string;
  ref?: string;
  doc_type?: string;
  date?: string;
  in_force?: boolean;
};

const SOURCE_OPTIONS: Array<{ id: SourceId; label: string }> = [
  { id: "eu_law", label: "Ligji i BE-se" },
  { id: "albania", label: "Ligji Shqiptar" },
];

function sourceLabel(id?: string): string {
  if (!id) return "Ligj";
  return SOURCE_OPTIONS.find((s) => s.id === id)?.label || id;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

function bucketLabelFromDate(value?: string): string {
  if (!value) return "Date e panjohur";
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return formatDate(value);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfCreated.getTime()) / 86400000);

  if (diffDays === 0) return "Sot";
  if (diffDays === 1) return "Dje";
  return formatDate(value);
}

function scorePercent(v?: number): string {
  if (typeof v !== "number") return "-";
  return `${Math.round(v * 100)}%`;
}

function normalizeDocRef(value: string): string {
  return value.trim().slice(0, 200);
}

function pickDocRefFromOption(option: LawSearchResult, source: SourceId): string {
  // Compare backend expects numeric/internal IDs for albanian dataset.
  if (source === "albania") {
    return normalizeDocRef(option.id || option.ref || "");
  }
  // EU dataset works with CELEX-like refs.
  return normalizeDocRef(option.ref || option.id || "");
}

function previewLabelFromOption(option: LawSearchResult): string {
  const base = (option.title || option.ref || option.id || "").trim();
  if (!base) return "";
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length <= 10) return base;
  return `${words.slice(0, 10).join(" ")}...`;
}

function scoreTone(v?: number): { bg: string; fg: string } {
  if (typeof v !== "number") {
    return { bg: "hsl(var(--surface-muted))", fg: "hsl(var(--text-muted))" };
  }
  const pct = Math.round(v * 100);
  if (pct >= 70) {
    return { bg: "#d8f5de", fg: "#1f8f43" };
  }
  if (pct >= 40) {
    return { bg: "#fff2cc", fg: "#9a6700" };
  }
  return { bg: "#ffe1e1", fg: "#c03636" };
}

function localizeHistoryTitle(title?: string): string | undefined {
  if (!title) return title;
  return title
    .replace(/^Comparison:/i, "Krahasim:")
    .replace(/\s+vs\s+/gi, " kundrejt ");
}

function mapKnownSectionTheme(theme?: string): string | undefined {
  if (!theme) return theme;
  const normalized = theme.trim().toLowerCase();
  const known: Record<string, string> = {
    "purpose and legal nature": "Qellimi dhe natyra ligjore",
    "scope and covered subjects": "Fusha dhe subjektet e mbuluara",
    "eligibility and beneficiary criteria": "Kriteret e kualifikimit dhe perfituesve",
    "calculation of amounts": "Llogaritja e shumave",
    "application, verification, and administration": "Aplikimi, verifikimi dhe administrimi",
    "funding and financial source": "Financimi dhe burimi financiar",
    "entry into force and temporal application": "Hyrja ne fuqi dhe zbatimi kohor",
    "institutional implementation and enforcement": "Zbatimi institucional dhe mbikeqyrja",
  };
  return known[normalized] || theme;
}

function isLikelyEnglishText(text?: string): boolean {
  if (!text || !text.trim()) return false;
  return /\b(the|and|of|for|with|from|into|scope|purpose|legal|nature|covered|subjects|eligibility|beneficiary|criteria|calculation|amounts|application|verification|administration|funding|financial|source|entry|force|temporal|institutional|implementation|enforcement|differences|report|summary)\b/i.test(
    text
  );
}

export default function ComparePage() {
  const { user: authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<CompareTab>("cross");

  const [sourceA, setSourceA] = useState<SourceId>("eu_law");
  const [sourceB, setSourceB] = useState<SourceId>("eu_law");
  const [docARef, setDocARef] = useState("");
  const [docBRef, setDocBRef] = useState("");
  const [focus, setFocus] = useState("");
  const [docAResolvedRef, setDocAResolvedRef] = useState<string | null>(null);
  const [docBResolvedRef, setDocBResolvedRef] = useState<string | null>(null);

  const [singleSource, setSingleSource] = useState<SourceId>("eu_law");
  const [singleDocRef, setSingleDocRef] = useState("");
  const [singleResolvedRef, setSingleResolvedRef] = useState<string | null>(null);

  const [lawOptionsA, setLawOptionsA] = useState<LawSearchResult[]>([]);
  const [lawOptionsB, setLawOptionsB] = useState<LawSearchResult[]>([]);
  const [lawOptionsSingle, setLawOptionsSingle] = useState<LawSearchResult[]>([]);
  const [lawLoadingA, setLawLoadingA] = useState(false);
  const [lawLoadingB, setLawLoadingB] = useState(false);
  const [lawLoadingSingle, setLawLoadingSingle] = useState(false);

  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState<number | null>(null);
  const [historyReports, setHistoryReports] = useState<Record<number, ReportEnvelope>>({});
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, string | false>>({});

  const userForHeader = authUser ? { id: authUser.id || "", email: authUser.email || "" } : undefined;
  const squaredFieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 1 } };

  const authedFetch = useCallback(async (url: string, init?: RequestInit) => {
    return fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  }, []);

  const maybeTranslateToAlbanian = useCallback(async (text?: string): Promise<string | undefined> => {
    if (!text || !text.trim()) return text;
    if (!isLikelyEnglishText(text)) return text;
    try {
      return await translateToAlbanian(text);
    } catch {
      return text;
    }
  }, []);

  const localizeReportEnvelope = useCallback(
    async (envelope: ReportEnvelope): Promise<ReportEnvelope> => {
      if (!envelope.report) return envelope;
      const report = envelope.report;
      const sections = report.sections || [];

      const localizedSections = await Promise.all(
        sections.map(async (section) => ({
          ...section,
          theme: mapKnownSectionTheme(await maybeTranslateToAlbanian(section.theme)),
          side_a: section.side_a
            ? {
                summary: await maybeTranslateToAlbanian(section.side_a.summary),
                key_provisions: section.side_a.key_provisions
                  ? await Promise.all(section.side_a.key_provisions.map((item) => maybeTranslateToAlbanian(item).then((v) => v || item)))
                  : undefined,
              }
            : undefined,
          side_b: section.side_b
            ? {
                summary: await maybeTranslateToAlbanian(section.side_b.summary),
                key_provisions: section.side_b.key_provisions
                  ? await Promise.all(section.side_b.key_provisions.map((item) => maybeTranslateToAlbanian(item).then((v) => v || item)))
                  : undefined,
              }
            : undefined,
          differences: await maybeTranslateToAlbanian(section.differences),
        }))
      );

      return {
        ...envelope,
        report: {
          ...report,
          title: localizeHistoryTitle(await maybeTranslateToAlbanian(report.title)),
          summary: await maybeTranslateToAlbanian(report.summary),
          sections: localizedSections,
        },
      };
    },
    [maybeTranslateToAlbanian]
  );

  const loadHistory = useCallback(async (): Promise<HistoryItem[]> => {
    setHistoryLoading(true);
    try {
      const response = await authedFetch("/api/compare?action=history");
      const payload = (await response.json()) as HistoryItem[] | { detail?: string };
      if (!response.ok) {
        throw new Error((payload as { detail?: string }).detail || "Failed to load history.");
      }
      const nextHistory = (Array.isArray(payload) ? payload : []).map((item) => ({
        ...item,
        title: localizeHistoryTitle(item.title),
      }));
      setHistory(nextHistory);
      return nextHistory;
    } catch {
      setHistory([]);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const onTokenReady = () => loadHistory();
    window.addEventListener("jwtTokenUpdated", onTokenReady);
    return () => window.removeEventListener("jwtTokenUpdated", onTokenReady);
  }, [loadHistory]);

  const fetchHistoryReport = useCallback(
    async (id: number) => {
      if (historyReports[id]) return;
      try {
        const response = await authedFetch(`/api/compare?action=report&report_id=${id}`);
        const payload = (await response.json()) as ReportEnvelope & { detail?: string };
        if (!response.ok) throw new Error(payload.detail || "Ngarkimi i raportit deshtoi.");
        const localized = await localizeReportEnvelope(payload);
        setHistoryReports((prev) => ({ ...prev, [id]: localized }));
      } catch {
        setHistoryReports((prev) => ({
          ...prev,
          [id]: { report: { title: "Ngarkimi i raportit deshtoi", summary: "Ju lutem provoni perseri." } },
        }));
      }
    },
    [authedFetch, historyReports, localizeReportEnvelope]
  );

  const runComparison = useCallback(
    async (action: "cross" | "amendment" | "replacement", body: Record<string, unknown>) => {
      setLoadingRun(true);
      setLoadingSeconds(0);
      setRunError(null);
      try {
        const response = await authedFetch(`/api/compare?action=${action}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as ReportEnvelope & { detail?: string };
        if (!response.ok) throw new Error(payload.detail || "Kerkesa per krahasim deshtoi.");
        if (!payload.report) {
          throw new Error(payload.error || payload.detail || "No comparison report was returned by backend.");
        }
        const nextHistory = await loadHistory();
        if (nextHistory.length > 0) {
          const latestId = nextHistory[0].id;
          setOpenHistoryId(latestId);
          await fetchHistoryReport(latestId);
        }
      } catch (error: unknown) {
        setRunError(error instanceof Error ? error.message : "Kerkesa per krahasim deshtoi.");
      } finally {
        setLoadingRun(false);
      }
    },
    [authedFetch, fetchHistoryReport, loadHistory]
  );

  useEffect(() => {
    if (!loadingRun) return;
    const timer = setInterval(() => {
      setLoadingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loadingRun]);

  const searchLaws = useCallback(
    async (query: string, source: SourceId): Promise<LawSearchResult[]> => {
      const q = query.trim().slice(0, 180);
      if (q.length < 2) return [];
      const response = await authedFetch(
        `/api/compare?action=search-laws&q=${encodeURIComponent(q)}&source=${encodeURIComponent(source)}&limit=8`
      );
      const payload = (await response.json()) as { results?: LawSearchResult[]; detail?: string };
      if (!response.ok) throw new Error(payload.detail || "Search failed.");
      return Array.isArray(payload.results) ? payload.results : [];
    },
    [authedFetch]
  );

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (activeTab !== "cross" || docARef.trim().length < 2) {
        if (active) setLawOptionsA([]);
        return;
      }
      setLawLoadingA(true);
      try {
        const results = await searchLaws(docARef, sourceA);
        if (active) setLawOptionsA(results);
      } catch {
        if (active) setLawOptionsA([]);
      } finally {
        if (active) setLawLoadingA(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [activeTab, docARef, searchLaws, sourceA]);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (activeTab !== "cross" || docBRef.trim().length < 2) {
        if (active) setLawOptionsB([]);
        return;
      }
      setLawLoadingB(true);
      try {
        const results = await searchLaws(docBRef, sourceB);
        if (active) setLawOptionsB(results);
      } catch {
        if (active) setLawOptionsB([]);
      } finally {
        if (active) setLawLoadingB(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [activeTab, docBRef, searchLaws, sourceB]);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (activeTab === "cross" || singleDocRef.trim().length < 2) {
        if (active) setLawOptionsSingle([]);
        return;
      }
      setLawLoadingSingle(true);
      try {
        const results = await searchLaws(singleDocRef, singleSource);
        if (active) setLawOptionsSingle(results);
      } catch {
        if (active) setLawOptionsSingle([]);
      } finally {
        if (active) setLawLoadingSingle(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [activeTab, searchLaws, singleDocRef, singleSource]);

  const openHistoryItem = useCallback(
    async (id: number) => {
      if (openHistoryId === id) {
        // If report is not loaded yet, keep item open and load it.
        if (!historyReports[id]) {
          await fetchHistoryReport(id);
          return;
        }
        setOpenHistoryId(null);
        return;
      }
      setOpenHistoryId(id);
      await fetchHistoryReport(id);
    },
    [fetchHistoryReport, historyReports, openHistoryId]
  );

  const renderReport = (
    envelope: ReportEnvelope,
    expanded: string | false,
    onChangeExpanded: (next: string | false) => void
  ) => {
    const report = envelope.report;
    const sections = report?.sections || [];
    if (!report) return null;

    return (
      <Box sx={{ mb: 1.3 }}>
        <Paper sx={{ p: 1.8, borderRadius: 1.6, mb: 1.1 }}>
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.3, mb: 0.75 }}>{report.title || "Raport krahasimi"}</Typography>
          <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))", lineHeight: 1.6 }}>{report.summary || "Nuk ka permbledhje."}</Typography>
          <Box sx={{ mt: 1.1, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
              {envelope.created_at ? `Krijuar (${formatDate(envelope.created_at)})` : ""}
            </Typography>
          </Box>
        </Paper>

        {sections.map((section, idx) => {
          const title = section.theme || `Seksioni ${idx + 1}`;
          const sectionTone = scoreTone(section.alignment_score);
          return (
            <Accordion
              key={`${title}-${idx}`}
              expanded={expanded === title}
              onChange={(_, isExpanded) => onChangeExpanded(isExpanded ? title : false)}
              sx={{ borderRadius: "10px !important", mb: 0.8, "&:before": { display: "none" } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", pr: 1.5 }}>
                  <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
                  <Typography sx={{ color: sectionTone.fg, fontWeight: 600 }}>{scorePercent(section.alignment_score)}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
                  <Paper variant="outlined" sx={{ p: 1.2 }}>
                    <Typography sx={{ color: "hsl(var(--primary))", fontWeight: 700, mb: 0.5 }}>{sourceLabel(envelope.source_a)}</Typography>
                    <Typography sx={{ fontSize: "0.92rem", color: "hsl(var(--text-muted))" }}>{section.side_a?.summary || "Nuk ka detaje."}</Typography>
                    {(section.side_a?.key_provisions || []).length > 0 ? (
                      <Typography component="ul" sx={{ mt: 0.6, mb: 0, pl: 2.2, fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>
                        {section.side_a?.key_provisions?.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                      </Typography>
                    ) : null}
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 1.2 }}>
                    <Typography sx={{ color: "hsl(var(--primary))", fontWeight: 700, mb: 0.5 }}>{sourceLabel(envelope.source_b)}</Typography>
                    <Typography sx={{ fontSize: "0.92rem", color: "hsl(var(--text-muted))" }}>{section.side_b?.summary || "Nuk ka detaje."}</Typography>
                    {(section.side_b?.key_provisions || []).length > 0 ? (
                      <Typography component="ul" sx={{ mt: 0.6, mb: 0, pl: 2.2, fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>
                        {section.side_b?.key_provisions?.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                      </Typography>
                    ) : null}
                  </Paper>
                </Box>
                <Paper variant="outlined" sx={{ mt: 1, p: 1 }}>
                  <Typography sx={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>
                    <strong>Dallimet kryesore:</strong> {section.differences || "Nuk ka tekst per dallimet."}
                  </Typography>
                </Paper>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  const groupedHistory = useMemo(() => {
    const groups: Array<{ label: string; items: HistoryItem[] }> = [];
    const indexByLabel = new Map<string, number>();

    history.forEach((item) => {
      const label = bucketLabelFromDate(item.created_at);
      const existingIndex = indexByLabel.get(label);
      if (typeof existingIndex === "number") {
        groups[existingIndex].items.push(item);
      } else {
        indexByLabel.set(label, groups.length);
        groups.push({ label, items: [item] });
      }
    });

    return groups;
  }, [history]);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar
        items={[]}
        selectedItem="compare"
        user={{ name: authUser?.full_name || authUser?.email || "User", email: authUser?.email || "user@deputeti.ai" }}
      />

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh" }}>
        <DashboardLayout header={<PageHeader breadcrumbItems={[{ label: "Asistenti Ligjor" }]} user={userForHeader} onLogout={logout} />}>
          <Box sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
            <Typography sx={{ fontSize: "2rem", fontWeight: 700, mb: 1.7 }}>Krahasimi i ligjeve</Typography>

            <Paper sx={{ p: 0.6, borderRadius: 1.8, mb: 1.5 }}>
              <Tabs value={activeTab} onChange={(_, value: CompareTab) => setActiveTab(value)} variant="fullWidth" sx={{ minHeight: 42, "& .MuiTabs-indicator": { display: "none" } }}>
                {[
                  { label: "Nder-juridiksion", value: "cross" },
                  { label: "Ndryshimet", value: "amendment" },
                  { label: "Zevendesimi", value: "replacement" },
                ].map((item) => (
                  <Tab
                    key={item.value}
                    label={item.label}
                    value={item.value}
                    sx={{
                      minHeight: 38,
                      borderRadius: 1.2,
                      textTransform: "none",
                      fontWeight: 500,
                      color: "hsl(var(--text-muted))",
                      "&.Mui-selected": { bgcolor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" },
                    }}
                  />
                ))}
              </Tabs>
            </Paper>

            {activeTab === "cross" && (
              <Box sx={{ mb: 2.2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>LIGJI A</Typography>
                    <TextField select fullWidth size="small" value={sourceA} onChange={(e) => setSourceA(e.target.value as SourceId)} sx={squaredFieldSx}>
                      {SOURCE_OPTIONS.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
                    </TextField>
                    <Autocomplete
                      freeSolo
                      options={lawOptionsA}
                      loading={lawLoadingA}
                      filterOptions={(x) => x}
                      inputValue={docARef}
                      onInputChange={(_, value, reason) => {
                        if (reason === "input" || reason === "clear") {
                          setDocARef(normalizeDocRef(value));
                          setDocAResolvedRef(null);
                        }
                      }}
                      onChange={(_, value) => {
                        if (typeof value === "string") {
                          setDocARef(normalizeDocRef(value));
                          setDocAResolvedRef(null);
                        } else if (value) {
                          setDocARef(previewLabelFromOption(value));
                          setDocAResolvedRef(pickDocRefFromOption(value, sourceA));
                        }
                      }}
                      getOptionLabel={(option) => (typeof option === "string" ? option : option.title || option.ref || option.id)}
                      renderOption={(props, option, state) => {
                        const { key, ...optionProps } = props;
                        return (
                          <Box
                            key={`${option.id || option.ref || option.title || "option"}-${state.index}`}
                            component="li"
                            {...optionProps}
                            sx={{ display: "block !important", py: "10px !important" }}
                          >
                            <Typography
                              sx={{
                                fontSize: "1rem",
                                color: "hsl(var(--text-primary))",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1.35,
                              }}
                            >
                              {option.title || option.ref || option.id}
                            </Typography>
                            <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
                              {option.ref || option.id} · {option.doc_type || "doc"} {option.date ? `· ${option.date}` : ""}
                            </Typography>
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth placeholder="Kerko sipas emrit ose numrit..." sx={{ mt: 0.75, ...squaredFieldSx }} />
                      )}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>LIGJI B</Typography>
                    <TextField select fullWidth size="small" value={sourceB} onChange={(e) => setSourceB(e.target.value as SourceId)} sx={squaredFieldSx}>
                      {SOURCE_OPTIONS.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
                    </TextField>
                    <Autocomplete
                      freeSolo
                      options={lawOptionsB}
                      loading={lawLoadingB}
                      filterOptions={(x) => x}
                      inputValue={docBRef}
                      onInputChange={(_, value, reason) => {
                        if (reason === "input" || reason === "clear") {
                          setDocBRef(normalizeDocRef(value));
                          setDocBResolvedRef(null);
                        }
                      }}
                      onChange={(_, value) => {
                        if (typeof value === "string") {
                          setDocBRef(normalizeDocRef(value));
                          setDocBResolvedRef(null);
                        } else if (value) {
                          setDocBRef(previewLabelFromOption(value));
                          setDocBResolvedRef(pickDocRefFromOption(value, sourceB));
                        }
                      }}
                      getOptionLabel={(option) => (typeof option === "string" ? option : option.title || option.ref || option.id)}
                      renderOption={(props, option, state) => {
                        const { key, ...optionProps } = props;
                        return (
                          <Box
                            key={`${option.id || option.ref || option.title || "option"}-${state.index}`}
                            component="li"
                            {...optionProps}
                            sx={{ display: "block !important", py: "10px !important" }}
                          >
                            <Typography
                              sx={{
                                fontSize: "1rem",
                                color: "hsl(var(--text-primary))",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1.35,
                              }}
                            >
                              {option.title || option.ref || option.id}
                            </Typography>
                            <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
                              {option.ref || option.id} · {option.doc_type || "doc"} {option.date ? `· ${option.date}` : ""}
                            </Typography>
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth placeholder="Kerko sipas emrit ose numrit..." sx={{ mt: 0.75, ...squaredFieldSx }} />
                      )}
                    />
                  </Box>
                </Box>
                <Box sx={{ mt: 1.4, display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "end" }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>FOKUS (OPSIONAL)</Typography>
                    <TextField fullWidth size="small" placeholder="e.g., data subject rights, penalties" value={focus} onChange={(e) => setFocus(e.target.value)} sx={squaredFieldSx} />
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() =>
                      runComparison("cross", {
                        doc_a_ref: docAResolvedRef || normalizeDocRef(docARef),
                        doc_b_ref: docBResolvedRef || normalizeDocRef(docBRef),
                        source_a: sourceA,
                        source_b: sourceB,
                        focus: focus.trim(),
                      })
                    }
                    disabled={loadingRun || !docARef.trim() || !docBRef.trim()}
                    sx={{
                      minWidth: 120,
                      height: 38,
                      borderRadius: 1,
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": { color: "#000" },
                    }}
                  >
                    {loadingRun ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                        <CircularProgress size={15} sx={{ color: "hsl(var(--primary-foreground))" }} />
                        Duke krahasuar...
                      </Box>
                    ) : (
                      "Krahaso"
                    )}
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab !== "cross" && (
              <Box sx={{ mb: 2.2, display: "grid", gridTemplateColumns: "260px 1fr auto", gap: 1, alignItems: "end" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>JURIDIKSIONI</Typography>
                  <TextField select fullWidth size="small" value={singleSource} onChange={(e) => setSingleSource(e.target.value as SourceId)} sx={squaredFieldSx}>
                    {SOURCE_OPTIONS.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", fontWeight: 600, mb: 0.4 }}>
                    {activeTab === "amendment" ? "REFERENCA E DOKUMENTIT (CELEX / NR. LIGJI)" : "REFERENCA E DOKUMENTIT TE SHFUQIZUAR"}
                  </Typography>
                  <Autocomplete
                    freeSolo
                    options={lawOptionsSingle}
                    loading={lawLoadingSingle}
                    filterOptions={(x) => x}
                    inputValue={singleDocRef}
                    onInputChange={(_, value, reason) => {
                      if (reason === "input" || reason === "clear") {
                        setSingleDocRef(normalizeDocRef(value));
                        setSingleResolvedRef(null);
                      }
                    }}
                    onChange={(_, value) => {
                      if (typeof value === "string") {
                        setSingleDocRef(normalizeDocRef(value));
                        setSingleResolvedRef(null);
                      } else if (value) {
                        setSingleDocRef(previewLabelFromOption(value));
                        setSingleResolvedRef(pickDocRefFromOption(value, singleSource));
                      }
                    }}
                    getOptionLabel={(option) => (typeof option === "string" ? option : option.title || option.ref || option.id)}
                    renderOption={(props, option, state) => {
                      const { key, ...optionProps } = props;
                      return (
                        <Box
                          key={`${option.id || option.ref || option.title || "option"}-${state.index}`}
                          component="li"
                          {...optionProps}
                          sx={{ display: "block !important", py: "10px !important" }}
                        >
                          <Typography
                            sx={{
                              fontSize: "1rem",
                              color: "hsl(var(--text-primary))",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.35,
                            }}
                          >
                            {option.title || option.ref || option.id}
                          </Typography>
                          <Typography sx={{ fontSize: "0.84rem", color: "hsl(var(--text-muted))" }}>
                            {option.ref || option.id} · {option.doc_type || "doc"} {option.date ? `· ${option.date}` : ""}
                          </Typography>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        placeholder={activeTab === "amendment" ? "p.sh., 32016R0679 ose Ligji nr. 7961" : "p.sh., 31995L0046"}
                        sx={squaredFieldSx}
                      />
                    )}
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={() =>
                    runComparison(activeTab === "amendment" ? "amendment" : "replacement", {
                      doc_ref: singleResolvedRef || normalizeDocRef(singleDocRef),
                      source: singleSource,
                    })
                  }
                  disabled={loadingRun || !singleDocRef.trim()}
                  sx={{
                    minWidth: 160,
                    height: 38,
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { color: "#000" },
                  }}
                >
                  {loadingRun ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
                      <CircularProgress size={15} sx={{ color: "hsl(var(--primary-foreground))" }} />
                      Duke ngarkuar...
                    </Box>
                  ) : activeTab === "amendment" ? (
                    "Gjej ndryshimet"
                  ) : (
                    "Gjej zevendesimin"
                  )}
                </Button>
              </Box>
            )}

            {loadingRun && (
              <Paper
                sx={{
                  mb: 1.2,
                  p: 2.2,
                  borderRadius: 1.6,
                  display: "grid",
                  placeItems: "center",
                  gap: 1.1,
                  textAlign: "center",
                }}
              >
                <CircularProgress size={30} />
                <Typography sx={{ fontSize: "1.02rem", fontWeight: 600, color: "hsl(var(--text-primary))" }}>
                  Po gjenerohet raporti i krahasimit...
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>
                  Kjo mund te zgjase 30-60 sekonda per ligje me te medha
                </Typography>
              </Paper>
            )}
            {runError && <Typography sx={{ mb: 1.2, color: "hsl(var(--text-muted))" }}>{runError}</Typography>}

            <Typography sx={{ fontSize: "1rem", fontWeight: 600, mb: 0.75 }}>Historiku i krahasimeve</Typography>
            {historyLoading ? (
              <Box sx={{ py: 2, display: "grid", placeItems: "center" }}><CircularProgress size={20} /></Box>
            ) : (
              <Box sx={{ display: "grid", gap: 0.8 }}>
                {groupedHistory.map((group) => (
                  <Box key={group.label} sx={{ display: "grid", gap: 0.8 }}>
                    <Typography sx={{ fontSize: "0.86rem", fontWeight: 700, color: "hsl(var(--text-muted))", mt: 0.3 }}>
                      {group.label}
                    </Typography>
                    {group.items.map((item) => (
                      <Box key={item.id}>
                        {(() => {
                          const historyTone = scoreTone(item.overall_alignment);
                          return (
                            <Paper
                              component="button"
                              type="button"
                              onClick={() => openHistoryItem(item.id)}
                              sx={{
                                p: 1.25,
                                borderRadius: 1.4,
                                width: "100%",
                                border: "1px solid hsl(var(--border-soft))",
                                textAlign: "left",
                                bgcolor: "hsl(var(--surface))",
                                cursor: "pointer",
                                transition: "background-color 150ms ease, border-color 150ms ease",
                                "&:hover": { bgcolor: "hsl(var(--surface-muted))", borderColor: "hsl(var(--text-muted))" },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.4 }}>
                                <Box>
                                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, mb: 0.35 }}>{item.title || `Krahasim #${item.id}`}</Typography>
                                  <Box sx={{ display: "flex", gap: 1.1, alignItems: "center", color: "hsl(var(--text-muted))", fontSize: "0.85rem" }}>
                                    <Typography sx={{ fontSize: "0.85rem" }}>{sourceLabel(item.source_a)} vs {sourceLabel(item.source_b)}</Typography>
                                    <Chip label={scorePercent(item.overall_alignment)} size="small" sx={{ bgcolor: historyTone.bg, color: historyTone.fg, fontWeight: 600, height: 22 }} />
                                    <Typography sx={{ fontSize: "0.85rem" }}>{formatDate(item.created_at)}</Typography>
                                  </Box>
                                </Box>
                                <ExpandMoreIcon sx={{ color: "hsl(var(--text-muted))", transform: openHistoryId === item.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }} />
                              </Box>
                            </Paper>
                          );
                        })()}
                        {openHistoryId === item.id && historyReports[item.id] ? (
                          <Box sx={{ mt: 0.9 }}>
                            {renderReport(historyReports[item.id], historyExpanded[item.id] || false, (next) =>
                              setHistoryExpanded((prev) => ({ ...prev, [item.id]: next }))
                            )}
                          </Box>
                        ) : null}
                      </Box>
                    ))}
                  </Box>
                ))}
                {history.length === 0 ? (
                  <Paper sx={{ p: 1.2, borderRadius: 1.2 }}>
                    <Typography sx={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem" }}>Ende nuk ka krahasime.</Typography>
                  </Paper>
                ) : null}
              </Box>
            )}
          </Box>
        </DashboardLayout>
      </Box>
    </Box>
  );
}
