# Deployment-Checkliste

## Vor dem Upload

- [ ] `node --test tests/*.test.js && bash tests/process-images.test.sh` läuft fehlerfrei durch
- [ ] Lokaler Test (`python3 -m http.server 8000`) zeigt alle 7 Seiten korrekt
- [ ] Mobile-Ansicht (< 720px) geprüft: Hamburger-Menü funktioniert auf jeder Seite
- [ ] Echte Formspree-Formular-ID erstellt (auf formspree.io) und in `kontakt.html` eingetragen (nicht mehr `REPLACE-WITH-YOUR-FORM-ID`), danach eine echte Testanfrage über das Live-Formular verschickt und die Zustellung per E-Mail geprüft
- [ ] UID/Handelsregisternummer in `impressum.html` ergänzt (nicht mehr `[vor Live-Schaltung ergänzen]`)
- [x] Echte Team-Fotos eingefügt (von immohitz.ch übernommen, mit `scripts/process-images.sh` aufbereitet)
- [ ] Aktuelle Immobilienangebote in `data/listings.json` eingetragen, sobald welche vorliegen (siehe Feldschema in der Spec); bis dahin bleibt die Datei bewusst `[]`

## Upload per SFTP

1. Hostpoint Control Panel → SFTP-Zugangsdaten notieren (Host, Benutzername, Passwort/Key, Port meist 22)
2. Mit einem SFTP-Client (z. B. Cyberduck, FileZilla, oder `sftp` im Terminal) verbinden
3. Diese Dateien/Ordner ins Webroot-Verzeichnis hochladen (meist `htdocs` oder `www`):
   `*.html`, `css/`, `js/`, `data/`, `img/`, `fonts/`, `partials/`
4. **Nicht** hochladen: `.git/`, `.superpowers/`, `tests/`, `scripts/`, `docs/`, `package.json`, `DEPLOY.md`, `.gitignore` — das sind reine Entwicklungs-/Quelldateien
5. Im Hostpoint Control Panel die Domain vom Homepage-Baukasten auf das klassische Hosting-Paket mit Dateisystem umstellen (die Baukasten-Instanz muss deaktiviert bzw. die Domain neu zugeordnet werden)

## Nach dem Upload

- [ ] Website live unter immohitz.ch aufrufen, obige Checkliste auf dem echten Server wiederholen
- [ ] Auf einem echten Mobilgerät prüfen (Ladezeit, Darstellung, Menü)
- [ ] Testanfrage über das Kontaktformular auf der Live-Seite verschicken und die E-Mail-Zustellung bestätigen
