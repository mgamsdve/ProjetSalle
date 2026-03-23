function animateCounter(el, target, duration = 1500) {
    let start = 0;
    const step = target / (duration / 16);

    const timer = setInterval(() => {
        start += step;

        if (start >= target) {
            el.textContent = String(target);
            clearInterval(timer);
            return;
        }

        el.textContent = String(Math.floor(start));
    }, 16);
}

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll(".animate-on-scroll").forEach((el) => {
    scrollObserver.observe(el);
});

const statsSection = document.querySelector("#stats-section");
let countersStarted = false;

if (statsSection) {
    const countersObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !countersStarted) {
                countersStarted = true;
                document.querySelectorAll("[data-counter-target]").forEach((counter) => {
                    const target = Number.parseInt(counter.getAttribute("data-counter-target"), 10);
                    if (!Number.isNaN(target)) {
                        animateCounter(counter, target);
                    }
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.25 });

    countersObserver.observe(statsSection);
}
