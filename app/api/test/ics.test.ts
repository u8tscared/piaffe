import { describe, it, expect } from "vitest";
import { call, env, seed } from "./helpers";
import { putRecord } from "./mail-kit";
import { calendar, escText, fold, firstOnOrAfter, weeklyRule } from "../src/ics/ics";

const unfold = (s: string) => s.replace(/\r\n /g, "");
const enc = new TextEncoder();

async function clubWithData() {
  const owner = await seed("owner");
  const c = owner.clubId;
  await putRecord(c, "club", "_", { arenas: [{ id: "a1", name: "Grand manège" }, { id: "a2", name: "Carrière d'honneur" }] });
  await putRecord(c, "members", "m001", { first: "Léa", last: "Martin", fam: "F1", email: "lea@exemple.fr" });
  await putRecord(c, "members", "m002", { first: "Zoé", last: "Martin", fam: "F1" });
  await putRecord(c, "members", "m003", { first: "Tom", last: "Durand", fam: "F3" });
  await putRecord(c, "staff", "s02", { first: "Hugo", last: "Lefèvre" });
  await putRecord(c, "coaches", "c01", { first: "Pauline", last: "Arnaud" });
  await putRecord(c, "horses", "h01", { name: "Ulysse de la Roche", owner: "m001", box: "B01" });
  await putRecord(c, "horses", "h02", { name: "Quiétude" });
  await putRecord(c, "lessons", "l01", { dow: 3, start: "17:00", dur: 60, title: "Galop 3-4", coach: "s02", arena: "a1", riders: ["m002"], horses: { m002: "h02" }, cap: 10, cancelled: ["2026-11-25"] });
  await putRecord(c, "lessons", "l02", { dow: 1, start: "18:00", dur: 60, title: "Galop 6-7, CSO", coach: "s02", arena: "a2", riders: ["m003"], horses: {}, cap: 8 });
  await putRecord(c, "care", "s1", { horse: "h01", kind: "Maréchal", who: "Benoît Gautier", date: "2026-12-02", time: "09:00", note: "Ferrure complète; plaques" });
  await putRecord(c, "care", "s2", { horse: "h02", kind: "Vaccin", date: "2026-12-03", time: "10:00" });
  await putRecord(c, "competitions", "k1", { name: "CSO Club et Poney", place: "Rambouillet", date: "2026-12-05", disc: "CSO" });
  await putRecord(c, "entries", "e1", { comp: "k1", rider: "m001", horse: "h01", class: "Club Élite", coach: "c01" });
  await putRecord(c, "coachBookings", "b01", { coach: "c01", riders: ["m001"], horse: "h01", date: "2026-12-01", t: "11:15", dur: 60, arena: "a2", type: "Cours particulier CSO", status: "confirmée" });
  return owner;
}

describe("format iCalendar", () => {
  it("plie les lignes à 75 octets sans couper un caractère accentué", () => {
    const long = "DESCRIPTION:" + "Équitation éthologique à l'écurie des Tilleuls, ".repeat(6);
    const f = fold(long);
    for (const l of f.split("\r\n")) expect(enc.encode(l).length).toBeLessThanOrEqual(75);
    expect(f.split("\r\n").slice(1).every((l) => l.startsWith(" "))).toBe(true);
    expect(unfold(f)).toBe(long);
  });
  it("échappe virgules, points-virgules, barres obliques et retours à la ligne", () => {
    expect(escText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });
  it("produit un calendrier valide : CRLF, VTIMEZONE, RRULE, EXDATE, VALARM", () => {
    const ics = calendar("Test", [{ uid: "lesson-l01@x", summary: "Galop 3", date: firstOnOrAfter("2026-09-01", 3), time: "17:00", durationMin: 90, rrule: weeklyRule(3), exdates: ["2026-11-25"], updatedAt: "2026-11-01T10:00:00Z" }], { alarmMin: 60 });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
    expect(ics).toContain("BEGIN:VTIMEZONE\r\nTZID:Europe/Paris");
    expect(ics).toContain("DTSTART;TZID=Europe/Paris:20260902T170000");
    expect(ics).toContain("DTEND;TZID=Europe/Paris:20260902T183000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=WE");
    expect(ics).toContain("EXDATE;TZID=Europe/Paris:20261125T170000");
    expect(ics).toContain("DTSTAMP:20261101T100000Z");
    expect(ics).toContain("TRIGGER:-PT60M");
  });
});

describe("abonnements de calendrier", () => {
  it("adhérent : liens prêts pour Google, Apple et Outlook, flux de sa famille uniquement", async () => {
    const o = await clubWithData();
    const m = await seed("member", { clubId: o.clubId, personRef: "m001" });
    const r = await call("/api/calendars", { method: "POST", token: m.token, json: { scope: "member", alarm_minutes: 30 } });
    expect(r.status).toBe(201);
    const j: any = await r.json();
    expect(j.links.webcal).toMatch(/^webcal:\/\/piaffe\.test\/ics\/cal_.+\.ics$/);
    expect(j.links.google).toBe("https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(j.links.webcal));
    expect(j.links.outlook).toContain("outlook.live.com/calendar/0/addfromweb?url=");
    const f = await call(j.links.url.replace("http://piaffe.test", ""));
    expect(f.status).toBe(200);
    expect(f.headers.get("content-type")).toContain("text/calendar");
    expect(f.headers.get("cache-control")).toContain("max-age=300");
    const ics = unfold(await f.text());
    expect(ics).toContain("UID:lesson-l01@" + o.clubId + ".piaffe.app");
    expect(ics).toContain("SUMMARY:Zoé : Galop 3-4");     // reprise de la fille (même foyer)
    expect(ics).not.toContain("Galop 6-7");               // reprise d'un autre cavalier
    expect(ics).toContain("SUMMARY:Maréchal · Ulysse de la Roche");
    expect(ics).toContain("Ferrure complète\\; plaques");
    expect(ics).not.toContain("Quiétude ·");               // soin d'un cheval qui n'est pas à elle
    expect(ics).toContain("SUMMARY:CSO · CSO Club et Poney");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261205");
    expect(ics).toContain("SUMMARY:Léa : Cours particulier CSO");
    expect(ics).toContain("LOCATION:Grand manège\\, Écurie Test");
    expect(ics).toContain("EXDATE;TZID=Europe/Paris:20261125T170000");
    expect(ics).toContain("TRIGGER:-PT30M");
    const list: any = await (await call("/api/calendars", { token: m.token })).json();
    expect(list.calendars[0].links.url).toBe(j.links.url);
  });
  it("jeton révoqué ou inconnu → 404 ; jeton haché en base", async () => {
    const o = await clubWithData();
    const m = await seed("member", { clubId: o.clubId, personRef: "m001" });
    const j: any = await (await call("/api/calendars", { method: "POST", token: m.token, json: { scope: "member" } })).json();
    const path = j.links.url.replace("http://piaffe.test", "");
    const token = path.slice(5, -4);
    const row = await env.DB.prepare("SELECT token_hash FROM calendar_feeds WHERE id = ?").bind(j.id).first<any>();
    expect(row.token_hash).not.toContain(token);
    expect((await call(`/api/calendars/${j.id}`, { method: "DELETE", token: m.token })).status).toBe(200);
    expect((await call(path)).status).toBe(404);
    expect((await call("/ics/cal_" + "x".repeat(40) + ".ics")).status).toBe(404);
    expect((await call("/ics/n-importe-quoi.ics")).status).toBe(404);
  });
  it("droits : planning du club réservé à l'équipe, cheval réservé à son propriétaire", async () => {
    const o = await clubWithData();
    const m = await seed("member", { clubId: o.clubId, personRef: "m001" });
    expect((await call("/api/calendars", { method: "POST", token: m.token, json: { scope: "club" } })).status).toBe(403);
    expect((await call("/api/calendars", { method: "POST", token: m.token, json: { scope: "horse", horse_id: "h02" } })).status).toBe(403);
    expect((await call("/api/calendars", { method: "POST", token: m.token, json: { scope: "horse", horse_id: "h01" } })).status).toBe(201);
    expect((await call("/api/calendars", { method: "POST", token: m.token, json: { scope: "nope" } })).status).toBe(400);
    const acc = await seed("accountant", { clubId: o.clubId });
    expect((await call("/api/calendars", { method: "POST", token: acc.token, json: { scope: "club" } })).status).toBe(403);
    const st = await seed("staff", { clubId: o.clubId });
    const j: any = await (await call("/api/calendars", { method: "POST", token: st.token, json: { scope: "club" } })).json();
    const ics = unfold(await (await call(j.links.url.replace("http://piaffe.test", ""))).text());
    expect(ics).toContain("Galop 6-7\\, CSO");
    expect(ics).toContain("Vaccin · Quiétude");
  });
  it("coach : son agenda (reprises, cours particuliers, concours de ses élèves)", async () => {
    const o = await clubWithData();
    const coach = await seed("coach", { clubId: o.clubId, personRef: "c01" });
    const j: any = await (await call("/api/calendars", { method: "POST", token: coach.token, json: { scope: "coach" } })).json();
    const ics = unfold(await (await call(j.links.url.replace("http://piaffe.test", ""))).text());
    expect(ics).toContain("Cours particulier CSO · Léa Martin");
    expect(ics).toContain("CSO Club et Poney");
    expect(ics).not.toContain("Galop 3-4");
    expect(ics).not.toContain("Maréchal");
  });
  it("un utilisateur retiré du club perd son flux ; un autre club ne voit jamais ces données", async () => {
    const o = await clubWithData();
    const m = await seed("member", { clubId: o.clubId, personRef: "m001" });
    const j: any = await (await call("/api/calendars", { method: "POST", token: m.token, json: { scope: "member" } })).json();
    const path = j.links.url.replace("http://piaffe.test", "");
    await env.DB.prepare("UPDATE memberships SET status = 'suspended' WHERE user_id = ?").bind(m.userId).run();
    expect((await call(path)).status).toBe(404);
    const other = await seed("owner");
    const j2: any = await (await call("/api/calendars", { method: "POST", token: other.token, json: { scope: "club" } })).json();
    const ics = await (await call(j2.links.url.replace("http://piaffe.test", ""))).text();
    expect(ics).not.toContain("Galop");
    expect(ics).not.toContain("Ulysse");
  });
  it("ajout d'un seul événement : prochaine séance d'une reprise, ou la série", async () => {
    const o = await clubWithData();
    const m = await seed("member", { clubId: o.clubId, personRef: "m002" });
    const r = await call("/api/calendars/event/lessons/l01.ics", { token: m.token });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-disposition")).toContain("attachment");
    const ics = unfold(await r.text());
    expect(ics).not.toContain("RRULE:FREQ=WEEKLY");
    expect(ics).toMatch(/DTSTART;TZID=Europe\/Paris:\d{8}T170000/);
    const serie = unfold(await (await call("/api/calendars/event/lessons/l01.ics?serie=1", { token: m.token })).text());
    expect(serie).toContain("RRULE:FREQ=WEEKLY;BYDAY=WE");
    expect((await call("/api/calendars/event/lessons/l02.ics", { token: m.token })).status).toBe(404);
    expect((await call("/api/calendars/event/members/m001.ics", { token: m.token })).status).toBe(400);
  });
});
