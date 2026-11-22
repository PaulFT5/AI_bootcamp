// Upload extraction smoke (MATCH-04, D-20). One real Gemini call on the sample PDF; every other check is local.
// Needs `npm run build`. Run: npm run smoke:extract
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { withServer } from "./lib/with-server";

const SAMPLE = new Uint8Array(readFileSync(join(__dirname, "fixtures", "syllabus-sample.pdf")));

async function main() {
  await withServer(async (base) => {
    const send = (bytes: Uint8Array<ArrayBuffer>, name: string, type: string) => {
      const body = new FormData();
      body.append("file", new Blob([bytes], { type }), name);
      return fetch(base + "/api/extract", { method: "POST", body });
    };
    const message = async (res: Response) => ((await res.json()) as { message: string }).message;

    // local rejections first: they never reach Gemini
    const fake = await send(new TextEncoder().encode("just some text"), "x.pdf", "application/pdf");
    assert.equal(fake.status, 415, "text renamed to .pdf");
    assert.equal(await message(fake), "Upload a PDF, PNG or JPEG file.");

    const empty = await send(new Uint8Array(0), "empty.pdf", "application/pdf");
    assert.equal(empty.status, 400, "0-byte file");
    assert.equal(await message(empty), "The file is empty.");

    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    big.set(new TextEncoder().encode("%PDF-1.4"));
    const tooBig = await send(big, "big.pdf", "application/pdf");
    assert.equal(tooBig.status, 413, "10,485,761 bytes");
    assert.match(await message(tooBig), /The limit is 10 MB/);

    const noFile = await fetch(base + "/api/extract", { method: "POST", body: new FormData() });
    assert.equal(noFile.status, 400, "no file field");

    // the one Gemini call; the name says PNG to prove the type comes from the bytes
    const res = await send(SAMPLE, "looks-like.png", "image/png");
    assert.equal(res.status, 200, `extract sample (${await res.clone().text()})`);
    const x = (await res.json()) as { name: string; ects: number | null; studyYear: number | null; topics: string[] };
    console.log(`extracted: ${x.name} | ${x.ects} ECTS | year ${x.studyYear} | ${x.topics.join("; ")}`);
    assert.match(x.name, /operating systems/i);
    assert.equal(x.ects, 6);
    assert.ok(x.topics.length >= 3, "at least 3 topics");
  });
  console.log("SMOKE EXTRACT OK");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
