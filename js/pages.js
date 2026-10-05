/* Service pages: the homepage's motion without the homepage-only sections */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href="#top"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.6 });
      else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      const wm = $(".wordmark");
      setTimeout(() => wm && wm.focus({ preventScroll: true }), reduce ? 0 : 900);
    })
  );

  if (!reduce) {
    // Hero rises in
    gsap.from([".svc-hero .kicker", ".svc-hero h1", ".svc-hero .lede", ".svc-hero .svc-ctas"], {
      y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out", delay: 0.1,
    });

    // Gentle reveal for content blocks
    gsap.set(".reveal", { opacity: 0, y: 40, filter: "blur(8px)" });
    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.08, ease: "expo.out", clearProps: "filter" }),
    });

    // Each screenshot scrolls through the real site as it crosses the screen
    $$(".shot-frame img").forEach((img) => {
      const frame = img.parentElement;
      gsap.to(img, {
        y: () => -Math.min(Math.max(0, img.offsetHeight - frame.clientHeight), frame.clientHeight * 1.4),
        ease: "none",
        scrollTrigger: { trigger: frame, start: "top 85%", end: "bottom 10%", scrub: 0.6, invalidateOnRefresh: true },
      });
    });

    // Footer wordmark
    gsap.from(".foot-mark > *", { yPercent: 60, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".foot-mark", start: "top 95%", once: true } });
  }

  // Images that load late change heights; recalc scroll positions once they arrive
  $$(".shot-frame img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  });

  /* ---------- Magnetic buttons (mouse only) ---------- */
  if (finePointer && !reduce) {
    $$(".btn").forEach((b) => {
      const xTo = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3.out" });
      const yTo = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3.out" });
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.18);
        yTo((e.clientY - r.top - r.height / 2) * 0.28);
      });
      b.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }
})();
