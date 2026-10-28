"use client";

import { Box, Button, Paper, Typography } from "@mui/material";

interface PromptGroup {
  title: string;
  prompts: Array<{
    label: string;
    fullQuestion: string;
  }>;
}

interface PromptSuggestionGridProps {
  onPromptClick: (prompt: string) => void;
  selectedLawLabel?: string;
}

const EU_PROMPT_GROUPS: PromptGroup[] = [
  {
    title: "GJETJE FAKTESH",
    prompts: [
      { label: "Gjoba maksimale GDPR", fullQuestion: "Cila eshte gjoba maksimale sipas GDPR per shkelje serioze?" },
      { label: "Bazat ligjore GDPR", fullQuestion: "Cilat jane bazat ligjore per perpunimin e te dhenave personale sipas nenit 6 te GDPR?" },
      { label: "Afati i Aktit te IA", fullQuestion: "Kur behet i zbatueshem Akti i IA i BE-se dhe cilat jane afatet kryesore te pajtueshmerise?" },
      {
        label: "Procedurat e shkeljes",
        fullQuestion: "Si funksionon procedura e shkeljes se BE-se ndaj shteteve anetare, hap pas hapi?",
      },
    ],
  },
  {
    title: "ARSYETIM NDER-DOKUMENTESH",
    prompts: [
      { label: "NIS2 dhe GDPR", fullQuestion: "Si nderveprojne detyrimet e NIS2 me kerkesat e GDPR per reagimin ndaj incidenteve?" },
      {
        label: "Akti i IA dhe pajisjet mjekesore",
        fullQuestion: "Si zbatohet Akti i IA per sistemet e IA te perdorura ne pajisje mjekesore sipas te drejtes se BE-se?",
      },
      {
        label: "DSA dhe e-Commerce",
        fullQuestion: "Cilat jane dallimet kryesore midis Aktit te Sherbimeve Dixhitale dhe Direktives se e-Commerce?",
      },
    ],
  },
  {
    title: "SAKTESI KOHORE",
    prompts: [
      {
        label: "GDPR kundrejt Direktives 95/46",
        fullQuestion: "Cfare ndryshoi kur GDPR zevendesoi Direktiven 95/46/EC dhe cilat detyrime u bene me te rrepta?",
      },
      {
        label: "Hyrja ne fuqi e Aktit te IA",
        fullQuestion: "Ne cilen date hyri ne fuqi Akti i IA dhe prej kur zbatohen dispozitat kryesore?",
      },
      {
        label: "Dispozitat kalimtare te IA",
        fullQuestion: "Cilat jane dispozitat kalimtare te Aktit te IA dhe si ndikojne ato ne sistemet ekzistuese te IA?",
      },
    ],
  },
  {
    title: "ARSYETIM HIERARKIK",
    prompts: [
      { label: "Lokalizimi i te dhenave", fullQuestion: "Kur lejohet ose kufizohet lokalizimi i te dhenave sipas te drejtes se BE-se?" },
      {
        label: "Rregullore kundrejt Direktive",
        fullQuestion: "Cili eshte dallimi juridik ne praktike midis nje Rregulloreje te BE-se dhe nje Direktive te BE-se?",
      },
    ],
  },
  {
    title: "RASTE KUFITARE DHE PERJASHTIME",
    prompts: [
      { label: "GDPR jashte BE-se", fullQuestion: "Kur zbatohet GDPR per kompani te vendosura jashte Bashkimit Europian?" },
      { label: "IA me rrezik te larte", fullQuestion: "Si i percakton Akti i IA sistemet me rrezik te larte dhe cilat detyrime zbatohen?" },
      {
        label: "Vendime te automatizuara",
        fullQuestion: "Cilat te drejta kane individet sipas GDPR lidhur me vendimmarrjen e automatizuar dhe profilizimin?",
      },
    ],
  },
];

const ALBANIAN_PROMPT_GROUPS: PromptGroup[] = [
  {
    title: "MBROJTJA E TE DHENAVE",
    prompts: [
      { label: "Bazat ligjore te GDPR", fullQuestion: "Cilat jane bazat ligjore per perpunimin e te dhenave personale sipas GDPR?" },
      { label: "Te drejtat e subjektit", fullQuestion: "Cilat jane te drejtat kryesore te subjektit te te dhenave sipas GDPR?" },
      { label: "Detyrimet e kontrolluesit", fullQuestion: "Cilat jane detyrimet kryesore te kontrolluesit sipas GDPR?" },
    ],
  },
  {
    title: "INTELIGJENCA ARTIFICIALE",
    prompts: [
      { label: "Qellimi i AI Act", fullQuestion: "Cili eshte qellimi i Rregullores se BE-se per Inteligjencen Artificiale (AI Act)?" },
      { label: "Sistemet me rrezik te larte", fullQuestion: "Si i percakton AI Act sistemet me rrezik te larte dhe cilat detyrime zbatohen?" },
      { label: "Praktikat e ndaluara", fullQuestion: "Cfare praktika te AI-se ndalohen sipas nenit 5 te AI Act?" },
    ],
  },
  {
    title: "SHERBIME DIXHITALE",
    prompts: [
      { label: "Detyrimet sipas DSA", fullQuestion: "Cilat jane detyrimet kryesore te platformave online sipas DSA?" },
      { label: "DSA dhe e-Commerce", fullQuestion: "Cilat jane dallimet kryesore midis DSA dhe Direktives se e-Commerce?" },
    ],
  },
  {
    title: "SIGURIA KIBERNETIKE",
    prompts: [
      { label: "NIS2 ne praktike", fullQuestion: "Cilat jane detyrimet kryesore sipas NIS2 per menaxhimin e riskut kibernetik?" },
      { label: "Raportimi i incidenteve", fullQuestion: "Cilat jane afatet e raportimit te incidenteve sipas NIS2?" },
    ],
  },
  {
    title: "HARMONIZIMI LIGJOR",
    prompts: [
      { label: "GDPR ne kontekst shqiptar", fullQuestion: "Si lidhen kerkesat e GDPR me kuadrin e mbrojtjes se te dhenave ne Shqiperi?" },
      { label: "AI Act dhe tregu shqiptar", fullQuestion: "Si mund te ndikoje AI Act ne kompanite shqiptare qe ofrojne sherbime ne tregun e BE-se?" },
    ],
  },
];

export function PromptSuggestionGrid({ onPromptClick, selectedLawLabel = "Ligji i BE-se" }: PromptSuggestionGridProps) {
  const isAlbanianLaw = selectedLawLabel === "Ligji Shqiptar";
  const promptGroups = isAlbanianLaw ? ALBANIAN_PROMPT_GROUPS : EU_PROMPT_GROUPS;
  const headingText =
    isAlbanianLaw
      ? "Pyet mbi Legjislacionin Shqiptar"
      : selectedLawLabel === "Ligji i BE-se"
        ? "Pyet per Ligjin e BE-se"
        : `Pyet per ${selectedLawLabel}`;
  const subheadingText = isAlbanianLaw
    ? "Merr pergjigje ne shqip me referenca nga ligji i BE-se dhe konteksti i harmonizimit"
    : "Merr pergjigje me referenca te traktateve dhe neneve specifike";

  return (
    <Box sx={{ width: "100%", maxWidth: 980, mx: "auto", pt: { xs: 2, sm: 4 } }}>
      <Typography sx={{ textAlign: "center", fontWeight: 600, fontSize: { xs: "1.1rem", sm: "1.35rem" } }}>
        {headingText}
      </Typography>
      <Typography sx={{ textAlign: "center", color: "hsl(var(--text-muted))", mt: 0.4, mb: 2.8, fontSize: "0.92rem" }}>
        {subheadingText}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.4 }}>
        {promptGroups.map((group) => (
          <Paper
            key={group.title}
            sx={{
              px: 1.3,
              pt: 1.45,
              pb: 1.2,
              minHeight: 222,
              borderRadius: 1.5,
              bgcolor: "hsl(var(--surface-muted))",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.66rem",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                color: "hsl(var(--text-muted))",
                fontWeight: 700,
                pl: 1,
                pt: 0.5,
                mb: 1.05,
                lineHeight: 1.2,
              }}
            >
              {group.title}
            </Typography>
            <Box sx={{ display: "grid", gap: 0.8 }}>
              {group.prompts.map((prompt) => (
                <Button
                  key={prompt.label}
                  onClick={() => onPromptClick(prompt.fullQuestion)}
                  variant="outlined"
                  sx={{
                    justifyContent: "flex-start",
                    borderRadius: 1,
                    py: 0.75,
                    px: 1.1,
                    fontSize: "0.82rem",
                    color: "hsl(var(--text-primary))",
                    borderColor: "hsl(var(--border-soft))",
                    bgcolor: "hsl(var(--surface))",
                    "&:hover": {
                      borderColor: "hsl(var(--text-muted))",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {prompt.label}
                </Button>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
