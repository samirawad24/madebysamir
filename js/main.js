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
    window.lenis = lenis;
  }
  const scrollToEl = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  /* ---------- Mobile menu (focus trap, Escape, morphing burger) ---------- */
  const menu = $("#menu");
  const burger = $(".burger");
  const main = $("#main");
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    main.inert = open;
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) setTimeout(() => $("a", menu).focus(), 60);
    else burger.focus({ preventScroll: true });
  };
  $$("a", menu).forEach((a) => a.setAttribute("tabindex", "-1"));
  const syncMenuTabs = () => $$("a", menu).forEach((a) => a.setAttribute("tabindex", menuOpen ? "0" : "-1"));
  burger.addEventListener("click", () => { setMenu(!menuOpen); syncMenuTabs(); });
  document.addEventListener("keydown", (e) => {
    if (!menuOpen) return;
    if (e.key === "Escape") { setMenu(false); syncMenuTabs(); return; }
    if (e.key === "Tab") {
      const items = [burger, ...$$("a", menu)];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (m) => { if (m.matches && menuOpen) { setMenu(false); syncMenuTabs(); } });

  /* ---------- In-page anchor links ---------- */
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) { setMenu(false); syncMenuTabs(); }
      if (id === "#top") { lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
      else scrollToEl(target);
      // Move focus for keyboard and screen reader users
      const focusTarget = id === "#top" ? $(".wordmark") : (target.querySelector("h2") || target);
      if (focusTarget && focusTarget !== $(".wordmark")) { focusTarget.setAttribute("tabindex", "-1"); }
      setTimeout(() => focusTarget && focusTarget.focus({ preventScroll: true }), reduce ? 0 : 900);
    })
  );

  /* ---------- Split helper ---------- */
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

  /* ---------- The Build (hero) ---------- */
  const build = $("#build");
  const frame = $("#frame");
  const frameWrap = $(".frame-wrap");
  const stageItems = $$(".stages li");
  const visit = $(".visit");

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
  tl.addLabel("intro", 0)
    .to(".hero-copy", { y: -120, opacity: 0, duration: 1, ease: "power2.in" }, 0)
    .fromTo(frameWrap,
      { y: () => window.innerHeight * 0.62, scale: 0.86, rotateX: 18, transformPerspective: 1400 },
      { y: 0, scale: 1, rotateX: 0, duration: 1.3 }, 0)
    .fromTo(".stages", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.6 }, 0.7)
    .addLabel("blank", 1.3)
    .addLabel("structure", 2.1)
    .to(".caret", { autoAlpha: 0, duration: 0.2 }, "structure")
    .to(".grid-ov", { opacity: 1, duration: 0.4 }, "structure")
    .to(".b .w", { clipPath: "inset(0 0% 0% 0)", duration: 0.5, stagger: 0.09, ease: "power3.out" }, "structure+=0.15")
    .addLabel("words", 3.6)
    .to(".b .w", { opacity: 0.35, duration: 0.4 }, "words")
    .to(typeChars, { opacity: 1, duration: 0.01, stagger: { amount: 1.6 }, ease: "none" }, "words")
    .addLabel("color", 5.8)
    .to(".screen", { backgroundColor: "#fbfaf7", duration: 0.6 }, "color")
    .to(".grid-ov", { opacity: 0, duration: 0.4 }, "color")
    .to(".b .w", { opacity: 0, duration: 0.4 }, "color")
    .to(".mock .ty", { opacity: 0, duration: 0.3 }, "color")
    .fromTo(".mock .st", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" }, "color+=0.15")
    .to(".m-logo .seal", { scale: 1, duration: 0.5, ease: "back.out(2)" }, "color+=0.2")
    .to(".m-photo .r", { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "power3.inOut" }, "color+=0.35")
    .fromTo(".m-photo img", { scale: 1.25 }, { scale: 1, duration: 1.2, ease: "power3.out" }, "color+=0.35")
    .addLabel("live", 8)
    .to(".url-blank", { opacity: 0, duration: 0.2 }, "live")
    .to(".url .lock", { opacity: 1, duration: 0.2 }, "live+=0.1")
    .to(urlChars, { opacity: 1, duration: 0.01, stagger: { amount: 0.6 }, ease: "none" }, "live+=0.1")
    .to("#frame .live-pill", { opacity: 1, duration: 0.3 }, "live+=0.7")
    .to(".final", { opacity: 1, duration: 0.6 }, "live+=0.9")
    .fromTo(visit, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, "live+=1")
    .to({}, { duration: 1 });

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

  /* ---------- Scroll-driven sections ---------- */
  const cases = $$(".case");
  const screenScroll = (img) => () => -Math.max(0, img.offsetHeight - img.parentElement.clientHeight);

  if (reduce) {
    tl.progress(1);
    setStage();
  } else {
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 901px)", mobile: "(max-width: 900px)" }, (ctx) => {
      const { desktop } = ctx.conditions;

      // Hero build
      ScrollTrigger.create({
        trigger: build,
        start: "top top",
        end: () => "+=" + window.innerHeight * (desktop ? 5.5 : 4.2),
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        animation: tl,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(".build-progress span", { scaleX: self.progress }),
      });

      // Work: each screen scrolls through the real site
      cases.forEach((c, i) => {
        $$(".scroller", c).forEach((img) => {
          gsap.to(img, {
            y: screenScroll(img),
            ease: "none",
            scrollTrigger: desktop
              ? { trigger: c, start: "top top", end: () => "+=" + window.innerHeight * 1.3, scrub: 0.6, invalidateOnRefresh: true }
              : { trigger: c, start: "top 80%", end: "bottom 10%", scrub: 0.6, invalidateOnRefresh: true },
          });
        });
        // Desktop: the card underneath sinks back as the next one slides over it
        if (desktop && i > 0) {
          gsap.to($(".case-shell", cases[i - 1]), {
            scale: 0.92, opacity: 0.35, ease: "none",
            scrollTrigger: { trigger: c, start: "top bottom", end: "top top", scrub: true },
          });
        }
      });

      // Process: vertical scroll pans the steps sideways (desktop)
      if (desktop) {
        const track = $(".process-track");
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: ".process-pin",
            start: "top top",
            end: () => "+=" + dist(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(".process-bar span", { scaleX: self.progress }),
          },
        });
      }
    });

    // Gentle reveal for content blocks
    gsap.set(".reveal", { opacity: 0, y: 40, filter: "blur(8px)" });
    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.08, ease: "expo.out", clearProps: "filter" }),
    });
    // Step words rise as they enter (mobile flow and desktop pan both)
    $$(".step").forEach((s) => gsap.from(s, { opacity: 0, y: 30, duration: 1, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 92%", containerAnimation: undefined, once: true } }));

    // Footer wordmark
    gsap.from(".foot-mark > *", { yPercent: 60, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".foot-mark", start: "top 95%", once: true } });
  }

  // Images that load late change heights; recalc scroll positions once they arrive
  $$(".scroller, .cell-media img, .photo-core img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  });

  /* ---------- FAQ accordion ---------- */
  $$(".qa-q").forEach((btn) =>
    btn.addEventListener("click", () => {
      const qa = btn.closest(".qa");
      const open = !qa.classList.contains("open");
      qa.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      setTimeout(() => ScrollTrigger.refresh(), 600);
    })
  );

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

  /* ---------- Contact: live preview ---------- */
  const form = $("#contact-form");
  const f = {
    name: $("#f-name"), email: $("#f-email"), biz: $("#f-biz"), msg: $("#f-msg"), consent: $("#f-consent"),
  };
  const pv = {
    url: $("#pv-url"), logo: $("#pv-logo"), title: $("#pv-title"), sub: $("#pv-sub"), kicker: $("#pv-kicker"),
    live: $("#pv-live"), frame: $("#pv-frame"),
  };
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").slice(0, 28);
  const needs = () => $$('input[name="needs"]:checked', form).map((i) => i.value);
  const updatePreview = () => {
    const biz = f.biz.value.trim();
    const name = f.name.value.trim().split(" ")[0];
    pv.url.textContent = (slug(biz) || "yourbusiness") + ".com";
    pv.logo.textContent = biz || "Your business";
    pv.title.textContent = biz || "Your business";
    const n = needs();
    pv.kicker.textContent = n.length ? n.join(", ") : "Your services go here";
    pv.sub.textContent = name ? `Made by Samir, for ${name}` : "Made by Samir";
  };
  ["input", "change"].forEach((ev) => form.addEventListener(ev, updatePreview));

  /* ---------- Contact: validation + send ---------- */
  const status = $("#form-status");
  const setErr = (input, errEl, msg) => {
    errEl.textContent = msg || "";
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    if (input.type !== "checkbox") input.setAttribute("aria-describedby", errEl.id);
  };
  const validate = () => {
    const checks = [
      [f.name, $("#e-name"), f.name.value.trim() ? "" : "Please add your name."],
      [f.email, $("#e-email"), !f.email.value.trim() ? "Please add your email." : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()) ? "" : "That email doesn't look right. Check for typos."],
      [f.biz, $("#e-biz"), f.biz.value.trim() ? "" : "Please add your business name."],
      [f.consent, $("#e-consent"), f.consent.checked ? "" : "Please check this box so I can reply to you."],
    ];
    let first = null;
    checks.forEach(([input, el, msg]) => { setErr(input, el, msg); if (msg && !first) first = input; });
    return first;
  };
  [f.name, f.email, f.biz].forEach((i) => i.addEventListener("blur", () => { if (i.getAttribute("aria-invalid")) validate(); }));
  f.consent.addEventListener("change", () => { if (f.consent.getAttribute("aria-invalid")) validate(); });

  const submitBtn = $(".btn-submit", form);
  const label = $(".btn-label", submitBtn);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status field-wide";
    status.textContent = "";
    const firstBad = validate();
    if (firstBad) { firstBad.focus(); return; }

    // Spam trap: bots fill hidden fields. Pretend it worked.
    if ($('input[name="_honey"]', form).value) { status.textContent = "Thanks. Your message is on its way."; return; }

    submitBtn.disabled = true;
    label.textContent = "Sending…";
    const payload = {
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      business: f.biz.value.trim(),
      needs: needs().join(", ") || "Not specified",
      message: f.msg.value.trim() || "(none)",
      consent: "Agreed to be contacted about this project (Privacy Policy)",
      _subject: `New project: ${f.biz.value.trim()}`,
      _replyto: f.email.value.trim(),
      _template: "table",
      _captcha: "false",
    };
    try {
      const res = await fetch("https://formsubmit.co/ajax/samirawad24@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) !== "true") throw new Error(data.message || "Send failed");
      const first = payload.name.split(" ")[0];
      status.textContent = `Thanks, ${first}. I got your details and will reply from samirawad24@gmail.com.`;
      pv.title.textContent = `Talk soon, ${first}.`;
      pv.live.style.opacity = "1";
      pv.frame.classList.add("is-live");
      label.textContent = "Sent";
      form.reset();
    } catch (err) {
      status.classList.add("is-error");
      status.innerHTML = 'Something went wrong and your message didn\'t send. Please email me at <a href="mailto:samirawad24@gmail.com">samirawad24@gmail.com</a> instead.';
      submitBtn.disabled = false;
      label.textContent = "Try again";
    }
  });

  /* ---------- Intro signature ---------- */
  const heroIn = () =>
    gsap.from([".hero-copy .kicker", ".hero-title .ln", ".hero-sub", ".hero-ctas"], {
      y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out",
    });
  const finishIntro = () => {
    document.body.classList.remove("is-loading");
    const intro = $("#intro");
    if (intro) intro.remove();
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  };
  // Show the intro once per visit; later page loads skip straight in
  let seen = false;
  try { seen = sessionStorage.getItem("mbs-intro") === "1"; sessionStorage.setItem("mbs-intro", "1"); } catch (e) { /* storage blocked */ }
  if (reduce || seen || location.hash) {
    finishIntro();
  } else {
    if (lenis) lenis.stop();
    window.scrollTo(0, 0);
    gsap.timeline({ delay: 0.2, onComplete: finishIntro })
      .to(".intro-text", { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "power2.inOut" }, 0)
      .fromTo(".intro-pen", { left: "0%" }, { left: "100%", duration: 1.5, ease: "power2.inOut" }, 0)
      .to(".intro-pen", { scale: 0, duration: 0.3 }, 1.5)
      .to("#intro", { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, 1.75)
      .add(heroIn, 2.1);
  }
})();
