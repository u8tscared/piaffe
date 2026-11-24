// Agenda au format iCalendar (.ics) exporté de Google Agenda, Outlook, Calendly… -> tableau de reprises.
export function estICS(texte) { return /^\s*BEGIN:VCALENDAR/.test(texte); }

export function tableDeICS(texte) {
  const brut = texte.replace(/\r?\n[ \t]/g, '');   // lignes repliées
  const lignes = [['Reprise', 'Date', 'Heure début', 'Heure fin', 'Jour', 'Lieu', 'Notes', 'Récurrence']];
  const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  for (const ev of brut.split('BEGIN:VEVENT').slice(1)) {
    const v = k => { const m = ev.match(new RegExp('^' + k + '(?:;[^:\\n]*)?:(.*)$', 'm')); return m ? m[1].trim().replace(/\\n/g, ' ').replace(/\\([,;\\])/g, '$1') : ''; };
    const d = s => { const m = s.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/); return m ? { date: `${m[1]}-${m[2]}-${m[3]}`, heure: m[4] ? `${m[4]}:${m[5]}` : '' } : { date: '', heure: '' }; };
    const a = d(v('DTSTART')), b = d(v('DTEND'));
    const rr = v('RRULE');
    lignes.push([v('SUMMARY'), rr ? '' : a.date, a.heure, b.heure, a.date ? JOURS[new Date(a.date + 'T12:00:00Z').getUTCDay()] : '', v('LOCATION'), v('DESCRIPTION'), rr]);
  }
  return lignes;
}
