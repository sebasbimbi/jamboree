// Ultra Performance-Optimized Webflow GSAP Animation Script v2.0
(() => {
  'use strict';

  // Performance monitoring
  const perfStart = performance.now();
  
  // Configuration with adaptive settings
  const CONFIG = {
    ease: {
      main: "0.65, 0.01, 0.05, 0.99",
      default: "back.inOut",
      menu: "power2.out",
      elastic: "elastic.inOut(1,0.4)"
    },
    duration: {
      default: 0.7,
      split: 0.5,
      menu: 0.4,
      fast: 0.45
    },
    scrollTrigger: {
      start: "top 70%",
      footerStart: "top 80%",
      batch: true
    },
    mobile: {
      breakpoint: 768,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      isLowEnd: navigator.hardwareConcurrency <= 4
    },
    performance: {
      useIntersectionObserver: 'IntersectionObserver' in window,
      usePassive: false,
      maxSplitChars: 100,
      batchSize: 5
    }
  };

  // Enhanced utility functions
  const utils = {
    isMobile: () => window.innerWidth <= CONFIG.mobile.breakpoint,
    isSafari: () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    isLowEndDevice: () => CONFIG.mobile.isLowEnd || CONFIG.mobile.reducedMotion,
    
    // DOM query caching
    domCache: new Map(),
    qs: (selector, parent = document, useCache = false) => {
      const key = `${parent === document ? 'doc' : 'el'}-${selector}`;
      if (useCache && utils.domCache.has(key)) {
        return utils.domCache.get(key);
      }
      const element = parent.querySelector(selector);
      if (useCache && element) {
        utils.domCache.set(key, element);
      }
      return element;
    },
    qsa: (selector, parent = document) => parent.querySelectorAll(selector),
    
    // Enhanced debounce
    debounce: (func, wait, immediate = false) => {
      let timeout;
      return function(...args) {
        const later = () => {
          timeout = null;
          if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
      };
    },
    
    // RAF throttle with FPS limiter
    rafThrottle: (callback, fps = 60) => {
      let requestId = null;
      let lastTime = 0;
      const interval = 1000 / fps;
      
      return (...args) => {
        if (requestId === null) {
          requestId = requestAnimationFrame((currentTime) => {
            if (currentTime - lastTime >= interval) {
              callback(...args);
              lastTime = currentTime;
            }
            requestId = null;
          });
        }
      };
    },
    
    // Batch processor
    processBatch: (items, processor, batchSize = CONFIG.performance.batchSize) => {
      let index = 0;
      
      function processNext() {
        const batch = items.slice(index, index + batchSize);
        batch.forEach(processor);
        index += batchSize;
        
        if (index < items.length) {
          requestAnimationFrame(processNext);
        }
      }
      
      if (items.length > 0) processNext();
    }
  };

  // Cache management
  const cache = {
    animations: new WeakMap(),
    splitTexts: new WeakMap(),
    timelines: new Map(),
    observers: new Map()
  };

  // Main initialization
  function init() {
    // GSAP check
    if (typeof window.gsap === "undefined") {
      document.documentElement.classList.add("gsap-not-found");
      console.error("GSAP not found");
      return;
    }

    // Register plugins once
    gsap.registerPlugin(ScrollTrigger, SplitText);
    
    // Custom ease
    if (typeof CustomEase !== 'undefined') {
      CustomEase.create("main", CONFIG.ease.main);
      gsap.defaults({ ease: "main", duration: CONFIG.duration.default });
    }

    // Font loading optimization
    const fontsReady = document.fonts?.ready || Promise.resolve();
    const timeout = new Promise(resolve => setTimeout(resolve, 2000));
    
    Promise.race([fontsReady, timeout]).then(() => {
      // Initialize jQuery button handlers first (if jQuery exists)
      if (typeof $ !== 'undefined') {
        initJQueryButtons();
      } else {
        initVanillaButtons();
      }
      
      // Initialize menu
      initMenu();
      
      // Initialize animations based on device capability
      if (utils.isLowEndDevice()) {
        initSimpleAnimations();
      } else if (CONFIG.performance.useIntersectionObserver) {
        initIntersectionObserverAnimations();
      } else {
        initScrollTriggerAnimations();
      }
      
      // Setup global handlers
      setupGlobalHandlers();
      
      // Performance report
      const perfEnd = performance.now();
      console.log(`⚡ Animations initialized in ${(perfEnd - perfStart).toFixed(2)}ms`);
    });
  }

  // jQuery button handlers (backward compatibility)
  function initJQueryButtons() {
    $("[data-btn='wrap']").each(function() {
      const $this = $(this);
      const clipEl = $this.find("[data-btn='clip']").attr("aria-hidden", "true");
      const durationSetting = CONFIG.duration.menu;
      const easeSetting = CONFIG.ease.menu;

      function getPercent(el, e, axis) {
        const rect = el[0].getBoundingClientRect();
        if (axis === 'x') {
          return ((e.clientX - rect.left) / rect.width) * 100;
        }
        return ((e.clientY - rect.top) / rect.height) * 100;
      }

      $this.on("mouseenter", function(e) {
        const percentLeft = getPercent($this, e, 'x');
        const percentTop = getPercent($this, e, 'y');
        
        gsap.set(clipEl, { display: "flex" });
        gsap.fromTo(clipEl, 
          { clipPath: `circle(0% at ${percentLeft}% ${percentTop}%)` },
          { clipPath: `circle(141.4% at ${percentLeft}% ${percentTop}%)`, 
            duration: durationSetting, 
            ease: easeSetting 
          }
        );
      });

      $this.on("mouseleave", function(e) {
        const percentLeft = getPercent($this, e, 'x');
        const percentTop = getPercent($this, e, 'y');
        
        gsap.to(clipEl, {
          clipPath: `circle(0% at ${percentLeft}% ${percentTop}%)`,
          overwrite: true,
          duration: durationSetting,
          ease: easeSetting
        });
      });
    });
  }

  // Vanilla JS button handlers
  function initVanillaButtons() {
    const buttons = utils.qsa("[data-btn='wrap']");
    if (!buttons.length) return;

    // Event delegation
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

  // Optimized menu
  function initMenu() {
    const navWrap = utils.qs(".nav", document, true);
    if (!navWrap) return;

    const elements = {
      overlay: utils.qs(".overlay", navWrap),
      menu: utils.qs(".menu", navWrap),
      bgPanels: utils.qsa(".bg-panel", navWrap),
      menuLinks: utils.qsa(".menu .nav_link", navWrap),
      fadeTargets: utils.qsa("[data-menu-fade]", navWrap),
      menuButton: utils.qs(".menu-button", document, true),
      menuToggles: utils.qsa("[data-menu-toggle]")
    };

    const menuButtonElements = elements.menuButton ? {
      texts: utils.qsa("p", elements.menuButton),
      icon: utils.qs(".menu-button-icon", elements.menuButton)
    } : null;

    let tl = cache.timelines.get('menu') || gsap.timeline();
    cache.timelines.set('menu', tl);
    
    let isOpen = false;

    const toggleMenu = utils.rafThrottle(() => {
      isOpen ? closeNav() : openNav();
    }, 30);

    function openNav() {
      if (isOpen) return;
      isOpen = true;
      
      navWrap.setAttribute("data-nav", "open");
      elements.menuButton?.classList.add("is-opened");
      elements.menuButton?.setAttribute("aria-label", "Close menu");

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

    elements.menuButton?.setAttribute("aria-label", "Open menu");
  }

  // Intersection Observer animations (best performance)
  function initIntersectionObserverAnimations() {
    const animationMap = {
      'hero-main': animateHeroMain,
      'stacked-content': animateStackedContent,
      'image-split': animateImageSplit,
      'icons-grid': animateIconsGrid,
      'cta': animateCTA,
      'footer': animateFooter,
      'download': animateDownload,
      'hero-banner': animateHeroBanner,
      'landingpage-hero': animateLandingPageHero,
      'tabs': animateTabs,
      'featured-testimonials': animateFeaturedTestimonials,
      'faq': animateFAQ
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !cache.animations.has(entry.target)) {
          const trigger = entry.target.dataset.animationTrigger;
          const handler = animationMap[trigger];
          
          if (handler) {
            entry.target.style.visibility = "visible";
            const timeline = gsap.timeline({ defaults: { ease: CONFIG.ease.default } });
            handler(entry.target, timeline);
            cache.animations.set(entry.target, timeline);
            observer.unobserve(entry.target);
          }
        }
      });
    }, {
      rootMargin: '0px 0px -30% 0px',
      threshold: 0.1
    });

    // Observe all animation triggers
    Object.keys(animationMap).forEach(trigger => {
      const elements = utils.qsa(`[data-animation-trigger="${trigger}"]`);
      elements.forEach(el => observer.observe(el));
    });

    cache.observers.set('main', observer);
  }

  // ScrollTrigger animations (fallback)
  function initScrollTriggerAnimations() {
    const animationConfigs = [
      { selector: '[data-animation-trigger="hero-main"]', handler: animateHeroMain },
      { selector: '[data-animation-trigger="stacked-content"]', handler: animateStackedContent },
      { selector: '[data-animation-trigger="image-split"]', handler: animateImageSplit },
      { selector: '[data-animation-trigger="icons-grid"]', handler: animateIconsGrid },
      { selector: '[data-animation-trigger="cta"]', handler: animateCTA },
      { selector: '[data-animation-trigger="footer"]', handler: animateFooter, start: CONFIG.scrollTrigger.footerStart },
      { selector: '[data-animation-trigger="download"]', handler: animateDownload, start: CONFIG.scrollTrigger.footerStart },
      { selector: '[data-animation-trigger="hero-banner"]', handler: animateHeroBanner, start: CONFIG.scrollTrigger.footerStart },
      { selector: '[data-animation-trigger="landingpage-hero"]', handler: animateLandingPageHero },
      { selector: '[data-animation-trigger="tabs"]', handler: animateTabs },
      { selector: '[data-animation-trigger="featured-testimonials"]', handler: animateFeaturedTestimonials },
      { selector: '[data-animation-trigger="faq"]', handler: animateFAQ }
    ];

    // Batch process animations
    if (CONFIG.scrollTrigger.batch && ScrollTrigger.batch) {
      animationConfigs.forEach(config => {
        const elements = utils.qsa(config.selector);
        if (!elements.length) return;

        ScrollTrigger.batch(elements, {
          start: config.start || CONFIG.scrollTrigger.start,
          once: true,
          onEnter: batch => {
            batch.forEach(section => {
              if (cache.animations.has(section)) return;
              
              section.style.visibility = "visible";
              const timeline = gsap.timeline({ defaults: { ease: CONFIG.ease.default } });
              config.handler(section, timeline);
              cache.animations.set(section, timeline);
            });
          }
        });
      });
    } else {
      // Fallback to individual ScrollTriggers
      animationConfigs.forEach(config => {
        const sections = utils.qsa(config.selector);
        sections.forEach(section => setupScrollTrigger(section, config));
      });
    }
  }

  // Simple animations for low-end devices
  function initSimpleAnimations() {
    const sections = utils.qsa('[data-animation-trigger]');
    
    sections.forEach(section => {
      section.style.visibility = "visible";
      
      // Simple fade-in animation
      gsap.fromTo(section, 
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            once: true
          }
        }
      );
    });
  }

  // Setup individual ScrollTrigger
  function setupScrollTrigger(section, config) {
    if (cache.animations.has(section)) return;
    
    section.style.visibility = "visible";

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: config.start || CONFIG.scrollTrigger.start,
        once: true,
        fastScrollEnd: true,
        preventOverlaps: true
      },
      defaults: { ease: CONFIG.ease.default }
    });

    config.handler(section, timeline);
    cache.animations.set(section, timeline);
  }

  // Reusable animation helpers with performance optimizations
  const animationHelpers = {
    splitHeading: (element, timeline, delay = 0) => {
      if (!element) return null;
      
      // Skip complex splits on low-end devices
      if (utils.isLowEndDevice()) {
        timeline.from(element, { opacity: 0, y: 20, duration: 0.5 }, delay);
        return null;
      }

      // Check if already split
      if (cache.splitTexts.has(element)) {
        const split = cache.splitTexts.get(element);
        timeline.from(split.chars, {
          opacity: 0,
          yPercent: 100,
          duration: CONFIG.duration.split,
          stagger: { amount: 0.3, from: "start" }
        }, delay);
        return split;
      }

      // Limit split for very long text
      const textLength = element.textContent.length;
      const splitType = textLength > CONFIG.performance.maxSplitChars ? "words" : "chars, lines, words";

      const split = SplitText.create(element, {
        type: splitType,
        mask: "chars"
      });

      split.chars?.forEach(char => char.classList.add("split-char"));
      split.masks?.forEach(mask => mask.classList.add("split-mask"));

      cache.splitTexts.set(element, split);

      timeline.from(split.chars || split.words, {
        opacity: 0,
        yPercent: 100,
        duration: CONFIG.duration.split,
        stagger: { amount: 0.3, from: "start" }
      }, delay);

      return split;
    },

    splitParagraph: (elements, timeline, delay = 0) => {
      if (!elements || !elements.length) return null;

      // Simplified animation for low-end devices
      if (utils.isLowEndDevice()) {
        timeline.from(elements, { opacity: 0, y: 20, duration: 0.5 }, delay);
        return null;
      }

      const elemArray = Array.isArray(elements) ? elements : [elements];
      
      const split = SplitText.create(elemArray, {
        type: "lines",
        mask: "lines"
      });

      split.lines?.forEach(line => line.classList.add("split-line"));
      split.masks?.forEach(mask => mask.classList.add("split-mask"));

      timeline.from(split.lines, {
        opacity: 0,
        yPercent: 100,
        duration: CONFIG.duration.fast,
        stagger: utils.isMobile() ? 0.1 : 0.15
      }, delay);

      return split;
    },

    animateButtons: (buttons, timeline, delay = 0) => {
      if (!buttons || !buttons.length) return;
      
      timeline.from(buttons, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.15,
        duration: CONFIG.duration.default
      }, delay);
    },

    animateImage: (image, timeline, delay = 0, scale = 0.85) => {
      if (!image) return;
      
      // Safari/iOS optimization
      if (utils.isSafari() || utils.isIOS()) {
        gsap.set(image, { willChange: "transform, opacity" });
      }
      
      timeline.from(image, {
        opacity: 0,
        yPercent: 50,
        scale: scale,
        duration: CONFIG.duration.default,
        clearProps: utils.isSafari() ? "willChange" : ""
      }, delay);
    },

    animateCards: (cards, timeline, delay = 0, yPercent = 30) => {
      if (!cards || !cards.length) return;
      
      timeline.from(cards, {
        opacity: 0,
        yPercent: yPercent,
        stagger: 0.15,
        duration: CONFIG.duration.default
      }, delay);
    }
  };

  // Animation handlers
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
      timeline.from(elements.tagWrap, { opacity: 0, yPercent: 100, duration: CONFIG.duration.default }, 0);
    }
    
    animationHelpers.splitHeading(elements.heading, timeline, 0.3);
    animationHelpers.splitParagraph(elements.paragraphs, timeline, 0.4);
    animationHelpers.animateButtons(elements.buttons, timeline, 0.9);
    animationHelpers.animateCards(elements.cards, timeline, 0.65);
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
    animationHelpers.animateCards(elements.cards, timeline, 0.4, 40);
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
        duration: CONFIG.duration.default
      }, 0.5);
    }
    
    if (elements.logoPaths.length) {
      timeline.from(elements.logoPaths, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.05,
        ease: CONFIG.ease.elastic,
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
      visual: utils.qs(".c-image-wrap", section),
      svgElements: utils.qsa(".hero_lp_svg", section)
    };

    animationHelpers.splitHeading(elements.heading, timeline, 0.68);
    animationHelpers.splitParagraph(elements.paragraph ? [elements.paragraph] : null, timeline, 1);
    animationHelpers.animateButtons(elements.buttons, timeline, 1.25);
    animationHelpers.animateImage(elements.visual, timeline, 1.4);
    
    if (elements.svgElements.length) {
      timeline.from(elements.svgElements, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.15
      }, 1.6);
    }
  }

  function animateTabs(section, timeline) {
    const elements = {
      heading: utils.qs(".tab_left .c-heading > *", section),
      tabButtons: utils.qsa(".tab_button_item", section),
      paragraphs: utils.qsa('.tab_left [data-animate="true"] p', section),
      buttons: utils.qsa(".u-button-group > * > *", section),
      cards: utils.qsa(".card_primary_wrap, .card_img-bottom_outer", section)
    };

    animationHelpers.splitHeading(elements.heading, timeline, 0);
    
    if (elements.tabButtons.length) {
      timeline.from(elements.tabButtons, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.05,
        duration: CONFIG.duration.default
      }, 0.3);
    }
    
    animationHelpers.splitParagraph(elements.paragraphs, timeline, 0.4);
    animationHelpers.animateButtons(elements.buttons, timeline, 0.9);
    animationHelpers.animateCards(elements.cards, timeline, 0.65);
  }

  function animateFeaturedTestimonials(section, timeline) {
    const elements = {
      cards: utils.qsa(".card_primary_wrap", section),
      image: utils.qs(".c-image-wrap", section)
    };

    if (elements.cards.length) {
      timeline.from(elements.cards, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.15
      }, 0);
    }
    
    animationHelpers.animateImage(elements.image, timeline, 0.15);
  }

  function animateFAQ(section, timeline) {
    const accordionItems = utils.qsa(".accordion_list > *", section);
    
    if (accordionItems.length) {
      timeline.from(accordionItems, {
        opacity: 0,
        yPercent: 100,
        stagger: 0.15
      }, 0);
    }
  }

  // Global handlers
  function setupGlobalHandlers() {
    // Optimized resize handler
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      document.body.classList.add('is-resizing');
      
      resizeTimer = setTimeout(() => {
        document.body.classList.remove('is-resizing');
        ScrollTrigger.refresh(true);
        utils.domCache.clear(); // Clear DOM cache on resize
      }, 250);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
  }

  // Cleanup function
  function cleanup() {
    // Kill all ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    
    // Clear all caches
    cache.animations.clear();
    cache.timelines.clear();
    cache.observers.forEach(observer => observer.disconnect());
    cache.observers.clear();
    utils.domCache.clear();
    
    // Kill all timelines
    gsap.globalTimeline.clear();
  }

  // Public API
  window.WebflowAnimations = {
    init,
    cleanup,
    refresh: () => ScrollTrigger.refresh(true),
    pause: () => gsap.globalTimeline.pause(),
    resume: () => gsap.globalTimeline.resume(),
    getPerformanceMetrics: () => ({
      animationCount: cache.animations.size,
      timelineCount: cache.timelines.size,
      observerCount: cache.observers.size,
      domCacheSize: utils.domCache.size
    })
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
