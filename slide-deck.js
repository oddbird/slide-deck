class slideDeck extends HTMLElement {
  // template
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
            <button part="button" slide-event='toggle-control'>
              keyboard navigation
            </button>

            <hr>
            <p><strong>Presentation:</strong></p>

            <button part="button event" slide-event>
              start
            </button>
            <button part="button event" slide-event>
              resume
            </button>
            <button part="button event" slide-event>
              reset
            </button>

            <hr>
            <p><strong>View:</strong></p>

            <button part="button view" set-view>
              grid
            </button>
            <button part="button view" set-view>
              solo
            </button>
            <button part="button view" set-view>
              script
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

  // css
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

  // static
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

  static slideViews = [
    'grid',
    'solo',
    'script',
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

  // dynamic
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

  // callbacks
  attributeChangedCallback(name) {

    switch (name) {
      case 'key-control':
        this.#keyControlChange();
        break;
      case 'follow-active':
        this.#followActiveChange();
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

    // shadow DOM event listeners
    this.shadowRoot.addEventListener('keydown', (event) => {
      event.stopPropagation();

      if (this.hasAttribute('blank-slide')) {
        event.preventDefault();
        this.blankSlideEvent();
      } else if ((event.key === 'k' && this.#cmdOrCtrl(event)) || event.key === 'Escape') {
        event.preventDefault();
        this.#controlPanel.close();
      }
    });

    this.#blankSlide.addEventListener('close', (event) => {
      this.removeAttribute('blank-slide');
    })

    // custom events
    this.addEventListener('toggle-control', (e) => this.toggleAttribute('key-control'));
    this.addEventListener('toggle-follow', (e) => this.toggleAttribute('follow-active'));
    this.addEventListener('toggle-fullscreen', (e) => this.fullScreenEvent());

    this.addEventListener('join', (e) => this.joinEvent());
    this.addEventListener('start', (e) => this.startEvent());
    this.addEventListener('resume', (e) => this.resumeEvent());
    this.addEventListener('reset', (e) => this.resetEvent());
    this.addEventListener('blank-slide', (e) => this.blankSlideEvent());
    this.addEventListener('join-with-notes', (e) => this.joinWithNotesEvent());

    this.addEventListener('next', (e) => this.move(1));
    this.addEventListener('saved-slide', (e) => this.goToSaved());
    this.addEventListener('previous', (e) => this.move(-1));
    this.addEventListener('to-slide', (e) => this.goTo(e.detail));
  };

  connectedCallback() {
    this.#body.addEventListener('keydown', this.#keyEventActions);
  }

  disconnectedCallback() {
    this.#body.removeEventListener('keydown', this.#keyEventActions);
  }

  // setup methods
  #cleanString = (str) => str.trim().toLowerCase();

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

  // buttons
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

  #setToggleState = (btn, attr, state) => {
    const isActive = this.#getButtonValue(btn, attr) === state;
    this.#setButtonPressed(btn, isActive);
  }

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

  #setupViewButtons = () => {
    this.#viewButtons = this.#findButtons('set-view');

    this.#viewButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.setAttribute('slide-view', this.#getButtonValue(btn, 'set-view'));
      });
      this.#setToggleState(btn, 'set-view', this.slideView);
    });
  }

  #updateViewButtons = () => {
    this.#viewButtons.forEach((btn) => {
      this.#setToggleState(btn, 'set-view', this.slideView);
    });
  }

  // attribute changes
  #onViewChange = () => {
    this.#updateViewButtons();
    this.scrollToActive();
    sessionStorage.setItem(this.#store.view, this.slideView);
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
    this.#eventButtons.forEach((btn) => {
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

  // event handlers
  #startPresenting = () => {
    this.setAttribute('slide-view', 'solo');
    this.setAttribute('key-control', '');
    this.setAttribute('follow-active', '');
  }

  startEvent = () => {
    this.goTo(1);
    this.#startPresenting();
  }

  resumeEvent = () => {
    this.goToSaved();
    this.#startPresenting();
  }

  resetEvent = () => {
    this.goTo(1);
  }

  joinWithNotesEvent = () => {
    this.setAttribute('slide-view', 'script');
    this.setAttribute('key-control', '');
    this.setAttribute('follow-active', '');
  }

  joinEvent = () => {
    this.setAttribute('key-control', '');
    this.setAttribute('follow-active', '');
  }

  blankSlideEvent = (color) => {
    if (this.#blankSlide.open) {
      this.#blankSlide.close();
      this.removeAttribute('blank-slide');
    } else {
      this.#blankSlide.showModal();
      this.setAttribute('blank-slide', color || 'black');
    }
  }

  fullScreenEvent = () => {
    this.toggleAttribute('full-screen');

    if (this.fullScreen && this.requestFullscreen) {
      this.requestFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  // dynamic attribute methods
  #keyControlChange = () => {
    if (this.keyControl) {
      this.goToSaved();
    }
  }

  #followActiveChange = () => {
    if (this.followActive) {
      this.goToSaved();
      window.addEventListener('storage', (e) => this.goToSaved());
    } else {
      window.removeEventListener('storage', (e) => this.goToSaved());
    }
  }

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

  // navigation
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

  goToSaved = () => {
    this.goTo(this.#slideFromStore());
  }

  // Detect Ctrl / Cmd modifiers in a platform-agnostic way
  #cmdOrCtrl = (event) => event.ctrlKey || event.metaKey;

  #keyEventActions = (event) => {
    // exit from blank slide
    if (this.hasAttribute('blank-slide')) {
      event.preventDefault();
      this.removeAttribute('blank-slide');
      return;
    }

    // always available
    if (this.#cmdOrCtrl(event)) {
      switch (event.key) {
        case 'k':
          event.preventDefault();
          this.#controlPanel.showModal();
          break;
        case 'Enter':
          if (event.shiftKey) {
            event.preventDefault();
            this.startEvent();
          } else {
            event.preventDefault();
            this.resumeEvent();
          }
          break;

        default:
          break;
      }
      return;
    } else if (event.altKey && event.key === 'Enter') {
      event.preventDefault();
      this.joinWithNotesEvent();
      return;
    }

    // only while key-control is active
    if (this.keyControl) {
      if (event.key === 'Escape') {
        if (event.target !== this.#body) {
          event.target.blur();
        }
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
          this.blankSlideEvent('black');
          break;
        case 'whiteOut':
          event.preventDefault();
          this.blankSlideEvent('white');
          break;
        default:
          break;
      }
    }
  };
};

window.customElements.define('slide-deck', slideDeck);
