import { Fragment, type ReactNode } from "react";
import { actionLinks, ExtLink, host, InfoNotice, mapsUrl, SourceBox } from "@/components/sourced";
import { Step } from "@/components/step";
import { FIRST_WEEK as FW } from "@/content/first-week";
import { OfficeSource, RoomSearch } from "./client";

const maps = (q: string | null | undefined) =>
  q ? <ExtLink key="maps" url={mapsUrl(q)} className="fw-act">Open in Maps</ExtLink> : null;
const acts = (h: ReactNode[]) => (h.some(Boolean) ? <div className="fw-acts">{h}</div> : null);

function Day({ d }: { d: (typeof FW.firstDays)[number] }) {
  return (
    <>
      <p>{d.summary}</p>
      {d.instructions.length > 0 && (
        <ol className="fw-list">
          {d.instructions.map((x) => <li key={x}>{x}</li>)}
        </ol>
      )}
      {d.where.length > 0 && (
        <>
          <h4 className="fw-sub">Where to go</h4>
          {d.where.map((w) => (
            <div className="fw-where" key={w.name}>
              <b>{w.name}</b>
              {(w.address != null || w.hours != null) && (
                <dl className="kv">
                  {w.address != null && (
                    <>
                      <dt>Address</dt>
                      <dd>{w.address}</dd>
                    </>
                  )}
                  {w.hours != null && (
                    <>
                      <dt>Opening hours</dt>
                      <dd>{w.hours}</dd>
                    </>
                  )}
                </dl>
              )}
              {acts([maps(w.mapsQuery)])}
            </div>
          ))}
        </>
      )}
      {acts(actionLinks(d.actions, "fw-act"))}
      <SourceBox source={d.source} />
    </>
  );
}

function Office({ o, i }: { o: (typeof FW.whoToAsk)[number]; i: number }) {
  const shown = o.phoneDisplay ?? o.phone;
  const phone = o.phone != null && (/^\+\d{6,}$/.test(o.phone) ? <a className="fw-act" href={`tel:${o.phone}`}>{shown}</a> : shown);
  return (
    <article className="fw-office">
      <div className="fw-oname">
        <h3>{o.name}</h3>
      </div>
      <dl className="kv">
        {o.place && (
          <>
            <dt>Where</dt>
            <dd>{o.place}</dd>
          </>
        )}
        {o.address && (
          <>
            <dt>Address</dt>
            <dd>{o.address}</dd>
          </>
        )}
        {o.hoursLines.length > 0 && (
          <>
            <dt>Opening hours</dt>
            <dd>
              <ul className="fw-lines">
                {o.hoursLines.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </dd>
          </>
        )}
        {phone && (
          <>
            <dt>Phone</dt>
            <dd>{phone}</dd>
          </>
        )}
        {o.email && (
          <>
            <dt>Email</dt>
            <dd>
              <a className="fw-act" href={`mailto:${o.email}`}>{o.email}</a>
            </dd>
          </>
        )}
      </dl>
      {o.note && <p className="muted fw-note">{o.note}</p>}
      <OfficeSource
        id={`fwo-${i}`}
        name={o.name}
        maps={maps(o.mapsQuery)}
        pageRef={o.source.pageRef ? <span className="fw-ref">{o.source.pageRef}</span> : null}
      >
        <SourceBox source={o.source} />
      </OfficeSource>
    </article>
  );
}

function buildingGroups() {
  const B = FW.buildings;
  const fac = B.filter((b) => b.id === "ac").concat(B.filter((b) => b.kind === "faculty" && b.id !== "ac"));
  const svc = ["rectorate", "library", "clinic", "canteen"].flatMap((k) => B.filter((b) => b.kind === k));
  return (
    [
      ["Faculties", fac],
      ["Services", svc],
      ["Student residences", B.filter((b) => b.kind === "residence")],
    ] as const
  ).filter((g) => g[1].length);
}

export default function FirstWeekPage() {
  return (
    <div id="v-firstweek">
      <div className="fw">
        <h1>First week</h1>
        <p className="muted" style={{ margin: 0 }}>
          Who to ask, where each building is, and what to do in your first days.
        </p>
        <InfoNotice />
        <section aria-labelledby="fwH-days">
          <h2 id="fwH-days">First 7 days</h2>
          <div id="fwDays">
            {FW.firstDays.map((d, i) => (
              <Step key={d.id} p="fw" id={`fwd-${i}`} n={i + 1} title={d.title}>
                <Day d={d} />
              </Step>
            ))}
          </div>
        </section>
        <section aria-labelledby="fwH-who">
          <h2 id="fwH-who">Who to ask</h2>
          <div id="fwWho">
            {FW.whoToAsk.map((o, i) => (
              <Office key={o.id} o={o} i={i} />
            ))}
          </div>
        </section>
        <section aria-labelledby="fwH-bld">
          <h2 id="fwH-bld">Buildings</h2>
          <div id="fwBuildings">
            <p>
              <ExtLink url={FW.officialMap.url} className="btn btn-outline fw-mapbtn">{FW.officialMap.label}</ExtLink>
            </p>
            {buildingGroups().map(([title, list]) => (
              <Fragment key={title}>
                <h3 className="fw-sub">{title}</h3>
                <ul className="fw-blist">
                  {list.map((b) => (
                    <li className="fw-bld" key={b.id} data-id={b.id}>
                      <h4 className="fw-bname">{b.name}</h4>
                      <p>{b.address}</p>
                      {b.note && <p className="muted fw-note">{b.note}</p>}
                      {acts([
                        maps(b.mapsQuery),
                        <ExtLink key="src" url={b.source.url} className="fw-act">{"Source: " + host(b.source.url)}</ExtLink>,
                        b.source.pageRef ? <span key="ref" className="res-ref">{b.source.pageRef}</span> : null,
                      ])}
                    </li>
                  ))}
                </ul>
              </Fragment>
            ))}
          </div>
        </section>
        <section aria-labelledby="fwH-room">
          <h2 id="fwH-room">Where is my room?</h2>
          <RoomSearch />
        </section>
        <section aria-labelledby="fwH-cls">
          <h2 id="fwH-cls">Your classes by building</h2>
          <div id="fwClasses">
            {/* The prototype grouped a sample timetable here; the app has no schedule until Phase 3. */}
            <p className="muted">Your classes appear here once the schedule builder is ready.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
