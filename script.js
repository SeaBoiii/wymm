(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js", "js-enhanced");

  const whenReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  };

  const clamp = (value, minimum = 0, maximum = 1) =>
    Math.min(maximum, Math.max(minimum, value));

  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  const prefersReducedMotion = () => Boolean(motionQuery?.matches);

  const onMotionPreferenceChange = (callback) => {
    if (!motionQuery) return;

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", callback);
    } else if (typeof motionQuery.addListener === "function") {
      motionQuery.addListener(callback);
    }
  };

  const safelyFocus = (element) => {
    if (!(element instanceof HTMLElement)) return;

    if (!element.matches(
      "a[href], button, input, select, textarea, [tabindex], [contenteditable]"
    )) {
      element.tabIndex = -1;
    }

    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  };

  const showElement = (element) => {
    if (!element) return;
    element.hidden = false;
    element.setAttribute("aria-hidden", "false");
    element.classList.add("shown", "is-active");
  };

  const hideElement = (element) => {
    if (!element) return;
    element.hidden = true;
    element.setAttribute("aria-hidden", "true");
    element.classList.remove("shown", "is-active", "is-leaving");
  };

  const safeInitializers = [];
  const initialize = (initializer) => safeInitializers.push(initializer);

  initialize(() => {
    const letterLines = document.querySelectorAll(
      "[data-letter-line], .letter-body > p, #letterBody > p"
    );
    const memoryCards = document.querySelectorAll(
      "[data-memory-card], .memory-card"
    );

    letterLines.forEach((line, index) => {
      line.classList.add("reveal", "letter-line");
      line.style.setProperty("--reveal-order", String(index));
      line.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
    });

    memoryCards.forEach((card, index) => {
      card.classList.add("reveal");
      card.style.setProperty("--reveal-order", String(index));
      card.style.setProperty("--reveal-delay", `${(index % 2) * 90}ms`);
    });

    const revealElements = Array.from(
      document.querySelectorAll(".reveal, [data-reveal]")
    );

    const reveal = (element) => {
      element.classList.add("visible", "is-visible");
    };

    const revealAll = () => revealElements.forEach(reveal);

    revealElements
      .filter((element) => element.closest(".hero, [data-hero]"))
      .forEach(reveal);

    if (
      prefersReducedMotion() ||
      typeof window.IntersectionObserver !== "function" ||
      revealElements.length === 0
    ) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      }
    );

    revealElements.forEach((element) => {
      if (!element.classList.contains("visible")) observer.observe(element);
    });

    onMotionPreferenceChange((event) => {
      if (!event.matches) return;
      observer.disconnect();
      revealAll();
    });

    window.addEventListener("beforeprint", revealAll, { once: true });
  });

  initialize(() => {
    const vines = Array.from(
      document.querySelectorAll("[data-vine-progress]")
    ).map((element) => {
      const track =
        element.closest("[data-vine-track], .memory-path, .timeline") ||
        element.parentElement ||
        element;
      let length = 0;

      if (typeof element.getTotalLength === "function") {
        try {
          length = element.getTotalLength();
          element.style.strokeDasharray = String(length);
        } catch {
          length = 0;
        }
      }

      return { element, track, length };
    });

    if (vines.length === 0) return;

    let frame = 0;

    const setProgress = ({ element, length }, progress) => {
      const normalized = clamp(progress);
      element.style.setProperty("--vine-progress", normalized.toFixed(4));
      element.style.setProperty(
        "--vine-progress-percent",
        `${(normalized * 100).toFixed(2)}%`
      );

      if (length > 0) {
        element.style.strokeDashoffset = String(length * (1 - normalized));
      }
    };

    const update = () => {
      frame = 0;

      if (document.hidden) return;

      if (prefersReducedMotion()) {
        vines.forEach((vine) => setProgress(vine, 1));
        return;
      }

      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 1;

      vines.forEach((vine) => {
        const bounds = vine.track.getBoundingClientRect();
        const distance = Math.max(bounds.height + viewportHeight * 0.5, 1);
        const progress = (viewportHeight * 0.75 - bounds.top) / distance;
        setProgress(vine, progress);
      });
    };

    const scheduleUpdate = () => {
      if (frame || document.hidden) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) scheduleUpdate();
    });
    onMotionPreferenceChange(() => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      update();
    });

    update();
  });

  initialize(() => {
    const hero = document.querySelector("[data-hero], .hero");
    if (!hero) return;

    const layers = hero.querySelectorAll(
      "[data-parallax-layer], .hero-art"
    );
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const reset = () => {
      hero.style.setProperty("--hero-parallax-x", "0px");
      hero.style.setProperty("--hero-parallax-y", "0px");
      layers.forEach((layer) => {
        layer.style.setProperty("--parallax-x", "0px");
        layer.style.setProperty("--parallax-y", "0px");
      });
    };

    const render = () => {
      frame = 0;

      if (prefersReducedMotion() || document.hidden) {
        reset();
        return;
      }

      const bounds = hero.getBoundingClientRect();
      const scrollOffset = clamp(-bounds.top * 0.035, -18, 18);
      const x = pointerX * 7;
      const y = pointerY * 5 + scrollOffset;

      hero.style.setProperty("--hero-parallax-x", `${x.toFixed(2)}px`);
      hero.style.setProperty("--hero-parallax-y", `${y.toFixed(2)}px`);

      layers.forEach((layer, index) => {
        const configuredDepth = Number.parseFloat(layer.dataset.parallaxDepth);
        const depth = Number.isFinite(configuredDepth)
          ? configuredDepth
          : 1 + index * 0.2;
        layer.style.setProperty("--parallax-x", `${(x * depth).toFixed(2)}px`);
        layer.style.setProperty("--parallax-y", `${(y * depth).toFixed(2)}px`);
      });
    };

    const scheduleRender = () => {
      if (frame || document.hidden) return;
      frame = window.requestAnimationFrame(render);
    };

    hero.addEventListener(
      "pointermove",
      (event) => {
        if (prefersReducedMotion() || event.pointerType === "touch") return;
        const bounds = hero.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        pointerX = clamp(
          (event.clientX - bounds.left) / bounds.width - 0.5,
          -0.5,
          0.5
        );
        pointerY = clamp(
          (event.clientY - bounds.top) / bounds.height - 0.5,
          -0.5,
          0.5
        );
        scheduleRender();
      },
      { passive: true }
    );

    hero.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
      scheduleRender();
    });
    window.addEventListener("scroll", scheduleRender, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        reset();
      } else {
        scheduleRender();
      }
    });
    onMotionPreferenceChange(() => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (prefersReducedMotion()) reset();
      else scheduleRender();
    });

    render();
  });

  initialize(() => {
    const artwork = document.querySelector(
      "[data-proposal-art], .proposal-art.lazy, .proposal-art.is-lazy"
    );
    if (!artwork) return;

    let observer = null;
    let activated = false;

    const markLoaded = () => {
      artwork.classList.remove("is-loading");
      artwork.classList.add("is-loaded");
      artwork.dataset.loaded = "true";
    };

    const activate = () => {
      if (activated) return;
      activated = true;
      observer?.disconnect();
      artwork.classList.add("is-near", "is-loading");
      artwork.classList.remove("lazy", "is-lazy");

      const lazyNodes = [
        ...(artwork.matches("[data-src], [data-srcset], [data-sizes]")
          ? [artwork]
          : []),
        ...artwork.querySelectorAll("[data-src], [data-srcset], [data-sizes]"),
      ];

      lazyNodes.forEach((element) => {
        if (element.dataset.srcset) {
          element.setAttribute("srcset", element.dataset.srcset);
          element.removeAttribute("data-srcset");
        }
        if (element.dataset.sizes) {
          element.setAttribute("sizes", element.dataset.sizes);
          element.removeAttribute("data-sizes");
        }
        if (element.dataset.src) {
          element.setAttribute("src", element.dataset.src);
          element.removeAttribute("data-src");
        }
      });

      const backgroundSource =
        artwork.dataset.backgroundSrc || artwork.dataset.lazyBackground;
      if (backgroundSource) {
        try {
          const imageUrl = new URL(backgroundSource, document.baseURI);
          const safeUrl = imageUrl.href.replace(/["\\\n\r]/g, "");
          artwork.style.backgroundImage = `url("${safeUrl}")`;
        } catch {
          artwork.classList.add("is-error");
        }
      }

      const images = Array.from(
        artwork.matches("img") ? [artwork] : artwork.querySelectorAll("img")
      );

      if (images.length === 0 || images.every((image) => image.complete)) {
        markLoaded();
        return;
      }

      let pending = images.filter((image) => !image.complete).length;
      const settle = () => {
        pending -= 1;
        if (pending <= 0) markLoaded();
      };

      images
        .filter((image) => !image.complete)
        .forEach((image) => {
          image.addEventListener("load", settle, { once: true });
          image.addEventListener("error", settle, { once: true });
        });
    };

    if (typeof window.IntersectionObserver !== "function") {
      activate();
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) activate();
      },
      { rootMargin: "600px 0px", threshold: 0 }
    );
    observer.observe(artwork);
  });

  let effectsController = null;

  initialize(() => {
    let fireflyContainer = document.querySelector(
      "#fireflies, [data-fireflies]"
    );
    const petalContainer = document.querySelector("#petals, [data-petals]");

    if (!fireflyContainer && document.body) {
      fireflyContainer = document.createElement("div");
      fireflyContainer.className = "fireflies";
      fireflyContainer.id = "fireflies";
      fireflyContainer.setAttribute("aria-hidden", "true");
      document.body.appendChild(fireflyContainer);
    }

    if (!fireflyContainer && !petalContainer) return;

    const generatedSelector = "[data-generated-effect]";

    const clearContainer = (container) => {
      container
        ?.querySelectorAll(generatedSelector)
        .forEach((effect) => effect.remove());
    };

    const clearAll = () => {
      clearContainer(fireflyContainer);
      clearContainer(petalContainer);
    };

    const makeFireflies = () => {
      if (
        !fireflyContainer ||
        document.hidden ||
        prefersReducedMotion() ||
        fireflyContainer.querySelector(generatedSelector)
      ) {
        return;
      }

      const count = clamp(
        Math.round((window.innerWidth || 320) / 150),
        5,
        10
      );

      for (let index = 0; index < count; index += 1) {
        const firefly = document.createElement("i");
        firefly.className = "ambient-firefly firefly";
        firefly.dataset.generatedEffect = "firefly";
        firefly.style.setProperty("--x", `${8 + Math.random() * 84}vw`);
        firefly.style.setProperty("--y", `${12 + Math.random() * 76}vh`);
        firefly.style.setProperty("--delay", `${-Math.random() * 12}s`);
        firefly.style.setProperty("--duration", `${8 + Math.random() * 8}s`);
        firefly.style.setProperty("--size", `${2 + Math.random() * 3}px`);
        fireflyContainer.appendChild(firefly);
      }
    };

    const burstPetals = (requestedCount = 32) => {
      if (!petalContainer || document.hidden || prefersReducedMotion()) return;

      clearContainer(petalContainer);
      const count = clamp(requestedCount, 0, 36);

      for (let index = 0; index < count; index += 1) {
        const petal = document.createElement("i");
        petal.className = "petal";
        petal.dataset.generatedEffect = "petal";
        petal.style.setProperty("--x", `${Math.random() * 100}vw`);
        petal.style.setProperty(
          "--drift",
          `${(Math.random() - 0.5) * 170}px`
        );
        petal.style.setProperty("--duration", `${7 + Math.random() * 5}s`);
        petal.style.setProperty("--delay", `${Math.random() * 1.2}s`);
        petal.style.setProperty("--size", `${5 + Math.random() * 7}px`);
        petal.addEventListener("animationend", () => petal.remove(), {
          once: true,
        });
        petalContainer.appendChild(petal);
      }
    };

    const resume = () => {
      if (document.hidden || prefersReducedMotion()) {
        clearAll();
        return;
      }

      makeFireflies();
      if (document.body.classList.contains("said-yes")) burstPetals(24);
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearAll();
      else resume();
    });
    onMotionPreferenceChange(() => {
      if (prefersReducedMotion()) clearAll();
      else resume();
    });

    effectsController = {
      celebrate: () => {
        makeFireflies();
        burstPetals(36);
      },
      clear: clearAll,
      resume,
    };

    resume();
  });

  initialize(() => {
    const proposalButton = document.querySelector("#proposalButton");
    const questionCard = document.querySelector("#questionCard");
    const yesButton = document.querySelector(
      "#yesButton, [data-yes-action]"
    );

    if (!proposalButton || !questionCard || !yesButton) return;

    const proposalContent =
      document.querySelector("#proposalContent") || proposalButton.parentElement;
    const questionHeading =
      document.querySelector("#questionHeading") ||
      questionCard.querySelector("h1, h2, h3");
    const celebration = document.querySelector("#celebration");
    const celebrationHeading =
      document.querySelector("#celebrationHeading") ||
      celebration?.querySelector("h1, h2, h3");
    const proposalSection =
      proposalButton.closest("#proposal, [data-proposal]") ||
      questionCard.parentElement;
    const status = document.querySelector("#proposalStatus");
    const replayButton = document.querySelector(
      "#replayButton, [data-replay-proposal]"
    );
    const transitionJobs = new Set();
    let state = "intro";
    let cancelTransition = null;

    const announce = (message) => {
      if (!status || status.textContent === message) return;
      status.textContent = message;
    };

    const transitionTime = (style) => {
      const times = (value) =>
        value.split(",").map((part) => {
          const time = part.trim();
          if (time.endsWith("ms")) return Number.parseFloat(time) || 0;
          if (time.endsWith("s")) return (Number.parseFloat(time) || 0) * 1000;
          return 0;
        });
      const durations = times(style.transitionDuration);
      const delays = times(style.transitionDelay);
      return durations.reduce((longest, duration, index) => {
        const delay = delays[index % Math.max(delays.length, 1)] || 0;
        return Math.max(longest, duration + delay);
      }, 0);
    };

    const transitionOut = (element, classes, complete) => {
      if (!element || prefersReducedMotion()) {
        complete();
        return () => {};
      }

      classes.forEach((className) => element.classList.add(className));
      const duration = transitionTime(window.getComputedStyle(element));

      if (duration <= 0) {
        complete();
        return () => {};
      }

      let finished = false;
      let fallbackTimer = 0;

      const finish = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(fallbackTimer);
        element.removeEventListener("transitionend", handleTransitionEnd);
        transitionJobs.delete(finish);
        complete();
      };

      const handleTransitionEnd = (event) => {
        if (event.target === element) finish();
      };

      element.addEventListener("transitionend", handleTransitionEnd);
      transitionJobs.add(finish);
      fallbackTimer = window.setTimeout(finish, duration + 120);

      return () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(fallbackTimer);
        element.removeEventListener("transitionend", handleTransitionEnd);
        transitionJobs.delete(finish);
      };
    };

    const setState = (nextState) => {
      state = nextState;
      if (proposalSection) proposalSection.dataset.proposalState = nextState;
    };

    const revealQuestion = () => {
      hideElement(proposalContent);
      proposalContent?.classList.add("is-hidden");
      showElement(questionCard);
      yesButton.disabled = false;
      setState("question");
      announce("The proposal question is open.");
      safelyFocus(questionHeading || yesButton);
    };

    const revealCelebration = () => {
      hideElement(questionCard);
      showElement(celebration);
      proposalButton.setAttribute("aria-expanded", "false");
      yesButton.setAttribute("aria-expanded", "true");
      document.body.classList.add("said-yes");
      setState("celebration");
      announce("The answer is yes. The celebration has begun.");
      effectsController?.celebrate();
      safelyFocus(celebrationHeading || celebration);
      prepareCelebrationCard();
    };

    const openProposal = () => {
      if (state !== "intro") return;
      setState("opening");
      proposalButton.disabled = true;
      proposalButton.setAttribute("aria-disabled", "true");
      proposalButton.setAttribute("aria-expanded", "true");
      proposalContent?.classList.remove("reveal");
      cancelTransition = transitionOut(
        proposalContent,
        ["depart", "is-leaving"],
        revealQuestion
      );
    };

    const celebrate = () => {
      if (state !== "question") return;
      setState("celebrating");
      yesButton.disabled = true;
      cancelTransition = transitionOut(
        questionCard,
        ["depart", "is-leaving"],
        revealCelebration
      );
    };

    const replay = () => {
      cancelTransition?.();
      cancelTransition = null;
      transitionJobs.forEach((finish) => finish());
      transitionJobs.clear();
      effectsController?.clear();
      document.body.classList.remove("said-yes");
      hideElement(questionCard);
      hideElement(celebration);

      if (proposalContent) {
        proposalContent.hidden = false;
        proposalContent.setAttribute("aria-hidden", "false");
        proposalContent.classList.remove(
          "depart",
          "is-hidden",
          "is-leaving"
        );
      }

      proposalButton.disabled = false;
      proposalButton.removeAttribute("aria-disabled");
      proposalButton.setAttribute("aria-expanded", "false");
      yesButton.disabled = false;
      yesButton.setAttribute("aria-expanded", "false");
      setState("intro");
      announce("The proposal has been reset.");
      effectsController?.resume();
      safelyFocus(proposalButton);
    };

    if (!questionCard.id) questionCard.id = "questionCard";
    if (!proposalButton.hasAttribute("aria-controls")) {
      proposalButton.setAttribute("aria-controls", questionCard.id);
    }
    proposalButton.setAttribute("aria-expanded", "false");
    yesButton.setAttribute("aria-expanded", "false");
    hideElement(questionCard);
    hideElement(celebration);
    setState("intro");

    proposalButton.addEventListener("click", openProposal);
    yesButton.addEventListener("click", celebrate);
    replayButton?.addEventListener("click", replay);
    onMotionPreferenceChange((event) => {
      if (!event.matches) return;
      transitionJobs.forEach((finish) => finish());
    });

    function prepareCelebrationCard() {
      document.dispatchEvent(
        new CustomEvent("celebrationcardrequested", {
          detail: { reason: "prepare" },
        })
      );
    }
  });

  initialize(() => {
    const shareButton = document.querySelector("#shareCardButton");
    const downloadButton = document.querySelector("#downloadCardButton");
    if (!shareButton && !downloadButton) return;

    const cardCanvas = document.querySelector("#celebrationCard");
    const celebration = document.querySelector("#celebration");
    const status =
      document.querySelector("#cardStatus") ||
      document.querySelector("#proposalStatus");
    const dataSources = [
      cardCanvas,
      celebration,
      document.querySelector("[data-card-initials], [data-card-date]"),
      document.body,
    ].filter(Boolean);
    let cardPromise = null;

    const getData = (key) => {
      for (const source of dataSources) {
        const value = source.dataset?.[key]?.trim();
        if (value) return value;
      }
      return "";
    };

    const initials = getData("cardInitials");
    const date = getData("cardDate");
    const shareTitle = getData("shareTitle") || initials;
    const shareText = getData("shareText") || `${initials} · ${date}`;
    const requestedFilename =
      getData("cardFilename") || `${initials || "our-garden"}-${date || "card"}`;
    const filename = `${requestedFilename
      .replace(/\.png$/i, "")
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "our-garden"}.png`;

    const announce = (message) => {
      if (!status || status.textContent === message) return;
      status.textContent = message;
    };

    const drawLeaf = (context, x, y, rotation, scale = 1) => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(scale, scale);
      context.beginPath();
      context.moveTo(0, 0);
      context.bezierCurveTo(30, -27, 58, -19, 66, 0);
      context.bezierCurveTo(43, 17, 17, 16, 0, 0);
      context.fill();
      context.restore();
    };

    const drawFlower = (context, x, y, radius) => {
      context.save();
      context.translate(x, y);
      for (let index = 0; index < 5; index += 1) {
        context.save();
        context.rotate((Math.PI * 2 * index) / 5);
        context.beginPath();
        context.ellipse(0, -radius, radius * 0.52, radius, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      context.fillStyle = "#d8b86b";
      context.beginPath();
      context.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const renderCard = () => {
      if (!initials || !date) return null;

      const canvas =
        cardCanvas instanceof HTMLCanvasElement
          ? cardCanvas
          : document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return null;

      canvas.width = 1200;
      canvas.height = 630;

      const background = context.createLinearGradient(0, 0, 1200, 630);
      background.addColorStop(0, "#061a16");
      background.addColorStop(0.55, "#123c31");
      background.addColorStop(1, "#081e19");
      context.fillStyle = background;
      context.fillRect(0, 0, 1200, 630);

      const moonlight = context.createRadialGradient(
        600,
        190,
        10,
        600,
        190,
        330
      );
      moonlight.addColorStop(0, "rgba(255, 239, 194, .22)");
      moonlight.addColorStop(1, "rgba(255, 239, 194, 0)");
      context.fillStyle = moonlight;
      context.fillRect(250, 0, 700, 560);

      context.fillStyle = "rgba(244, 222, 176, .7)";
      [
        [116, 105, 3],
        [237, 168, 2],
        [342, 82, 2],
        [881, 116, 2],
        [1015, 185, 3],
        [1088, 91, 2],
        [930, 275, 1.5],
        [184, 307, 1.5],
      ].forEach(([x, y, radius]) => {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });

      context.strokeStyle = "rgba(151, 178, 130, .75)";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(-20, 600);
      context.bezierCurveTo(160, 505, 210, 650, 390, 553);
      context.bezierCurveTo(525, 483, 665, 647, 840, 545);
      context.bezierCurveTo(1010, 447, 1060, 580, 1220, 475);
      context.stroke();

      context.fillStyle = "rgba(128, 164, 112, .9)";
      [
        [95, 553, -0.7, 0.8],
        [205, 572, 2.6, 0.72],
        [332, 571, -0.8, 0.7],
        [493, 548, 2.5, 0.78],
        [716, 568, -0.72, 0.76],
        [881, 528, 2.5, 0.82],
        [1052, 513, -0.72, 0.78],
      ].forEach(([x, y, rotation, scale]) =>
        drawLeaf(context, x, y, rotation, scale)
      );

      context.fillStyle = "rgba(247, 233, 202, .92)";
      drawFlower(context, 280, 554, 18);
      drawFlower(context, 610, 566, 22);
      drawFlower(context, 956, 523, 17);

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#f5e6c5";
      context.font = "600 126px Georgia, 'Times New Roman', serif";
      context.fillText(initials, 600, 275, 860);
      context.fillStyle = "rgba(245, 230, 197, .82)";
      context.font = "400 28px Arial, sans-serif";
      context.fillText(date, 600, 380, 820);

      return canvas;
    };

    const canvasToBlob = (canvas) =>
      new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 0.92);
      });

    const prepareCard = () => {
      if (cardPromise) return cardPromise;
      const canvas = renderCard();
      cardPromise = canvas
        ? canvasToBlob(canvas).then((blob) =>
            blob ? { blob, canvas } : null
          )
        : Promise.resolve(null);
      cardPromise = cardPromise.catch(() => null);
      return cardPromise;
    };

    const download = (blob) => {
      if (
        !blob ||
        typeof URL === "undefined" ||
        typeof URL.createObjectURL !== "function"
      ) {
        return false;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      return true;
    };

    const setBusy = (button, busy) => {
      if (!button) return;
      button.disabled = busy;
      button.setAttribute("aria-busy", String(busy));
    };

    const handleDownload = async () => {
      setBusy(downloadButton, true);
      try {
        const card = await prepareCard();
        if (card && download(card.blob)) {
          announce("The celebration card has been downloaded.");
        } else {
          announce("The celebration card could not be created.");
        }
      } catch {
        announce("The celebration card could not be created.");
      } finally {
        setBusy(downloadButton, false);
      }
    };

    const handleShare = async () => {
      setBusy(shareButton, true);

      try {
        const card = await prepareCard();
        if (!card) {
          announce("The celebration card could not be created.");
          return;
        }

        let canShareFile = false;
        let file = null;

        if (
          typeof navigator.share === "function" &&
          typeof navigator.canShare === "function" &&
          typeof File === "function"
        ) {
          file = new File([card.blob], filename, { type: "image/png" });
          try {
            canShareFile = navigator.canShare({ files: [file] });
          } catch {
            canShareFile = false;
          }
        }

        if (canShareFile) {
          try {
            await navigator.share({
              files: [file],
              title: shareTitle,
              text: shareText,
            });
            announce("The celebration card was shared.");
            return;
          } catch (error) {
            if (error?.name === "AbortError") {
              announce("Sharing was cancelled.");
              return;
            }
          }
        }

        if (download(card.blob)) {
          announce(
            "Image sharing is unavailable here, so the card was downloaded instead."
          );
        } else {
          announce("The celebration card could not be shared.");
        }
      } catch {
        announce("The celebration card could not be shared.");
      } finally {
        setBusy(shareButton, false);
      }
    };

    if (!initials || !date) {
      [shareButton, downloadButton].forEach((button) => {
        if (!button) return;
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
      });
      return;
    }

    document.addEventListener("celebrationcardrequested", prepareCard);
    shareButton?.addEventListener("click", handleShare);
    downloadButton?.addEventListener("click", handleDownload);
  });

  whenReady(() => {
    safeInitializers.forEach((initializer) => {
      try {
        initializer();
      } catch {
        root.classList.add("enhancement-degraded");
        document
          .querySelectorAll(".reveal, [data-reveal]")
          .forEach((element) =>
            element.classList.add("visible", "is-visible")
          );
      }
    });
  });
})();
