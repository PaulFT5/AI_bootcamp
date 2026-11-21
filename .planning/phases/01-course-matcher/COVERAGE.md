# API Coverage — Anthropic Claude API (Messages API via @anthropic-ai/sdk 1.12.0)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Phase 1 uses Claude for three single-shot structured calls: shortlist + rank/explain (runtime, `claude-sonnet-5-5`), syllabus upload extraction (runtime) and fișă topic extraction (offline, `claude-opus-5-5`). A second external service, Voyage AI embeddings, is opted out as a whole (last row).

| capability | decision | reason |
|---|---|---|
| messages.parse structured outputs (output_config.format + zodOutputFormat) | INTEGRATE | |
| effort control (output_config.effort low/medium) | INTEGRATE | |
| adaptive thinking (default, no thinking param sent) | INTEGRATE | |
| prompt caching (system block cache_control, ttl 1h) | INTEGRATE | |
| PDF document input (base64 document block) | INTEGRATE | |
| image input (base64 PNG/JPEG block) | INTEGRATE | |
| refusal handling (stop_reason refusal + parsed_output null guard) | INTEGRATE | |
| usage reporting (cache_read_input_tokens check in golden.ts) | INTEGRATE | |
| server-side refusal fallbacks (fallbacks param, beta header) | OPT-OUT | CLAUDE.md marks it optional for the demo; refusals return a friendly retryable 502 and the student can re-run |
| streaming responses | OPT-OUT | not needed: each call returns one small structured object well under the non-streaming max_tokens of 16000 |
| tool use / tool runner | OPT-OUT | explicitly out of scope per CLAUDE.md: structured outputs replace tools; forced tool_choice 400s on these models |
| citations on document blocks | OPT-OUT | incompatible with output_config.format; belongs to the v2 RAG chatbot (PAPER-V2-01) |
| Message Batches API | OPT-OUT | offline fișă extraction is at most ~200 PDFs; a resumable sequential loop is simpler and finishes before the demo |
| Files API (upload once, reference by file_id) | OPT-OUT | each document is sent once; base64 inline blocks suffice |
| token counting endpoint (count_tokens) | OPT-OUT | not needed: usage fields on the first live calls give the real catalogue token count |
| Models API (list/retrieve) | OPT-OUT | model ids are fixed in env vars CLAUDE_MODEL / CLAUDE_INGEST_MODEL |
| compaction / message threads / context editing | OPT-OUT | every call is single-turn; there is no conversation to compact |
| fast mode (speed fast) | OPT-OUT | not needed for the demo; doubles cost; Sonnet latency is acceptable with per-course loading |
| Voyage AI embeddings (voyage-4) + pgvector similarity | OPT-OUT | no Voyage key; research chose Plan B (Claude over cached catalogue); kept swappable behind the single shortlist() function |
