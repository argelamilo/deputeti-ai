"use client";

import { Box, Button, Paper, Typography } from "@mui/material";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";

interface PromptGroup {
  title: string;
  prompts: Array<{
    label: string;
    fullQuestion: string;
  }>;
}

interface PromptSuggestionGridProps {
  onPromptClick: (prompt: string) => void;
  selectedLaw?: "eu_law" | "albanian";
}

const EU_PROMPT_GROUPS_SQ: PromptGroup[] = [
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

const ALBANIAN_PROMPT_GROUPS_SQ: PromptGroup[] = [
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

const EU_PROMPT_GROUPS_EN: PromptGroup[] = [
  {
    title: "FACT LOOKUP",
    prompts: [
      { label: "Maximum GDPR fine", fullQuestion: "What is the maximum fine under the GDPR for serious infringements?" },
      { label: "GDPR legal bases", fullQuestion: "What are the legal bases for processing personal data under Article 6 of the GDPR?" },
      { label: "AI Act timeline", fullQuestion: "When does the EU AI Act become applicable and what are the key compliance deadlines?" },
      {
        label: "Infringement procedure",
        fullQuestion: "How does the EU infringement procedure against member states work, step by step?",
      },
    ],
  },
  {
    title: "CROSS-DOCUMENT REASONING",
    prompts: [
      { label: "NIS2 and GDPR", fullQuestion: "How do the NIS2 obligations interact with the GDPR requirements for incident response?" },
      {
        label: "AI Act and medical devices",
        fullQuestion: "How does the AI Act apply to AI systems used in medical devices under EU law?",
      },
      {
        label: "DSA and e-Commerce",
        fullQuestion: "What are the main differences between the Digital Services Act and the e-Commerce Directive?",
      },
    ],
  },
  {
    title: "TEMPORAL ACCURACY",
    prompts: [
      {
        label: "GDPR vs Directive 95/46",
        fullQuestion: "What changed when the GDPR replaced Directive 95/46/EC, and which obligations became stricter?",
      },
      {
        label: "AI Act entry into force",
        fullQuestion: "On what date did the AI Act enter into force, and from when do its main provisions apply?",
      },
      {
        label: "AI Act transitional provisions",
        fullQuestion: "What are the transitional provisions of the AI Act and how do they affect existing AI systems?",
      },
    ],
  },
  {
    title: "HIERARCHICAL REASONING",
    prompts: [
      { label: "Data localisation", fullQuestion: "When are data localisation requirements allowed or restricted under EU law?" },
      {
        label: "Regulation vs Directive",
        fullQuestion: "What is the practical legal difference between an EU Regulation and an EU Directive?",
      },
    ],
  },
  {
    title: "EDGE CASES AND EXCEPTIONS",
    prompts: [
      { label: "GDPR outside the EU", fullQuestion: "When does the GDPR apply to companies established outside the European Union?" },
      { label: "High-risk AI", fullQuestion: "How does the AI Act define high-risk AI systems and which obligations apply?" },
      {
        label: "Automated decisions",
        fullQuestion: "What rights do individuals have under the GDPR regarding automated decision-making and profiling?",
      },
    ],
  },
];

const ALBANIAN_PROMPT_GROUPS_EN: PromptGroup[] = [
  {
    title: "DATA PROTECTION",
    prompts: [
      { label: "GDPR legal bases", fullQuestion: "What are the legal bases for processing personal data under the GDPR?" },
      { label: "Data subject rights", fullQuestion: "What are the main rights of the data subject under the GDPR?" },
      { label: "Controller obligations", fullQuestion: "What are the main obligations of the controller under the GDPR?" },
    ],
  },
  {
    title: "ARTIFICIAL INTELLIGENCE",
    prompts: [
      { label: "Purpose of the AI Act", fullQuestion: "What is the purpose of the EU Artificial Intelligence Act (AI Act)?" },
      { label: "High-risk systems", fullQuestion: "How does the AI Act define high-risk systems and which obligations apply?" },
      { label: "Prohibited practices", fullQuestion: "Which AI practices are prohibited under Article 5 of the AI Act?" },
    ],
  },
  {
    title: "DIGITAL SERVICES",
    prompts: [
      { label: "DSA obligations", fullQuestion: "What are the main obligations of online platforms under the DSA?" },
      { label: "DSA and e-Commerce", fullQuestion: "What are the main differences between the DSA and the e-Commerce Directive?" },
    ],
  },
  {
    title: "CYBERSECURITY",
    prompts: [
      { label: "NIS2 in practice", fullQuestion: "What are the main obligations under NIS2 for cybersecurity risk management?" },
      { label: "Incident reporting", fullQuestion: "What are the incident reporting deadlines under NIS2?" },
    ],
  },
  {
    title: "LEGAL HARMONISATION",
    prompts: [
      { label: "GDPR in the Albanian context", fullQuestion: "How do the GDPR requirements relate to the data protection framework in Albania?" },
      { label: "AI Act and the Albanian market", fullQuestion: "How could the AI Act affect Albanian companies that offer services in the EU market?" },
    ],
  },
];

const PROMPT_GROUPS: Record<Language, Record<"eu_law" | "albanian", PromptGroup[]>> = {
  en: { eu_law: EU_PROMPT_GROUPS_EN, albanian: ALBANIAN_PROMPT_GROUPS_EN },
  sq: { eu_law: EU_PROMPT_GROUPS_SQ, albanian: ALBANIAN_PROMPT_GROUPS_SQ },
};

export function PromptSuggestionGrid({ onPromptClick, selectedLaw = "eu_law" }: PromptSuggestionGridProps) {
  const { lang, t } = useLanguage();
  const isAlbanianLaw = selectedLaw === "albanian";
  const promptGroups = PROMPT_GROUPS[lang][selectedLaw];
  const headingText = isAlbanianLaw ? t("promptHeadingAl") : t("promptHeadingEu");
  const subheadingText = isAlbanianLaw ? t("promptSubheadingAl") : t("promptSubheadingEu");

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
