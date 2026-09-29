(() => {
  "use strict";

  const index = document.querySelector("#plain-index");
  const toast = document.querySelector(".toast");
  let toastTimer;

  function shanghaiNow() {
    const date = new Date();
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23"
    }).formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
    return { date, dayKey: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
  }

  function initGate() {
    if (!document.body.matches("[data-gate-page]")) return;
    const message = document.querySelector("[data-gate-message]");
    const status = document.querySelector("[data-gate-status]");
    const enter = document.querySelector("[data-enter]");
    const now = shanghaiNow();
    const phase = now.hour < 6 ? "night" : now.hour < 9 ? "dawn" : now.hour < 17 ? "day" : now.hour < 20 ? "dusk" : "night";
    document.body.classList.add(`time-${phase}`);

    let lastVisit = "";
    let visits = 0;
    try {
      lastVisit = localStorage.getItem("yili.shrine.lastVisit") || "";
      visits = Number(localStorage.getItem("yili.shrine.visits") || 0);
    } catch (_) {}

    if (message && visits > 0) message.textContent = lastVisit === now.dayKey ? "门开着。自己进来。" : "又来了？今天也没锁门。";
    if (status) {
      const dateText = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric", weekday: "short" }).format(now.date);
      const sky = { dawn: "天将亮", day: "日间", dusk: "暮色", night: "夜" }[phase];
      status.textContent = `${dateText}　${sky}　境界没有异常。`;
    }
    enter?.addEventListener("click", () => {
      try {
        localStorage.setItem("yili.shrine.lastVisit", now.dayKey);
        localStorage.setItem("yili.shrine.visits", String(visits + 1));
      } catch (_) {}
    });
  }

  function say(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function initScene() {
    const scene = document.querySelector(".scene");
    if (!scene) return;
    const scrollRoot = document.scrollingElement;

    if (matchMedia("(max-width: 760px)").matches) {
      requestAnimationFrame(() => {
        const range = Math.max(0, scene.scrollWidth - innerWidth);
        scrollTo({ left: range * .38, top: 0, behavior: "instant" });
      });
    }

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    scene.addEventListener("pointerdown", event => {
      if (event.pointerType !== "mouse" || event.target.closest("a, button") || scene.scrollWidth <= innerWidth) return;
      dragging = true;
      startX = event.clientX;
      startScroll = scrollRoot.scrollLeft;
      scene.classList.add("is-dragging");
      scene.setPointerCapture(event.pointerId);
    });
    scene.addEventListener("pointermove", event => {
      if (!dragging) return;
      scrollRoot.scrollLeft = startScroll - (event.clientX - startX);
    });
    const stopDragging = () => {
      dragging = false;
      scene.classList.remove("is-dragging");
    };
    scene.addEventListener("pointerup", stopDragging);
    scene.addEventListener("pointercancel", stopDragging);
  }

  function toggleIndex() {
    if (!index) return;
    const shouldOpen = index.hidden;
    index.hidden = !shouldOpen;
    document.querySelectorAll('[data-action="toggle-index"]').forEach(button => {
      button.setAttribute("aria-expanded", String(shouldOpen));
    });
    if (shouldOpen) index.querySelector("a, button")?.focus();
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;

    if (trigger.dataset.action === "toggle-index") toggleIndex();
    if (trigger.dataset.action === "leave") {
      if (history.length > 1) history.back();
      else location.href = "outside/";
    }
    if (trigger.dataset.action === "toggle-labels") {
      const active = document.body.classList.toggle("show-labels");
      trigger.setAttribute("aria-pressed", String(active));
      trigger.textContent = active ? "收起路标" : "看路标";
    }
    if (trigger.dataset.action === "saisen") {
      say("空响了一声。愿望先欠着，香油钱也是。");
    }
    if (trigger.dataset.action === "broom") {
      say("都说了别碰。……算了，落叶归你扫。");
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && index && !index.hidden && matchMedia("(min-width: 761px)").matches) toggleIndex();
  });

  initGate();
  initScene();
})();
