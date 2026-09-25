# ImmoHitz Website-Relaunch — Design

Datum: 2026-09-25
Status: zur Freigabe

## Kontext

ImmoHitz GmbH (Jeremias & Tamara Hitz, Urtenen-Schönbühl) betreibt die
Website immohitz.ch. Jeremias hat keine Zeit, die Seite zu pflegen; Stefan
(sein Vater) übernimmt diese Aufgabe. Stefan hat bereits eine vergleichbare
Website für Anette Hitz-Miehe gebaut (`WebSiteAnette`, live als
anttenitz.ch) und möchte den gleichen bewährten Ansatz für immohitz.ch
anwenden.

## Ist-Zustand (Analyse)

- immohitz.ch läuft aktuell auf **Hostpoints eigenem Homepage-Baukasten**
  (cm4all/beng-Technologie, browserbasierter Editor) — nicht auf einer
  selbstgebauten statischen Seite und nicht mehr auf Jimdo (anders als bei
  Anette vor dem Relaunch).
- 4 Seiten: Startseite, Über uns, Team, Kontakt.
- Inhalte: Firma als "familiengeführtes Unternehmen", drei
  Dienstleistungen (Immobilienbewirtschaftung/Mietliegenschaften/STOWE,
  Immobilienbewertung, Immobilienvermarktung). Team: Tamara Hitz
  (Inhaberin/Administration) und Jeremias Hitz (Inhaber/eidg. dipl.
  Immobilientreuhänder), mit je eigener Telefonnummer/E-Mail.
- Kontaktformular vorhanden (Vorname, Nachname, E-Mail, Telefon,
  Nachricht), keine erkennbare Backend-Anbindung geprüft.
- Keine Immobilien-Angebotsliste, keine Öffnungszeiten, keine
  Social-Media-Links.
- **Es fehlen Impressum und Datenschutzerklärung komplett** — rechtliche
  Lücke, die beim Relaunch geschlossen werden soll.
- Design wirkt generisch (Baukasten-Vorlage), kein Copyright-Jahr
  sichtbar.

## Ziel

Ablösung der Baukasten-Seite durch eine selbstgebaute statische Website
nach dem bewährten Muster von `WebSiteAnette`, die Stefan eigenständig
pflegen und per SFTP zu Hostpoint deployen kann — inklusive einer neuen
Seite für aktuelle Immobilienangebote und der fehlenden Rechtsseiten.

## Architektur

Gleicher Ansatz wie `WebSiteAnette`:

- Statisches HTML/CSS/JS, kein Framework, kein Build-Step.
- Gemeinsame Kopf-/Fusszeile über `partials/header.html` /
  `partials/footer.html`, eingebunden via `js/include.js`.
- Self-gehostete Web-Fonts (kein Google-Fonts-Ladeaufruf).
- Tests mit Node's eingebautem Test-Runner (`node --test`) für
  Kernlogik (z.B. Angebots-Filterung, Formular-Validierung).
- Deployment per SFTP zu Hostpoint; die Domain wird dabei vom
  Homepage-Baukasten auf ein klassisches Hosting-Paket mit eigenem
  Dateisystem umgehängt (analog zur damaligen Ablösung der
  Jimdo-Weiterleitung bei Anette).

## Seitenstruktur

| Seite | Inhalt |
|---|---|
| `index.html` | Hero mit Logo/Claim, Kurzvorstellung der 3 Dienstleistungen, Teaser auf aktuelle Angebote, Team-Teaser |
| `ueber-uns.html` | Firmentext, Dienstleistungen im Detail |
| `team.html` | Tamara & Jeremias Hitz mit Rolle, Foto, Kontaktdaten |
| `angebote.html` | Liste aktueller Immobilienangebote (neu) |
| `kontakt.html` | Adresse, Telefon, E-Mail, Kontaktformular |
| `impressum.html` | Neu, rechtlich nötig |
| `datenschutz.html` | Neu, rechtlich nötig |

## Datenmodell Immobilienangebote

Analog zu `data/images.json` bei Anette: `data/listings.json` mit einem
Objekt pro Angebot. Felder: Titel, Ort, Preis, Zimmer, Fläche (m²),
Bild(er), Typ (Kauf/Miete), Status (aktiv/verkauft/vermietet),
Beschreibung. Pflege erfolgt durch direktes Editieren der JSON-Datei,
kein Admin-Interface.

## Design & Assets

- Bestehendes Logo wird übernommen (Download von der aktuellen Seite).
- Neue, seriöse Farbpalette passend zum Logo (aktuell keine erkennbare
  Markenfarbe, nur Baukasten-Grau/Weiss) — z.B. Anthrazit/Blau als
  Basis mit einer Akzentfarbe.
- Neues, seriöses Web-Font-Paar (nicht das verspielte Fredoka/Nunito von
  Anettes Seite), self-hosted.
- Teamfoto und Angebotsbilder müssen von Jeremias zugeliefert werden.

## Kontaktformular

Echtes Formular (Vorname, Nachname, E-Mail, Telefon, Nachricht) über
einen Formular-Dienst (Formspree), der die Zustellung per E-Mail ohne
eigenes Server-Backend übernimmt.

## Offene Punkte (TODOs, blockieren den Start nicht)

- Zugang zu Hostpoint-Konto/SFTP-Zugangsdaten für immohitz.ch.
- Formspree-Zieladresse fürs Kontaktformular.
- Bildmaterial und Texte für Team & aktuelle Immobilienangebote.

## Out of Scope

- Kein CMS, kein Admin-Backend für Nicht-Techniker.
- Keine Mehrsprachigkeit (nur Deutsch, wie bisher).
- Keine Online-Buchung/Terminvereinbarung.

## Erfolgskriterien

- Alle Seiten laden korrekt, mobile und desktop.
- Kontaktformular versendet E-Mails zuverlässig.
- Impressum und Datenschutzerklärung vorhanden und rechtlich
  ausreichend.
- Angebote lassen sich durch einfaches Bearbeiten von
  `data/listings.json` aktualisieren, ohne Code-Kenntnisse über das
  JSON-Format hinaus.
