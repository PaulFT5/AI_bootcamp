"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Step } from "@/components/step";
import { actionLinks, ExtLink, host, mapsUrl, SourceBox } from "@/components/sourced";
import { RESOURCES } from "@/content/resources";

type Aud = "eu" | "non-eu";
type StepData = (typeof RESOURCES.steps)[number];
type Mission = (typeof RESOURCES.embassies.countries)[number]["missions"][number];
type Place = {
  address?: string | null;
  hours?: string | null;
  hoursLines?: string[];
  phone?: string | null;
  phoneDisplay?: string | null;
  phoneExtra?: string;
  email?: string | null;
};

const AUD_KEY = "eupt2-resAud"; // same key as the prototype
const KIND: Record<string, string> = { office: "Office", embassy: "Embassy or consulate", online: "Online" };
const MKIND: Record<string, string> = {
  embassy: "Embassy",
  consulate: "Consulate",
  "honorary-consulate": "Honorary consulate",
  "consular-agency": "Consular agency",
};
const MAIL = (
  <a className="res-act" href="mailto:incoming@upt.ro">
    incoming@upt.ro
  </a>
);
const NP_OFFICE = <>Not published. Confirm with {MAIL}</>;
const NP_EMB = "Not published. Confirm on the embassy contact page";

const countries = (aud: Aud) =>
  RESOURCES.embassies.countries
    .map((c, k) => ({ c, k }))
    .filter(({ c }) => (aud === "eu" ? c.group === "eu" || c.group === "eea" : c.group === "non-eu"));

function tel(s: string) {
  const t = s.replace("(0)", "");
  return "tel:" + (/^\s*\+/.test(t) ? "+" : "") + t.replace(/\D/g, "");
}
const dialable = (s: string) => tel(s).replace(/\D/g, "").length >= 6;

// Display text wins; otherwise every number-looking run in the raw text becomes a tel: link.
function Phone({ raw, display }: { raw: string; display?: string | null }) {
  if (display != null) return dialable(raw) ? <a className="res-act" href={tel(raw)}>{display}</a> : <>{display}</>;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of raw.matchAll(/\+?\d[\d\s.\-()]{5,}\d/g)) {
    out.push(raw.slice(last, m.index));
    out.push(dialable(m[0]) ? <a key={m.index} className="res-act" href={tel(m[0])}>{m[0]}</a> : m[0]);
    last = m.index + m[0].length;
  }
  out.push(raw.slice(last));
  return <>{out}</>;
}

function Row({ label, value, np }: { label: string; value: ReactNode; np: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      {value ? (
        <dd>{value}</dd>
      ) : (
        <dd className="res-np">
          <span>{np}</span>
        </dd>
      )}
    </>
  );
}

function Rows({ o, np }: { o: Place; np: ReactNode }) {
  const hours = o.hoursLines?.length ? (
    <ul className="res-lines">
      {o.hoursLines.map((l) => <li key={l}>{l}</li>)}
    </ul>
  ) : (
    o.hours
  );
  const phone = o.phone != null && (
    <>
      <Phone raw={o.phone} display={o.phoneDisplay} />
      {o.phoneExtra && <div className="res-extra">{o.phoneExtra}</div>}
    </>
  );
  return (
    <>
      <Row label="Address" value={o.address} np={np} />
      <Row label="Opening hours" value={hours} np={np} />
      <Row label="Phone" value={phone} np={np} />
      {o.email && (
        <>
          <dt>Email</dt>
          <dd>
            <a className="res-act" href={`mailto:${o.email}`}>{o.email}</a>
          </dd>
        </>
      )}
    </>
  );
}

function Where({ w }: { w: StepData["where"][number] }) {
  const head = (
    <div className="res-wname">
      <b>{w.name}</b>
      <span className="res-kind">{KIND[w.kind] || w.kind}</span>
    </div>
  );
  if (w.kind === "online") {
    const has = w.email || w.phone != null;
    return (
      <div className="res-where">
        {head}
        {has && (
          <dl className="kv">
            {w.email && (
              <>
                <dt>Email</dt>
                <dd>
                  <a className="res-act" href={`mailto:${w.email}`}>{w.email}</a>
                </dd>
              </>
            )}
            {w.phone != null && (
              <>
                <dt>Phone</dt>
                <dd>
                  <Phone raw={w.phone} display={w.phoneDisplay} />
                </dd>
              </>
            )}
          </dl>
        )}
        <div className="res-acts">
          {w.url && <ExtLink url={w.url} className="res-act">Open the website</ExtLink>}
        </div>
      </div>
    );
  }
  const acts = (w.mapsQuery || w.url) && (
    <div className="res-acts">
      {w.mapsQuery && <ExtLink url={mapsUrl(w.mapsQuery)} className="res-act">Open in Google Maps</ExtLink>}
      {w.url && <ExtLink url={w.url} className="res-act">{w.urlLabel || "Website"}</ExtLink>}
    </div>
  );
  return (
    <div className="res-where">
      {head}
      <dl className="kv">
        <Rows o={w} np={w.kind === "embassy" ? NP_EMB : NP_OFFICE} />
      </dl>
      {acts}
    </div>
  );
}

function MissionCard({ m }: { m: Mission }) {
  const kind = MKIND[m.kind] || m.kind.replace(/-/g, " ").replace(/^./, (x) => x.toUpperCase());
  return (
    <div className="res-mission">
      <div className="res-wname">
        <b>{m.name}</b>
      </div>
      <div className="muted">
        {kind}
        {m.city ? " · " + m.city : ""}
      </div>
      <dl className="kv">
        <Rows o={m} np={NP_EMB} />
      </dl>
      {m.mapsQuery && (
        <div className="res-acts">
          <ExtLink url={mapsUrl(m.mapsQuery)} className="res-act">Open in Google Maps</ExtLink>
        </div>
      )}
      {m.whatFor.length > 0 && (
        <>
          <h5 className="res-sub">What they can help with</h5>
          <ul className="res-lines">
            {m.whatFor.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </>
      )}
      {m.note && <p className="muted res-mnote">{m.note}</p>}
      {m.source?.url && (
        <p className="res-mrc">
          <ExtLink url={m.source.url}>{"Source: " + host(m.source.url)}</ExtLink>
          {m.source.verified ? ` · Verified: ${m.source.verified}` : ""}
        </p>
      )}
    </div>
  );
}

function EmbassySelect({ aud }: { aud: Aud }) {
  const [v, setV] = useState("");
  const cs = countries(aud).sort((a, b) => a.c.country.localeCompare(b.c.country, "en"));
  const c = v && v !== "other" ? RESOURCES.embassies.countries[+v] : null;
  const fb = RESOURCES.embassies.fallback;
  return (
    <div className="res-emb">
      <label htmlFor="embCountry">Choose your country</label>
      <select id="embCountry" value={v} onChange={(e) => setV(e.target.value)}>
        <option value="">Select a country</option>
        {cs.map(({ c, k }) => (
          <option key={k} value={k}>{c.country}</option>
        ))}
        <option value="other">My country is not listed</option>
      </select>
      <div id="embResult" aria-live="polite">
        {v &&
          (c && c.hasData && c.missions.length ? (
            c.missions.map((m) => <MissionCard key={m.name} m={m} />)
          ) : (
            <div className="res-fallback">
              <p>
                We have no checked details for this country yet. Find your embassy in the official list from the
                Ministry of Foreign Affairs of Romania (MAE).
              </p>
              <ExtLink url={fb.url} className="res-act">{fb.label}</ExtLink>
            </div>
          ))}
      </div>
    </div>
  );
}

function Body({ s, aud }: { s: StepData; aud: Aud }) {
  const dl = aud === "eu" && typeof s.deadlineEU === "string" ? s.deadlineEU : s.deadline;
  const acts = actionLinks(s.actions, "res-act");
  return (
    <>
      <p>{s.summary}</p>
      {dl && (
        <p>
          <b>Deadline:</b> {dl}
        </p>
      )}
      {s.instructions.length > 0 && (
        <ol className="res-list">
          {s.instructions.map((x) => <li key={x}>{x}</li>)}
        </ol>
      )}
      {s.note && (
        <p className="muted">
          <b>Note:</b> {s.note}
        </p>
      )}
      {s.bring.length > 0 && (
        <>
          <h4 className="res-sub">Documents to bring</h4>
          <ul className="res-list">
            {s.bring.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </>
      )}
      {s.type === "embassy-selector" && <EmbassySelect key={aud} aud={aud} />}
      {s.where.length > 0 && (
        <>
          <h4 className="res-sub">Where to go</h4>
          {s.where.map((w) => <Where key={w.name} w={w} />)}
        </>
      )}
      {acts.length > 0 && <div className="res-acts">{acts}</div>}
      <SourceBox source={s.source} />
    </>
  );
}

const TOPICS = [
  ["all", "All"],
  ["start", "Get started"],
  ["stay", "Stay & health"],
  ["bring", "What to bring"],
] as const;

export function ResourceSteps() {
  const [aud, setAud] = useState<Aud | null>(null);
  const [topic, setTopic] = useState("all");

  // Remember the citizenship choice like the prototype did; storage may be blocked, so never fail on it.
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(AUD_KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only storage can only be read after hydration
      if (v === "eu" || v === "non-eu") setAud(v);
    } catch {}
  }, []);
  const chooseAud = (v: Aud) => {
    setAud(v);
    try {
      localStorage.setItem(AUD_KEY, JSON.stringify(v));
    } catch {}
  };

  const steps = RESOURCES.steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => (s.audience === "all" || s.audience === aud) && (topic === "all" || s.topic === topic));
  let n = 0;
  const group = (a: Aud, phase: string, title: string) => {
    const items = steps.filter(({ s }) => s.phase === phase);
    return (
      items.length > 0 && (
        <>
          <h2>{title}</h2>
          {items.map(({ s, i }) => (
            <Step key={s.id} p="res" id={`rs-${i}`} n={++n} title={s.title}>
              <Body s={s} aud={a} />
            </Step>
          ))}
        </>
      )
    );
  };

  return (
    <>
      <fieldset className="res-seg">
        <legend>Your citizenship</legend>
        <div className="res-seg-track">
          <label>
            <input type="radio" name="resAud" value="eu" checked={aud === "eu"} onChange={() => chooseAud("eu")} />
            EU / EEA
          </label>
          <label>
            <input type="radio" name="resAud" value="non-eu" checked={aud === "non-eu"} onChange={() => chooseAud("non-eu")} />
            Non-EU
          </label>
        </div>
        <p className="muted res-hint">EU / EEA means the 27 EU countries plus Iceland, Liechtenstein and Norway.</p>
      </fieldset>
      <fieldset className="res-topic" hidden={!aud}>
        <legend className="res-vh">Topic</legend>
        <div className="res-topic-track">
          {TOPICS.map(([v, label]) => (
            <label key={v}>
              <input type="radio" name="resTopic" value={v} checked={topic === v} onChange={() => setTopic(v)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div id="resList">
        {!aud ? (
          <p className="muted">Choose EU / EEA or Non-EU to see your steps.</p>
        ) : steps.length === 0 ? (
          <p className="muted">No steps in this topic for your citizenship. Choose All to see every step.</p>
        ) : (
          <>
            {group(aud, "before-arrival", "Before you arrive")}
            {group(aud, "after-arrival", "After you arrive")}
          </>
        )}
      </div>
    </>
  );
}
