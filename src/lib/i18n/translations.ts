export type Language = "en" | "sq";

export const LANGUAGES: Array<{ id: Language; label: string }> = [
  { id: "en", label: "English" },
  { id: "sq", label: "Shqip" },
];

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "app_language";

const en = {
  // Navigation / layout
  legalAssistant: "Legal Assistant",
  euLaw: "EU Law",
  albanianLaw: "Albanian Law",
  language: "Language",

  // Sidebar
  startNewChat: "Start a new chat",
  history: "History",
  noChatsYet: "No chats yet",
  newChat: "New chat",
  deleteChat: "Delete chat",

  // Chat
  composerPlaceholder: "Type your question...",
  generatingResponse: "Generating response...",
  gatheringSources: "Gathering legal sources and reasoning steps...",
  lastMessageFailed: "Last message failed.",
  tryAgain: "Try again",

  // Prompt suggestions
  promptHeadingEu: "Ask about EU law",
  promptSubheadingEu: "Get answers with references to treaties and specific articles",
  promptHeadingAl: "Ask about Albanian legislation",
  promptSubheadingAl: "Get answers with references to EU law and the harmonisation context",

  // Message bubble
  reasoningSteps: "Reasoning steps",
  sourcesUsed: "Sources used",
  filtersApplied: "Filters applied",
  dataLinks: "Data links",
  otherSteps: "Other steps",
  hideSources: "Hide sources & details",
  showSources: "Show sources & legal details",
  openSource: "Open source",
  openInExplorer: "Open in Explorer",
  loadingContent: "Loading content...",
  noSourceDetail: "No detailed content available for this source.",

  // Reasoning fallback steps
  stepClassify: "Classifying the question and determining the legal context",
  stepSearch: "Searching for relevant fragments in the source base",
  stepEvaluate: "Evaluating the {count} most relevant sources",
  stepRetrieval: "The answer was built from the retrieved fragments (retrieval)",
  stepSynthesis: "Synthesising the answer within the limits of the evidence",

  // Errors
  errGeneric: "Something went wrong while processing the request. Please try again.",
  errNetwork: "A network problem was detected. Please check your connection and try again.",
  errTimeout: "The request is taking longer than expected. Please try again.",
  errAuth: "Authentication failed. Please sign in again.",
  errRateLimit: "There are too many requests right now. Please wait a moment and try again.",
  errUnavailable: "The service is temporarily unavailable. Please try again shortly.",
  errBadRequest: "The request could not be completed. Please check your input and try again.",
  errRequestFailed: "The request failed. Please try again.",
  errAssistant: "Failed to get a response from the assistant.",
} as const;

export type TranslationKey = keyof typeof en;

const sq: Record<TranslationKey, string> = {
  legalAssistant: "Asistenti Ligjor",
  euLaw: "Ligji i BE-së",
  albanianLaw: "Ligji Shqiptar",
  language: "Gjuha",

  startNewChat: "Bëj një pyetje të re",
  history: "Historiku",
  noChatsYet: "Ende nuk ka biseda",
  newChat: "Bisedë e re",
  deleteChat: "Fshi bisedën",

  composerPlaceholder: "Shkruani pyetjen tuaj...",
  generatingResponse: "Po gjenerohet përgjigjja...",
  gatheringSources: "Po merren burimet ligjore dhe hapat e arsyetimit...",
  lastMessageFailed: "Mesazhi i fundit dështoi.",
  tryAgain: "Provo përsëri",

  promptHeadingEu: "Pyet për Ligjin e BE-së",
  promptSubheadingEu: "Merr përgjigje me referenca nga traktatet dhe nenet specifike",
  promptHeadingAl: "Pyet mbi Legjislacionin Shqiptar",
  promptSubheadingAl: "Merr përgjigje në shqip me referenca nga ligji i BE-së dhe konteksti i harmonizimit",

  reasoningSteps: "Hapat e arsyetimit",
  sourcesUsed: "Burimet e përdorura",
  filtersApplied: "Filtrat që po aplikohen",
  dataLinks: "Lidhjet e të dhënave",
  otherSteps: "Hapa të tjerë",
  hideSources: "Fshih Burimet & Detajet",
  showSources: "Shfaq Burimet & Detajet Ligjore",
  openSource: "Hap burimin",
  openInExplorer: "Hap në Explorer",
  loadingContent: "Po ngarkohet përmbajtja...",
  noSourceDetail: "Nuk ka përmbajtje të detajuar për këtë burim.",

  stepClassify: "Klasifikimi i pyetjes dhe përcaktimi i kontekstit ligjor",
  stepSearch: "Kërkimi i fragmenteve relevante në bazën e burimeve",
  stepEvaluate: "Vlerësimi i {count} burimeve më relevante",
  stepRetrieval: "Përgjigjja u ndërtua mbi fragmentet e rikuperuara (retrieval)",
  stepSynthesis: "Sinteza e përgjigjes duke respektuar kufizimet e evidencës",

  errGeneric: "Ndodhi një gabim gjatë përpunimit të kërkesës. Ju lutem provoni përsëri.",
  errNetwork: "U zbulua problem me rrjetin. Ju lutem kontrolloni lidhjen dhe provoni përsëri.",
  errTimeout: "Kërkesa po zgjat më shumë se sa pritej. Ju lutem provoni përsëri.",
  errAuth: "Autentikimi dështoi. Ju lutem hyni përsëri.",
  errRateLimit: "Ka shumë kërkesa për momentin. Ju lutem prisni pak dhe provoni përsëri.",
  errUnavailable: "Shërbimi është përkohësisht i padisponueshëm. Ju lutem provoni pas pak.",
  errBadRequest: "Kërkesa nuk mund të plotësohej. Ju lutem verifikoni inputin dhe provoni përsëri.",
  errRequestFailed: "Kërkesa dështoi. Ju lutem provoni përsëri.",
  errAssistant: "Dështoi marrja e përgjigjes nga asistenti.",
};

export const TRANSLATIONS: Record<Language, Record<TranslationKey, string>> = { en, sq };

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "sq";
}
