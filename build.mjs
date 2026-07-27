import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";
import content from "./content.mjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(projectRoot, "dist");
const checkOnly = process.argv.includes("--check");
const releaseMode = process.argv.includes("--release");
const allowedBotanicals = new Set(["jasmine", "fern", "wildflower", "rose"]);

const asArray = (value) => (Array.isArray(value) ? value : []);
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const attribute = (name, value) =>
  value === undefined || value === null || value === ""
    ? ""
    : ` ${name}="${escapeHtml(value)}"`;

const hasFile = async (relativePath) => {
  if (!relativePath || path.isAbsolute(relativePath)) return false;
  const resolved = path.resolve(projectRoot, relativePath);
  if (!resolved.startsWith(`${projectRoot}${path.sep}`)) return false;
  try {
    await access(resolved);
    return true;
  } catch {
    return false;
  }
};

const srcsetPaths = (srcset) =>
  String(srcset)
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .filter(Boolean);

const sourceIsAvailable = async (source) => {
  if (!source || typeof source !== "object" || !source.srcset) return false;
  const paths = srcsetPaths(source.srcset);
  if (paths.length === 0) return false;
  const results = await Promise.all(paths.map(hasFile));
  return results.every(Boolean);
};

const requireObject = (value, label, errors) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${label} must be an object.`);
    return {};
  }
  return value;
};

const requireString = (value, label, errors) => {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} must be a non-empty string.`);
    return "";
  }
  return value.trim();
};

const optionalString = (value, label, errors) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") {
    errors.push(`${label} must be a string when supplied.`);
    return "";
  }
  return value.trim();
};

export function validateContent(story) {
  const errors = [];
  const warnings = [];
  const root = requireObject(story, "content", errors);
  const metadata = requireObject(root.metadata, "metadata", errors);
  const people = requireObject(root.people, "people", errors);
  const proposalDate = requireObject(root.proposalDate, "proposalDate", errors);
  const hero = requireObject(root.hero, "hero", errors);
  const artwork = requireObject(root.artwork, "artwork", errors);
  const letter = requireObject(root.letter, "letter", errors);
  const storySection = requireObject(root.story, "story", errors);
  const reasons = requireObject(root.reasons, "reasons", errors);
  const promises = requireObject(root.promises, "promises", errors);
  const proposal = requireObject(root.proposal, "proposal", errors);
  const celebration = requireObject(root.celebration, "celebration", errors);
  const shareCard = requireObject(root.shareCard, "shareCard", errors);
  const footer = requireObject(root.footer, "footer", errors);

  [
    ["metadata.language", metadata.language],
    ["metadata.title", metadata.title],
    ["metadata.description", metadata.description],
    ["metadata.themeColor", metadata.themeColor],
    ["metadata.robots", metadata.robots],
    ["people.partnerName", people.partnerName],
    ["people.partnerShortName", people.partnerShortName],
    ["people.partnerNickname", people.partnerNickname],
    ["people.yourName", people.yourName],
    ["people.initials", people.initials],
    ["proposalDate.machine", proposalDate.machine],
    ["proposalDate.display", proposalDate.display],
    ["hero.eyebrow", hero.eyebrow],
    ["hero.titleLead", hero.titleLead],
    ["hero.titleLine", hero.titleLine],
    ["hero.note", hero.note],
    ["hero.invitation", hero.invitation],
    ["hero.scrollNote", hero.scrollNote],
    ["letter.kicker", letter.kicker],
    ["letter.heading", letter.heading],
    ["letter.salutation", letter.salutation],
    ["letter.signoff", letter.signoff],
    ["story.kicker", storySection.kicker],
    ["story.heading", storySection.heading],
    ["story.introduction", storySection.introduction],
    ["reasons.kicker", reasons.kicker],
    ["reasons.heading", reasons.heading],
    ["reasons.introduction", reasons.introduction],
    ["promises.kicker", promises.kicker],
    ["promises.heading", promises.heading],
    ["promises.introduction", promises.introduction],
    ["proposal.kicker", proposal.kicker],
    ["proposal.intro", proposal.intro],
    ["proposal.lead", proposal.lead],
    ["proposal.openButton", proposal.openButton],
    ["proposal.quietPause", proposal.quietPause],
    ["proposal.questionPrelude", proposal.questionPrelude],
    ["proposal.question", proposal.question],
    ["proposal.yesButton", proposal.yesButton],
    ["proposal.signed", proposal.signed],
    ["celebration.kicker", celebration.kicker],
    ["celebration.heading", celebration.heading],
    ["celebration.message", celebration.message],
    ["celebration.finalNote", celebration.finalNote],
    ["celebration.replayButton", celebration.replayButton],
    ["shareCard.eyebrow", shareCard.eyebrow],
    ["shareCard.headline", shareCard.headline],
    ["shareCard.subline", shareCard.subline],
    ["shareCard.downloadButton", shareCard.downloadButton],
    ["shareCard.shareButton", shareCard.shareButton],
    ["shareCard.filename", shareCard.filename],
    ["shareCard.shareTitle", shareCard.shareTitle],
    ["shareCard.shareText", shareCard.shareText],
    ["footer.madeWith", footer.madeWith],
    ["footer.madeFor", footer.madeFor],
    ["footer.closing", footer.closing],
  ].forEach(([label, value]) => requireString(value, label, errors));

  [
    ["metadata.canonicalUrl", metadata.canonicalUrl],
    ["metadata.socialImage", metadata.socialImage],
    ["metadata.favicon", metadata.favicon],
    ["metadata.appleTouchIcon", metadata.appleTouchIcon],
  ].forEach(([label, value]) => optionalString(value, label, errors));

  if (!String(metadata.robots ?? "").toLowerCase().includes("noindex")) {
    errors.push("metadata.robots must include noindex for this private-feeling public URL.");
  }
  if (metadata.canonicalUrl) {
    try {
      const canonical = new URL(metadata.canonicalUrl);
      if (canonical.protocol !== "https:") {
        errors.push("metadata.canonicalUrl must use HTTPS.");
      }
    } catch {
      errors.push("metadata.canonicalUrl must be a valid absolute URL when supplied.");
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(proposalDate.machine ?? ""))) {
    errors.push("proposalDate.machine must use YYYY-MM-DD.");
  }
  if (!artwork.hero || typeof artwork.hero !== "object") {
    errors.push("artwork.hero must define the opening artwork.");
  }
  if (!artwork.proposal || typeof artwork.proposal !== "object") {
    errors.push("artwork.proposal must define the proposal artwork.");
  }

  if (!Array.isArray(letter.paragraphs) || letter.paragraphs.length < 2) {
    errors.push("letter.paragraphs must contain at least two paragraphs.");
  } else {
    letter.paragraphs.forEach((paragraph, index) =>
      requireString(paragraph, `letter.paragraphs[${index}]`, errors),
    );
  }

  if (!Array.isArray(storySection.memories) || storySection.memories.length !== 5) {
    errors.push("story.memories must contain exactly five memories.");
  } else {
    storySection.memories.forEach((memoryValue, index) => {
      const memory = requireObject(memoryValue, `story.memories[${index}]`, errors);
      ["chapter", "title", "date", "place", "story", "media", "alt", "caption", "botanical"].forEach(
        (key) => requireString(memory[key], `story.memories[${index}].${key}`, errors),
      );
      optionalString(memory.editorNote, `story.memories[${index}].editorNote`, errors);
      if (!allowedBotanicals.has(memory.botanical)) {
        errors.push(
          `story.memories[${index}].botanical must be one of ${[...allowedBotanicals].join(", ")}.`,
        );
      }
      if (memory.editorNote) warnings.push(memory.editorNote);
    });
  }

  if (!Array.isArray(reasons.items) || reasons.items.length < 4) {
    errors.push("reasons.items must contain at least four evidence-based reasons.");
  } else {
    reasons.items.forEach((reasonValue, index) => {
      const reason = requireObject(reasonValue, `reasons.items[${index}]`, errors);
      ["number", "trait", "evidence"].forEach((key) =>
        requireString(reason[key], `reasons.items[${index}].${key}`, errors),
      );
    });
  }

  if (!Array.isArray(promises.items) || promises.items.length !== 3) {
    errors.push("promises.items must contain exactly three concrete promises.");
  } else {
    promises.items.forEach((promiseValue, index) => {
      const promise = requireObject(promiseValue, `promises.items[${index}]`, errors);
      ["title", "text"].forEach((key) =>
        requireString(promise[key], `promises.items[${index}].${key}`, errors),
      );
    });
  }

  const narrativeParts = [
    hero.note,
    ...asArray(letter.paragraphs),
    storySection.introduction,
    ...asArray(storySection.memories).flatMap((memory) => [
      memory?.title,
      memory?.date,
      memory?.place,
      memory?.story,
      memory?.caption,
    ]),
    reasons.introduction,
    ...asArray(reasons.items).flatMap((reason) => [reason?.trait, reason?.evidence]),
    promises.introduction,
    ...asArray(promises.items).flatMap((promise) => [promise?.title, promise?.text]),
    proposal.intro,
    proposal.lead,
    proposal.quietPause,
    proposal.questionPrelude,
    proposal.question,
    celebration.message,
    celebration.finalNote,
  ]
    .filter((part) => typeof part === "string")
    .join(" ");
  const wordCount = narrativeParts.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  if (wordCount < 650 || wordCount > 900) {
    errors.push(`The narrative is ${wordCount} words; keep it between 650 and 900 words.`);
  }

  return { errors, warnings, wordCount };
}

const botanicalSvg = (kind, className = "botanical-illustration") => {
  const paths = {
    jasmine: `
      <g class="botanical-stems" fill="none" stroke="currentColor" stroke-linecap="round">
        <path d="M24 184C71 139 89 89 106 22M79 115c-20-10-36-8-51 3M92 75c21-12 39-12 55-2"/>
      </g>
      <g class="botanical-blooms" fill="currentColor">
        <path d="M103 35c-23-4-26-23-15-31 12 2 20 11 18 27 7-16 19-20 29-14 3 13-5 23-24 25 18 5 24 16 19 27-14 4-24-5-26-23-5 17-17 24-29 18-2-13 7-23 28-29Z"/>
        <path d="M29 119c-15-3-17-15-10-21 8 1 13 7 12 18 5-11 13-14 20-10 2 9-3 16-16 17 12 4 16 11 13 19-10 2-16-4-18-16-3 12-11 16-19 12-1-9 5-15 18-19Z"/>
      </g>`,
    fern: `
      <g fill="none" stroke="currentColor" stroke-linecap="round">
        <path d="M40 190C95 135 111 77 109 13"/>
        <path d="M85 135c-25-17-43-18-57-10M91 116c25-17 45-20 60-10M98 94c-22-16-39-18-52-11M103 73c20-14 36-17 49-10M107 54c-15-12-28-14-39-8M109 36c12-9 23-11 32-6"/>
      </g>`,
    wildflower: `
      <g fill="none" stroke="currentColor" stroke-linecap="round">
        <path d="M29 190c10-60 8-98-7-134M77 190c-4-62 3-112 22-149M124 190c4-48 20-83 47-105"/>
      </g>
      <g fill="currentColor">
        <circle cx="21" cy="48" r="7"/><circle cx="10" cy="55" r="7"/><circle cx="22" cy="61" r="7"/><circle cx="33" cy="54" r="7"/>
        <circle cx="101" cy="34" r="8"/><circle cx="89" cy="42" r="8"/><circle cx="101" cy="49" r="8"/><circle cx="113" cy="41" r="8"/>
        <circle cx="174" cy="79" r="7"/><circle cx="163" cy="87" r="7"/><circle cx="174" cy="94" r="7"/><circle cx="185" cy="86" r="7"/>
      </g>`,
    rose: `
      <g fill="none" stroke="currentColor" stroke-linecap="round">
        <path d="M105 190c-6-60-3-102 10-128M102 135c-24-13-43-12-58 3M105 116c21-15 41-18 58-8"/>
      </g>
      <g fill="currentColor">
        <path d="M115 70c-28 0-44-17-42-38 13-4 24-1 33 10 0-18 10-31 25-36 12 11 14 25 5 42 14-9 28-7 39 4-4 18-18 28-43 27-5 14-15 23-30 25-10-12-6-23 13-34Z"/>
      </g>`,
  };
  return `<svg class="${className}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">${paths[kind] ?? paths.jasmine}</svg>`;
};

const sealMarkup = (initials, modifier = "") => `<span class="garden-seal${modifier ? ` garden-seal--${modifier}` : ""}" role="img" aria-label="${escapeHtml(initials)}">
    <span aria-hidden="true">${escapeHtml(initials)}</span>
  </span>`;

const renderArtworkPicture = async (art, { className, eager = false }) => {
  const availableSources = [];
  for (const source of asArray(art?.sources)) {
    if (await sourceIsAvailable(source)) availableSources.push(source);
  }
  const fallbackExists = await hasFile(art?.fallback);
  if (!fallbackExists) {
    return `<div class="${className} ${className}--symbolic" aria-hidden="true">${botanicalSvg("jasmine")}</div>`;
  }
  const sources = availableSources
    .map(
      (source) =>
        `<source${attribute("media", source.media)}${attribute("type", source.type)}${attribute("srcset", source.srcset)}${attribute("sizes", source.sizes)}>`,
    )
    .join("");
  return `<picture class="${className}">${sources}<img src="${escapeHtml(art.fallback)}" alt="${escapeHtml(art.alt ?? "")}" width="1672" height="941"${eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy" fetchpriority="low"'} decoding="async"></picture>`;
};

const renderMemoryMedia = async (memory, index) => {
  const imageExists = await hasFile(memory.media);
  if (imageExists) {
    return `<img src="${escapeHtml(memory.media)}" alt="${escapeHtml(memory.alt)}" loading="lazy" decoding="async" width="960" height="720">`;
  }
  return `<div class="memory-symbolic memory-symbolic--${escapeHtml(memory.botanical)}" role="img" aria-label="${escapeHtml(`Symbolic ${memory.botanical} illustration. ${memory.alt}`)}">
    <span class="memory-symbolic-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
    ${botanicalSvg(memory.botanical)}
  </div>`;
};

const renderMemories = async (memories) => {
  const articles = await Promise.all(
    memories.map(async (memory, index) => `<article class="memory-card timeline-item reveal${index % 2 ? " memory-card--reverse" : ""}">
        <figure class="memory-media pressed-flower-frame">
          ${await renderMemoryMedia(memory, index)}
          <figcaption>${escapeHtml(memory.caption)}</figcaption>
        </figure>
        <div class="memory-copy timeline-copy">
          <div class="memory-specimen" aria-hidden="true">${botanicalSvg(memory.botanical, "botanical-specimen")}</div>
          <p class="chapter">${escapeHtml(memory.chapter)}</p>
          <h3>${escapeHtml(memory.title)}</h3>
          <p class="memory-meta">
            <span class="date">${escapeHtml(memory.date)}</span>
            <span aria-hidden="true"> · </span>
            <span class="place">${escapeHtml(memory.place)}</span>
          </p>
          <p>${escapeHtml(memory.story)}</p>
        </div>
      </article>`),
  );
  return articles.join("\n        ");
};

const renderOptionalHeadAssets = async (metadata) => {
  const tags = [];
  if (await hasFile(metadata.favicon)) {
    tags.push(`<link rel="icon" href="${escapeHtml(metadata.favicon)}" type="image/svg+xml">`);
  }
  if (await hasFile(metadata.appleTouchIcon)) {
    tags.push(`<link rel="apple-touch-icon" href="${escapeHtml(metadata.appleTouchIcon)}">`);
  }
  if (await hasFile(metadata.socialImage)) {
    const socialImage = metadata.canonicalUrl
      ? new URL(metadata.socialImage, metadata.canonicalUrl).href
      : metadata.socialImage;
    tags.push(
      `<meta property="og:image" content="${escapeHtml(socialImage)}">`,
      '<meta property="og:image:type" content="image/jpeg">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '<meta property="og:image:alt" content="A moonlit botanical garden beneath a star-filled sky.">',
      `<meta name="twitter:image" content="${escapeHtml(socialImage)}">`,
      '<meta name="twitter:image:alt" content="A moonlit botanical garden beneath a star-filled sky.">',
    );
  }
  if (metadata.canonicalUrl) {
    tags.push(
      `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}">`,
      `<meta property="og:url" content="${escapeHtml(metadata.canonicalUrl)}">`,
    );
  }
  return tags.join("\n  ");
};

const renderHeroPreloads = async (art) => {
  const tags = [];
  for (const preload of asArray(art?.preloads)) {
    if (!preload || typeof preload !== "object" || !(await hasFile(preload.href))) continue;
    const srcsetAvailable = preload.imagesrcset
      ? await sourceIsAvailable({ srcset: preload.imagesrcset })
      : false;
    tags.push(
      `<link rel="preload" as="image"${attribute("href", preload.href)}${attribute("media", preload.media)}${attribute("type", preload.type)}${srcsetAvailable ? attribute("imagesrcset", preload.imagesrcset) : ""}${srcsetAvailable ? attribute("imagesizes", preload.imagesizes) : ""} fetchpriority="high">`,
    );
  }
  return tags.join("\n  ");
};

export async function renderPage(story) {
  const { errors } = validateContent(story);
  if (errors.length) {
    throw new Error(`Content validation failed:\n- ${errors.join("\n- ")}`);
  }

  const {
    metadata,
    people,
    proposalDate,
    hero,
    artwork,
    letter,
    story: storySection,
    reasons,
    promises,
    proposal,
    celebration,
    shareCard,
    footer,
  } = story;

  const [heroPicture, proposalPicture, memoriesMarkup, optionalHeadAssets, preload] = await Promise.all([
    renderArtworkPicture(artwork.hero, { className: "hero-art", eager: true }),
    renderArtworkPicture(artwork.proposal, { className: "proposal-art-picture" }),
    renderMemories(storySection.memories),
    renderOptionalHeadAssets(metadata),
    renderHeroPreloads(artwork.hero),
  ]);

  const letterMarkup = letter.paragraphs
    .map((paragraph) => `<p class="letter-line reveal">${escapeHtml(paragraph)}</p>`)
    .join("");
  const reasonsMarkup = reasons.items
    .map(
      (reason) => `
        <article class="reason-card reveal">
          <span class="reason-number" aria-hidden="true">${escapeHtml(reason.number)}</span>
          <h3>${escapeHtml(reason.trait)}</h3>
          <p>${escapeHtml(reason.evidence)}</p>
        </article>`,
    )
    .join("");
  const promisesMarkup = promises.items
    .map(
      (promise, index) => `
        <article class="promise-card reveal" style="--promise-index: ${index}">
          <span class="promise-flower" aria-hidden="true">${botanicalSvg(index === 1 ? "rose" : "jasmine", "promise-bloom")}</span>
          <h3>${escapeHtml(promise.title)}</h3>
          <p>${escapeHtml(promise.text)}</p>
        </article>`,
    )
    .join("");

  return `<!doctype html>
<html class="no-js" lang="${escapeHtml(metadata.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="${escapeHtml(metadata.themeColor)}">
  <meta name="color-scheme" content="light dark">
  <meta name="robots" content="${escapeHtml(metadata.robots)}">
  <meta name="googlebot" content="${escapeHtml(metadata.robots)}">
  <meta name="description" content="${escapeHtml(metadata.description)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(metadata.title)}">
  <meta property="og:description" content="${escapeHtml(metadata.description)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(metadata.title)}">
  <meta name="twitter:description" content="${escapeHtml(metadata.description)}">
  ${optionalHeadAssets}
  <title>${escapeHtml(metadata.title)}</title>
  ${preload}
  <link rel="preload" href="assets/fonts/cormorant-garamond-400.woff2" as="font" type="font/woff2" crossorigin>
  <script>document.documentElement.classList.replace("no-js","js");</script>
  <style>
    html.no-js .reveal { opacity: 1 !important; transform: none !important; }
    html.no-js [data-enhanced-only] { display: none !important; }
    [hidden] { display: none !important; }
  </style>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to the garden</a>
  <div class="page-noise" aria-hidden="true"></div>
  <div class="petals" id="petals" aria-hidden="true"></div>

  <header class="hero" id="home">
    ${heroPicture}
    <div class="hero-shade" aria-hidden="true"></div>
    <nav class="nav" aria-label="Garden navigation">
      <a class="monogram" href="#home" aria-label="${escapeHtml(`${people.initials} — back to the beginning`)}">${sealMarkup(people.initials, "nav")}</a>
      <a class="nav-link" href="#our-story">Our story</a>
    </nav>
    <div class="hero-content">
      <p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>
      <h1>${escapeHtml(hero.titleLead)} <em>${escapeHtml(people.partnerName)}</em>,<br>${escapeHtml(hero.titleLine)}</h1>
      <p class="hero-note">${escapeHtml(hero.note)}</p>
      <a class="garden-button" href="#letter">
        <span>${escapeHtml(hero.invitation)}</span>
        <span aria-hidden="true">↓</span>
      </a>
    </div>
    <p class="scroll-note">${escapeHtml(hero.scrollNote)}</p>
  </header>

  <main id="main-content">
    <section class="letter-section" id="letter" aria-labelledby="letter-heading">
      <div class="botanical-mark reveal" aria-hidden="true">${botanicalSvg("jasmine", "botanical-mark-art")}</div>
      <p class="section-kicker reveal">${escapeHtml(letter.kicker)}</p>
      <div class="letter">
        <h2 id="letter-heading" class="visually-hidden">${escapeHtml(letter.heading)}</h2>
        <p class="letter-salutation reveal">${escapeHtml(letter.salutation)} ${escapeHtml(people.partnerShortName)},</p>
        <div class="letter-body">${letterMarkup}</div>
        <p class="signature reveal">${escapeHtml(letter.signoff)}<strong>${escapeHtml(people.yourName)}</strong></p>
      </div>
    </section>

    <section class="story-section" id="our-story" aria-labelledby="story-heading">
      <div class="section-heading reveal">
        <p class="section-kicker">${escapeHtml(storySection.kicker)}</p>
        <h2 id="story-heading">${escapeHtml(storySection.heading)}</h2>
        <p>${escapeHtml(storySection.introduction)}</p>
      </div>
      <div class="memory-path timeline" id="timeline">
        <svg class="memory-vine" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path class="memory-vine-shadow" d="M50 0C10 110 90 190 50 300S10 490 50 600s40 190 0 300S35 980 50 1000"/>
          <path class="memory-vine-growth" data-vine-progress d="M50 0C10 110 90 190 50 300S10 490 50 600s40 190 0 300S35 980 50 1000"/>
        </svg>
        ${memoriesMarkup}
      </div>
    </section>

    <section class="reasons-section" id="reasons-section" aria-labelledby="reasons-heading">
      <div class="section-heading reveal">
        <p class="section-kicker">${escapeHtml(reasons.kicker)}</p>
        <h2 id="reasons-heading">${escapeHtml(reasons.heading)}</h2>
        <p>${escapeHtml(reasons.introduction)}</p>
      </div>
      <div class="reason-grid" id="reasons">${reasonsMarkup}</div>
    </section>

    <section class="promise-section" id="promises" aria-labelledby="promises-heading">
      <div class="section-heading reveal">
        <p class="section-kicker">${escapeHtml(promises.kicker)}</p>
        <h2 id="promises-heading">${escapeHtml(promises.heading)}</h2>
        <p>${escapeHtml(promises.introduction)}</p>
      </div>
      <div class="promise-grid">${promisesMarkup}</div>
    </section>

    <section class="proposal-section" id="proposal" aria-labelledby="proposal-heading">
      <div class="proposal-art" data-proposal-art aria-hidden="true">
        ${proposalPicture}
        <div class="ring-veil"></div>
      </div>
      <div class="proposal-glow" aria-hidden="true"></div>
      <div class="proposal-content reveal" id="proposalContent">
        <p class="section-kicker">${escapeHtml(proposal.kicker)}</p>
        <h2 id="proposal-heading">${escapeHtml(proposal.intro)}</h2>
        <p>${escapeHtml(proposal.lead)}</p>
        <p class="proposal-pause">${escapeHtml(proposal.quietPause)}</p>
        <button class="proposal-button" id="proposalButton" type="button" aria-controls="questionCard" aria-expanded="false">
          ${escapeHtml(proposal.openButton)}
        </button>
      </div>

      <section class="question-card" id="questionCard" aria-labelledby="questionHeading" aria-hidden="true" hidden>
        <p>${escapeHtml(proposal.questionPrelude)}</p>
        <h2 id="questionHeading" tabindex="-1">${escapeHtml(people.partnerNickname)},<br>${escapeHtml(proposal.question)}</h2>
        <div class="answer-row">
          <button class="yes-button" id="yesButton" type="button" aria-controls="celebration" aria-expanded="false">
            ${escapeHtml(proposal.yesButton)}
          </button>
        </div>
        <p class="signed">${escapeHtml(proposal.signed)} ${escapeHtml(people.yourName)}</p>
      </section>

      <section
        class="celebration"
        id="celebration"
        aria-labelledby="celebrationHeading"
        data-card-initials="${escapeHtml(people.initials)}"
        data-card-date="${escapeHtml(proposalDate.display)}"
        data-card-filename="${escapeHtml(shareCard.filename)}"
        data-share-title="${escapeHtml(shareCard.shareTitle)}"
        data-share-text="${escapeHtml(shareCard.shareText)}"
        aria-hidden="true"
        hidden
      >
        <p class="section-kicker">${escapeHtml(celebration.kicker)}</p>
        <h2 id="celebrationHeading" tabindex="-1">${escapeHtml(celebration.heading)}</h2>
        <p class="celebration-message">${escapeHtml(celebration.message)}</p>
        <time datetime="${escapeHtml(proposalDate.machine)}">${escapeHtml(proposalDate.display)}</time>
        ${sealMarkup(people.initials, "celebration")}
        <p class="final-note">${escapeHtml(celebration.finalNote)}</p>

        <div class="keepsake-preview" aria-labelledby="keepsake-heading">
          <p class="share-card-eyebrow">${escapeHtml(shareCard.eyebrow)}</p>
          <h3 id="keepsake-heading">${escapeHtml(shareCard.headline)}</h3>
          <p>${escapeHtml(people.initials)} · ${escapeHtml(proposalDate.display)}</p>
          <p>${escapeHtml(shareCard.subline)}</p>
        </div>
        <canvas
          id="celebrationCard"
          data-card-initials="${escapeHtml(people.initials)}"
          data-card-date="${escapeHtml(proposalDate.display)}"
          data-card-filename="${escapeHtml(shareCard.filename)}"
          data-share-title="${escapeHtml(shareCard.shareTitle)}"
          data-share-text="${escapeHtml(shareCard.shareText)}"
          width="1200"
          height="630"
          hidden
        ></canvas>
        <div class="celebration-actions" data-enhanced-only>
          <button class="keepsake-button" id="downloadCardButton" type="button">${escapeHtml(shareCard.downloadButton)}</button>
          <button class="keepsake-button" id="shareCardButton" type="button">${escapeHtml(shareCard.shareButton)}</button>
          <button class="replay-button" id="replayButton" type="button">${escapeHtml(celebration.replayButton)}</button>
        </div>
      </section>
      <p class="visually-hidden" id="proposalStatus" role="status" aria-live="polite" aria-atomic="true"></p>
    </section>
  </main>

  <footer>
    <p>${escapeHtml(footer.madeWith)} <span>${escapeHtml(people.yourName)}</span> ${escapeHtml(footer.madeFor)} <span>${escapeHtml(people.partnerName)}</span></p>
    <span>${escapeHtml(footer.closing)}</span>
  </footer>

  <script src="script.js" defer></script>
</body>
</html>
`;
}

const ensureSafeDist = () => {
  const resolved = path.resolve(distDir);
  if (path.dirname(resolved) !== projectRoot || path.basename(resolved) !== "dist") {
    throw new Error(`Refusing to reset unexpected output path: ${resolved}`);
  }
};

const copyIfPresent = async (source, destination) => {
  if (await hasFile(source)) {
    await cp(path.join(projectRoot, source), path.join(distDir, destination), {
      recursive: true,
    });
  }
};

const collectPublicAssets = (...sources) => {
  const references = new Set();
  const assetPattern = /assets\/[A-Za-z0-9][A-Za-z0-9._~@%+/-]*/g;
  for (const source of sources) {
    for (const match of String(source).matchAll(assetPattern)) {
      references.add(match[0]);
    }
  }
  return [...references].sort();
};

const copyPublicAsset = async (relativePath) => {
  if (!(await hasFile(relativePath))) {
    throw new Error(`Referenced public asset is missing: ${relativePath}`);
  }
  const sourcePath = path.resolve(projectRoot, relativePath);
  const destinationPath = path.resolve(distDir, relativePath);
  if (!destinationPath.startsWith(`${distDir}${path.sep}`)) {
    throw new Error(`Refusing to publish an unsafe asset path: ${relativePath}`);
  }
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await cp(sourcePath, destinationPath);
};

const minifyRuntimeFile = async (source, loader) => {
  const sourceText = await readFile(path.join(projectRoot, source), "utf8");
  const { code } = await transform(sourceText, {
    charset: "utf8",
    legalComments: "none",
    loader,
    minify: true,
    target: loader === "js" ? "es2020" : undefined,
  });
  return code;
};

async function build() {
  const report = validateContent(content);
  const releaseErrors =
    releaseMode && report.warnings.length
      ? [
          `${report.warnings.length} PERSONALISE reminder(s) remain. Replace the private details and remove their editorNote values before deployment.`,
        ]
      : [];
  const blockingErrors = [...report.errors, ...releaseErrors];
  if (blockingErrors.length) {
    throw new Error(`Content validation failed:\n- ${blockingErrors.join("\n- ")}`);
  }
  const requiredRuntimeFiles = ["styles.css", "script.js", ".nojekyll"];
  const runtimeAvailability = await Promise.all(requiredRuntimeFiles.map(hasFile));
  const missingRuntimeFiles = requiredRuntimeFiles.filter(
    (_file, index) => !runtimeAvailability[index],
  );
  if (missingRuntimeFiles.length) {
    throw new Error(`Missing required runtime files: ${missingRuntimeFiles.join(", ")}`);
  }

  console.log(`Content valid: ${report.wordCount} narrative words.`);
  if (report.warnings.length) {
    console.warn(`Personalisation reminders (${report.warnings.length}):`);
    report.warnings.forEach((warning) => console.warn(`- ${warning}`));
  }
  if (checkOnly) return;

  const html = await renderPage(content);
  const [productionCss, productionScript] = await Promise.all([
    minifyRuntimeFile("styles.css", "css"),
    minifyRuntimeFile("script.js", "js"),
  ]);
  const deployHtml = html.replace(
    '  <link rel="stylesheet" href="styles.css">',
    `  <style>${productionCss.replaceAll("</style", "<\\/style")}</style>`,
  );
  const publicAssets = collectPublicAssets(deployHtml, productionScript);
  ensureSafeDist();
  await rm(distDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
  await mkdir(distDir, { recursive: true });
  await writeFile(path.join(distDir, "index.html"), deployHtml, "utf8");

  // Keep a generated root preview for people who open index.html directly.
  // content.mjs remains the source of truth; do not hand-edit index.html.
  const existingIndex = await readFile(path.join(projectRoot, "index.html"), "utf8").catch(() => "");
  if (existingIndex !== html) {
    await writeFile(path.join(projectRoot, "index.html"), html, "utf8");
  }

  await Promise.all([
    writeFile(path.join(distDir, "script.js"), productionScript, "utf8"),
    ...publicAssets.map(copyPublicAsset),
    copyIfPresent(".nojekyll", ".nojekyll"),
  ]);
  console.log(`Built static site in dist/ with ${publicAssets.length} public assets.`);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  build().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
