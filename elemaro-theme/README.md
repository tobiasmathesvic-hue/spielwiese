# Elemaro Theme

Minimalistische Landingpage für „Elemaro“ (Websites für kleine Unternehmen, Praxen, Handwerk, Vereine).
Reines HTML/CSS/JS ohne Build-Schritt und ohne externe Abhängigkeiten. Schriften liegen lokal vor.

## Dateien

| Datei | Zweck | Installation | Update |
|---|---|---|---|
| `index.html` | Landingpage (alle Module) | ja | ja |
| `impressum.html`, `datenschutz.html` | Unterseiten mit **Platzhaltertexten** | ja | nur bei Layout-Änderungen |
| `seite.html` | Vorlage für weitere Unterseiten | ja | optional |
| `assets/css/elemaro.css` | gesamtes Design | ja | ja |
| `assets/js/elemaro.js` | Menü, Kartenstapel, Preiskarte, Formular | ja | ja |
| `assets/fonts/*.woff2` + `OFL-*.txt` | Manrope, DM Sans, Instrument Serif (SIL OFL, Latin) | ja | nein |
| `assets/favicon.svg` | Favicon | ja | nein |

Statisch einsetzen: Ordner auf den Webspace kopieren, fertig. Beim Update genügen `elemaro.css`, `elemaro.js`
und `index.html`; eigene Texte vorher sichern.

## Formular (Demomodus)

`<form data-endpoint="">` ist leer, daher läuft das Formular im **Demomodus**: Es erscheint die Markierung
„Demo-Formular · es wird nichts gesendet“, und beim Absenden wird ausdrücklich gemeldet, dass nichts gesendet wurde.
Für echten Versand `data-endpoint="https://…"` setzen (POST mit FormData, Erfolg nur bei HTTP 2xx).
Die Datenschutz-Checkbox ist Pflicht. Ein Captcha ist **nicht** enthalten – beim Anbinden eines Backends bzw.
CMS-Kontaktformulars dessen Versand, Datenschutzprüfung und Captcha verwenden; die CSS-Klassen `.field`, `.input`,
`.select`, `.textarea`, `.check` lassen sich auf CMS-Felder übertragen.

## Anpassen

- Farben/Abstände: Variablen am Anfang von `elemaro.css` (`--bg`, `--ink`, `--lime`, `--lilac`, …).
- Website-Name/Logo: `.logo` in Header und Footer. Ein `<img>` ersetzt den Text-Schriftzug.
- Adminleiste eines CMS: `--admin-h` setzen (oder Klasse `admin-bar` am `body`); fixierter Header und Sticky-Bereiche berücksichtigen sie.
- Beispielvorlagen: je ein `<li class="tpl">` im Modul `preview-stack`.

## CMS-Integration

Ein Elemaro-CMS wurde nicht bereitgestellt, daher gibt es **keine** CMS-spezifischen Dateien. Das Theme ist vorbereitet:

- Jede Sektion ist ein Modul (`data-module="header|hero|preview-stack|benefits|process|pricing|faq|contact-form|footer"`).
- Jede Animation initialisiert sich pro Modul über `querySelectorAll`; Module dürfen dupliziert, ausgeblendet oder
  umsortiert werden. Die Logik nutzt keine festen IDs (IDs gibt es nur für Abschnittsanker und Formularfelder).
- Texte, Preise, Buttons und Links stehen als normales Markup in den Modulen und sind direkt bearbeitbar.
- Die FAQ-Antwort liegt in genau einem `.faq-item__a`-Block; nur dieser trägt die lila Linie, zusätzliche Absätze bekommen keine.
- Sobald das CMS vorliegt: Modul-Markup als Theme-Module/Felder registrieren und die Landingpage als Editor-Vorlage
  hinterlegen, ohne bestehende Seiten oder Einstellungen zu überschreiben.

## Verhalten

- Branchenvorschauen: scrollgekoppelter Kartenstapel (vorwärts/rückwärts). Er schaltet sich nur ein, wenn Bühne und Text
  komplett in den Viewport passen; sonst (kurze Bildschirme, Querformat, `prefers-reduced-motion`, kein JS) erscheinen die
  Beispiele als normale, vollständig lesbare Liste.
- Preiskarte: schrumpft von `documentElement.clientWidth` (ohne Scrollbalken) auf Inhaltsbreite, ohne zusätzlichen Scrollweg.
- Formularkarte klappt beim Annähern auf; bei Tastaturfokus oder Sprung per `#anfrage` sofort ohne Animation.
- Mobiles Menü: Vollbild; Symbol, Escape oder Link schließen; Fokus bleibt im Menü; Hintergrund-Scrollen gesperrt.
