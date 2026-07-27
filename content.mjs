/*
 * THE ONE EDITABLE STORY SOURCE
 * --------------------------------
 * Update the words and media paths in this file, then run `npm run build`.
 *
 * The five memories below are intentionally written as graceful placeholders
 * because no private dates, places, or approved photos were supplied. Each
 * `editorNote` says exactly what to replace. Editor notes are never rendered.
 *
 * A memory image is optional. If its `media` file is missing, the build renders
 * a coordinated symbolic botanical illustration instead of a broken image.
 */

const content = {
  metadata: {
    language: "en",
    title: "A Garden in Bloom",
    description: "A quiet garden of memories, made with care.",
    themeColor: "#102e26",
    robots: "noindex, nofollow, noarchive, nosnippet, noimageindex",
    // Update this if the repository or custom domain changes.
    canonicalUrl: "https://seaboiii.github.io/wymm/",
    socialImage: "assets/social-preview.jpg",
    favicon: "assets/icons/favicon.svg",
    appleTouchIcon: "assets/icons/apple-touch-icon.png",
  },

  people: {
    partnerName: "Nurulain",
    partnerShortName: "Nurul",
    partnerNickname: "Ain",
    yourName: "Aleem",
    initials: "A ✦ N",
  },

  proposalDate: {
    machine: "2026-07-27",
    display: "27 July 2026",
  },

  hero: {
    eyebrow: "A garden of everything I feel for you",
    titleLead: "For",
    titleLine: "my favourite forever.",
    note: "Some love stories are written in the stars. Ours grew quietly—moment by moment, memory by memory—until you became the most beautiful part of every day.",
    invitation: "Walk through our garden",
    scrollNote: "A little piece of my heart, in bloom",
  },

  artwork: {
    hero: {
      fallback: "assets/art/hero-wide-fallback.jpg",
      alt: "",
      sources: [
        {
          media: "(max-width: 640px)",
          type: "image/avif",
          srcset: "assets/art/hero-tall-720.avif 720w, assets/art/hero-tall-1080.avif 941w",
          sizes: "calc(100vw - 1px)",
        },
        {
          media: "(max-width: 640px)",
          type: "image/webp",
          srcset: "assets/art/hero-tall-720.webp 720w, assets/art/hero-tall-1080.webp 941w",
          sizes: "calc(100vw - 1px)",
        },
        {
          type: "image/avif",
          srcset: "assets/art/hero-wide-960.avif 960w, assets/art/hero-wide-1672.avif 1672w",
          sizes: "100vw",
        },
        {
          type: "image/webp",
          srcset: "assets/art/hero-wide-960.webp 960w, assets/art/hero-wide-1672.webp 1672w",
          sizes: "100vw",
        },
      ],
      preloads: [
        {
          href: "assets/art/hero-tall-720.avif",
          media: "(max-width: 640px)",
          type: "image/avif",
          imagesrcset: "assets/art/hero-tall-720.avif 720w, assets/art/hero-tall-1080.avif 941w",
          imagesizes: "calc(100vw - 1px)",
        },
        {
          href: "assets/art/hero-wide-960.avif",
          media: "(min-width: 641px)",
          type: "image/avif",
          imagesrcset: "assets/art/hero-wide-960.avif 960w, assets/art/hero-wide-1672.avif 1672w",
          imagesizes: "100vw",
        },
      ],
    },
    proposal: {
      fallback: "assets/art/proposal-wide-fallback.jpg",
      alt: "",
      sources: [
        {
          media: "(max-width: 640px)",
          type: "image/avif",
          srcset: "assets/art/proposal-tall-720.avif 720w, assets/art/proposal-tall-1080.avif 941w",
          sizes: "100vw",
        },
        {
          media: "(max-width: 640px)",
          type: "image/webp",
          srcset: "assets/art/proposal-tall-720.webp 720w, assets/art/proposal-tall-1080.webp 941w",
          sizes: "100vw",
        },
        {
          type: "image/avif",
          srcset: "assets/art/proposal-wide-960.avif 960w, assets/art/proposal-wide-1672.avif 1672w",
          sizes: "100vw",
        },
        {
          type: "image/webp",
          srcset: "assets/art/proposal-wide-960.webp 960w, assets/art/proposal-wide-1672.webp 1672w",
          sizes: "100vw",
        },
      ],
    },
  },

  letter: {
    kicker: "A letter for you",
    heading: "What I hope you always know",
    salutation: "My dearest",
    paragraphs: [
      "If I could gather every feeling you have given me and plant it in one place, it would look like this: a garden without end, full of warmth, wonder, and light.",
      "You have shown me that love lives in the little things—in being understood without having to explain, in laughter arriving exactly when it is needed, and in the peace of simply knowing you are there.",
      "With you, the ordinary becomes worth remembering. You make me want to be softer, braver, and better. If life gives us a thousand seasons, I want to walk through every one of them with you.",
    ],
    signoff: "Always yours,",
  },

  story: {
    kicker: "How we grew",
    heading: "Our journey, in bloom",
    introduction: "Five chapters from the life we have already begun—and a path toward everything still waiting.",
    memories: [
      {
        editorNote: "PERSONALISE: add the real first-hello date, place, vivid detail, and an approved photo or keepsake.",
        chapter: "Where it began",
        title: "The first hello",
        date: "The day our story began",
        place: "Where a simple hello changed everything",
        story: "I did not know then how much that first moment would come to mean. I only knew there was something about you I wanted to keep discovering—the warmth in our first exchange, the ease I carried away, and the quiet hope that this would not be the last time our paths found one another.",
        media: "assets/keepsakes/first-hello.svg",
        alt: "An illustrated envelope beneath a moon, framed by jasmine sprigs and tiny golden stars.",
        caption: "A symbolic keepsake for our first hello—ready to be replaced with our real memory.",
        botanical: "jasmine",
      },
      {
        editorNote: "PERSONALISE: use the date and place of an early conversation that made you lose track of time.",
        chapter: "Growing closer",
        title: "The conversation that kept going",
        date: "One conversation at a time",
        place: "Where the hours forgot to pass",
        story: "Somewhere between the stories we traded, the questions that became braver, and the way time disappeared around you, you became the person I could not wait to tell everything to. Trust did not arrive all at once. It grew patiently, in every conversation that made the next one feel even more natural.",
        media: "assets/keepsakes/little-moments.svg",
        alt: "Overlapping keepsake cards illustrated with a crescent moon, teacup, flower, and small golden stars.",
        caption: "A symbolic keepsake for the little moments that drew us closer.",
        botanical: "fern",
      },
      {
        editorNote: "PERSONALISE: add a real ordinary outing and the sensory detail you both still mention.",
        chapter: "Joy in the ordinary",
        title: "The day nothing—and everything—happened",
        date: "One of our beautifully ordinary days",
        place: "Our little corner of the world",
        story: "Nothing grand had to happen. There was simply your laugh, a plan that did not need to go perfectly, and the lovely realisation that ordinary time with you never feels ordinary to me. You taught me that a favourite memory can be made from almost nothing—provided I get to share it with you.",
        media: "assets/keepsakes/shared-laughter.svg",
        alt: "Two illustrated conversation bubbles meet around a small heart, jasmine flowers, and warm stars.",
        caption: "A symbolic keepsake for a day made memorable by shared laughter.",
        botanical: "wildflower",
      },
      {
        editorNote: "PERSONALISE: describe a specific time she supported you, including what she did rather than only how it felt.",
        chapter: "Finding home",
        title: "The moment you stayed",
        date: "When care became certainty",
        place: "Wherever I needed you most",
        story: "You have a way of staying close without crowding, of listening without rushing to fill the silence, and of making difficult things feel possible again. In the steadiness of your care, I found something I had hoped for without knowing how to name it: not simply comfort, but the feeling of coming home.",
        media: "assets/keepsakes/finding-home.svg",
        alt: "A warmly lit doorway beneath a moon, framed by climbing vines and white flowers.",
        caption: "A symbolic keepsake for the moment care began to feel like home.",
        botanical: "rose",
      },
      {
        editorNote: "PERSONALISE: replace with the exact moment you first pictured a shared future, plus its date and place.",
        chapter: "What comes next",
        title: "When forever felt simple",
        date: "Not one moment, but all of them",
        place: "Everywhere I picture home",
        story: "I cannot point to a single second when forever came into focus. It was all of them together: the calm beside you, the joy I feel in your happiness, and every ordinary future scene that becomes brighter when I imagine you there. Loving you made the biggest promise of my life feel wonderfully simple.",
        media: "assets/keepsakes/future-path.svg",
        alt: "A symbolic illustration of a starlit garden path winding toward the horizon.",
        caption: "A symbolic keepsake for every unwritten chapter on the path ahead.",
        botanical: "jasmine",
      },
    ],
  },

  reasons: {
    kicker: "In every season",
    heading: "A few of a thousand reasons",
    introduction: "Not only the qualities I love, but the ways you bring them to life.",
    items: [
      {
        number: "01",
        trait: "Your kindness",
        evidence: "You notice when someone has gone quiet, make room for what they are feeling, and offer care without asking for applause.",
      },
      {
        number: "02",
        trait: "Your light",
        evidence: "You can rescue an ordinary day with one perfectly timed joke, then laugh so freely that I forget what was weighing on me.",
      },
      {
        number: "03",
        trait: "Your strength",
        evidence: "You meet difficult days with honesty and grace. Watching you begin again has taught me that courage can be gentle.",
      },
      {
        number: "04",
        trait: "The way you love us",
        evidence: "You listen closely, tell me the truth with care, and make it safe for me to be completely myself while still growing.",
      },
    ],
  },

  promises: {
    kicker: "My promises",
    heading: "For every season ahead",
    introduction: "Not one sweeping promise, but three choices I will keep making.",
    items: [
      {
        title: "I will keep choosing you",
        text: "In easy mornings and difficult nights, I will return to us with honesty, patience, and the courage to repair what needs tending.",
      },
      {
        title: "I will protect your becoming",
        text: "I will celebrate who you are now, make room for who you are growing into, and never ask you to become smaller for my comfort.",
      },
      {
        title: "I will tend our joy",
        text: "I will keep planning adventures, finding reasons to laugh, noticing the small good things, and making our ordinary days feel loved.",
      },
    ],
  },

  proposal: {
    kicker: "One last thing, my love",
    intro: "There is only one future I want.",
    lead: "And in every version of it, you are beside me.",
    openButton: "Open my heart",
    quietPause: "Take one slow breath with me.",
    questionPrelude: "My heart has found its home in you.",
    question: "will you marry me?",
    yesButton: "Yes, a thousand times ♡",
    signed: "With all my love,",
  },

  celebration: {
    kicker: "Our next chapter",
    heading: "Our forever begins here.",
    message: "I love you. Today, tomorrow, and through every season still to come.",
    finalNote: "This garden holds only a glimpse of what you mean to me. The rest will be written slowly: in a gentle home, in dreams made braver together, and in a lifetime of choosing each other.",
    replayButton: "Walk through our garden again",
  },

  shareCard: {
    eyebrow: "A new chapter, in bloom",
    headline: "Our forever begins here.",
    subline: "A quiet yes beneath the garden stars",
    downloadButton: "Save our keepsake",
    shareButton: "Share our keepsake",
    filename: "a-new-chapter-in-bloom.png",
    shareTitle: "A new chapter, in bloom",
    shareText: "A little garden keepsake from a beautiful day.",
  },

  footer: {
    madeWith: "Made with love by",
    madeFor: "for",
    closing: "Est. forever",
  },
};

export default content;
