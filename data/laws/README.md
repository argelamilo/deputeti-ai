# Law texts for retrieval (RAG)

Put official law texts here and list them in `manifest.json`, then run `npm run laws:ingest`
(needs `DATABASE_URL`). Until at least one act is loaded the assistant simply keeps using web search.

1. Download the text of an act from an official site (EUR-Lex, qbz.gov.al, tatime.gov.al) and save it here as
   `.pdf` (with selectable text), `.txt`, `.md` or `.html`. For EU acts use the **current consolidated version**
   (EUR-Lex "Current consolidated version" link, CELEX starting with `0`), not the original `3...` text, which
   misses later amendments. The text should contain article headings such as `Article 97` or `Neni 97`,
   because passages are split per article.
2. Add an entry to `manifest.json`:

```json
[
  {
    "file": "vat-directive.html",
    "jurisdiction": "eu",
    "title": "Council Directive 2006/112/EC on the common system of value added tax",
    "ref": "32006L0112",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006L0112",
    "language": "en"
  },
  {
    "file": "tvsh.txt",
    "jurisdiction": "al",
    "title": "Ligji nr. 92/2014 Per tatimin mbi vleren e shtuar",
    "ref": "AL-92-2014",
    "url": "https://qbz.gov.al/",
    "language": "sq"
  }
]
```

`jurisdiction` is `eu` or `al`; `ref` must be unique per act (re-running replaces that act's passages).
Only load text from official sources, and re-run the script when a law is amended.

Check how a file splits before loading: `npm run laws:ingest -- --dry-run` (no database needed).
