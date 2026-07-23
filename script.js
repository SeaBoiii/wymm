document.addEventListener("DOMContentLoaded", () => {
  const setText = (selector, value) => {
    document.querySelectorAll(`[data-content="${selector}"]`).forEach((el) => {
      el.textContent = value;
    });
  };

  Object.entries(proposalContent).forEach(([key, value]) => {
    if (typeof value === "string") setText(key, value);
  });

  const letterBody = document.querySelector("#letterBody");
  proposalContent.letter.forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    letterBody.appendChild(p);
  });

  const timeline = document.querySelector("#timeline");
  proposalContent.journey.forEach((moment, index) => {
    const article = document.createElement("article");
    article.className = "timeline-item reveal";
    article.innerHTML = `
      <div class="timeline-marker"><span>${String(index + 1).padStart(2, "0")}</span></div>
      <div class="timeline-copy">
        <p class="chapter">${moment.chapter}</p>
        <h3>${moment.title}</h3>
        <p class="date">${moment.date}</p>
        <p>${moment.text}</p>
      </div>`;
    timeline.appendChild(article);
  });

  const reasons = document.querySelector("#reasons");
  proposalContent.reasons.forEach((reason) => {
    const article = document.createElement("article");
    article.className = "reason-card reveal";
    article.innerHTML = `
      <span>${reason.number}</span>
      <h3>${reason.title}</h3>
      <p>${reason.text}</p>`;
    reasons.appendChild(article);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  const petals = document.querySelector("#petals");
  const makePetal = (burst = false) => {
    const petal = document.createElement("i");
    petal.style.setProperty("--x", `${Math.random() * 100}vw`);
    petal.style.setProperty("--drift", `${(Math.random() - 0.5) * 180}px`);
    petal.style.setProperty("--duration", `${7 + Math.random() * 8}s`);
    petal.style.setProperty("--delay", burst ? "0s" : `${Math.random() * 8}s`);
    petal.style.setProperty("--size", `${5 + Math.random() * 7}px`);
    petals.appendChild(petal);
    setTimeout(() => petal.remove(), 16000);
  };
  for (let i = 0; i < 16; i += 1) makePetal();
  setInterval(makePetal, 1100);

  const proposalButton = document.querySelector("#proposalButton");
  const proposalContentEl = document.querySelector("#proposalContent");
  const questionCard = document.querySelector("#questionCard");
  proposalButton.addEventListener("click", () => {
    proposalButton.disabled = true;
    proposalContentEl.classList.add("depart");
    setTimeout(() => {
      proposalContentEl.classList.add("is-hidden");
      questionCard.classList.add("shown");
      questionCard.setAttribute("aria-hidden", "false");
    }, 520);
  });

  const celebrate = () => {
    questionCard.classList.remove("shown");
    questionCard.setAttribute("aria-hidden", "true");
    document.querySelector("#celebration").classList.add("shown");
    document.body.classList.add("said-yes");
    for (let i = 0; i < 80; i += 1) setTimeout(() => makePetal(true), i * 24);
  };
  document.querySelector("#yesButton").addEventListener("click", celebrate);
  document.querySelector("#alsoYesButton").addEventListener("click", celebrate);
});
