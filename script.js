/* =====================================================================
   Synq. – Verstaubare Studiokammer · script.js
   Reines JavaScript, kein Framework, kein Build-Schritt.
   Alle Inhalte stammen aus dem Diplomarbeitsantrag (3R IT 27 06).
   Farben werden NUR aus den CSS-Variablen in style.css (:root) gelesen.
   ===================================================================== */
(() => {
'use strict';

/* ---------------------------------------------------------------------
   0. Hilfsfunktionen
   --------------------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
let reduce = mqReduce.matches;
mqReduce.addEventListener?.('change', e => { reduce = e.matches; });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

/* CSS-Variable → [r,g,b] (funktioniert mit jedem gültigen CSS-Farbwert) */
const probe = document.createElement('canvas').getContext('2d');
function cssColor(name) {
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  probe.fillStyle = '#000'; probe.fillStyle = v || '#000';
  const s = probe.fillStyle;
  if (s[0] === '#') return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  return (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
}
const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
let P = {};
function readPalette() {
  P = {
    bg: cssColor('--bg'), card: cssColor('--card'), line: cssColor('--line'), text: cssColor('--text'),
    muted: cssColor('--muted'), a1: cssColor('--accent-1'), a2: cssColor('--accent-2'),
    ok: cssColor('--ok'), warn: cssColor('--warn'), high: cssColor('--high')
  };
}
readPalette();

/* ---------------------------------------------------------------------
   1. DATEN (1:1 aus dem Antrag)
   --------------------------------------------------------------------- */
const PEOPLE = {
  ZHE: { first: 'Kevin', last: 'Zheng', role: 'Projektleiter / Product Owner', fn: 'PL / PO', av: '--av-zhe', mentor: 'NUS',
    focus: 'Projektleitung, 3D-Modellierung, VR/AR und technische Dokumentation.',
    focusMore: 'Der Schwerpunkt liegt auf der digitalen Planung, der Auswahl der Bauversion und der strukturierten Gesamtdokumentation.',
    H: [['H3', '3. 3D-Modellierung, Baupläne und VR-Walkthrough'], ['H4', '4e. Durchführung und Dokumentation von Testaufnahmen'], ['H6', '6d. Prüfung und Finalisierung der Gesamtdokumentation']],
    O: [['O1', '1. AR-Raumeinpassung'], ['O6', '6. Konzeptvarianten']] },
  SUB: { first: 'Naila', last: 'Subasic', role: 'Stellv. Projektleiterin / Scrum Master', fn: 'PL Stv. / SM', av: '--av-sub', mentor: 'NUS',
    focus: 'Konstruktion, Akustik, Elektrotechnik und Marketing.',
    focusMore: 'Der Schwerpunkt liegt auf der Planung und dem Aufbau der Kammer, der akustischen Ausführung, der technischen Umsetzung sowie der Präsentation des Projekts und der Suche nach Sponsoren und Kooperationspartnern.',
    H: [['H1', '1a. Festlegung der Anforderungen an die „Synq.“-Kammer'], ['H1', '1b. Entwicklung des grundlegenden Konstruktionskonzepts'], ['H1', '1c. Auswahl und Umsetzung der Verbindungstechnik'], ['H1', '1d. Konstruktion und platzsparende Lagerung'], ['H6', '6a. Technische Gesamtdokumentation'], ['H7', '7. Marketing, Social Media und Sponsorensuche']],
    O: [] },
  ZIM: { first: 'Angelika', last: 'Zimmermann', role: 'Projektmitarbeiterin', fn: 'PM', av: '--av-zim', mentor: 'FIN',
    focus: 'Akustik, Innenausbau, Audiointegration und Benutzeroberfläche.',
    focusMore: 'Der Schwerpunkt liegt auf der akustischen Arbeitsumgebung, den Audio-Komponenten und der nutzerfreundlichen Bedienung.',
    H: [['H4', '4b. Einrichtung der Produktionstemplates'], ['H4', '4c. Erstellung des Cubase-Aufnahmetemplates'], ['H4', '4d. Akustische Anpassung des Templates'], ['H5', '5. Elektrische Installation und Sensorik'], ['H6', '6c. Zusammenfassung der Messergebnisse und Tests']],
    O: [['O2', '2. Touchpanel-Steuerung']] },
  POP: { first: 'Maximilian', last: 'Popek', role: 'Projektmitarbeiter', fn: 'PM', av: '--av-pop', mentor: 'FIN',
    focus: 'Server, Netzwerk und Infrastruktur.',
    focusMore: 'Der Schwerpunkt liegt auf der zuverlässigen und sicheren Übertragung, Speicherung und Absicherung der Audioaufnahmen sowie auf automatisierten Infrastruktur-Diensten.',
    H: [['H1', '1e. Prüfung von Montage und Demontage'], ['H1', '1f. Kennzeichnung und Lagerung der Module'], ['H2', '2. Akustik und Schallschutz'], ['H4', '4a. Einrichtung der Aufnahmetechnik'], ['H6', '6b. Dokumentation der technischen Infrastruktur']],
    O: [['O3', '3. Automatisches Backup und Online-Monitoring'], ['O4', '4. Kommunikations- und Monitoringschnittstelle'], ['O5', '5. Schulinterner Sync-Server und Audioübertragung']] }
};
const PEOPLE_KEYS = ['ZHE', 'SUB', 'ZIM', 'POP'];
const MENTORS = {
  NUS: { name: 'Vincent Nussbaumer', role: 'Individuelle Betreuung (Hauptbetreuung)', av: '--av-nus', of: ['ZHE', 'SUB'] },
  FIN: { name: 'Andreas Fink', role: 'Individuelle Betreuung (Hauptbetreuung Stellv.)', av: '--av-fin', of: ['ZIM', 'POP'] }
};
const mail = k => `${PEOPLE[k].first}.${PEOPLE[k].last}@htl.rennweg.at`.toLowerCase();

/* Ziele – jedes Teilziel mit Zuständigkeit laut Kapitel 2.4 */
const S = '„Synq.“';
const GOALS = {
  h: [
    { id: 'H1', title: 'Konstruktion und platzsparende Lagerung',
      desc: `Die ${S}-Kammer ist vollständig aufgebaut und so ausgeführt, dass sie wiederholt, schnell und mit geringem Aufwand montiert, demontiert und anschließend platzsparend gelagert werden kann.`,
      subs: [
        ['a', `Die Anforderungen an Abmessungen, Aufbau, Materialien, Nutzung und Lagerung der ${S}-Kammer sind festgelegt.`, 'SUB'],
        ['b', 'Ein grundlegendes Konstruktionskonzept für Rahmen, Boden, Wände und Decke ist entwickelt.', 'SUB'],
        ['c', 'Eine geeignete Verbindungstechnik für den wiederholten Auf- und Abbau der Module ist ausgewählt und konstruktiv umgesetzt.', 'SUB'],
        ['d', 'Die Grundkonstruktion aus Rahmen, Boden, Wänden und Decke ist vollständig gefertigt und montiert.', 'SUB'],
        ['e', 'Ein vollständiger Montage- und Demontagezyklus wird durchgeführt und dokumentiert, um Funktion und Passgenauigkeit nach der erneuten Montage zu überprüfen.', 'POP'],
        ['f', 'Die zerlegten Module sind eindeutig gekennzeichnet und so organisiert, dass sie geordnet und platzsparend gelagert werden können.', 'POP']] },
    { id: 'H2', title: 'Akustik und Schallschutz',
      desc: `Die ${S}-Kammer reduziert störende Umgebungsgeräusche und schafft eine geeignete akustische Umgebung für Sprach- und Audioaufnahmen.`,
      subs: [
        ['a', 'Schalldämmende Materialien und geeignete akustische Bauteile werden ausgewählt und integriert, um die Schallübertragung sowohl von außen nach innen als auch von innen nach außen zu reduzieren.', 'POP'],
        ['b', 'Eine schulische Vergleichsmessung weist unter definierten Messbedingungen eine Schalldruckpegelreduktion von mindestens 20 dB nach. Dieser Wert wird als projektspezifischer Zielwert für eine deutlich wahrnehmbare Reduktion störender Umgebungsgeräusche festgelegt.', 'POP'],
        ['c', 'Absorber und der vorgesehene Mikrofonbereich sind so angeordnet, dass störende Schallreflexionen bei Aufnahmen reduziert werden.', 'POP'],
        ['d', 'Die für die Audioaufnahme relevanten akustischen Messergebnisse sind dokumentiert und stehen für die weitere Audio-Konfiguration zur Verfügung.', 'POP']] },
    { id: 'H3', title: '3D-Modellierung, Baupläne und VR-Walkthrough',
      desc: `Für die ${S}-Kammer liegt eine vollständig ausgearbeitete digitale Variante vor, die zur Visualisierung und technischen Darstellung des Projekts dient.`,
      subs: [
        ['a', 'Das Kammerkonzept ist digital ausgearbeitet und in einer geeigneten 3D-Software modelliert.', 'ZHE'],
        ['b', 'Maßstabsgerechte Baupläne mit Draufsicht, Schnitt- und Explosionsdarstellung sind erstellt.', 'ZHE'],
        ['c', 'Das Kammerkonzept ist in einer VR-/Walkthrough-Umgebung dargestellt und kann virtuell betrachtet werden.', 'ZHE']] },
    { id: 'H4', title: 'Audioaufnahme und Cubase-Template',
      desc: `Der Audioaufnahme-Workflow der ${S}-Kammer ist funktionsfähig und durch ein auf die Raumakustik abgestimmtes Cubase-Template unterstützt.`,
      subs: [
        ['a', 'Mikrofonierung, Audio-Interface und Kabelmanagement sind für den vorgesehenen Aufnahmebetrieb mit Fokus auf Sprachaufnahmen eingerichtet.', 'POP'],
        ['b', 'Geeignete Produktionstemplates für vorgesehene Aufnahmebetriebe sind eingerichtet.', 'ZIM'],
        ['c', 'Ein Cubase-Aufnahmetemplate ist erstellt und auf die gemessenen akustischen Eigenschaften der Kammer abgestimmt.', 'ZIM'],
        ['d', 'Das Template berücksichtigt die erforderliche Kompensation im Bass- und Höhenbereich sowie den Einfluss der eingesetzten Absorber.', 'ZIM'],
        ['e', 'Mehrere Testaufnahmen werden mit dem definierten Workflow durchgeführt und die Ergebnisse dokumentiert.', 'ZHE']] },
    { id: 'H5', title: 'Elektrische Installation und Sensorik',
      desc: `Die elektrische Ausstattung der ${S}-Kammer ist betriebsbereit, dokumentiert und technisch geprüft. Für die vorgesehenen Steuerungs- und Überwachungsfunktionen erforderliche Sensorik ist integriert und getestet.`,
      subs: [
        ['a', 'Die 230-V-Stromversorgung wird unter Unterstützung einer Lehrkraft aus dem Bereich Elektrotechnik geplant und umgesetzt und anschließend fachgerecht überprüft.', 'ZIM'],
        ['b', 'Beleuchtung und Lüftung sind integriert und auf ihre Funktionen geprüft.', 'ZIM'],
        ['c', 'Für die vorgesehenen Steuerungs- und Überwachungsfunktionen erforderliche Sensoren sind ausgewählt, integriert und getestet.', 'ZIM'],
        ['d', 'Die Steuerlogik für die vorgesehenen automatisierten Funktionen ist umgesetzt und dokumentiert.', 'ZIM'],
        ['e', 'Ein vollständiger Schaltplan ist erstellt und die elektrische Installation ist durch eine zuständige Lehrkraft überprüft.', 'ZIM']] },
    { id: 'H6', title: 'Technische Gesamtdokumentation',
      desc: `Die vollständige technische Dokumentation der ${S}-Kammer liegt als strukturierte PDF-Dokumentation vor und ermöglicht einen nachvollziehbaren Auf- und Abbau sowie den technischen Betrieb des Projektergebnisses.`,
      subs: [
        ['a', 'Eine Bauanleitung mit Stückliste sowie einer Beschreibung für Montage, Demontage und Lagerung liegt vor.', 'SUB'],
        ['b', 'Schaltpläne, Netzwerkaufbau und wesentliche Systemeinstellungen sind dokumentiert.', 'POP'],
        ['c', 'Ergebnisse der Akustikmessungen, Variantenbewertung und Funktionstests sind strukturiert zusammengefasst.', 'ZIM'],
        ['d', 'Die Gesamtdokumentation wurde zusammen mit den Betreuern geprüft und als vollständige PDF-Dokumentation finalisiert.', 'ZHE']] },
    { id: 'H7', title: 'Marketing, Social Media und Sponsorensuche',
      desc: `Die Entwicklung und das Ergebnis der ${S}-Kammer werden dokumentiert und über geeignete schulische und digitale Kanäle präsentiert. Zusätzlich werden bei Bedarf Sponsoren und Kooperationspartner für die Umsetzung des Projekts gesucht.`,
      subs: [
        ['a', `Ein einheitliches Erscheinungsbild für ${S} mit Logo, Farben und grundlegenden Gestaltungsvorgaben ist erstellt.`, 'SUB'],
        ['b', `Die Entwicklung und der Baufortschritt der ${S}-Kammer ist fotografisch und/oder videobasiert dokumentiert.`, 'SUB'],
        ['c', 'Geeignete Social-Media-Kanäle sind ausgewählt und für die Präsentation des Projekts genutzt.', 'SUB'],
        ['d', 'Inhalte zu Projektfortschritt, Konstruktion, technischen Funktionen und dem fertigen Projektergebnis sind erstellt und veröffentlicht.', 'SUB'],
        ['e', 'Potenzielle Sponsoren und Kooperationspartner sind recherchiert und strukturiert erfasst.', 'SUB'],
        ['f', 'Potenzielle Sponsoren und Kooperationspartner sind kontaktiert und die Ergebnisse der Kontaktaufnahme dokumentiert.', 'SUB'],
        ['g', 'Sponsoringkontakte sowie erhaltene Sach- oder Geldleistungen sind dokumentiert und in die Projektdokumentation aufgenommen.', 'SUB']] }
  ],
  o: [
    { id: 'O1', title: 'Virtuelle Raumdarstellung',
      desc: `Das 3D-Modell der ${S}-Kammer ist zur Visualisierung in unterschiedlichen Raumumgebungen eingesetzt.`,
      subs: [['a', 'Das 3D-Modell wird in mindestens zwei unterschiedlichen Raumumgebungen dargestellt und dokumentiert.', 'ZHE']] },
    { id: 'O2', title: 'Touchpanel-Steuerung',
      desc: `Ausgewählte Funktionen der ${S}-Kammer sind über ein zentrales Touchpanel bedienbar gemacht.`,
      subs: [
        ['a', 'Eine grafische Benutzeroberfläche für die Kammersteuerung ist entwickelt.', 'ZIM'],
        ['b', 'Beleuchtung und Lüftung können über das Touchpanel geschaltet werden.', 'ZIM'],
        ['c', 'Die Aufnahmefunktionen können über das Touchpanel zentral gestartet und gesteuert werden.', 'ZIM']] },
    { id: 'O3', title: 'Automatisches Backup und Online-Monitoring',
      desc: `Die Aufnahmen der ${S}-Kammer sind zusätzlich auf einem Backup-System gesichert und der Betriebsstatus wichtiger technischer Komponenten ist über eine Web-Oberfläche dargestellt.`,
      subs: [
        ['a', 'Ein automatisierter Backup-Prozess erkennt neue Aufnahmen und kopiert diese auf das Backup-System.', 'POP'],
        ['b', 'Die Integrität der gesicherten Aufnahmen wird überprüft.', 'POP'],
        ['c', 'Ein webbasiertes Monitoring zeigt relevante Statusinformationen wie Speicher-, Netzwerk- und Systemstatus an und wird im Schulnetzwerk getestet.', 'POP']] },
    { id: 'O4', title: 'Kommunikations- und Monitoringschnittstelle',
      desc: `Für die ${S}-Kammer ist eine technische Schnittstelle zur Kommunikation und Überwachung zwischen Innen- und Außenbereich entwickelt und umgesetzt.`,
      subs: [
        ['a', 'Eine Kamera- und Audioverbindung ermöglicht die visuelle und akustische Kommunikation zwischen Personen innerhalb und außerhalb der Kammer.', 'POP'],
        ['b', 'Möglichkeiten zur Anbindung an bestehende Aufnahme- und Produktionsumgebungen (z. B. Audiolabor) werden untersucht, dokumentiert und prototypisch getestet.', 'POP'],
        ['c', 'Ein Praxistest mit mindestens zwei Personen (eine Person in der Kammer, eine Person außerhalb) wurde erfolgreich durchgeführt und dokumentiert.', 'POP']] },
    { id: 'O5', title: 'Schulinterner Sync-Server und Audioübertragung',
      desc: `Die Audioaufnahmen der ${S}-Kammer werden automatisiert, sicher und strukturiert über das schulinterne Netzwerk an einen zentralen Server übertragen und dort gespeichert.`,
      subs: [
        ['a', 'Die Anforderungen an Audioübertragung, Netzwerkverbindung und benötigten Speicherplatz sind ermittelt.', 'POP'],
        ['b', 'Eine geeignete Netzwerk- und Übertragungstechnologie ist ausgewählt und eingerichtet.', 'POP'],
        ['c', 'Neue Audioaufnahmen werden automatisiert vom Aufnahmegerät auf den zentralen Server übertragen.', 'POP'],
        ['d', 'Zielsystem, Speicherstruktur sowie Benutzer- und Rechteverwaltung sind eingerichtet.', 'POP'],
        ['e', 'Fehlerbehandlung, Protokollierung und Absicherung der Datenübertragung sind umgesetzt.', 'POP'],
        ['f', 'Funktions-, Belastungs- und Ausfalltests sind durchgeführt und dokumentiert.', 'POP']] },
    { id: 'O6', title: 'Konzeptvarianten',
      desc: `Für die ${S}-Kammer werden mehrere alternative Konstruktionskonzepte entwickelt, visualisiert und miteinander verglichen, um die finale Bauversion gezielt auszuwählen und zu optimieren.`,
      subs: [
        ['a', 'Bis zu drei unterschiedliche Kammerkonzepte sind hinsichtlich Aufbaus, Lagerung, Platzbedarf und Umsetzbarkeit ausgearbeitet.', 'ZHE'],
        ['b', 'Die Konzepte sind in einer geeigneten 3D-Software modelliert und für eine anschauliche Präsentation aufbereitet.', 'ZHE'],
        ['c', 'Die Varianten sind Schülerinnen und Schülern des Schwerpunktes Multimedia vorgestellt und hinsichtlich Funktionalität, Design und Praxistauglichkeit bewertet.', 'ZHE'],
        ['d', 'Die Ergebnisse der Bewertung sind strukturiert erfasst und dokumentiert.', 'ZHE'],
        ['e', 'Vor- und Nachteile der einzelnen Varianten sind gegenübergestellt und analysiert.', 'ZHE'],
        ['f', 'Die Erkenntnisse aus dem Variantenvergleich sind für die Optimierung der finalen Bauversion herangezogen und dokumentiert.', 'ZHE']] }
  ],
  n: [
    { id: 'N1', title: 'Professionelle zertifizierte Schallmessung', desc: `Die akustische Bewertung der ${S}-Kammer erfolgt durch eine professionelle bzw. zertifizierte Schallmessung durch ein externes Fachunternehmen.` },
    { id: 'N2', title: 'Vollständiges Regiestudio', desc: 'Ein vollständig ausgestattetes Regiestudio mit professionellem Schnitt-PC, Regiepult und Multi-Kamera-Regie wird realisiert.' },
    { id: 'N3', title: 'Externe Cloud-Infrastruktur', desc: 'Die Datenverarbeitung und Speicherung erfolgt über externe Cloud-Dienste wie AWS, Azure oder externe Streaming-Plattformen.' },
    { id: 'N4', title: 'Dauerhafte Installation', desc: `Die ${S}-Kammer wird als fixe, dauerhaft installierte Konstruktion ausgeführt.` },
    { id: 'N5', title: 'Kommerzielle Serienproduktion', desc: `Die ${S}-Kammer wird als kommerziell produzierbares System entwickelt und für eine mögliche Serienproduktion ausgelegt.` }
  ]
};
const goalLabel = id => id[0] === 'H' ? `Ziel-H ${id.slice(1)}` : id[0] === 'O' ? `Ziel-O ${id.slice(1)}` : `Ziel-N ${id.slice(1)}`;

const STAKEHOLDERS = [
  { id: 'I-01', ext: false, name: 'Projektteam', desc: 'Arbeitet aktiv im Projekt und trägt die Umsetzung sowie die Abstimmung der Teilbereiche.', inf: 'hoch', att: 'positiv', meas: 'Klare Verantwortlichkeiten; regelmäßige Abstimmung; gemeinsame Tests.' },
  { id: 'I-02', ext: false, name: 'Projektbetreuung', desc: 'Prüft die technische Ausrichtung, gibt Feedback und unterstützt bei Planungs- und Umsetzungsproblemen.', inf: 'hoch', att: 'positiv', meas: 'Regelmäßige Reviews; Meilensteinfreigaben; Risiken früh melden.' },
  { id: 'E-01', ext: true, name: 'Sponsoren und Kooperationspartner', desc: 'Unterstützen das Projekt durch finanzielle Mittel oder Sachleistungen und können dadurch die Umsetzung einzelner Projektbereiche ermöglichen. Die Suche und Kontaktaufnahme kann zusätzlichen organisatorischen Aufwand verursachen.', inf: 'hoch', att: 'positiv', meas: 'Potenzielle Sponsoren frühzeitig recherchieren; Anfragen gezielt versenden; Rückmeldungen und zugesagte Leistungen dokumentieren.' },
  { id: 'E-02', ext: true, name: 'Schüler*innen und Lehrpersonen als Nutzer', desc: 'Nutzen die Kammer für Audioaufgaben, Schulprojekte und Maturaaufnahmen und geben Feedback zu Bedienung und Störungsfreiheit.', inf: 'mittel', att: 'positiv', meas: 'Frühe Praxistests; Feedback erfassen; Anforderungen vor der Endmontage prüfen.' }
];

const PSP = [
  { code: '1.1', name: 'Projektmanagement & Administration', wp: [['1.1.1', 'Diplomarbeitsantrag'], ['1.1.2', 'Product Backlog'], ['1.1.3', 'Projektwebsite']], ms: 'Projektmanagement-Setup abgeschlossen' },
  { code: '1.2', name: 'Design & Visualisierung', wp: [['1.2.1', 'Konzeptskizzen'], ['1.2.2', 'Maßstabgerechte Baupläne (PDF)'], ['1.2.3', 'Digitale 3D-Modelle'], ['1.2.4', 'VR-Walkthrough Umgebung']], ms: 'Design-Freeze & VR-Ready' },
  { code: '1.3', name: 'Hardware & Physische Kammer', wp: [['1.3.1', 'Grundkonstruktion (Rahmen & Wände)'], ['1.3.2', 'Akustik-Dämmsystem'], ['1.3.3', 'Elektrische Installation'], ['1.3.4', 'Innenausstattung & Möbel'], ['1.3.5', 'Sensorik- & Lüfter-Hardware']], ms: 'Physische Kammer betriebsbereit' },
  { code: '1.4', name: 'Marketing', wp: [['1.4.1', 'Corporate Design'], ['1.4.2', 'Social Media'], ['1.4.3', 'Sponsoringrecherche'], ['1.4.4', 'Sponsoringkonzept'], ['1.4.5', 'Sponsoren Kontaktaufnahme'], ['1.4.6', 'Sponsorenübersicht', true]], ms: 'IT-Systeme synchronisiert' },
  { code: '1.5', name: 'Projektabschluss & Dokumentation', wp: [['1.5.1', 'Vollständige Bauanleitung & Stückliste'], ['1.5.2', 'Schaltpläne & Netzwerkdokumentation'], ['1.5.3', 'VR-Bewertungsbericht'], ['1.5.4', 'Schallmess-Protokoll']], ms: 'Projekt final abgenommen' }
];

const RISKS = [
  { n: 1, t: 'Akustikziel wird nicht erreicht', d: 'Die angestrebte Schallreduktion bzw. die gewünschte störungsarme Aufnahmequalität wird im Schulbetrieb nicht erreicht.', p: 35, a: 60, w: 3, c: 150, m: 'Akustikkonzept früh testen; Absorberpositionen variieren; Messungen vor der Endmontage.' },
  { n: 2, t: 'Elektrische Integration verzögert sich', d: 'Material- oder Planungsprobleme verzögern die Integration von Stromversorgung, Licht, Lüftung und Sensorik.', p: 25, a: 80, w: 3, c: 100, m: 'Schaltplan und Materialliste früh prüfen; kritische Komponenten zuerst beschaffen.' },
  { n: 3, t: 'Material- oder Verbindungsteile fehlen', d: 'Benötigte Bau- oder Verbindungsteile sind nicht rechtzeitig verfügbar oder passen nicht wie geplant.', p: 45, a: 60, w: 3, c: 150, m: 'Standardteile bevorzugen; Ersatzkomponenten definieren; Bauproben durchführen.' },
  { n: 4, t: 'Netzwerk- oder Serverprobleme', d: 'Übertragung, Speicher oder Serverzugriff funktionieren im Schulnetz nicht zuverlässig.', p: 35, a: 55, w: 3, c: 80, m: 'Übertragung unabhängig testen; Fehlerprotokollierung und lokaler Zwischenspeicher vorsehen.' },
  { n: 5, t: 'Auf- und Abbau nicht nutzerfreundlich', d: 'Die zerlegte Kammer ist zu aufwendig zu montieren oder benötigt zu viele Einzelschritte.', p: 40, a: 70, w: 3, c: 100, m: 'Verbindungen vereinfachen; Module kennzeichnen; drei reale Auf-/Abbauzyklen durchführen.' },
  { n: 6, t: 'Zeit- oder Know-how-Engpass', d: 'Neue technische Themen führen zu Verzögerungen bei Konstruktion, Akustik, Netzwerk oder Integration.', p: 50, a: 75, w: 4, c: 0, m: 'Aufgaben früh in Teilpakete zerlegen; Wissen im Team teilen; kritische Themen früh klären.' },
  { n: 7, t: 'Anforderungen ändern sich nach Tests', d: 'Nutzerfeedback oder Testergebnisse führen zu Änderungen an Konstruktion, Bedienung oder Workflow.', p: 30, a: 45, w: 2, c: 0, m: 'Anforderungen vor der Endmontage abgleichen; Änderungsreserve einplanen.' }
].map(r => ({ ...r, rf: r.p * r.a, z: zoneOf(r.p, r.a) }));
function zoneOf(p, a) { return p + a >= 126 ? 'A' : p + a <= 74 ? 'C' : 'B'; }

const MILESTONES = [
  { n: 1, t: 'Anforderungsanalyse und Projektplanung abgeschlossen', soll: 'Ende Okt. 2026', date: [2026, 10, 31] },
  { n: 2, t: 'Drei 3D-Konzepte und Bauplanung abgeschlossen', soll: 'Mitte Jan. 2027', date: [2027, 1, 15] },
  { n: 3, t: 'VR-Bewertung durchgeführt und Bauversion festgelegt', soll: 'Mitte Feb. 2027', date: [2027, 2, 15] },
  { n: 4, t: 'Grundkonstruktion, Verstaubarkeit und Akustik umgesetzt', soll: 'Ende Feb. 2027', date: [2027, 2, 28] },
  { n: 5, t: 'Audio, Elektrik und Sync-Server funktionsfähig', soll: 'Mitte März 2027', date: [2027, 3, 15] },
  { n: 6, t: 'Systemtests und technische Abnahme abgeschlossen', soll: 'Mitte Apr. 2027', date: [2027, 4, 15] },
  { n: 7, t: 'Abschlussdokumentation und Endpräsentation abgeschlossen', soll: 'Ende Apr. 2027', date: [2027, 4, 30] }
].map(m => ({ ...m, d: new Date(m.date[0], m.date[1] - 1, m.date[2]), ist: '–' }));

const HOURS = [['Kevin Zheng', 200], ['Naila Subasic', 200], ['Angelika Zimmermann', 200], ['Maximilian Popek', 200]];
const COSTS = [['Konstruktions- und Verbindungsmaterial', 400, 700], ['Akustikdämmung, Absorber und Innenausbau', 250, 500], ['Elektrotechnik, Sensorik und Beleuchtung', 100, 250], ['Netzwerk, Speicher und sonstige IT-Komponenten', 50, 250]];

const CRITERIA = [
  ['A.1', 'Konstruktion', 'Die Kammer kann vollständig montiert und wieder zerlegt werden; die Module sind gekennzeichnet und für die Lagerung geordnet.'],
  ['A.2', 'Akustik', 'Die schulischen Vergleichsmessungen und Testaufnahmen sind dokumentiert und für die Bewertung der Raumakustik herangezogen.'],
  ['A.3', 'Audio / Cubase', 'Der definierte Aufnahme-Workflow funktioniert und das Cubase-Template berücksichtigt die ermittelten akustischen Eigenschaften inklusive Bass-, Höhen- und Absorberkompensation.'],
  ['A.4', 'IT', 'Audioaufnahmen können automatisiert über das schulinterne Netzwerk auf dem zentralen Server gespeichert und berechtigten Benutzern zugänglich gemacht werden.'],
  ['A.5', 'Dokumentation', `Bauanleitung, Schaltpläne, Netzwerk-/Serverkonfigurationen, Testberichte und die finale PDF-Dokumentation liegen vollständig vor. Die Entwicklung und der Baufortschritt der ${S}-Kammer sind dokumentiert und die Sponsoring- und Kooperationskontakte sind nachvollziehbar erfasst.`]
];

const TOPICS = ['Konstruktion', 'Akustik & Schallschutz', 'Audiointegration', 'Cubase-Template', 'Elektrotechnik', 'Sensorik', 'Netzwerk & Server', '3D-Modellierung', 'VR/AR', 'Marketing'];

/* Hotspots auf der Kammer: Titel vom Plakat, Text aus dem Antrag */
const HOTSPOTS = [
  { n: 1, face: 'left', x: 70, y: 72, t: 'Modular & gekennzeichnet', ref: 'Kap. 1.2 · H1c, H1f', d: 'Die Kammer kann nach dem Einsatz in einzelne Module zerlegt, geordnet und platzsparend gelagert werden. Verbindungstechnik und Bauteilkennzeichnung werden auf eine einfache und nutzerfreundliche Montage und Demontage ausgerichtet.' },
  { n: 2, face: 'left', x: 30, y: 28, t: 'Schalldämmung', ref: 'H2a', d: 'Schalldämmende Materialien und geeignete akustische Bauteile werden ausgewählt und integriert, um die Schallübertragung sowohl von außen nach innen als auch von innen nach außen zu reduzieren.' },
  { n: 3, face: 'top', x: 50, y: 26, t: 'Licht & Lüftung', ref: 'H5b', d: 'Beleuchtung und Lüftung sind integriert und auf ihre Funktionen geprüft.' },
  { n: 4, face: 'front', x: 36, y: 66, t: 'Mikrofon & Audio-Interface', ref: 'H4a', d: 'Mikrofonierung, Audio-Interface und Kabelmanagement sind für den vorgesehenen Aufnahmebetrieb mit Fokus auf Sprachaufnahmen eingerichtet.' },
  { n: 5, face: 'front', x: 66, y: 74, t: 'Aufnahmeprogramm', ref: 'H4c', d: 'Ein Cubase-Aufnahmetemplate ist erstellt und auf die gemessenen akustischen Eigenschaften der Kammer abgestimmt.' }
];

/* ---------------------------------------------------------------------
   2. Theme: Favicon + theme-color aus der Palette
   --------------------------------------------------------------------- */
function applyTheme() {
  const bg = hex(P.bg), a1 = hex(P.a1), a2 = hex(P.a2);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='${bg}'/><g fill='${a1}'><rect x='5.5' y='13' width='3.6' height='8' rx='1.8'/><rect x='10.8' y='7' width='3.6' height='18' rx='1.8'/><rect x='16.1' y='10.5' width='3.6' height='11' rx='1.8'/><rect x='21.4' y='14.5' width='3.6' height='5' rx='1.8'/></g><circle cx='26.5' cy='24.5' r='2.2' fill='${a2}'/></svg>`;
  $('#favicon').href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  $('meta[name="theme-color"]').setAttribute('content', bg);
}
applyTheme();

/* ---------------------------------------------------------------------
   3. Navigation, Fortschritt, Nach-oben
   --------------------------------------------------------------------- */
const nav = $('#nav'), progress = $('#progress'), toTop = $('#toTop'), topRing = $('#topRing');
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? y / max : 0;
  nav.classList.toggle('glass', y > 20);
  progress.style.transform = `scaleX(${p})`;
  toTop.classList.toggle('show', y > innerHeight * .8);
  topRing.style.strokeDashoffset = 100 - p * 100;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();
toTop.addEventListener('click', () => { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); $('.brand').focus({ preventScroll: true }); });

const burger = $('#burger'), menu = $('#menu');
function setMenu(open) {
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  menu.classList.toggle('open', open);
}
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });

const navLinks = $$('#menu a');
const secObs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    navLinks.forEach(a => { const on = a.getAttribute('href') === '#' + en.target.id; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => secObs.observe(s));

/* ---------------------------------------------------------------------
   4. Laufband
   --------------------------------------------------------------------- */
const mq = $('#marquee');
mq.innerHTML = TOPICS.map(t => `<span>${esc(t)}</span>`).join('') + TOPICS.map(t => `<span aria-hidden="true">${esc(t)}</span>`).join('');

/* ---------------------------------------------------------------------
   5. Inhalte aus Daten erzeugen
   --------------------------------------------------------------------- */
const avStyle = k => `background:var(${(PEOPLE[k] || MENTORS[k]).av})`;
const miniAv = k => `<span class="mini-av" style="${avStyle(k)}" title="${esc(PEOPLE[k].first + ' ' + PEOPLE[k].last)}">${k}</span>`;

/* --- Ziele --- */
function renderGoals() {
  ['h', 'o', 'n'].forEach(cat => {
    const box = $('#goals-' + cat);
    box.innerHTML = GOALS[cat].map((g, i) => {
      if (cat === 'n') {
        return `<article class="card goal nz spot" id="goal-${g.id}" data-reveal style="--d:${i % 3}">
          <div class="goal-head"><span class="goal-code">${goalLabel(g.id)}</span><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p></div>
          <span class="nz-x" aria-hidden="true">✕</span><span class="sr-only">Nicht Teil des Projekts.</span></article>`;
      }
      const owners = [...new Set(g.subs.map(s => s[2]))];
      return `<article class="card goal spot" id="goal-${g.id}" data-reveal style="--d:${i % 3}">
        <div class="goal-head">
          <span class="goal-code">${goalLabel(g.id)}</span>
          <span class="goal-owners" aria-label="Zuständig: ${owners.join(', ')}">${owners.map(miniAv).join('')}</span>
          <h3><button class="goal-btn" type="button" aria-expanded="false" aria-controls="gb-${g.id}">${esc(g.title)}</button></h3><span class="plus" aria-hidden="true"></span>
          <p>${esc(g.desc)}</p>
        </div>
        <div class="goal-body" id="gb-${g.id}" role="region" aria-label="Teilziele ${goalLabel(g.id)}"><div>
          <ul class="subs">${g.subs.map(s => `<li data-own="${s[2]}"><span class="l">${s[0]})</span><span>${esc(s[1])}</span><span class="own" style="${avStyle(s[2])}">${s[2]}</span></li>`).join('')}</ul>
        </div></div></article>`;
    }).join('');
  });
  $$('.goal-btn').forEach(btn => btn.addEventListener('click', () => toggleGoal(btn.closest('.goal'))));
}
function toggleGoal(card, force) {
  const open = force ?? !card.classList.contains('open');
  card.classList.toggle('open', open);
  $('.goal-btn', card).setAttribute('aria-expanded', open);
}
renderGoals();

/* Tabs mit gleitender Markierung */
const tabs = $$('#goalTabs .tab'), tabInd = $('#goalTabs .tab-ind');
function moveInd(ind, el) {
  if (!el) return;
  ind.style.width = el.offsetWidth + 'px';
  ind.style.height = el.offsetHeight + 'px';
  ind.style.top = el.offsetTop + 'px';
  ind.style.transform = `translateX(${el.offsetLeft}px)`;
}
function selectTab(tab, focus) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
    $('#' + t.getAttribute('aria-controls')).hidden = !on;
  });
  moveInd(tabInd, tab);
  if (focus) tab.focus();
  $$('#' + tab.getAttribute('aria-controls') + ' [data-reveal]').forEach(el => el.classList.add('in'));
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = tabs.length - 1;
    if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
  });
});
const expandBtn = $('#expandAll');
expandBtn.addEventListener('click', () => {
  const open = expandBtn.getAttribute('aria-pressed') !== 'true';
  expandBtn.setAttribute('aria-pressed', open);
  expandBtn.textContent = open ? 'Alle zuklappen' : 'Alle aufklappen';
  $$('.goal:not(.nz)').forEach(c => toggleGoal(c, open));
});

/* Filter "Zuständig" */
const who = $('#whoFilter');
who.innerHTML = `<button type="button" data-who="" aria-pressed="true">Alle</button>` + PEOPLE_KEYS.map(k => `<button type="button" data-who="${k}" aria-pressed="false" title="${esc(PEOPLE[k].first + ' ' + PEOPLE[k].last)}">${k}</button>`).join('');
function setWho(k) {
  $$('button', who).forEach(b => b.setAttribute('aria-pressed', b.dataset.who === k));
  $$('.goals').forEach(g => g.classList.toggle('filtering', !!k));
  $$('.goal:not(.nz)').forEach(card => {
    let mine = false;
    $$('.subs li', card).forEach(li => { const m = li.dataset.own === k; li.classList.toggle('mine', m); mine ||= m; });
    card.classList.toggle('has-mine', mine);
    if (k && mine) toggleGoal(card, true);
  });
  const mx = $('#matrix');
  if (k) mx.dataset.col = PEOPLE_KEYS.indexOf(k); else delete mx.dataset.col;
}
who.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setWho(b.dataset.who); });

/* Zuständigkeitsmatrix (2.4) */
function renderMatrix() {
  const rows = [];
  rows.push(`<div class="mx-row mx-head" role="row"><div role="columnheader">Ziel</div>${PEOPLE_KEYS.map((k, i) => `<div role="columnheader" data-c="${i}"><button class="chip" type="button" data-who="${k}" style="padding:2px 4px 2px 2px;border:0;background:none">${miniAv(k)}<span>${k}</span></button></div>`).join('')}</div>`);
  [['h', 'Hauptziele'], ['o', 'Optionale Ziele']].forEach(([cat, label]) => {
    rows.push(`<div class="mx-row sep" role="row"><div role="cell">${label}</div><div></div><div></div><div></div><div></div></div>`);
    GOALS[cat].forEach(g => {
      const cells = PEOPLE_KEYS.map((k, i) => {
        const mine = g.subs.filter(s => s[2] === k);
        let inner = '<span class="muted" aria-label="nicht zuständig">·</span>';
        if (mine.length && mine.length === g.subs.length) inner = `<span class="cell-full" title="gesamtes Ziel">ganz</span>`;
        else if (mine.length) inner = `<span class="cell-subs">${mine.map(s => `<i>${s[0]}</i>`).join('')}</span>`;
        return `<div role="cell" data-c="${i}">${inner}</div>`;
      }).join('');
      rows.push(`<div class="mx-row" role="row"><div class="mx-goal" role="rowheader"><a class="mono" href="#goal-${g.id}" data-goal="${g.id}">${g.id[0]}${g.id.slice(1)}</a><span>${esc(g.title)}</span></div>${cells}</div>`);
    });
  });
  const mx = $('#matrix');
  mx.setAttribute('role', 'table');
  mx.setAttribute('aria-label', 'Zuständigkeiten der Teammitglieder je Ziel und Teilziel');
  mx.innerHTML = rows.join('');
  mx.addEventListener('click', e => {
    const b = e.target.closest('button[data-who]');
    if (b) setWho(b.dataset.who === who.querySelector('[aria-pressed="true"]').dataset.who ? '' : b.dataset.who);
    const a = e.target.closest('a[data-goal]');
    if (a) { e.preventDefault(); openGoal(a.dataset.goal); }
  });
  mx.addEventListener('pointerover', e => { const c = e.target.closest('[data-c]'); if (c && !$('#whoFilter [aria-pressed="true"]').dataset.who) mx.dataset.col = c.dataset.c; });
  mx.addEventListener('pointerleave', () => { if (!$('#whoFilter [aria-pressed="true"]').dataset.who) delete mx.dataset.col; });
}
renderMatrix();

function openGoal(id) {
  const cat = id[0] === 'H' ? 'h' : id[0] === 'O' ? 'o' : 'n';
  selectTab($('#tab-' + cat));
  const card = $('#goal-' + id);
  if (!card) return;
  if (!card.classList.contains('nz')) toggleGoal(card, true);
  card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
  setTimeout(() => $('.goal-btn', card)?.focus({ preventScroll: true }), 500);
}

/* --- Team --- */
function renderTeam() {
  const mailIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
  $('#teamGrid').innerHTML = PEOPLE_KEYS.map((k, i) => {
    const p = PEOPLE[k];
    const chip = ([id, label]) => `<button class="chip" type="button" data-goal="${id}" title="${esc(goalLabel(id))} öffnen"><b>${id[0]}</b>${esc(label)}</button>`;
    return `<article class="card member spot" data-k="${k}" data-reveal style="--d:${i % 2}">
      <div class="member-top">
        <div class="avatar" style="${avStyle(k)}" aria-hidden="true">${p.first[0]}${p.last[0]}</div>
        <div><h3>${esc(p.first + ' ' + p.last)}</h3><div class="role">${esc(p.role)}</div>
          <div class="meta"><span class="chip">Kürzel <b>${k}</b></span><span class="chip">Klasse <b>5AX</b></span><span class="chip">Betreuung <b>${p.mentor}</b></span></div></div>
      </div>
      <p class="focus"><b>Themenschwerpunkt:</b> ${esc(p.focus)} ${esc(p.focusMore)}</p>
      <div><div class="chips-h">Ziel-H</div><div class="chips">${p.H.map(chip).join('')}</div></div>
      ${p.O.length ? `<div><div class="chips-h">Ziel-O</div><div class="chips">${p.O.map(chip).join('')}</div></div>` : ''}
      <a class="mail" href="mailto:${mail(k)}">${mailIcon}${mail(k)}</a>
    </article>`;
  }).join('');
  $('#mentorGrid').innerHTML = Object.entries(MENTORS).map(([k, m], i) => `
    <article class="card mentor spot" data-m="${k}" data-reveal style="--d:${i}" tabindex="0">
      <div class="avatar" style="${avStyle(k)}" aria-hidden="true">${m.name.split(' ').map(s => s[0]).join('')}</div>
      <div><h3>${esc(m.name)}</h3><div class="role">${esc(m.role)} · <span class="mono">${k}</span></div>
        <div class="supervises">betreut ${m.of.map(o => miniAv(o) + `<span>${esc(PEOPLE[o].first + ' ' + PEOPLE[o].last)}</span>`).join('')}</div></div>
    </article>`).join('');
  $('#teamTable tbody').innerHTML = PEOPLE_KEYS.map(k => `<tr><td data-l="Funktion">${esc(PEOPLE[k].fn)}</td><td class="main">${esc(PEOPLE[k].first + ' ' + PEOPLE[k].last)}</td><td class="mono" data-l="Kürzel">${k}</td><td data-l="E-Mail"><a href="mailto:${mail(k)}">${mail(k)}</a></td></tr>`).join('');

  $('#teamGrid').addEventListener('click', e => { const b = e.target.closest('[data-goal]'); if (b) openGoal(b.dataset.goal); });
  const hl = k => $$('.member').forEach(m => { const on = !k || MENTORS[k].of.includes(m.dataset.k); m.classList.toggle('dim', !on); m.classList.toggle('glow', !!k && on); });
  $$('.mentor').forEach(m => {
    m.addEventListener('pointerenter', () => hl(m.dataset.m));
    m.addEventListener('pointerleave', () => hl(null));
    m.addEventListener('focus', () => hl(m.dataset.m));
    m.addEventListener('blur', () => hl(null));
  });
}
renderTeam();

/* --- Stakeholder --- */
$('#shGrid').innerHTML = STAKEHOLDERS.map((s, i) => `
  <article class="card sh spot" data-reveal style="--d:${i % 2}">
    <div class="sh-top"><div><span class="sh-id ${s.ext ? 'ext' : ''}">${s.id}</span></div><span class="badge ${s.ext ? 'acc' : 'ok'}">${s.ext ? 'extern' : 'intern'}</span></div>
    <h3>${esc(s.name)}</h3>
    <p>${esc(s.desc)}</p>
    <div class="tags">
      <span class="chip">Einfluss <b>${s.inf}</b> <span class="level ${s.inf === 'hoch' ? 'l3' : 'l2'}" aria-hidden="true"><i></i><i></i><i></i></span></span>
      <span class="chip">Einstellung <b style="color:var(--ok)">${s.att}</b></span>
    </div>
    <div class="measures"><b>Maßnahmen</b>${esc(s.meas)}</div>
  </article>`).join('');

/* --- PSP --- */
$('#pspCols').innerHTML = PSP.map((c, i) => `
  <div class="psp-col" data-reveal style="--d:${i}">
    <div class="head"><span class="mono">${c.code}</span>${esc(c.name)}</div>
    <div class="psp-list">
      ${c.wp.map(w => `<div class="wp${w[2] ? ' fix' : ''}"${w[2] ? ' title="Im Antrag doppelt als 1.4.5 nummeriert – hier als 1.4.6 korrigiert"' : ''}><span class="mono">${w[0]}</span>${esc(w[1])}</div>`).join('')}
      <div class="wp ms"><span class="mono">◆ Meilenstein</span>${esc(c.ms)}</div>
    </div>
  </div>`).join('');

/* --- Abnahmekriterien --- */
$('#criteria').innerHTML = CRITERIA.map((c, i) => `
  <article class="card crit spot" data-reveal style="--d:${i}">
    <div class="code"><span>${c[0]}</span><span class="check" aria-hidden="true"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m2.5 7.5 3 3 6-7"/></svg></span></div>
    <h3>Abnahmekriterium ${esc(c[1])}</h3><p>${esc(c[2])}</p>
  </article>`).join('');

/* --- Ressourcen --- */
$('#hoursBars').innerHTML = HOURS.map((r, i) => `<div class="hbar"><span>${esc(r[0])}</span><span class="track"><span data-w="${r[1] / 800 * 100}" style="--d:${i}"></span></span><span class="v">${r[1]} h</span></div>`).join('')
  + `<div class="hbar sum"><span>Summe (4 × 200 h)</span><span class="track"><span data-w="100" style="--d:4"></span></span><span class="v">800 h</span></div>`;
$('#costBars').innerHTML = COSTS.map((c, i) => `<div class="range" style="--from:${c[1] / 800 * 100}%;--w:${(c[2] - c[1]) / 800 * 100}%;--d:${i}">
  <div class="top"><span>${i + 1}. ${esc(c[0])}</span><b>€ ${c[1]} – ${c[2]}</b></div><div class="track" aria-hidden="true"><span></span></div></div>`).join('');


/* ---------------------------------------------------------------------
   6. Scroll-Reveal, Hochzählen, Spotlight
   --------------------------------------------------------------------- */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add('in');
    revealObs.unobserve(el);
    $$('.hbar .track span', el).forEach(s => s.style.width = s.dataset.w + '%');
    $$('.range', el).forEach(r => r.classList.add('in'));
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
$$('[data-reveal]').forEach(el => revealObs.observe(el));
const pspObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); pspObs.disconnect(); } }), { threshold: .2 });
pspObs.observe($('#pspTree'));

function countUp(el) {
  const to = +el.dataset.count, dur = 1500, t0 = performance.now();
  if (reduce) { el.textContent = to; return; }
  const step = now => {
    const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(to * e).toLocaleString('de-AT');
    if (k < 1) requestAnimationFrame(step);
  };
  el.textContent = '0';
  requestAnimationFrame(step);
  setTimeout(() => { el.textContent = to.toLocaleString('de-AT'); }, dur + 200); /* Fallback, falls rAF gedrosselt ist */
}
const cntObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); cntObs.unobserve(e.target); } }), { threshold: .6 });
$$('[data-count]').forEach(el => cntObs.observe(el));

document.addEventListener('pointermove', e => {
  const c = e.target.closest?.('.spot');
  if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });

/* ---------------------------------------------------------------------
   7. Audio: Mikro-Demo + Hörprobe (alles lokal im Browser)
   --------------------------------------------------------------------- */
const AudioEngine = {
  ctx: null, analyser: null, data: null, freq: null, stream: null, level: 0, mic: false,
  noise: null, noiseGain: null, noiseFilter: null, listen: null,
  ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512; this.analyser.smoothingTimeConstant = .75;
      this.data = new Float32Array(this.analyser.fftSize);
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  async toggleMic() {
    if (this.mic) { this.stopMic(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !this.ensureCtx()) { micUi('unsupported'); return; }
    try {
      micUi('asking');
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      this.src = this.ctx.createMediaStreamSource(this.stream);
      this.src.connect(this.analyser);
      this.mic = true; micUi('on');
    } catch (err) { micUi('denied'); }
  },
  stopMic() {
    this.stream?.getTracks().forEach(t => t.stop());
    try { this.src?.disconnect(); } catch (e) { /* bereits getrennt */ }
    this.mic = false; this.level = 0; micUi('off');
  },
  /* Rosa Rauschen als "Umgebungslärm"; innen = −20 dB + Höhen gedämpft */
  playNoise(where) {
    if (!this.ensureCtx()) return;
    if (!this.noise) {
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
        b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
      }
      this.noise = this.ctx.createBufferSource(); this.noise.buffer = buf; this.noise.loop = true;
      this.noiseFilter = this.ctx.createBiquadFilter(); this.noiseFilter.type = 'lowpass';
      this.noiseGain = this.ctx.createGain(); this.noiseGain.gain.value = 0;
      this.noise.connect(this.noiseFilter).connect(this.noiseGain).connect(this.ctx.destination);
      this.noise.start();
    }
    const t = this.ctx.currentTime;
    const g = where === 'out' ? .35 : where === 'in' ? .035 : 0;   /* 0.35 → 0.035 = −20 dB */
    this.noiseGain.gain.cancelScheduledValues(t);
    this.noiseGain.gain.setTargetAtTime(g, t, .08);
    this.noiseFilter.frequency.setTargetAtTime(where === 'in' ? 900 : 18000, t, .08);
    this.listen = where;
  },
  update() {
    if (!this.mic) return 0;
    this.analyser.getFloatTimeDomainData(this.data);
    let s = 0; for (let i = 0; i < this.data.length; i++) s += this.data[i] * this.data[i];
    const rms = Math.sqrt(s / this.data.length);
    this.rms = rms;
    this.level = lerp(this.level, clamp(rms * 6, 0, 1), .3);
    this.analyser.getByteFrequencyData(this.freq);
    return this.level;
  }
};
function micUi(state) {
  const on = state === 'on';
  $$('.mic-toggle').forEach(b => {
    b.setAttribute('aria-pressed', on);
    const span = $('span', b);
    if (b.closest('.hero-cta')) span.textContent = on ? 'Mikro-Demo stoppen' : state === 'asking' ? 'Erlaubnis anfragen …' : 'Mikro-Demo starten';
    else span.textContent = on ? '■ Mikro aus' : '🎙 Mikro';
  });
  $('#emblemHint').textContent = { on: 'Sprich! Das Logo hört zu', off: 'Mikro aus', asking: 'Warte auf Erlaubnis …', denied: 'Mikro nicht erlaubt', unsupported: 'Mikro nicht verfügbar' }[state];
  $('#dbSrc').textContent = on ? 'Dein Mikrofon' : AudioEngine.listen ? 'Hörprobe' : 'Simulation';
}
$$('.mic-toggle').forEach(b => b.addEventListener('click', () => AudioEngine.toggleMic()));
const lo = $('#listenOut'), li = $('#listenIn');
function setListen(where) {
  const now = AudioEngine.listen === where ? null : where;
  AudioEngine.playNoise(now);
  lo.setAttribute('aria-pressed', now === 'out'); li.setAttribute('aria-pressed', now === 'in');
  lo.textContent = now === 'out' ? '■ Hörprobe außen' : '▶ Hörprobe außen';
  li.textContent = now === 'in' ? '■ Hörprobe innen' : '▶ Hörprobe innen';
  $('#dbSrc').textContent = AudioEngine.mic ? 'Dein Mikrofon' : now ? (now === 'out' ? 'Hörprobe außen' : 'Hörprobe innen (−20 dB)') : 'Simulation';
}
lo.addEventListener('click', () => setListen('out'));
li.addEventListener('click', () => setListen('in'));
document.addEventListener('visibilitychange', () => { if (document.hidden && AudioEngine.listen) setListen(AudioEngine.listen); });

/* ---------------------------------------------------------------------
   8. Hero: Schallwellen-Canvas + Plakat-Emblem
   --------------------------------------------------------------------- */
const hero = $('#hero'), hc = $('#heroCanvas'), hctx = hc.getContext('2d'), emblem = $('#emblem');
let hW = 0, hH = 0, dpr = 1, mouse = { x: -1e4, y: -1e4, on: false }, heroVisible = true;
function sizeHero() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  hW = hero.clientWidth; hH = hero.clientHeight;
  hc.width = hW * dpr; hc.height = hH * dpr;
  hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; });
hero.addEventListener('pointerleave', () => { mouse.on = false; });
new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }).observe(hero);

/* Balken 1:1 aus Plakat_DA_Synq_Kreativ_A1.pdf: [y, x0, x1, Strichstärke] in Plakat-Koordinaten.
   Das Hexagon-Logo (442 × 497) wird im Emblem auf 100 Einheiten skaliert. */
const BAR_K = 100 / 442, BAR_CY = 1175.5;
const BARS = [
  [165, 843, 843, 20], [209, 816, 869, 21.8], [254, 786, 899, 21.8], [300, 758, 927, 21.8], [347, 725, 960, 23.3],
  [395, 685, 1001, 23.3], [448, 587, 1098, 23.3], [495, 522, 1163, 21.8], [539, 622, 1064, 23.3], [581, 719, 966, 23.3],
  [624, 757, 928, 21.8], [666, 787, 899, 21.8], [707, 753, 932, 20.2], [750, 703, 983, 21.8], [792, 643, 1043, 20.2],
  [834, 723, 963, 21.8], [878, 765, 920, 20.2],
  [1479, 756, 930, 20.2], [1521, 707, 978, 18.7], [1561, 749, 937, 20.2], [1600, 684, 1001, 20.2], [1643, 740, 945, 20.2],
  [1687, 770, 915, 20.2], [1731, 795, 890, 20.2], [1773, 815, 871, 20.2], [1815, 808, 877, 20.2], [1857, 826, 860, 18.7],
  [1900, 843, 843, 20]
];
const barEls = [];
function buildBars() {
  const lens = BARS.map(([, x0, x1, lw]) => (x1 - x0 + lw) * BAR_K);
  const max = Math.max(...lens);
  BARS.forEach(([y, , , lw], i) => {
    const th = lw * BAR_K, len = lens[i], t = len / max;
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('height', th.toFixed(2)); r.setAttribute('rx', (th / 2).toFixed(2));
    r.setAttribute('y', ((y - BAR_CY) * BAR_K - th / 2).toFixed(2));
    r.style.fill = `color-mix(in srgb, var(--accent-1) ${Math.round(35 + 65 * t)}%, var(--accent-2))`;
    (y < BAR_CY ? $('#barsTop') : $('#barsBot')).appendChild(r);
    barEls.push({ el: r, base: len, min: th, i, band: t });
  });
}
buildBars();

function drawHero(t) {
  const lvl = AudioEngine.level;
  /* Emblem-Position = "Kammer" */
  const er = emblem.getBoundingClientRect(), hr = hero.getBoundingClientRect();
  const cx = er.left - hr.left + er.width / 2, cy = er.top - hr.top + er.height / 2;
  hctx.clearRect(0, 0, hW, hH);
  const waves = 5, start = cx - Math.min(hW * .45, 520);
  for (let w = 0; w < waves; w++) {
    const col = w % 2 ? P.a2 : P.a1;
    hctx.beginPath();
    hctx.lineWidth = w === 0 ? 2 : 1.4;
    hctx.strokeStyle = rgba(col, .5 - w * .07);
    const f = .006 + w * .0023, sp = 1.1 + w * .35, ph = w * 1.7;
    const amp = (34 + w * 9) * (1 + lvl * 2.2);
    for (let x = 0; x <= hW; x += 4) {
      /* Dämpfung Richtung Kammer: bis auf 1/10 (= −20 dB) */
      const k = clamp((x - start) / (cx - start), 0, 1);
      const damp = 1 - .9 * (k * k * (3 - 2 * k));
      let a = amp * damp;
      let yOff = 0;
      if (mouse.on) {
        const g = Math.exp(-((x - mouse.x) ** 2) / (2 * 110 * 110));
        a += 38 * g * damp;
        yOff = (mouse.y - cy) * .22 * g * damp;
      }
      const y = cy + yOff + Math.sin(x * f + t * sp + ph) * a * (.75 + .25 * Math.sin(x * .0015 + t * .4 + w));
      x ? hctx.lineTo(x, y) : hctx.moveTo(x, y);
    }
    hctx.stroke();
  }
  /* Bars */
  const fr = AudioEngine.mic ? AudioEngine.freq : null;
  barEls.forEach((b, i) => {
    let s;
    if (fr) {
      const bin = 2 + Math.floor((i % 14) * 3.2);
      s = .3 + 1.15 * (fr[bin] / 255);
    } else s = .8 + .2 * Math.sin(t * 2.2 + i * .55) + .06 * Math.sin(t * 5.1 + i);
    const w = Math.max(b.min, b.base * s);
    b.el.setAttribute('width', w.toFixed(1));
    b.el.setAttribute('x', (-w / 2).toFixed(1));
  });
  /* leichte Neigung zur Maus */
  if (mouse.on) {
    const rx = clamp((mouse.y - cy) / hH, -1, 1) * -8, ry = clamp((mouse.x - cx) / hW, -1, 1) * 10;
    $('#emblemSvg').style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${1 + lvl * .06})`;
  } else $('#emblemSvg').style.transform = `scale(${1 + lvl * .06})`;
  $('#micMeter').style.width = (lvl * 100).toFixed(0) + '%';
}

/* ---------------------------------------------------------------------
   9. 3D-Kammer (CSS-3D)
   --------------------------------------------------------------------- */
const W = 190, H = 235, D = 190, E = 85;
const FACES = [
  { id: 'bottom', w: W, h: D, lbl: 'BODEN' },
  { id: 'back', w: W, h: H, lbl: 'RÜCKWAND' },
  { id: 'left', w: D, h: H, lbl: 'WAND L' },
  { id: 'right', w: D, h: H, lbl: 'WAND R' },
  { id: 'front', w: W, h: H, lbl: 'FRONT' },
  { id: 'top', w: W, h: D, lbl: 'DECKE' }
];
const tf = (x, y, z, rx, ry, tz) => `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
const POSE = {
  built:    { front: [0, 0, 0, 0, 0, D / 2], back: [0, 0, 0, 0, 180, D / 2], left: [0, 0, 0, 0, -90, W / 2], right: [0, 0, 0, 0, 90, W / 2], top: [0, 0, 0, 90, 0, H / 2], bottom: [0, 0, 0, -90, 0, H / 2] },
  exploded: { front: [0, 0, 0, 0, 0, D / 2 + E], back: [0, 0, 0, 0, 180, D / 2 + E], left: [0, 0, 0, 0, -90, W / 2 + E], right: [0, 0, 0, 0, 90, W / 2 + E], top: [0, 0, 0, 90, 0, H / 2 + E * .8], bottom: [0, 0, 0, -90, 0, H / 2 + E * .5] },
  stowed: {}
};
['bottom', 'back', 'left', 'right', 'front', 'top'].forEach((id, i) => { POSE.stowed[id] = [i % 2 ? 5 : -5, H / 2 - 6 - i * 13, 0, 90, 0, 0]; });
const STATE_NAMES = { built: 'Aufgebaut', exploded: 'Zerlegt', stowed: 'Verstaut' };
const cube = $('#cube'), stage = $('#stage');
const faceEls = {};
FACES.forEach((f, i) => {
  const el = h(`<div class="face f-${f.id}" style="width:${f.w}px;height:${f.h}px;margin-left:${-f.w / 2}px;margin-top:${-f.h / 2}px;--n:${i}">${f.id === 'front' ? '<div class="door"></div>' : ''}<span class="lbl">${f.lbl}</span></div>`);
  HOTSPOTS.filter(p => p.face === f.id).forEach(p => {
    el.appendChild(h(`<button class="pin" type="button" data-hs="${p.n}" style="left:calc(${p.x}% - 13px);top:calc(${p.y}% - 13px)" aria-label="${p.n}: ${esc(p.t)}">${p.n}</button>`));
  });
  cube.appendChild(el); faceEls[f.id] = el;
});
let chamberState = 'built';
function setChamber(s) {
  chamberState = s;
  FACES.forEach(f => { faceEls[f.id].style.transform = tf(...POSE[s][f.id]); });
  cube.className = 'cube s-' + s;
  $('#stateName').textContent = STATE_NAMES[s];
  const seg = $('#stateSeg');
  $$('button', seg).forEach(b => b.setAttribute('aria-pressed', b.dataset.state === s));
  moveInd($('.seg-ind', seg), $(`button[data-state="${s}"]`, seg));
  if (s !== 'built') setHotspot(null, false);
}
setChamber('built');

/* Drehen mit Schwung */
const rot = { x: -20, y: 32, vx: 0, vy: 0, tx: null, ty: null };
let auto = !reduce, dragging = false, moved = 0, last = null, autoTimer = null;
function stopAuto() {
  if (!auto) return;
  auto = false; clearInterval(autoTimer);
  $('#autoTag').classList.add('off'); $('#autoTag span').textContent = 'Manuell';
}
function startAuto() {
  if (reduce) return;
  auto = true; $('#autoTag').classList.remove('off'); $('#autoTag span').textContent = 'Auto';
  clearInterval(autoTimer);
  const order = ['built', 'exploded', 'stowed'];
  autoTimer = setInterval(() => setChamber(order[(order.indexOf(chamberState) + 1) % 3]), 3400);
}
startAuto();
stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  dragging = true; moved = 0; last = { x: e.clientX, y: e.clientY, t: performance.now() };
  rot.tx = rot.ty = null; rot.vx = rot.vy = 0;
  stopAuto(); stopTour();
});
addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - last.x, dy = e.clientY - last.y;
  moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 4) stage.setPointerCapture?.(e.pointerId);
  rot.y += dx * .45; rot.x = clamp(rot.x - dy * .35, -85, 60);
  rot.vy = dx * .45; rot.vx = -dy * .35;
  last = { x: e.clientX, y: e.clientY, t: performance.now() };
});
const endDrag = () => { dragging = false; };
addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
stage.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } }, true);
stage.addEventListener('keydown', e => {
  const k = { ArrowLeft: [0, -12], ArrowRight: [0, 12], ArrowUp: [8, 0], ArrowDown: [-8, 0] }[e.key];
  if (k) { e.preventDefault(); stopAuto(); rot.tx = null; rot.x = clamp(rot.x + k[0], -85, 60); rot.y += k[1]; }
  if (['1', '2', '3'].includes(e.key)) { stopAuto(); setChamber(['built', 'exploded', 'stowed'][+e.key - 1]); }
});
$('#stateSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { stopAuto(); setChamber(b.dataset.state); } });

function stepRotation() {
  if (!dragging) {
    if (rot.tx !== null) {
      let dy = ((rot.ty - rot.y) % 360 + 540) % 360 - 180;
      rot.y += dy * .08; rot.x += (rot.tx - rot.x) * .08;
      if (Math.abs(dy) < .2 && Math.abs(rot.tx - rot.x) < .2) rot.tx = rot.ty = null;
    } else {
      rot.y += rot.vy; rot.x = clamp(rot.x + rot.vx, -85, 60);
      rot.vx *= .94; rot.vy *= .94;
      if (auto && Math.abs(rot.vy) < .05) rot.y += .18;
    }
  }
  cube.style.transform = `rotateX(${rot.x.toFixed(2)}deg) rotateY(${rot.y.toFixed(2)}deg)`;
}
/* Skalierung an Kartengröße anpassen, damit nichts übersteht */
new ResizeObserver(() => {
  const k = Math.min(1, stage.clientWidth / 600, stage.clientHeight / 470);
  $('#stageScale').style.setProperty('--k', k.toFixed(3));
  moveInd($('#stateSeg .seg-ind'), $('#stateSeg [aria-pressed="true"]'));
  moveInd(tabInd, $('#goalTabs [aria-selected="true"]'));
}).observe(stage);

/* Hotspots */
const VIEW = { left: [-14, 62], top: [-58, 32], front: [-12, 8] };
$('#hotspots').innerHTML = HOTSPOTS.map(p => `<button class="hs" type="button" data-hs="${p.n}" aria-expanded="false"><span class="n">${p.n}</span><span><b>${esc(p.t)}</b><small>${esc(p.d)} <span class="mono" style="color:var(--accent-2)">· ${p.ref}</span></small></span></button>`).join('');
function setHotspot(n, turn = true) {
  $$('.hs').forEach(b => { const on = +b.dataset.hs === n; b.classList.toggle('on', on); b.setAttribute('aria-expanded', on); });
  $$('.pin').forEach(b => b.classList.toggle('on', +b.dataset.hs === n));
  Object.values(faceEls).forEach(f => f.classList.remove('lit'));
  if (!n) return;
  const p = HOTSPOTS.find(x => x.n === n);
  faceEls[p.face].classList.add('lit');
  if (turn) { if (chamberState !== 'built') setChamber('built'); [rot.tx, rot.ty] = VIEW[p.face]; rot.vx = rot.vy = 0; }
}
$('#hotspots').addEventListener('click', e => { const b = e.target.closest('.hs'); if (b) { stopAuto(); stopTour(); setHotspot(b.classList.contains('on') ? null : +b.dataset.hs); } });
cube.addEventListener('click', e => { const b = e.target.closest('.pin'); if (b) { stopAuto(); setHotspot(+b.dataset.hs); } });

/* ---------------------------------------------------------------------
   10. −20 dB-Visualisierung
   --------------------------------------------------------------------- */
const dbc = $('#dbCanvas'), dctx = dbc.getContext('2d');
let dW = 0, dH = 0, dbVisible = false;
function sizeDb() { const r = dbc.getBoundingClientRect(); dW = r.width; dH = r.height; dbc.width = dW * dpr; dbc.height = dH * dpr; dctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
new IntersectionObserver(es => { dbVisible = es[0].isIntersecting; }).observe(dbc);
function drawDb(t) {
  if (!dW) return;
  const mid = dW / 2, cy = dH / 2 + 10, wall = 22;
  const lvl = AudioEngine.mic ? clamp(AudioEngine.level * 1.6, .08, 1) : 1;
  const A = (dH * .34) * lvl, Ai = A / 10;              /* −20 dB = Faktor 10 */
  dctx.clearRect(0, 0, dW, dH);
  /* Mittellinien */
  dctx.strokeStyle = rgba(P.line, 1); dctx.lineWidth = 1;
  dctx.beginPath(); dctx.moveTo(0, cy); dctx.lineTo(dW, cy); dctx.stroke();
  /* Referenz (gestrichelt): so groß wäre die Welle ohne Kammer */
  dctx.setLineDash([4, 5]); dctx.strokeStyle = rgba(P.muted, .45);
  dctx.beginPath(); dctx.moveTo(mid + wall / 2, cy - A); dctx.lineTo(dW, cy - A); dctx.moveTo(mid + wall / 2, cy + A); dctx.lineTo(dW, cy + A); dctx.stroke();
  dctx.setLineDash([]);
  const wave = (x0, x1, amp, col, lw) => {
    dctx.beginPath(); dctx.lineWidth = lw; dctx.strokeStyle = col;
    for (let x = x0; x <= x1; x += 2) {
      const y = cy + amp * (Math.sin(x * .045 - t * 5) * .7 + Math.sin(x * .11 - t * 8.3) * .3);
      x === x0 ? dctx.moveTo(x, y) : dctx.lineTo(x, y);
    }
    dctx.stroke();
  };
  const hiOut = AudioEngine.listen === 'out', hiIn = AudioEngine.listen === 'in';
  if (hiOut || hiIn) { dctx.fillStyle = rgba(hiOut ? P.a1 : P.a2, .07); dctx.fillRect(hiOut ? 0 : mid + wall / 2, 0, mid - wall / 2, dH); }
  wave(0, mid - wall / 2, A, rgba(P.a1, 1), 2.5);
  wave(mid + wall / 2, dW, Ai, rgba(P.a2, 1), 2.5);
  /* Wand mit Absorber-Struktur */
  dctx.fillStyle = rgba(P.card, 1); dctx.fillRect(mid - wall / 2, 8, wall, dH - 16);
  dctx.strokeStyle = rgba(P.a1, .8); dctx.lineWidth = 2; dctx.strokeRect(mid - wall / 2, 8, wall, dH - 16);
  dctx.strokeStyle = rgba(P.a1, .35); dctx.lineWidth = 1;
  for (let y = 14; y < dH - 10; y += 10) { dctx.beginPath(); dctx.moveTo(mid - wall / 2 + 2, y); dctx.lineTo(mid + wall / 2 - 2, y + 7); dctx.stroke(); }
  dctx.fillStyle = rgba(P.muted, 1); dctx.font = `600 10px "JetBrains Mono", monospace`; dctx.textAlign = 'center';
  dctx.fillText('WAND', mid, dH - 14 + 0);
  dctx.textAlign = 'right'; dctx.fillStyle = rgba(P.muted, .8);
  dctx.fillText('ohne Kammer', dW - 10, cy - A - 6);
  /* Anzeige */
  if (AudioEngine.mic) {
    const out = 20 * Math.log10(Math.max(AudioEngine.rms || 1e-5, 1e-5));
    $('#dbOut').textContent = out.toFixed(1).replace('-', '−') + 'FS';
    $('#dbIn').textContent = (out - 20).toFixed(1).replace('-', '−') + 'FS';
  } else { $('#dbOut').textContent = '0.0'; $('#dbIn').textContent = '−20.0'; }
}

/* ---------------------------------------------------------------------
   11. Risikomatrix (SVG) + Tabelle + Detailkarte
   --------------------------------------------------------------------- */
const svgNS = 'http://www.w3.org/2000/svg';
const X0 = 58, X1 = 405, Y0 = 16, Y1 = 362;
const sx = p => X0 + p / 100 * (X1 - X0), sy = a => Y1 - a / 100 * (Y1 - Y0);
const pts = arr => arr.map(([p, a]) => `${sx(p).toFixed(1)},${sy(a).toFixed(1)}`).join(' ');
function renderRisk() {
  const svg = $('#riskSvg');
  let s = '';
  s += `<polygon class="zone-b" points="${pts([[74, 0], [100, 0], [100, 26], [26, 100], [0, 100], [0, 74]])}"/>`;
  s += `<polygon class="zone-c" points="${pts([[0, 0], [74, 0], [0, 74]])}"/>`;
  s += `<polygon class="zone-a" points="${pts([[26, 100], [100, 100], [100, 26]])}"/>`;
  for (let v = 0; v <= 100; v += 10) {
    s += `<line class="gl" x1="${sx(v)}" y1="${Y0}" x2="${sx(v)}" y2="${Y1}"/><line class="gl" x1="${X0}" y1="${sy(v)}" x2="${X1}" y2="${sy(v)}"/>`;
    if (v % 20 === 0) s += `<text class="tk" x="${sx(v)}" y="${Y1 + 16}" text-anchor="middle">${v}</text><text class="tk" x="${X0 - 8}" y="${sy(v) + 3}" text-anchor="end">${v}</text>`;
  }
  s += `<polyline class="bound a" points="${pts([[26, 100], [100, 26]])}"/><polyline class="bound c" points="${pts([[0, 74], [74, 0]])}"/>`;
  s += `<text class="zl c" x="${sx(10)}" y="${sy(10)}">C</text><text class="zl b" x="${sx(46)}" y="${sy(46)}">B</text><text class="zl a" x="${sx(86)}" y="${sy(86)}">A</text>`;
  s += `<line class="ax" x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}"/><line class="ax" x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}"/>`;
  s += `<text class="axl" x="${(X0 + X1) / 2}" y="${Y1 + 38}" text-anchor="middle">P · Eintrittswahrscheinlichkeit →</text>`;
  s += `<text class="axl" transform="translate(16 ${(Y0 + Y1) / 2}) rotate(-90)" text-anchor="middle">A · Schadensausmaß →</text>`;
  s += `<line class="conn" id="connX"/><line class="conn" id="connY"/>`;
  s += RISKS.map((r, i) => `<g class="rp" data-r="${r.n}" style="--i:${i}" tabindex="0" role="button" aria-label="Risiko ${r.n}: ${esc(r.t)}, P ${r.p}, A ${r.a}">
      <g class="pp" transform-origin="${sx(r.p)} ${sy(r.a)}"><circle class="ring" cx="${sx(r.p)}" cy="${sy(r.a)}" r="14"/><circle class="dot" cx="${sx(r.p)}" cy="${sy(r.a)}" r="9.5"/><text x="${sx(r.p)}" y="${sy(r.a)}">${r.n}</text></g></g>`).join('');
  svg.innerHTML = s;

  const maxRf = Math.max(...RISKS.map(r => r.rf));
  $('#riskTable tbody').innerHTML = RISKS.map(r => `<tr data-r="${r.n}" tabindex="0">
    <td class="mono" data-l="#">${r.n}</td><td class="main">${esc(r.t)}</td>
    <td class="c mono" data-l="P">${r.p}</td><td class="c mono" data-l="A">${r.a}</td>
    <td data-l="RF"><div class="rf-cell"><span class="rf-bar"><span data-w="${(r.rf / maxRf * 100).toFixed(1)}"></span></span><span class="mono">${r.rf.toLocaleString('de-AT')}</span></div></td>
    <td class="c" data-l="Zone"><span class="zone z${r.z.toLowerCase()}">${r.z}</span></td>
    <td class="c mono" data-l="Verzögerung">${r.w} Wo.</td><td class="r mono" data-l="Kosten">€ ${r.c}</td></tr>`).join('');

  const hot = n => {
    $$('.rp').forEach(g => g.classList.toggle('hot', +g.dataset.r === n));
    $$('#riskTable tbody tr').forEach(tr => tr.classList.toggle('hot', +tr.dataset.r === n));
    const r = RISKS.find(x => x.n === n), cx = $('#connX'), cy = $('#connY');
    if (r) {
      cx.setAttribute('x1', sx(r.p)); cx.setAttribute('y1', sy(r.a)); cx.setAttribute('x2', sx(r.p)); cx.setAttribute('y2', Y1);
      cy.setAttribute('x1', sx(r.p)); cy.setAttribute('y1', sy(r.a)); cy.setAttribute('x2', X0); cy.setAttribute('y2', sy(r.a));
    }
    cx.classList.toggle('on', !!r); cy.classList.toggle('on', !!r);
  };
  const bind = el => {
    const n = +el.dataset.r;
    el.addEventListener('pointerenter', () => hot(n));
    el.addEventListener('pointerleave', () => hot(selRisk));
    el.addEventListener('focus', () => hot(n));
    el.addEventListener('click', () => { stopTour(); selectRisk(n); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRisk(n); } });
  };
  $$('.rp, #riskTable tbody tr').forEach(bind);
  window.__riskHot = hot;
}
let selRisk = 1;
function selectRisk(n) {
  selRisk = n;
  const r = RISKS.find(x => x.n === n);
  $$('.rp').forEach(g => g.classList.toggle('sel', +g.dataset.r === n));
  $$('#riskTable tbody tr').forEach(tr => tr.classList.toggle('sel', +tr.dataset.r === n));
  window.__riskHot(n);
  const zc = { A: 'high', B: 'warn', C: 'ok' }[r.z];
  $('#riskDetail').innerHTML = `<div class="rd-anim" style="display:flex;flex-direction:column;gap:14px">
    <span class="k" style="margin:0">Risiko ${r.n} von ${RISKS.length}</span>
    <div class="rd-top"><span class="rd-num">${r.n}</span><h3>${esc(r.t)}</h3></div>
    <p class="rd-desc">${esc(r.d)}</p>
    <div class="rd-kpis">
      <div class="kpi"><span>P</span><b>${r.p}</b></div>
      <div class="kpi"><span>A</span><b>${r.a}</b></div>
      <div class="kpi"><span>RF</span><b>${r.rf.toLocaleString('de-AT')}</b></div>
      <div class="kpi"><span>Zone</span><b><span class="badge ${zc}">${r.z}</span></b></div>
      <div class="kpi"><span>Verzögerung</span><b>${r.w}<small style="font-size:12px"> Wo.</small></b></div>
      <div class="kpi"><span>Kosten</span><b>€ ${r.c}</b></div>
    </div>
    <div class="rd-meas"><small>Maßnahmen</small>${esc(r.m)}</div></div>`;
}
renderRisk(); selectRisk(1);
const riskObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  if (e.target.id === 'riskSvg') $('.matrix-card').classList.add('risk-in');
  else $$('.rf-bar span', e.target).forEach(s => s.style.width = s.dataset.w + '%');
  riskObs.unobserve(e.target);
}), { threshold: .25 });
riskObs.observe($('#riskSvg')); riskObs.observe($('#riskTable'));

/* ---------------------------------------------------------------------
   12. Meilensteine
   --------------------------------------------------------------------- */
const TL_START = new Date(2026, 8, 1), TL_END = new Date(2027, 5, 1);
const pos = d => clamp((d - TL_START) / (TL_END - TL_START) * 100, 0, 100);
const today = new Date(); today.setHours(0, 0, 0, 0);
const fmt = d => d.toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric' });
const nextIdx = MILESTONES.findIndex(m => m.d >= today);
MILESTONES.forEach((m, i) => { m.status = m.d < today ? 'done' : i === nextIdx ? 'next' : 'plan'; });
const ST_LABEL = { done: 'fällig', next: 'als Nächstes', plan: 'geplant' };
function renderTimeline() {
  const tl = $('#timeline');
  const months = ['Sep', 'Okt', 'Nov', 'Dez', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai'];
  let s = `<div class="tl-track"><div class="tl-fill" id="tlFill"></div></div>`;
  months.forEach((m, i) => {
    const d = new Date(2026, 8 + i, 1);
    s += `<div class="tl-tick" style="left:${pos(d)}%"><span>${m}${i === 0 ? '<em>2026</em>' : i === 4 ? '<em>2027</em>' : ''}</span></div>`;
  });
  const inRange = today >= TL_START && today <= TL_END;
  if (inRange) s += `<div class="tl-today" style="left:${pos(today)}%"><span>Heute · ${fmt(today)}</span></div>`;
  s += MILESTONES.map((m, i) => `<div class="tl-ms ${i % 2 ? 'down' : 'up'} ${m.status}" style="left:${pos(m.d)}%" data-ms="${m.n}">
      <button class="mk" type="button" aria-label="Meilenstein ${m.n}: ${esc(m.t)}, ${m.soll}, ${ST_LABEL[m.status]}">${m.n}</button>
      <div class="lab"><b>MS ${m.n}</b>${m.soll}</div></div>`).join('');
  tl.innerHTML = s;

  /* vertikal (Handy) */
  let v = `<div class="vfill" id="vFill"></div>`;
  let todayPlaced = !inRange;
  MILESTONES.forEach(m => {
    if (!todayPlaced && m.d >= today) { v += `<div class="vtoday"><span>Heute · ${fmt(today)}</span></div>`; todayPlaced = true; }
    v += `<div class="vi ${m.status}"><span class="mk">${m.n}</span><b>${esc(m.t)}</b><small>SOLL ${m.soll} · <span class="st ${m.status}">${ST_LABEL[m.status]}</span></small></div>`;
  });
  if (!todayPlaced) v += `<div class="vtoday"><span>Heute · ${fmt(today)}</span></div>`;
  $('#vtimeline').innerHTML = v;

  $('#msCards').innerHTML = MILESTONES.map((m, i) => `<article class="card ms-card spot" data-ms="${m.n}" data-reveal style="--d:${i % 4}">
      <div class="row"><span class="n">MS ${m.n}</span><span class="st ${m.status}">${ST_LABEL[m.status]}</span></div>
      <h4>${esc(m.t)}</h4><span class="date">SOLL ${m.soll}</span></article>`).join('');
  $$('#msCards [data-reveal]').forEach(el => revealObs.observe(el));
  $('#msTable tbody').innerHTML = MILESTONES.map(m => `<tr><td class="mono" data-l="#">${m.n}</td><td class="main">${esc(m.t)}</td><td class="mono" data-l="SOLL-Termin">${m.soll}</td><td class="mono" data-l="IST-Termin">${m.ist}</td></tr>`).join('');

  const nx = MILESTONES[nextIdx];
  if (nx) {
    const days = Math.round((nx.d - today) / 864e5);
    $('#countdown').innerHTML = `Nächster Meilenstein <b>MS ${nx.n}</b> in <b>${days}</b> ${days === 1 ? 'Tag' : 'Tagen'}`;
  } else $('#countdown').textContent = 'Alle Meilensteine liegen in der Vergangenheit.';

  const hl = n => { $$('.tl-ms, .ms-card').forEach(e => e.classList.toggle('on', +e.dataset.ms === n)); };
  $$('.tl-ms, .ms-card').forEach(e => { e.addEventListener('pointerenter', () => hl(+e.dataset.ms)); e.addEventListener('pointerleave', () => hl(0)); });
  $$('.tl-ms .mk').forEach(b => {
    b.addEventListener('focus', () => hl(+b.parentElement.dataset.ms));
    b.addEventListener('blur', () => hl(0));
    b.addEventListener('click', () => { const c = $(`.ms-card[data-ms="${b.parentElement.dataset.ms}"]`); c?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); hl(+b.parentElement.dataset.ms); });
  });
  const fillTo = inRange ? pos(today) : today > TL_END ? 100 : 0;
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return;
    $('#tlFill').style.width = fillTo + '%';
    const vi = $$('#vtimeline .vi, #vtimeline .vtoday'), vt = $('#vtimeline .vtoday');
    if (vt) $('#vFill').style.height = (vt.offsetTop + vt.offsetHeight / 2) + 'px';
    o.disconnect();
  }), { threshold: .3 }).observe($('.tl-card'));
}
renderTimeline();

/* ---------------------------------------------------------------------
   13. Vorführmodus (Tag der offenen Tür)
   --------------------------------------------------------------------- */
const TOUR = [
  { sel: '#hero', label: 'Synq.', dur: 7000 },
  { sel: '#idee', label: '01 Projektidee', dur: 7000 },
  { sel: '.chamber-wrap', label: '01 Die Kammer', dur: 10000, run: () => { setHotspot(null, false); startAuto(); } },
  { sel: '.db-card', label: '01 −20 dB', dur: 7000 },
  { sel: '.flow', label: '01 Signalweg', dur: 6000 },
  { sel: '#ziele', label: '02 Hauptziele', dur: 8000, run: () => { selectTab($('#tab-h')); } },
  { sel: '#ziele', label: '02 Optionale Ziele', dur: 6000, run: () => selectTab($('#tab-o')) },
  { sel: '#ziele', label: '02 NICHT-Ziele', dur: 6000, run: () => selectTab($('#tab-n')) },
  { sel: '#matrix', label: '2.4 Zuständigkeiten', dur: 7000, run: () => selectTab($('#tab-h')) },
  { sel: '#team', label: '03 Team', dur: 9000 },
  { sel: '#stakeholder', label: '04 Stakeholder', dur: 7000 },
  { sel: '#psp', label: '05 PSP', dur: 8000 },
  { sel: '#risiken', label: '06 Risiken', dur: 12000, run: () => { let i = 0; tourSub = setInterval(() => selectRisk(RISKS[++i % RISKS.length].n), 1700); } },
  { sel: '#meilensteine', label: '07 Meilensteine', dur: 8000 },
  { sel: '#ressourcen', label: '08 Ressourcen', dur: 8000 },
  { sel: '#partner', label: '09 Partner', dur: 7000 },
  { sel: '#verwertung', label: '10 Verwertung', dur: 8000 }
];
let touring = false, tourIdx = 0, tourT = null, tourSub = null, tourStart = 0, idleT = null;
const tourBtn = $('#tourBtn'), hud = $('#tourHud');
const kiosk = /[?&#](tdot|vorfuehrung|kiosk)\b/i.test(location.search + location.hash);
function tourStep() {
  clearInterval(tourSub);
  const st = TOUR[tourIdx % TOUR.length];
  const el = $(st.sel);
  const y = el.getBoundingClientRect().top + scrollY - (st.sel.startsWith('#') ? 0 : 90);
  scrollTo({ top: st.sel === '#hero' ? 0 : y, behavior: reduce ? 'auto' : 'smooth' });
  st.run?.();
  $('#tourLabel').textContent = 'Vorführmodus · ' + st.label;
  tourStart = performance.now(); tourDur = st.dur;
  tourT = setTimeout(() => { tourIdx++; tourStep(); }, st.dur);
}
let tourDur = 1;
function startTour() {
  if (touring) return;
  touring = true; tourIdx = 0;
  document.body.classList.add('touring');
  tourBtn.setAttribute('aria-pressed', 'true'); hud.classList.add('show');
  tourStep();
}
function stopTour() {
  if (!touring) return;
  touring = false; clearTimeout(tourT); clearInterval(tourSub);
  document.body.classList.remove('touring');
  tourBtn.setAttribute('aria-pressed', 'false'); hud.classList.remove('show');
  if (kiosk) armIdle();
}
function armIdle() { clearTimeout(idleT); if (kiosk) idleT = setTimeout(startTour, 60000); }
tourBtn.addEventListener('click', e => { e.stopPropagation(); touring ? stopTour() : startTour(); });
$('#tourStop').addEventListener('click', e => { e.stopPropagation(); stopTour(); });
['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, e => {
  if (e.target.closest?.('#tourBtn, #tourHud')) return;
  if (touring && (ev !== 'keydown' || e.key !== 'Tab')) stopTour();
  armIdle();
}, { passive: true }));
addEventListener('keydown', e => { if (e.key === 'Escape') stopTour(); });
if (kiosk) setTimeout(startTour, 2500);

/* ---------------------------------------------------------------------
   14. Hauptschleife
   --------------------------------------------------------------------- */
function resize() { sizeHero(); sizeDb(); moveInd(tabInd, $('#goalTabs [aria-selected="true"]')); moveInd($('#stateSeg .seg-ind'), $('#stateSeg [aria-pressed="true"]')); }
addEventListener('resize', resize);
resize();
document.fonts?.ready.then(resize);

let t0 = performance.now();
function loop(now) {
  const t = reduce ? 0 : (now - t0) / 1000;
  AudioEngine.update();
  if (heroVisible && !document.hidden) drawHero(t);
  if (dbVisible && !document.hidden) drawDb(t);
  stepRotation();
  if (touring) $('#tourBar').style.width = clamp((now - tourStart) / tourDur * 100, 0, 100) + '%';
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
setTimeout(() => root.classList.add('is-ready'), 60);
setTimeout(() => root.classList.add('anim-done'), 2600); /* Sicherheitsnetz: Titel immer sichtbar */
})();
