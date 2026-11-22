"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Chev, ExtLink, host, mapsUrl } from "@/components/sourced";
import { FIRST_WEEK as FW } from "@/content/first-week";

// Office card actions row plus its collapsible Source panel (prototype fwOffice srcbtn).
export function OfficeSource({ id, name, maps, pageRef, children }: { id: string; name: string; maps: ReactNode; pageRef: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="fw-acts">
        {maps}
        <button type="button" className="fw-srcbtn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          Source<span className="res-vh"> for {name}</span>
          <Chev className="fw-chev" />
        </button>
        {pageRef}
      </div>
      <div className="fw-osrc" id={id} hidden={!open}>
        {children}
      </div>
    </>
  );
}

// Room lookup: exact match on the whole code, case-insensitive; a Map means typed text never reaches prototype members.
const ROOMS: Record<string, { corp: string; floor: number }> = FW.rooms.table;
const INDEX = new Map(Object.keys(ROOMS).map((k) => [k.toLowerCase(), k]));
const norm = (v: string) => v.replace(/\s+/g, "").toLowerCase();

export function roomInfo(code: string) {
  const key = INDEX.get(norm(code));
  if (!key) return null;
  const r = ROOMS[key];
  const b = FW.roomBuildings.find((x) => x.corps.includes(r.corp));
  return b ? { code: key, corp: r.corp, floor: r.floor, b } : null;
}

const Line = ({ l, v }: { l: string; v: string }) => (
  <p className="fw-line">
    <span className="fw-lbl">{l}:</span> {v}
  </p>
);

function Result({ q }: { q: string }) {
  if (!norm(q)) return <p className="muted">Type a room code, for example B426.</p>;
  const i = roomInfo(q);
  if (!i)
    return (
      <div className="fw-result">
        <p>Not in our map yet. Check the code, or open the official UPT map.</p>
        <div className="fw-acts">
          <ExtLink url={FW.officialMap.url} className="fw-act">{FW.officialMap.label}</ExtLink>
        </div>
      </div>
    );
  const s = i.b.source;
  return (
    <div className="fw-result">
      <Line l="Building" v={i.b.name + ", " + i.b.address} />
      <Line l="Wing" v={"Corp " + i.corp} />
      <Line l="Floor" v={i.floor === 0 ? "0 (ground floor)" : String(i.floor)} />
      <Line l="Room" v={i.code} />
      <div className="fw-acts">
        <ExtLink url={mapsUrl(i.b.mapsQuery)} className="fw-act">Open in Maps</ExtLink>
      </div>
      <div className="fw-roomsrc">
        <p className="muted">Room data: official UPT map (maps.upt.ro).</p>
        <blockquote cite={s.url}>{s.quote}</blockquote>
        <p>
          <ExtLink url={s.url}>{"Source: " + host(s.url)}</ExtLink>
        </p>
        {i.b.note && <p className="muted">{i.b.note}</p>}
      </div>
    </div>
  );
}

export function RoomSearch() {
  const [q, setQ] = useState<string | null>(null);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQ(String(new FormData(e.currentTarget).get("room") ?? ""));
  };
  return (
    <div id="fwRoomBox">
      <form className="fw-room" role="search" noValidate onSubmit={submit}>
        <label htmlFor="fwRoom">Room code</label>
        <div className="fw-room-row">
          <input
            type="text"
            id="fwRoom"
            name="room"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            placeholder="Room code, e.g. B426, A117"
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </div>
      </form>
      <div id="fwRoomResult" aria-live="polite">
        {q !== null && <Result q={q} />}
      </div>
    </div>
  );
}
