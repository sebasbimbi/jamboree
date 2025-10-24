// Check screen size helper
const isLargeScreen = () => window.innerWidth > 568;
const getTriggerStart = () => isLargeScreen() ? "top 70%" : "top 85%";
const getDelay = (delay) => isLargeScreen() ? delay : 0;

// Initialize GSAP once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.gsap === "undefined") {
        document.documentElement.classList.add("gsap-not-found");
        return;
    }
    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
    CustomEase.create("main", "0.65, 0.01, 0.05, 0.99");
    gsap.defaults({ ease: "main", duration: 0.7 });
});

// Button hover effect
$("[data-btn='wrap']").each(function() {
    const $clip = $(this).find("[data-btn='clip']").attr("aria-hidden", "true");
    const ease = "power2.out";

    const getY = (el, e) => ((e.pageY - $(window).scrollTop() - (el.offset().top - $(window).scrollTop())) / el.innerHeight()) * 100;
    const getX = (el, e) => ((e.pageX - el.offset().left) / el.innerWidth()) * 100;

    $(this).on("mouseenter", function(e) {
        const y = getY($(this), e), x = getX($(this), e);
        gsap.set($clip, { display: "flex" });
        gsap.fromTo($clip, { clipPath: `circle(0% at ${x}% ${y}%)` }, { clipPath: `circle(141.4% at ${x}% ${y}%)`, duration: 0.4, ease });
    }).on("mouseleave", function(e) {
        const y = getY($(this), e), x = getX($(this), e);
        gsap.to($clip, { clipPath: `circle(0% at ${x}% ${y}%)`, overwrite: true, duration: 0.4, ease });
    });
});

// Navigation menu
document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    const overlay = nav.querySelector(".overlay");
    const menu = nav.querySelector(".menu");
    const panels = nav.querySelectorAll(".bg-panel");
    const toggles = document.querySelectorAll("[data-menu-toggle]");
    const links = nav.querySelectorAll(".menu .nav_link");
    const fades = nav.querySelectorAll("[data-menu-fade]");
    const btn = document.querySelector(".menu-button");
    const btnTexts = btn?.querySelectorAll("p") || [];
    const btnIcon = btn?.querySelector(".menu-button-icon");
    const tl = gsap.timeline();

    const closeMenu = () => {
        nav.setAttribute("data-nav", "closed");
        btn?.classList.remove("is-opened");
        btn?.setAttribute("aria-label", "Open menu");
        tl.clear().to(overlay, { autoAlpha: 0 }).to(menu, { xPercent: 120 }, "<").to(btnTexts, { yPercent: 0 }, "<").to(btnIcon, { rotate: 0 }, "<").set(nav, { display: "none" });
    };

    toggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            if (nav.getAttribute("data-nav") === "open") {
                closeMenu();
            } else {
                nav.setAttribute("data-nav", "open");
                btn?.classList.add("is-opened");
                btn?.setAttribute("aria-label", "Close menu");
                tl.clear().set(nav, { display: "block" }).set(menu, { xPercent: 0 }, "<").fromTo(btnTexts, { yPercent: 0 }, { yPercent: -100, stagger: 0.2 }).fromTo(btnIcon, { rotate: 0 }, { rotate: 315 }, "<").fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1 }, "<").fromTo(panels, { xPercent: 101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, "<").fromTo(links, { yPercent: 140, rotate: 10, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, rotate: 0, stagger: 0.05 }, "<+=0.35").fromTo(fades, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, stagger: 0.04 }, "<+=0.2");
            }
        });
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && nav.getAttribute("data-nav") === "open") closeMenu();
    });

    if (btn && !btn.hasAttribute("aria-label")) btn.setAttribute("aria-label", "Open menu");
});

// Animation helper function
const createSplitText = (el, type) => {
    const split = SplitText.create(el, { type, mask: type });
    split.chars?.forEach(c => c.classList.add("split-char"));
    split.words?.forEach(w => w.classList.add("split-word"));
    split.lines?.forEach(l => l.classList.add("split-line"));
    split.masks?.forEach(m => m.classList.add("split-mask"));
    return split;
};

// Wait for fonts then initialize animations
document.fonts.ready.then(() => {
    
    // Stacked Content Animation
    document.querySelectorAll('[data-animation-trigger="stacked-content"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: getTriggerStart(), once: true }, defaults: { ease: "back.inOut" } });

        const tag = el.querySelector(".tag_wrap");
        if (tag) tl.from(tag, { opacity: 0, yPercent: 100, duration: 0.7 }, delay);

        const heading = el.querySelector(".c-heading > *");
        if (heading) {
            const split = createSplitText(heading, "chars, lines, words");
            tl.from(split.chars, { opacity: 0, yPercent: 100, duration: 0.5, stagger: { amount: 0.3, from: "start" } }, 0.3 + delay);
        }

        const texts = el.querySelectorAll('[data-animate="true"] p');
        if (texts.length) {
            const split = createSplitText(texts, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.75, stagger: 0.05 }, 0.4 + delay);
        }

        const btns = el.querySelectorAll(".u-button-group > * > *");
        if (btns.length) tl.from(btns, { opacity: 0, yPercent: 100, stagger: 0.15 }, 0.9 + delay);

        const cards = el.querySelectorAll(".card_primary_wrap, .card_img-bottom_outer");
        if (cards.length) tl.from(cards, { opacity: 0, yPercent: 30, stagger: 0.15 }, 0.65 + delay);
    });

    // Image Split Animation
    document.querySelectorAll('[data-animation-trigger="image-split"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: getTriggerStart(), once: true }, defaults: { ease: "back.inOut" } });

        const heading = el.querySelector(".c-heading > *");
        if (heading) {
            const split = createSplitText(heading, "chars, lines, words");
            tl.from(split.chars, { opacity: 0, yPercent: 100, duration: 0.5, stagger: { amount: 0.3, from: "start" } }, delay);
        }

        const texts = el.querySelectorAll('[data-animate="true"] > *:not(ul, ol)');
        if (texts.length) {
            const split = createSplitText(texts, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.75, stagger: 0.05 }, 0.4 + delay);
        }

        const listItems = el.querySelectorAll(".c-text > ul > li, .c-text > ol > li");
        if (listItems.length) tl.from(listItems, { opacity: 0, yPercent: 100, duration: 0.75, stagger: 0.05 }, 0.4 + delay);

        const btns = el.querySelectorAll(".u-button-group > * > *");
        if (btns.length) tl.from(btns, { opacity: 0, yPercent: 100, stagger: 0.15 }, 0.6 + delay);

        const img = el.querySelector(".c-image-wrap");
        if (img) tl.from(img, { opacity: 0, yPercent: 50, duration: 0.7, scale: 0.85 }, 0.15 + delay);
    });

    // Icons Grid Animation
    document.querySelectorAll('[data-animation-trigger="icons-grid"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: getTriggerStart(), once: true }, defaults: { ease: "back.inOut" } });

        const heading = el.querySelector(".c-heading > *");
        if (heading) {
            const split = createSplitText(heading, "chars, lines, words");
            tl.from(split.chars, { opacity: 0, yPercent: 100, duration: 0.5, stagger: { amount: 0.3, from: "start" } }, delay);
        }

        const texts = el.querySelectorAll('[data-animate="true"] p');
        if (texts.length) {
            const split = createSplitText(texts, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.45, stagger: 0.15 }, 0.6 + delay);
        }

        const btns = el.querySelectorAll(".u-button-group > * > *");
        if (btns.length) tl.from(btns, { opacity: 0, yPercent: 100, stagger: 0.15 }, 0.3 + delay);

        const cards = el.querySelectorAll(".card_primary_wrap");
        if (cards.length) tl.from(cards, { opacity: 0, yPercent: 40, duration: 0.7, stagger: 0.05 }, 0.4 + delay);
    });

    // CTA Animation
    document.querySelectorAll('[data-animation-trigger="cta"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: getTriggerStart(), once: true }, defaults: { ease: "back.inOut" } });

        const img = el.querySelector(".c-image-wrap");
        if (img) tl.from(img, { opacity: 0, yPercent: 50, scale: 0.85, duration: 0.7 }, delay);

        const heading = el.querySelector(".c-heading > *");
        if (heading) {
            const split = createSplitText(heading, "chars, lines, words");
            tl.from(split.chars, { opacity: 0, yPercent: 100, duration: 0.5, stagger: { amount: 0.3, from: "start" } }, 0.5 + delay);
        }

        const texts = el.querySelectorAll('[data-animate="true"] p');
        if (texts.length) {
            const split = createSplitText(texts, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.45, stagger: 0.15 }, 0.6 + delay);
        }

        const btns = el.querySelectorAll(".u-button-group > * > *");
        if (btns.length) tl.from(btns, { opacity: 0, yPercent: 100, stagger: 0.15 }, 0.7 + delay);
    });

    // Footer Animation
    document.querySelectorAll('[data-animation-trigger="footer"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: isLargeScreen() ? "top 80%" : "top 85%", once: true }, defaults: { ease: "back.inOut" } });

        const logo = el.querySelector(".footer_logo_wrap");
        if (logo) tl.from(logo, { opacity: 0, yPercent: 100, duration: 0.4 }, delay);

        const text = el.querySelector('[data-animate="true"] p');
        if (text) {
            const split = createSplitText(text, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.45, stagger: 0.15 }, 0.3 + delay);
        }

        const navItems = el.querySelectorAll(".footer_nav > *");
        if (navItems.length) tl.from(navItems, { opacity: 0, yPercent: 100, stagger: 0.15, duration: 0.7 }, 0.5 + delay);

        const logoItems = el.querySelectorAll(".footer_logo > *");
        if (logoItems.length) tl.from(logoItems, { opacity: 0, yPercent: 100, stagger: 0.05, ease: "elastic.inOut(1,0.4)", duration: 1.5 }, 0.16 + delay);
    });

    // Download Animation
    document.querySelectorAll('[data-animation-trigger="download"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: isLargeScreen() ? "top 80%" : "top 85%", once: true }, defaults: { ease: "back.inOut" } });

        const logo = el.querySelector(".download_main_logo");
        if (logo) tl.from(logo, { opacity: 0, yPercent: 100, duration: 0.4 }, delay);

        const heading = el.querySelector(".c-heading > *");
        if (heading) {
            const split = createSplitText(heading, "chars, lines, words");
            tl.from(split.chars, { opacity: 0, yPercent: 100, duration: 0.5, stagger: { amount: 0.3, from: "start" } }, 0.3 + delay);
        }

        const texts = el.querySelectorAll('[data-animate="true"] p');
        if (texts.length) {
            const split = createSplitText(texts, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.45, stagger: 0.15 }, 0.5 + delay);
        }

        const btns = el.querySelectorAll(".download_main_button_wrap > *, .u-button-group > * > *");
        if (btns.length) tl.from(btns, { opacity: 0, yPercent: 20, stagger: 0.15 }, 0.7 + delay);

        const img = el.querySelector(".c-image-cs-wrap");
        if (img) tl.from(img, { opacity: 0, yPercent: 50, duration: 0.7, scale: 0.85 }, 0.15 + delay);

        const playIcon = el.querySelector(".download_main_play-icon");
        if (playIcon) tl.from(playIcon, { opacity: 0, yPercent: 50, duration: 0.7, scale: 0.85 }, 0.65 + delay);
    });

    // Hero Banner Animation
    document.querySelectorAll('[data-animation-trigger="hero-banner"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: isLargeScreen() ? "top 80%" : "top 85%", once: true }, defaults: { ease: "back.inOut" } });

        const contain = el.querySelector(".hero_banner_contain");
        if (contain) tl.from(contain, { opacity: 0, yPercent: 50, scale: 0.85, duration: 0.7 }, delay);

        const heading = el.querySelector(".c-heading > *");
        if (heading) {
            const split = createSplitText(heading, "chars, lines, words");
            tl.from(split.chars, { opacity: 0, yPercent: 100, duration: 0.5, stagger: { amount: 0.3, from: "start" } }, 0.7 + delay);
        }

        const texts = el.querySelectorAll('[data-animate="true"] p');
        if (texts.length) {
            const split = createSplitText(texts, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.45, stagger: 0.15 }, 0.9 + delay);
        }

        const btns = el.querySelectorAll(".u-button-group > * > *");
        if (btns.length) tl.from(btns, { opacity: 0, yPercent: 100, stagger: 0.15 }, 0.95 + delay);
    });

    // Landing Page Hero Animation
    document.querySelectorAll('[data-animation-trigger="landingpage-hero"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: getTriggerStart(), once: true }, defaults: { ease: "back.inOut" } });

        const heading = el.querySelector(".c-heading > *");
        if (heading) {
            const split = createSplitText(heading, "chars, lines, words");
            tl.from(split.chars, { opacity: 0, yPercent: 100, duration: 0.5, stagger: { amount: 0.3, from: "start" } }, 0.68 + delay);
        }

        const text = el.querySelector('[data-animate="true"] p');
        if (text) {
            const split = createSplitText(text, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.45, stagger: 0.15 }, 1 + delay);
        }

        const btns = el.querySelectorAll(".u-button-group > * > *");
        if (btns.length) tl.from(btns, { opacity: 0, yPercent: 100, stagger: 0.15 }, 1.25 + delay);

        const img = el.querySelector(".c-image-wrap");
        if (img) tl.from(img, { opacity: 0, yPercent: 50, duration: 0.7, scale: 0.85 }, 1.4 + delay);

        const svgs = el.querySelectorAll(".hero_lp_svg");
        if (svgs.length) tl.from(svgs, { opacity: 0, yPercent: 100, stagger: 0.15 }, 1.6 + delay);
    });

    // Tabs Animation
    document.querySelectorAll('[data-animation-trigger="tabs"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: getTriggerStart(), once: true }, defaults: { ease: "back.inOut" } });

        const heading = el.querySelector(".tab_left .c-heading > *");
        if (heading) {
            const split = createSplitText(heading, "chars, lines, words");
            tl.from(split.chars, { opacity: 0, yPercent: 100, duration: 0.5, stagger: { amount: 0.3, from: "start" } }, delay);
        }

        const tabBtns = el.querySelectorAll(".tab_button_item");
        if (tabBtns.length) tl.from(tabBtns, { opacity: 0, yPercent: 100, stagger: 0.05, duration: 0.7 }, 0.3 + delay);

        const texts = el.querySelectorAll('.tab_left [data-animate="true"] p');
        if (texts.length) {
            const split = createSplitText(texts, "lines");
            tl.from(split.lines, { opacity: 0, yPercent: 100, duration: 0.75, stagger: 0.05 }, 0.4 + delay);
        }

        const btns = el.querySelectorAll(".u-button-group > * > *");
        if (btns.length) tl.from(btns, { opacity: 0, yPercent: 100, stagger: 0.15 }, 0.9 + delay);

        const cards = el.querySelectorAll(".card_primary_wrap, .card_img-bottom_outer");
        if (cards.length) tl.from(cards, { opacity: 0, yPercent: 30, stagger: 0.15 }, 0.65 + delay);
    });

    // Featured Testimonials Animation
    document.querySelectorAll('[data-animation-trigger="featured-testimonials"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: getTriggerStart(), once: true }, defaults: { ease: "back.inOut" } });

        const cards = el.querySelectorAll(".card_primary_wrap");
        if (cards.length) tl.from(cards, { opacity: 0, yPercent: 100, stagger: 0.15 }, delay);

        const img = el.querySelector(".c-image-wrap");
        if (img) tl.from(img, { opacity: 0, yPercent: 50, duration: 0.7, scale: 0.85 }, 0.15 + delay);
    });

    // FAQ Animation
    document.querySelectorAll('[data-animation-trigger="faq"]').forEach(el => {
        el.style.visibility = "visible";
        const delay = getDelay(parseFloat(el.getAttribute("data-animation-delay")) || 0);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: getTriggerStart(), once: true }, defaults: { ease: "back.inOut" } });

        const items = el.querySelectorAll(".accordion_list > *");
        if (items.length) tl.from(items, { opacity: 0, yPercent: 100, stagger: 0.15 }, delay);
    });
});
