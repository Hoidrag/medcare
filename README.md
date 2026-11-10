# MedCare

Interfață demonstrativă pentru o aplicație de informatică biomedicală. Include
autentificare și un dashboard de previzualizare cu date fictive; autentificarea
și datele reale vor necesita un backend.

## Rulare locală

```sh
npm install
npm run dev
```

Verificări disponibile:

```sh
npm run build
npm run lint
```

## Structura proiectului

```text
src/
  components/
    auth/                 Formular și opțiuni de autentificare
    dashboard/
      widgets/            Indicatori, grafice, echipă și programări
    BrandLogo.tsx         Logo MedCare reutilizabil
    WelcomePanel.tsx      Panoul de prezentare
  styles/
    auth-page.css          Stilurile paginii de autentificare
    dashboard.css          Stilurile dashboardului responsive
  types/
    auth.ts                Tipuri pentru autentificare
  App.tsx                  Navigare și compunerea paginilor
  index.css                Reguli și stiluri globale
  main.tsx                 Inițializarea aplicației React
public/
  favicon.svg              Favicon MedCare
```
