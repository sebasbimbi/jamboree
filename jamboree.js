// Performance-optimized Webflow GSAP Animation Script
(() => {
  'use strict';

  // Configuration
  const CONFIG = {
    ease: {
      main: "0.65, 0.01, 0.05, 0.99",
      default: "back.inOut",
      menu: "power2.out"
    },
    duration: {
      default: 0.7,
      split: 0.5,
      menu: 0.4
    },
    scrollTrigger: {
      start: "top 70%",
      footerStart: "top 80%"
    },
    mobile: {
      breakpoint: 768,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  };

  // Utility functions
  const utils = {
    isMobile: () => window.innerWidth <= CONFIG.mobile.breakpoint,
    isSafari: () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    
    // Optimized querySelector with caching
    qs: (selector, parent = document) => parent.querySelector(selector),
    qsa: (selector, parent = document) => parent.querySelectorAll(selector),
    
    // Debounce for performance
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    // RAF throttle for smooth animations
    rafThrottle: (callback) => {
      let requestId = null;
      return (...args) => {
        if (requestId === null) {
          requestId = requestAnimationFrame(() => {
            callback.apply(this, args);
            requestId = null;
          });
        }
      };
    }
  };

  // Animation cache to prevent re-initialization
  const animationCache = new WeakMap();

  // Main initialization
  function init() {
    // Check GSAP availability
    if (typeof window.gsap === "undefined") {
      document.documentElement.classList.add("gsap-not-found");
      return;
    }

    // Register plugins once
    gsap.registerPlugin(ScrollTrigger, SplitText);
    
    // Custom ease
    if (typeof CustomEase !== 'undefined') {
      CustomEase.create("main", CONFIG.ease.main);
      gsap.defaults({ ease: "main", duration: CONFIG.duration.default });
    }

    // Wait for fonts with timeout
    const fontsReady = document.fonts?.ready || Promise.resolve();
    const timeout = new Promise(resolve => setTimeout(resolve, 3000));
    
    Promise.race([fontsReady, timeout]).then(() => {
      initAnimations();
      initMenu();
      initButtons();
      
      // Setup resize handler with debouncing
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          ScrollTrigger.refresh();
        }, 250);
      });
    });
  }

  // Optimized button animation with event delegation
  function initButtons() {
    const buttonWraps = utils.qsa("[data-btn='wrap']");
    if (!buttonWraps.length) return;

    // Use event delegation for better performance
    document.addEventListener('mouseenter', handleButtonEnter, true);
    document.addEventListener('mouseleave', handleButtonLeave, true);

    function handleButtonEnter(e) {
      const wrap = e.target.closest("[data-btn='wrap']");
      if (!wrap) return;
      
      const clipEl = wrap.querySelector("[data-btn='clip']");
      if (!clipEl) return;

      const rect = wrap.getBoundingClientRect();
      const percentLeft = ((e.clientX - rect.left) / rect.width) * 100;
      const percentTop = ((e.clientY - rect.top) / rect.height) * 100;

      gsap.set(clipEl, { display: "flex" });
      gsap.fromTo(clipEl, 
        { clipPath: `circle(0% at ${percentLeft}% ${percentTop}%)` },
        { clipPath: `circle(141.4% at ${percentLeft}% ${percentTop}%)`, 
          duration: CONFIG.duration.menu, 
          ease: CONFIG.ease.menu 
        }
      );
    }

    function handleButtonLeave(e) {
      const wrap = e.target.closest("[data-btn='wrap']");
      if (!wrap) return;
      
      const clipEl = wrap.querySelector("[data-btn='clip']");
      if (!clipEl) return;

      const rect = wrap.getBoundingClientRect();
      const percentLeft = ((e.clientX - rect.left) / rect.width) * 100;
      const percentTop = ((e.clientY - rect.top) / rect.height) * 100;

      gsap.to(clipEl, {
        clipPath: `circle(0% at ${percentLeft}% ${percentTop}%)`,
        overwrite: true,
        duration: CONFIG.duration.menu,
        ease: CONFIG.ease.menu
      });
    }
  }

  // Optimized menu initialization
  function initMenu() {
    const navWrap = utils.qs(".nav");
    if (!navWrap) return;

    const elements = {
      overlay: utils.qs(".overlay", navWrap),
      menu: utils.qs(".menu", navWrap),
      bgPanels: utils.qsa(".bg-panel", navWrap),
      menuLinks: utils.qsa(".menu .nav_link", navWrap),
      fadeTargets: utils.qsa("[data-menu-fade]", navWrap),
      menuButton: utils.qs(".menu-button"),
      menuToggles: utils.qsa("[data-menu-toggle]")
    };

    const menuButtonElements = elements.menuButton ? {
      texts: utils.qsa("p", elements.menuButton),
      icon: utils.qs(".menu-button-icon", elements.menuButton)
    } : null;

    let tl = gsap.timeline();
    let isOpen = false;

    const toggleMenu = utils.rafThrottle(() => {
      isOpen ? closeNav() : openNav();
    });

    function openNav() {
      if (isOpen) return;
      isOpen = true;
      
      navWrap.setAttribute("data-nav", "open");
      elements.menuButton?.classList.add("is-opened");
      elements.menuButton?.setAttribute("aria-label", "Close menu");

      // Use single timeline for better performance
      tl.clear()
        .set(navWrap, { display: "block" })
        .set(elements.menu, { xPercent: 0 }, "<");

      if (menuButtonElements) {
        tl.fromTo(menuButtonElements.texts, 
          { yPercent: 0 }, 
          { yPercent: -100, stagger: 0.2 })
          .fromTo(menuButtonElements.icon, 
            { rotate: 0 }, 
            { rotate: 315 }, "<");
      }

      tl.fromTo(elements.overlay, 
        { autoAlpha: 0 }, 
        { autoAlpha: 1 }, "<")
        .fromTo(elements.bgPanels, 
          { xPercent: 101 }, 
          { xPercent: 0, stagger: 0.12, duration: 0.575 }, "<")
        .fromTo(elements.menuLinks, 
          { yPercent: 140, rotate: 10, autoAlpha: 0 }, 
          { yPercent: 0, autoAlpha: 1, rotate: 0, stagger: 0.05 }, "<+=0.35");

      if (elements.fadeTargets.length) {
        tl.fromTo(elements.fadeTargets, 
          { autoAlpha: 0, yPercent: 50 }, 
          { autoAlpha: 1, yPercent: 0, stagger: 0.04 }, "<+=0.2");
      }
    }

    function closeNav() {
      if (!isOpen) return;
      isOpen = false;
      
      navWrap.setAttribute("data-nav", "closed");
      elements.menuButton?.classList.remove("is-opened");
      elements.menuButton?.setAttribute("aria-label", "Open menu");

      tl.clear()
        .to(elements.overlay, { autoAlpha: 0 })
        .to(elements.menu, { xPercent: 120 }, "<");

      if (menuButtonElements) {
        tl.to(menuButtonElements.texts, { yPercent: 0 }, "<")
          .to(menuButtonElements.icon, { rotate: 0 }, "<");
      }

      tl.set(navWrap, { display: "none" });
    }

    // Event listeners
    elements.menuToggles.forEach(toggle => {
      toggle.addEventListener("click", toggleMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) closeNav();
    });

    // Set initial ARIA
    elements.menuButton?.setAttribute("aria-label", "Open menu");
  }

  // Unified animation initialization
  function initAnimations() {
    const animationConfigs = [
      { selector: '[data-animation-trigger="hero-main"]', handler: animateHeroMain },
      { selector: '[data-animation-trigger="stacked-content"]', handler: animateStackedContent },
      { selector: '[data-animation-trigger="image-split"]', handler: animateImageSplit },
      { selector: '[data-animation-trigger="icons-grid"]', handler: animateIconsGrid },
      { selector: '[data-animation-trigger="cta"]', handler: animateCTA },
      { selector: '[data-animation-trigger="footer"]', handler: animateFooter, start: CONFIG.scrollTrigger.footerStart },
      { selector: '[data-animation-trigger="download"]', handler: animateDownload, start: CONFIG.scrollTrigger.footerStart },
      { selector: '[data-animation-trigger="hero-banner"]', handler: animateHeroBanner, start: CONFIG.scrollTrigger.footerStart },
      { selector: '[data-animation-trigger="landingpage-hero"]', handler: animateLandingPageHero }
    ];

    animationConfigs.forEach(config => {
      const sections = utils.qsa(config.selector);
      sections.forEach(section => setupAnimation(section, config));
    });
  }

  // Setup animation with caching
  function setupAnimation(section, config) {
    // Skip if already initialized
    if (animationCache.has(section)) return;
    
    section.style.visibility = "visible";

    // Create timeline with optimized ScrollTrigger
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: config.start || CONFIG.scrollTrigger.start,
        end: config.start || CONFIG.scrollTrigger.start,
        toggleActions: "play none none none",
        once: true, // Better performance - only trigger once
      },
      defaults: { ease: CONFIG.ease.default }
    });

    // Call specific animation handler
    config.handler(section, timeline);
    
    // Cache the animation
    animationCache.set(section, timeline);
  }

  // Reusable animation helpers
  const animationHelpers = {
    splitHeading: (element, timeline, delay = 0) => {
      if (!element) return;
      
      // Skip on mobile if reduced motion is preferred
      if (CONFIG.mobile.reducedMotion) {
        timeline.from(element, { opacity: 0, y: 20, duration: 0.5 }, delay);
        return;
      }

      const split = SplitText.create(element, {
        type: "chars, lines, words",
        mask: "chars"
      });

      // Add classes for styling
      split.chars.forEach(char => char.classList.add("split-char"));
      split.masks.forEach(mask => mask.classList.add("split-mask"));

      timeline.from(split.chars, {
        opacity: 0,
        yPercent: 100,
        duration: CONFIG.duration.split,
        stagger: { amount: 0.3, from: "start" }
      }, delay);

      // Return split for potential cleanup
      return split;
    },

    splitParagraph: (elements, timeline, delay = 0) => {
      if (!elements || !elements.length) return;

      // Skip on mobile if reduced motion is preferred
      if (CONFIG.mobile.reducedMotion) {
        timeline.from(elements, { opacity: 0, y: 20, duration: 0.5 }, delay);
        return;
      }

      const split = SplitText.create(elements, {
        type: "lines",
        mask: "lines"
      });

      split.lines.forEach(line => line.classList.add("split-line"));
      split.masks.forEach(mask => mask.classList.add("split-mask"));

      timeline.from(split.lines, {
        opacity: 0,
        yPercent: 100,
        duration: 0.45,
        stagger: utils.isMobile() ? 0.1 : 0.15
      }, delay);

      return split;
    },

    animateButtons: (buttons, timeline, delay = 0) => {
      if (!buttons || !buttons.length) return;
      
      timeline.from(buttons, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.15
      }, delay);
    },

    animateImage: (image, timeline, delay = 0, scale = 0.85) => {
      if (!image) return;
      
      // Optimize for Safari/iOS
      const willChange = utils.isSafari() || utils.isIOS();
      
      if (willChange) {
        gsap.set(image, { willChange: "transform, opacity" });
      }
      
      timeline.from(image, {
        opacity: 0,
        yPercent: 50,
        scale: scale,
        duration: 0.7
      }, delay);
      
      if (willChange) {
        timeline.set(image, { willChange: "auto" });
      }
    }
  };

  // Individual animation handlers (simplified)
  function animateHeroMain(section, timeline) {
    const elements = {
      content: utils.qs(".hero_main_content", section),
      heading: utils.qs(".c-heading > *", section),
      paragraph: utils.qs('[data-animate="true"] p', section),
      buttons: utils.qsa(".u-button-group > * > *", section),
      visual: utils.qs(".hero_main_visual", section)
    };

    animationHelpers.animateImage(elements.content, timeline, 0);
    animationHelpers.splitHeading(elements.heading, timeline, 0.68);
    animationHelpers.splitParagraph(elements.paragraph ? [elements.paragraph] : null, timeline, 1);
    animationHelpers.animateButtons(elements.buttons, timeline, 1.25);
    animationHelpers.animateImage(elements.visual, timeline, 1.4);
  }

  function animateStackedContent(section, timeline) {
    const elements = {
      tagWrap: utils.qs(".tag_wrap", section),
      heading: utils.qs(".c-heading > *", section),
      paragraphs: utils.qsa('[data-animate="true"] p', section),
      buttons: utils.qsa(".u-button-group > * > *", section),
      cards: utils.qsa(".card_primary_wrap, .card_img-bottom_outer", section)
    };

    if (elements.tagWrap) {
      timeline.from(elements.tagWrap, { opacity: 0, yPercent: 100, duration: 0.7 }, 0);
    }
    
    animationHelpers.splitHeading(elements.heading, timeline, 0.3);
    animationHelpers.splitParagraph(elements.paragraphs, timeline, 0.4);
    animationHelpers.animateButtons(elements.buttons, timeline, 0.9);
    
    if (elements.cards.length) {
      timeline.from(elements.cards, { opacity: 0, yPercent: 30, stagger: 0.15 }, 0.65);
    }
  }

  function animateImageSplit(section, timeline) {
    const elements = {
      heading: utils.qs(".c-heading > *", section),
      paragraphs: utils.qsa('[data-animate="true"] > *:not(ul)', section),
      listItems: utils.qsa(".c-text > ul > li", section),
      buttons: utils.qsa(".u-button-group > * > *", section),
      image: utils.qs(".c-image-wrap", section)
    };

    animationHelpers.splitHeading(elements.heading, timeline, 0);
    animationHelpers.splitParagraph(elements.paragraphs, timeline, 0.4);
    
    if (elements.listItems.length) {
      timeline.from(elements.listItems, {
        opacity: 0,
        yPercent: 100,
        duration: 0.75,
        stagger: 0.05
      }, 0.4);
    }
    
    animationHelpers.animateButtons(elements.buttons, timeline, 0.6);
    animationHelpers.animateImage(elements.image, timeline, 0.15);
  }

  function animateIconsGrid(section, timeline) {
    const elements = {
      heading: utils.qs(".c-heading > *", section),
      paragraphs: utils.qsa('[data-animate="true"] p', section),
      buttons: utils.qsa(".u-button-group > * > *", section),
      cards: utils.qsa(".card_primary_wrap", section)
    };

    animationHelpers.splitHeading(elements.heading, timeline, 0);
    animationHelpers.splitParagraph(elements.paragraphs, timeline, 0.6);
    animationHelpers.animateButtons(elements.buttons, timeline, 0.3);
    
    if (elements.cards.length) {
      timeline.from(elements.cards, {
        opacity: 0,
        yPercent: 40,
        duration: 0.7,
        stagger: 0.05
      }, 0.4);
    }
  }

  function animateCTA(section, timeline) {
    const elements = {
      image: utils.qs(".c-image-wrap", section),
      heading: utils.qs(".c-heading > *", section),
      paragraphs: utils.qsa('[data-animate="true"] p', section),
      buttons: utils.qsa(".u-button-group > * > *", section)
    };

    animationHelpers.animateImage(elements.image, timeline, 0);
    animationHelpers.splitHeading(elements.heading, timeline, 0.5);
    animationHelpers.splitParagraph(elements.paragraphs, timeline, 0.6);
    animationHelpers.animateButtons(elements.buttons, timeline, 0.7);
  }

  function animateFooter(section, timeline) {
    const elements = {
      logoWrap: utils.qs(".footer_logo_wrap", section),
      paragraph: utils.qs('[data-animate="true"] p', section),
      menuItems: utils.qsa(".footer_nav > *", section),
      logoPaths: utils.qsa(".footer_logo > *", section)
    };

    if (elements.logoWrap) {
      timeline.from(elements.logoWrap, { opacity: 0, yPercent: 100, duration: 0.4 }, 0);
    }
    
    animationHelpers.splitParagraph(elements.paragraph ? [elements.paragraph] : null, timeline, 0.3);
    
    if (elements.menuItems.length) {
      timeline.from(elements.menuItems, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.15,
        duration: 0.7
      }, 0.5);
    }
    
    if (elements.logoPaths.length) {
      timeline.from(elements.logoPaths, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.05,
        ease: "elastic.inOut(1,0.4)",
        duration: 1.5
      }, 0.16);
    }
  }

  function animateDownload(section, timeline) {
    const elements = {
      logo: utils.qs(".download_main_logo", section),
      heading: utils.qs(".c-heading > *", section),
      paragraphs: utils.qsa('[data-animate="true"] p', section),
      buttons: utils.qsa(".download_main_button_wrap > *, .u-button-group > * > *", section),
      image: utils.qs(".c-image-cs-wrap", section),
      playIcon: utils.qs(".download_main_play-icon", section)
    };

    if (elements.logo) {
      timeline.from(elements.logo, { opacity: 0, yPercent: 100, duration: 0.4 }, 0);
    }
    
    animationHelpers.splitHeading(elements.heading, timeline, 0.3);
    animationHelpers.splitParagraph(elements.paragraphs, timeline, 0.5);
    
    if (elements.buttons.length) {
      timeline.from(elements.buttons, { opacity: 0, yPercent: 20, stagger: 0.15 }, 0.7);
    }
    
    animationHelpers.animateImage(elements.image, timeline, 0.15);
    animationHelpers.animateImage(elements.playIcon, timeline, 0.65);
  }

  function animateHeroBanner(section, timeline) {
    const elements = {
      content: utils.qs(".hero_banner_contain", section),
      heading: utils.qs(".c-heading > *", section),
      paragraphs: utils.qsa('[data-animate="true"] p', section),
      buttons: utils.qsa(".u-button-group > * > *", section)
    };

    animationHelpers.animateImage(elements.content, timeline, 0);
    animationHelpers.splitHeading(elements.heading, timeline, 0.7);
    animationHelpers.splitParagraph(elements.paragraphs, timeline, 0.9);
    animationHelpers.animateButtons(elements.buttons, timeline, 0.95);
  }

function animateLandingPageHero(section, timeline) {
  const elements = {
    heading: utils.qs(".c-heading > *", section),
    paragraph: utils.qs('[data-animate="true"] p', section),
    buttons: utils.qsa(".u-button-group > * > *", section),
    heroVisual: utils.qs(".c-image-wrap", section),
    svgElements: utils.qsa(".hero_lp_svg", section)
  };

  animationHelpers.splitHeading(elements.heading, timeline, 0.68);
  animationHelpers.splitParagraph(elements.paragraph ? [elements.paragraph] : null, timeline, 1);
  animationHelpers.animateButtons(elements.buttons, timeline, 1.25);
  animationHelpers.animateImage(elements.heroVisual, timeline, 1.4);
  
  if (elements.svgElements.length) {
    timeline.from(elements.svgElements, {
      opacity: 0,
      yPercent: 100,
      stagger: 0.15
    }, 1.6);
  }
}

  // Cleanup function for when needed
  window.cleanupAnimations = () => {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    animationCache.clear();
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
