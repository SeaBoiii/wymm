import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import content from "../content.mjs";

const words = (value) => String(value).trim().split(/\s+/u).filter(Boolean).length;

test("content keeps the approved story and privacy contract", () => {
  assert.equal(content.story.memories.length, 5);
  assert.equal(content.promises.items.length, 3);
  assert.equal(content.reasons.items.length, 4);
  assert.match(content.metadata.robots, /\bnoindex\b/);
  assert.match(content.metadata.robots, /\bnofollow\b/);
  assert.match(content.proposalDate.machine, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(content.people.initials, "A ✦ N");
});

test("memory placeholders are explicit and every referenced asset exists", () => {
  for (const memory of content.story.memories) {
    assert.match(memory.editorNote, /^PERSONALISE:/);
    assert.ok(memory.alt.length >= 20);
    assert.ok(memory.caption.length >= 20);
    assert.ok(existsSync(memory.media), `Missing ${memory.media}`);
  }

  assert.ok(existsSync(content.metadata.socialImage));
  assert.ok(existsSync(content.metadata.favicon));
  assert.ok(existsSync(content.metadata.appleTouchIcon));
});

test("narrative remains inside the approved editorial budget", () => {
  const narrative = [
    content.hero.note,
    ...content.letter.paragraphs,
    content.story.introduction,
    ...content.story.memories.flatMap((memory) => [
      memory.chapter,
      memory.title,
      memory.date,
      memory.place,
      memory.story,
      memory.caption,
    ]),
    content.reasons.introduction,
    ...content.reasons.items.flatMap((reason) => [reason.trait, reason.evidence]),
    content.promises.introduction,
    ...content.promises.items.flatMap((promise) => [promise.title, promise.text]),
    content.proposal.lead,
    content.proposal.quietPause,
    content.celebration.message,
    content.celebration.finalNote,
  ].join(" ");

  assert.ok(words(narrative) >= 650, "Narrative is shorter than 650 words");
  assert.ok(words(narrative) <= 900, "Narrative exceeds 900 words");
});

test("client interaction layer contains no outbound response tracking", () => {
  const script = readFileSync("script.js", "utf8");
  assert.doesNotMatch(script, /\bfetch\s*\(/);
  assert.doesNotMatch(script, /\bsendBeacon\s*\(/);
  assert.doesNotMatch(script, /\bXMLHttpRequest\b/);
  assert.doesNotMatch(script, /\bWebSocket\b/);
});
