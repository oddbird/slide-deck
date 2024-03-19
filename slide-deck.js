class slideDeck extends HTMLElement {

  static knownViews = {
    public: 'presentation',
    private: 'speaker',
  };

  // --------------------------------------------------------------------------
  // shadow DOM (control panel & blank slide)

  static #appendShadowTemplate = (node) => {
    const template = document.createElement("template");
    template.innerHTML = `
      <slot></slot>
      <slot name="control-panel">
        <dialog part="control-panel">
          <div part="panel-header">
            <strong>Slide-Deck Controls</strong>
            <form method="dialog">
              <button part="button close-controls">close</button>
            </form>
          </div>
          <div part="controls">
            <button part="button event" slide-event="start">
              start presentation
            </button>
            <button part="button event">
              resume
            </button>
            <button part="button event" slide-event>
              join as speaker
            </button>

            <hr>
            <p><strong>View:</strong></p>

            <button part="button view" set-view>
              grid
            </button>
            <button part="button view" set-view>
              ${slideDeck.knownViews.public}
            </button>
            <button part="button view" set-view>
              ${slideDeck.knownViews.private}
            </button>

            <hr>
            <button part="button" slide-event='key-control'>
              keyboard navigation
            </button>
          </div>
        </dialog>
      </slot>
      <slot name="blank-slide">
        <dialog part="blank-slide">
          <form method="dialog">
            <button part="close-blank-slide">
              <span aria-label="close">x<span>
            </button>
          </form>
        </dialog>
      </slot>
    `;
    const shadowRoot = node.attachShadow({ mode: "open" });
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static #adoptShadowStyles = (node) => {
    const shadowStyle = new CSSStyleSheet();
    shadowStyle.replaceSync(`
      [part=control-panel] {
        --sd-panel-gap: clamp(8px, 0.25em + 1vw, 24px);
        min-width: min(50ch, 100%);
        padding: 0;
      }

      [part=panel-header] {
        align-items: center;
        border-block-end: thin solid gray;
        display: grid;
        gap: var(--sd-panel-gap);
        grid-template-columns: 1fr auto;
        padding: var(--sd-panel-gap);
      }

      [part=controls] {
        padding: var(--sd-panel-gap);
      }

      hr {
        border-block-start: thin dotted gray;
        border-block-end: none;
        margin-block: 1lh;
      }

      [part~=button] {
        border: medium solid transparent;
        font: inherit;
        padding-inline: var(--sd-panel-gap);

        &[aria-pressed=true] {
          border-color: currentColor;
        }
      }

      [part=blank-slide],
      ::slotted([slot=blank-slide]) {
        block-size: 100%;
        border: 0;
        color-scheme: var(--sd-blank-slide-scheme, dark);
        inline-size: 100%;
        max-block-size: unset;
        max-inline-size: unset;
      }

      [part=blank-slide] {
        padding: 0;

        &[open] { display: grid; }
        form { display: grid; }
      }

      :host([blank-slide=white]) {
        --sd-blank-slide-scheme: light;
      }

      [part=close-blank-slide] {
        background: transparent;
        border: 0;
        color: inherit;
        display: grid;
        font: inherit;
        place-items: start end;
      }
    `);
    node.shadowRoot.adoptedStyleSheets = [shadowStyle];
  }

  // --------------------------------------------------------------------------
  // static properties

  static observedAttributes = [
    'key-control',
    'follow-active',
    'full-screen',
    'slide-view',
  ];

  get keyControl(){
    return this.hasAttribute('key-control');
  }
  get followActive(){
    return this.hasAttribute('follow-active');
  }
  get fullScreen(){
    return this.hasAttribute('full-screen');
  }
  get slideView(){
    return this.getAttribute('slide-view');
  }

  static storageKeys = [
    'control',
    'follow',
    'view',
    'slide',
  ];

  static controlKeys = {
    'Home': 'firstSlide',
    'End': 'lastSlide',

    // next slide
    'ArrowRight': 'nextSlide',
    'ArrowDown': 'nextSlide',
    'PageDown': 'nextSlide',
    'N': 'nextSlide',
    ' ': 'nextSlide',

    // previous slide
    'ArrowLeft': 'previousSlide',
    'ArrowUp': 'previousSlide',
    'PageUp': 'previousSlide',
    'P': 'previousSlide',
    'Delete': 'previousSlide',

    // blank slide
    'B': 'blackOut',
    '.': 'blackOut',
    'W': 'whiteOut',
    ',': 'whiteOut',
  }

  // --------------------------------------------------------------------------
  // dynamic properties

  #store = {};
  slides;
  slideCount;
  activeSlide;
  #controlPanel;
  #blankSlide;
  #eventButtons;
  #viewButtons;
  #goToButtons;
  #body;

  // --------------------------------------------------------------------------
  // callbacks

  attributeChangedCallback(name) {

    switch (name) {
      case 'key-control':
        this.#onKeyControlChange();
        break;
      case 'follow-active':
        this.#onFollowActiveChange();
        break;
      case 'slide-view':
        this.#onViewChange();
        break;
      default:
        break;
    }

    this.#updateEventButtons();
  }

  constructor() {
    super();

    // shadow dom and ID
    slideDeck.#appendShadowTemplate(this);
    slideDeck.#adoptShadowStyles(this);
    this.#setDeckID();

    // custom events
    this.addEventListener('key-control', (e) => this.toggleKeyControl());
    this.addEventListener('follow-active', (e) => this.toggleFollowActive());
    this.addEventListener('full-screen', (e) => this.toggleFullScreen());

    this.addEventListener('join', (e) => this.join());
    this.addEventListener('start', (e) => this.start());
    this.addEventListener('resume', (e) => this.resume());
    this.addEventListener('reset', (e) => this.reset());
    this.addEventListener('blank-slide', (e) => this.blankSlide());
    this.addEventListener('join-as-speaker', (e) => this.joinAsSpeaker());

    this.addEventListener('next', (e) => this.next());
    this.addEventListener('previous', (e) => this.previous());
    this.addEventListener('to-slide', (e) => this.goTo(e.detail));
    this.addEventListener('to-saved', (e) => this.goToSaved());
  };

  connectedCallback() {
    // relevant nodes
    this.#body = document.querySelector('body');
    this.#controlPanel = this.querySelector(`[slot="control-panel"]`) ??
      this.shadowRoot.querySelector(`[part="control-panel"]`);
    this.#blankSlide = this.querySelector(`[slot="blank-slide"]`) ??
      this.shadowRoot.querySelector(`[part="blank-slide"]`);

    // initial setup
    this.#defaultAttrs();
    this.#setupSlides();
    this.goTo();

    // buttons
    this.#setupEventButtons();
    this.#setupViewButtons();
    this.#setupGoToButtons();

    // events
    this.#body.addEventListener('keydown', this.#bodyKeyEvents);
    this.#blankSlide.addEventListener('close', this.#blankSlideClosed);
  }

  disconnectedCallback() {
    this.#body.removeEventListener('keydown', this.#bodyKeyEvents);
    this.#blankSlide.removeEventListener('close', this.#blankSlideClosed);
  }

  // --------------------------------------------------------------------------
  // setup methods

  #cleanString = (str) => str.trim().toLowerCase().replace(' ', '-');

  #newDeckId = (from, count) => {
    const base = from || window.location.pathname.split('.')[0];
    const ID = count ? `${base}-${count}` : base;

    if (document.getElementById(ID)) {
      return this.#newDeckId(base, (count || 0) + 1);
    }

    return ID;
  };

  #setDeckID = () => {
    this.id = this.id || this.#newDeckId();

    // storage keys based on slide ID
    slideDeck.storageKeys.forEach((key) => {
      this.#store[key] = `${this.id}.${key}`;
    });
  }

  #slideId = (n) => `slide_${this.id}-${n}`;

  #setupSlides = () => {
    this.slides = this.querySelectorAll(':scope > :not([slot])');
    this.slideCount = this.slides.length;
    this.style.setProperty('--slide-count', this.slideCount);
    this.style.setProperty('--slide-count-string', `'${this.slideCount}'`);

    this.slides.forEach((slide, index) => {
      const slideIndex = index + 1;
      slide.id = this.#slideId(slideIndex);
      slide.style.setProperty('--slide-index', slideIndex);
      slide.style.setProperty('--slide-index-string', `'${slideIndex}'`);

      if (slide.querySelector(':scope [slide-canvas]')) {
        if (!slide.hasAttribute('slide-item')) {
          slide.setAttribute('slide-item', 'container');
        }
      } else {
        if (!slide.hasAttribute('slide-item')) {
          slide.setAttribute('slide-item', 'canvas');
        }

        if (!slide.hasAttribute('slide-canvas')) {
          slide.toggleAttribute('slide-canvas', true);
        }
      }
    });
  };

  #defaultAttrs = () => {
    // view required
    this.setAttribute(
      'slide-view',
      sessionStorage.getItem(this.#store.view) || this.slideView || 'grid'
    );

    // fullscreen must be set by user interaction
    this.removeAttribute('full-screen');
  };

  // --------------------------------------------------------------------------
  // button setup

  #findButtons = (attr) => [
    ...this.querySelectorAll(`:scope button[${attr}]`),
    ...this.shadowRoot.querySelectorAll(`button[${attr}]`),
  ];

  #getButtonValue = (btn, attr, lower=true) => this.#cleanString(
    btn.getAttribute(attr) || btn.innerText
  );

  #setButtonPressed = (btn, isPressed) => {
    btn.setAttribute('aria-pressed', isPressed);

    if (btn.hasAttribute('part')) {
      const currentNames = btn.getAttribute('part').split(' ');
      let newNames;

      if (isPressed) {
        newNames = currentNames.includes('pressed')
          ? currentNames
          : [...currentNames, 'pressed'];
      } else if (!isPressed) {
        newNames = currentNames.filter((name) => name !== 'pressed')
      }

      btn.setAttribute('part', newNames.join(' '));
    }
  }

  #setButtonToggleState = (btn, attr, state) => {
    const isActive = this.#getButtonValue(btn, attr) === state;
    this.#setButtonPressed(btn, isActive);
  }

  // go-to buttons
  #setupGoToButtons = () => {
    this.#goToButtons = this.#findButtons('to-slide');

    this.#goToButtons.forEach((btn) => {
      const btnValue = btn.getAttribute('to-slide');
      const btnSlide = btn.closest("[slide-item]");

      const toSlide = btnValue
        ? this.#asSlideInt(btnValue)
        : this.#indexFromId(btnSlide.id);

      btn.addEventListener('click', (e) => {
        this.goTo(toSlide);
      });
    });
  }

  // view buttons
  #setupViewButtons = () => {
    this.#viewButtons = this.#findButtons('set-view');

    this.#viewButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.setAttribute('slide-view', this.#getButtonValue(btn, 'set-view'));
      });
      this.#setButtonToggleState(btn, 'set-view', this.slideView);
    });
  }

  #updateViewButtons = () => {
    this.#viewButtons?.forEach((btn) => {
      this.#setButtonToggleState(btn, 'set-view', this.slideView);
    });
  }

  // event buttons
  #setupEventButtons = () => {
    this.#eventButtons = this.#findButtons('slide-event');

    this.#eventButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const event = this.#getButtonValue(btn, 'slide-event');
        this.dispatchEvent(new Event(event, { view: window, bubbles: false }));
      });
    });

    this.#updateEventButtons();
  }

  #updateEventButtons = () => {
    this.#eventButtons?.forEach((btn) => {
      const btnEvent = this.#getButtonValue(btn, 'slide-event');

      let isActive = {
        'toggle-control': this.keyControl,
        'toggle-follow': this.followActive,
        'toggle-fullscreen': this.fullScreen,
      }

      if (Object.keys(isActive).includes(btnEvent)) {
        this.#setButtonPressed(btn, isActive[btnEvent]);
      }
    });
  }

  // --------------------------------------------------------------------------
  // event handlers

  reset = () => {
    this.goTo(1);
  }

  join = () => {
    this.setAttribute('key-control', '');
    this.setAttribute('follow-active', '');
  }

  resume = () => {
    this.setAttribute('slide-view', slideDeck.knownViews.public);
    this.join();
  }

  start = () => {
    this.reset();
    this.resume();
  }

  joinAsSpeaker = () => {
    this.setAttribute('slide-view', slideDeck.knownViews.private);
    this.join();
  }

  blankSlide = (color) => {
    if (this.#blankSlide.open) {
      this.#blankSlide.close();
    } else {
      this.#blankSlide.showModal();
      this.setAttribute('blank-slide', color || 'black');
    }
  }

  #blankSlideClosed = () => {
    this.removeAttribute('blank-slide');
  }

  toggleFullScreen = () => {
    this.toggleAttribute('full-screen');

    if (this.fullScreen && this.requestFullscreen) {
      this.requestFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  toggleKeyControl = () => this.toggleAttribute('key-control');
  toggleFollowActive = () => this.toggleAttribute('follow-active');

  // --------------------------------------------------------------------------
  // attribute-change methods

  #onViewChange = () => {
    this.#updateViewButtons();
    this.scrollToActive();
    sessionStorage.setItem(this.#store.view, this.slideView);
  }

  #onKeyControlChange = () => {
    if (this.keyControl) {
      this.goToSaved();
    }
  }

  #onFollowActiveChange = () => {
    if (this.followActive) {
      this.goToSaved();
      window.addEventListener('storage', (e) => this.goToSaved());
    } else {
      window.removeEventListener('storage', (e) => this.goToSaved());
    }
  }

  // --------------------------------------------------------------------------
  // storage

  #asSlideInt = (string) => parseInt(string, 10);
  #indexFromId = (string) => this.#asSlideInt(string.split('-').pop());

  #slideFromHash = () => window.location.hash.startsWith('#slide_')
    ? this.#indexFromId(window.location.hash)
    : null;

  #slideFromStore = (fallback = 1) => this.#asSlideInt(
    localStorage.getItem(this.#store.slide)
  ) || fallback;

  #slideToHash = (to) => {
    if (to) {
      window.location.hash = this.#slideId(to);
    }
  };
  #slideToStore = (to) => {
    if (to) {
      localStorage.setItem(this.#store.slide, to);
    } else {
      localStorage.removeItem(this.#store.slide);
    }
  };

  // --------------------------------------------------------------------------
  // slide navigation

  #inRange = (slide) => slide >= 1 && slide <= this.slideCount;
  #getActive = () => this.#slideFromHash() || this.activeSlide;

  scrollToActive = () => {
    const activeEl = document.getElementById(this.#slideId(this.activeSlide));

    if (activeEl) {
      activeEl.scrollIntoView(true);
    }
  };

  goTo = (to) => {
    const fromHash = this.#slideFromHash();
    const setTo = to || this.#getActive();

    if (setTo && this.#inRange(setTo)) {
      this.activeSlide = setTo;
      this.#slideToStore(setTo);

      if (setTo !== fromHash) {
        this.#slideToHash(setTo);
      }

      // update aria-current
      this.querySelectorAll(
        ':scope [slide-item][aria-current]'
      ).forEach((slide) => {
        slide.removeAttribute('aria-current');
      });

      this.querySelector(`:scope #${this.#slideId(setTo)}`).setAttribute('aria-current', 'true');
    }
  }

  move = (by) => {
    const to = (this.#getActive() || 0) + by;
    this.goTo(to);
  };

  next = () => this.move(1);
  previous = () => this.move(-1);

  goToSaved = () => {
    this.goTo(this.#slideFromStore());
  }

  // --------------------------------------------------------------------------
  // keyboard control

  // Detect Ctrl / Cmd modifiers in a platform-agnostic way
  #cmdOrCtrl = (event) => event.ctrlKey || event.metaKey;

  #escToBlur = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.target.blur();
      return true;
    }
  }

  #bodyKeyEvents = (event) => {
    // modal events
    if (event.key === 'k' && this.#cmdOrCtrl(event)) {
      this.#controlPanel.open
        ? this.#controlPanel.close()
        : this.#controlPanel.showModal();
    } else if (this.#controlPanel.open) {
      this.#escToBlur(event) && this.#controlPanel.close();
      return;
    } else if (this.#blankSlide.open && !this.#cmdOrCtrl(event)) {
      event.preventDefault();
      this.blankSlide();
      return;
    }

    // always available, quickstart
    if (event.key === 'Enter') {
      if (this.#cmdOrCtrl(event)) {
        event.preventDefault();
        event.shiftKey ? this.start(): this.resume();
      } else if (event.altKey) {
        event.preventDefault();
        this.joinAsSpeaker();
      }

      return;
    }

    // only while key-control is active
    if (this.keyControl) {
      if (event.target !== this.#body) {
        this.#escToBlur(event);
        return;
      }

      switch (slideDeck.controlKeys[event.key]) {
        case 'firstSlide':
          event.preventDefault();
          this.goTo(1);
          break;
        case 'lastSlide':
          event.preventDefault();
          this.goTo(this.slideCount);
          break;
        case 'nextSlide':
          event.preventDefault();
          this.move(1);
          break;
        case 'previousSlide':
          event.preventDefault();
          this.move(-1);
          break;
        case 'blackOut':
          event.preventDefault();
          this.blankSlide('black');
          break;
        case 'whiteOut':
          event.preventDefault();
          this.blankSlide('white');
          break;
        default:
          break;
      }
    }
  };
};

window.customElements.define('slide-deck', slideDeck);
