(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    window.lenis = lenis;
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  /* ---------- Anchor links + mobile menu ---------- */
  const menu = $("#menu");
  const menuBtn = $(".menu-btn");
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.firstElementChild.textContent = open ? "Close" : "Menu";
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener("click", () => setMenu(menu.hidden));
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const target = $(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (!menu.hidden) setMenu(false);
      scrollTo(target);
    })
  );

  /* ---------- Split helpers (words keep chars from breaking mid-word) ---------- */
  const splitChars = (el) => {
    const words = el.textContent.split(" ");
    el.textContent = "";
    words.forEach((w, i) => {
      const wd = document.createElement("span");
      wd.className = "wd";
      [...w].forEach((ch) => {
        const c = document.createElement("span");
        c.className = "c";
        c.textContent = ch;
        wd.appendChild(c);
      });
      el.appendChild(wd);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return $$(".c", el);
  };
  const typeChars = $$(".mock .ty").flatMap(splitChars);
  const urlChars = splitChars($(".url-live"));

  /* ---------- The Build timeline ---------- */
  const build = $("#build");
  const frame = $("#frame");
  const frameWrap = $(".frame-wrap");
  const stageItems = $$(".stages li");
  const visit = $(".visit");

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });

  // 0. Hero copy leaves, frame rises into place
  tl.addLabel("intro", 0)
    .to(".hero-copy", { y: -120, opacity: 0, duration: 1, ease: "power2.in" }, 0)
    .fromTo(frameWrap,
      { y: () => window.innerHeight * 0.62, scale: 0.86, rotateX: 18, transformPerspective: 1400 },
      { y: 0, scale: 1, rotateX: 0, duration: 1.3 }, 0)
    .fromTo(".stages", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.6 }, 0.7)

  // 1. Blank page: just the caret
    .addLabel("blank", 1.3)

  // 2. Structure: grid + wireframe boxes draw in
    .addLabel("structure", 2.1)
    .to(".caret", { autoAlpha: 0, duration: 0.2 }, "structure")
    .to(".grid-ov", { opacity: 1, duration: 0.4 }, "structure")
    .to(".b .w", { clipPath: "inset(0 0% 0% 0)", duration: 0.5, stagger: 0.09, ease: "power3.out" }, "structure+=0.15")

  // 3. Words: draft copy types itself
    .addLabel("words", 3.6)
    .to(".b .w", { opacity: 0.35, duration: 0.4 }, "words")
    .to(typeChars, { opacity: 1, duration: 0.01, stagger: { amount: 1.6 }, ease: "none" }, "words")

  // 4. Color & photos: brand type, color, photo
    .addLabel("color", 5.8)
    .to(".screen", { backgroundColor: "#fbfaf7", duration: 0.6 }, "color")
    .to(".grid-ov", { opacity: 0, duration: 0.4 }, "color")
    .to(".b .w", { opacity: 0, duration: 0.4 }, "color")
    .to(".mock .ty", { opacity: 0, duration: 0.3 }, "color")
    .fromTo(".mock .st", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" }, "color+=0.15")
    .to(".m-logo .seal", { scale: 1, duration: 0.5, ease: "back.out(2)" }, "color+=0.2")
    .to(".m-photo .r", { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.inOut" }, "color+=0.35")
    .fromTo(".m-photo img", { scale: 1.25 }, { scale: 1, duration: 1.2, ease: "power3.out" }, "color+=0.35")

  // 5. Live: real URL, live pill, real screenshot
    .addLabel("live", 8)
    .to(".url-blank", { opacity: 0, duration: 0.2 }, "live")
    .to(".url .lock", { opacity: 1, duration: 0.2 }, "live+=0.1")
    .to(urlChars, { opacity: 1, duration: 0.01, stagger: { amount: 0.6 }, ease: "none" }, "live+=0.1")
    .to(".live-pill", { opacity: 1, duration: 0.3 }, "live+=0.7")
    .to(".final", { opacity: 1, duration: 0.6 }, "live+=0.9")
    .fromTo(visit, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, "live+=1")
    .to({}, { duration: 1 }); // hold on the finished site

  const labels = ["blank", "structure", "words", "color", "live"];
  const setStage = () => {
    const t = tl.time();
    let idx = -1;
    labels.forEach((l, i) => { if (t >= tl.labels[l] - 0.05) idx = i; });
    stageItems.forEach((li, i) => li.classList.toggle("is-active", i === idx));
    frame.classList.toggle("is-live", t >= tl.labels.live + 0.7);
    visit.classList.toggle("on", t >= tl.labels.live + 1);
  };
  tl.eventCallback("onUpdate", setStage);

  if (reduce) {
    // Static: show the finished build, no pinning
    tl.progress(1);
    setStage();
  } else {
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 901px)", mobile: "(max-width: 900px)" }, (ctx) => {
      const st = ScrollTrigger.create({
        trigger: build,
        start: "top top",
        end: () => "+=" + window.innerHeight * (ctx.conditions.desktop ? 5.5 : 4.2),
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        animation: tl,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(".build-progress span", { scaleX: self.progress }),
      });
      return () => st.kill();
    });
  }

  /* ---------- Intro signature ---------- */
  const heroIn = () =>
    gsap.from([".hero-copy .kicker", ".hero-title .ln", ".hero-sub", ".hero-ctas"], {
      y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out",
    });

  const finishIntro = () => {
    document.body.classList.remove("is-loading");
    $("#intro").remove();
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  };

  if (reduce) {
    finishIntro();
  } else {
    if (lenis) lenis.stop();
    window.scrollTo(0, 0);
    const text = $(".intro-text");
    const pen = $(".intro-pen");
    gsap.timeline({ delay: 0.2, onComplete: finishIntro })
      .to(text, { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "power2.inOut" }, 0)
      .fromTo(pen, { left: "0%" }, { left: "100%", duration: 1.5, ease: "power2.inOut" }, 0)
      .to(pen, { scale: 0, duration: 0.3 }, 1.5)
      .to("#intro", { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, 1.75)
      .add(heroIn, 2.1);
  }
})();
