class slideDeck extends HTMLElement {
  // template
  static appendShadowTemplate = (node) => {
    const template = document.createElement("template");
    template.innerHTML = `
      <dialog part="controls">
        <form method="dialog"><button>close</button></form>
        <div>
          <slot name="slide-controls">
            <button slide-event='toggleControl'>keyboard controls</button>

            <p><strong>Presentation:</strong></p>
            <button slide-event>start</button>
            <button slide-event>end</button>
            <button slide-event="joinWithNotes">speaker view</button>

            <p><strong>View:</strong></p>
            <button set-view>grid</button>
            <button set-view>list</button>

            <p><strong>Hide:</strong></p>
            <button hide-part="frame">slides</button>
            <button hide-part="note">notes</button>
          </slot>
        </div>
      </dialog>
      <div part="contents">
        <slot></slot>
      </div>
    `;
    const shadowRoot = node.attachShadow({ mode: "open" });
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  // css
  static adoptShadowStyles = (node) => {
    const shadowStyle = new CSSStyleSheet();
    shadowStyle.replaceSync(`
      :host {
        position: relative;
      }

      :host:not(:fullscreen) {
        container: host / inline-size;
      }

      :host(:fullscreen) {
        background-color: white;
        overflow-x: clip;
        overflow-y: auto;
      }

      :host([slide-view=grid]) {
        ---slide-grid-ratio: 16/9;
        ---slide-grid-border: var(--slide-grid-border, thin solid);
        ---slide-grid-active-outline: medium dotted hotpink;
        ---slide-grid-scroll-margin: clamp(10px, 4cqi, 40px);
        ---slide-list-border: var(--slide-grid-border, thin solid);
      }

      :host([slide-view=list]) {
        ---slide-list-border: var(--slide-list-border, thin solid);
      }

      :host([blank-slide])::after {
        content: '';
        position: absolute;
        inset: 0;
        background-color: var(--blank-slide-color, black);
      }

      :host([blank-slide='white'])::after {
        --blank-slide-color: white;
      }

      [part=contents] {
        ---slide-gap: clamp(5px, 1.5cqi, 15px);
        display: grid;

        :host([slide-view=grid]) & {
          grid-template-columns: var(
            --slide-grid-columns,
            repeat(auto-fit, minmax(min(50ch, 100%), 1fr))
          );
          gap: var(--slide-grid-gap, var(---slide-gap));
          padding: var(--slide-grid-padding, var(---slide-gap));
        }

        :host([slide-view=list]) & {
          grid-auto-rows: var(--slide-list-rows, 100svh);
        }
      }

      ::slotted([id^=slide_]) {
        container-name: slide;
        container-type: var(--slide-container, inline-size);
        scroll-margin: var(
          --slide-grid-scroll-margin,
          var(---slide-grid-scroll-margin)
        );
      }

      ::slotted([slide-frame]) {
        aspect-ratio: var(--slide-grid-ratio, var(---slide-grid-ratio));
        border: var(---slide-grid-border);
        border-block-end: var(---slide-list-border);
        padding: var(---slide-gap);
      }

      ::slotted([id^=slide_]:target) {
        outline: var(
          --slide-grid-active-outline,
          var(---slide-grid-active-outline)
        );
        outline-offset: var(--slide-active-outline-offset, 3px);
      }

      button[aria-pressed=true] {
        box-shadow: inset 0 0 2px black;

        &::before {
          content: ' ✅ ';
        }
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
    'hide-parts',
  ];

  static attrToPropMap = {
    'key-control': 'keyControl',
    'follow-active': 'followActive',
    'full-screen': 'fullScreen',
    'slide-view': 'slideView',
    'hide-parts': 'hideParts',
  };

  static storageKeys = [
    'control',
    'follow',
    'view',
    'slide',
  ];

  static slideViews = [
    'grid',
    'list',
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

    // end
    '-': 'endPresentation'
  }

  // dynamic
  store = {};
  slides;
  slideNotes;
  slideFrames;
  slideCount;
  activeSlide;
  controlPanel;
  eventButtons;
  viewButtons;
  #body;

  // callbacks
  attributeChangedCallback(name, oldValue, newValue) {
    this[slideDeck.attrToPropMap[name]] = newValue || this.hasAttribute(name);

    switch (name) {
      case 'follow-active':
        this.#followActiveChange();
        this.#updateEventButtons();
        break;
      case 'hide-parts':
        this.#hidePartsChange();
        this.#updatePartButtons();
        break;
      case 'slide-view':
        this.#updateViewButtons();
        this.scrollToActive();
        break;
      default:
        break;
    }

    this.#updateEventButtons();
  }

  constructor() {
    super();

    // shadow dom and ID
    slideDeck.appendShadowTemplate(this);
    slideDeck.adoptShadowStyles(this);
    this.#setDeckID();

    // relevant nodes
    this.#body = document.querySelector('body');
    this.controlPanel = this.shadowRoot.querySelector(`[part="controls"]`);
    this.slides = this.querySelectorAll(':scope > :not([slot=slide-controls])');
    this.slideNotes = this.querySelectorAll('[slide-note]');
    this.slideFrames = this.querySelectorAll('[slide-frame]:not(:scope > *)');

    // initial setup
    this.slideCount = this.slides.length;
    this.#defaultAttrs();
    this.#setupSlides();
    this.goTo();

    // buttons
    this.#setupEventButtons();
    this.#setupViewButtons();
    this.#setupPartButtons();

    // event listeners
    this.shadowRoot.addEventListener('keydown', (event) => {
      event.stopPropagation();

      if ((event.key === 'k' && event.metaKey) || event.key === 'Escape') {
        event.preventDefault();
        this.controlPanel.close();
      }
    });

    // custom events
    this.addEventListener('toggleControl', (e) => this.toggleAttribute('key-control'));
    this.addEventListener('toggleFollow', (e) => this.toggleAttribute('follow-active'));
    this.addEventListener('toggleFullscreen', (e) => this.fullScreenEvent());
    this.addEventListener('toggleView', (e) => this.toggleView());
    this.addEventListener('grid', (e) => this.toggleView('grid'));
    this.addEventListener('list', (e) => this.toggleView('list'));

    this.addEventListener('toggleFrame', (e) => this.togglePart('frame'));
    this.addEventListener('toggleNote', (e) => this.togglePart('note'));
    this.addEventListener('showAll', (e) => this.removeAttribute('hide-parts'));

    this.addEventListener('join', (e) => this.joinEvent());
    this.addEventListener('joinWithNotes', (e) => this.joinWithNotesEvent());
    this.addEventListener('start', (e) => this.startEvent());
    this.addEventListener('resume', (e) => this.resumeEvent());
    this.addEventListener('end', (e) => this.endEvent());
    this.addEventListener('reset', (e) => this.resetEvent());
    this.addEventListener('blankSlide', (e) => this.blankSlideEvent());

    this.addEventListener('nextSlide', (e) => this.move(1));
    this.addEventListener('savedSlide', (e) => this.goToSaved());
    this.addEventListener('previousSlide', (e) => this.move(-1));
  };

  connectedCallback() {
    this.#body.addEventListener('keydown', this.#keyEventActions);
  }

  disconnectedCallback() {
    this.#body.removeEventListener('keydown', this.#keyEventActions);
  }

  // setup methods
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
      this.store[key] = `${this.id}.${key}`;
    });
  }

  #slideId = (n) => `slide_${this.id}-${n}`;

  #setupSlides = () => {
    const slides = this.querySelectorAll(':scope > *');

    slides.forEach((slide, index) => {
      slide.id = this.#slideId(index + 1);
      if (slide.querySelector('[slide-frame]')) {
        slide.toggleAttribute('slide-group', true);
      } else {
        slide.toggleAttribute('slide-frame', true);
      }
    });
  };

  #defaultAttrs = () => {
    // view required
    if (!this.hasAttribute('slide-view')) {
      this.setAttribute('slide-view', 'grid');
    }

    // fullscreen must be set by user interaction
    this.removeAttribute('full-screen');
  };

  // buttons
  #findButtons = (attr) => [
    ...this.querySelectorAll(`button[${attr}]`),
    ...this.shadowRoot.querySelectorAll(`button[${attr}]`),
  ];

  #getButtonValue = (btn, attr) => btn.getAttribute(attr) || btn.innerText;

  #setToggleState = (btn, attr, state) => {
    const isActive = this.#getButtonValue(btn, attr) === state;
    btn.setAttribute('aria-pressed', isActive);
  }

  #setupViewButtons = () => {
    this.slideView = this.slideView || this.getAttribute('slide-view');
    this.viewButtons = this.#findButtons('set-view');

    this.viewButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.setAttribute('slide-view', this.#getButtonValue(btn, 'set-view'));
      });
      this.#setToggleState(btn, 'set-view', this.slideView);
    });
  }

  #updateViewButtons = () => {
    this.viewButtons.forEach((btn) => {
      this.#setToggleState(btn, 'set-view', this.slideView);
    });
  }

  #setupPartButtons = () => {
    this.hideParts = this.hideParts || this.getAttribute('hide-parts');
    this.partButtons = this.#findButtons('hide-part');

    this.partButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.togglePart(this.#getButtonValue(btn, 'hide-part'));
      });
      this.#setToggleState(btn, 'hide-part', this.hideParts);
    });
  }

  #updatePartButtons = () => {
    this.partButtons.forEach((btn) => {
      this.#setToggleState(btn, 'hide-part', this.hideParts);
    });
  }

  // event buttons
  #setupEventButtons = () => {
    this.eventButtons = this.#findButtons('slide-event');

    this.eventButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const event = this.#getButtonValue(btn, 'slide-event');
        this.dispatchEvent(new Event(event, { view: window, bubbles: false }));
      });
    });

    this.#updateEventButtons();
  }

  #updateEventButtons = () => {
    this.eventButtons.forEach((btn) => {
      const btnEvent = this.#getButtonValue(btn, 'slide-event');

      let isActive = {
        'toggleControl': this.keyControl,
        'toggleFrame': this.hideParts === 'frame',
        'toggleNote': this.hideParts === 'note',
        'toggleFollow': this.followActive,
        'toggleFullscreen': this.fullScreen,
      }

      if (Object.keys(isActive).includes(btnEvent)) {
        btn.setAttribute('aria-pressed', isActive[btnEvent]);
      }
    });
  }

  // event handlers
  toggleView = (to) => {
    let next;

    if (!to) {
      const current = this.getAttribute('slide-view');
      const l = slideDeck.slideViews - 1; // adjust for 0-index
      const i = slideDeck.slideViews.indexOf(current);
      next = slideDeck.slideViews[(i + 1) % l];
    }

    this.setAttribute('slide-view', to || next || 'grid');
  }

  togglePart = (type = 'note') => {
    this.hideParts === type
      ? this.removeAttribute('hide-parts')
      : this.setAttribute('hide-parts', type);
  }

  #startPresenting = () => {
    this.setAttribute('hide-parts', 'note');
    this.setAttribute('slide-view', 'list');
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

  joinWithNotesEvent = () => {
    if (this.hideParts === 'note') { this.removeAttribute('hide-parts'); }
    this.setAttribute('slide-view', 'grid');
    this.setAttribute('key-control', '');
    this.setAttribute('follow-active', '');
  }

  joinEvent = () => {
    this.setAttribute('key-control', '');
    this.setAttribute('follow-active', '');
  }

  endEvent = () => {
    this.setAttribute('slide-view', 'grid');
    this.removeAttribute('key-control');
    this.removeAttribute('follow-active');
    this.resetEvent();
  }

  resetEvent = () => {
    window.location.hash = this.id;
    this.resetActive();
  }

  blankSlideEvent = (color) => {
    if (this.hasAttribute('blank-slide')) {
      this.removeAttribute('blank-slide');
    } else {
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
  #followActiveChange = () => {
    if (this.followActive) {
      this.goToSaved();
      window.addEventListener('storage', (e) => this.goToSaved());
    } else {
      window.removeEventListener('storage', (e) => this.goToSaved());
    }
  }

  #hidePartsChange = () => {
    this.slideNotes.forEach((note) => {
      note.toggleAttribute('hidden', this.hideParts === 'note');
    });

    this.slideFrames.forEach((frame) => {
      frame.toggleAttribute('hidden', this.hideParts === 'frame');
    });
  }

  // storage
  #asSlideInt = (string) => parseInt(string, 10);

  #slideFromHash = () => window.location.hash.startsWith('#slide_')
    ? this.#asSlideInt(window.location.hash.split('-').pop())
    : null;
  #slideFromStore = () => this.#asSlideInt(
    localStorage.getItem(this.store.slide)
  );

  #slideToHash = (to) => {
    if (to) {
      window.location.hash = this.#slideId(to);
    }
  };
  #slideToStore = (to) => {
    if (to) {
      localStorage.setItem(this.store.slide, to);
    } else {
      localStorage.removeItem(this.store.slide);
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
    }
  }

  resetActive = () => {
    this.activeSlide = null;
    window.location.hash = this.id;
    localStorage.removeItem(this.store.slide);
  };

  move = (by) => {
    const to = (this.#getActive() || 0) + by;
    this.goTo(to);
  };

  goToSaved = () => {
    this.goTo(this.#slideFromStore());
  }

  #keyEventActions = (event) => {
    // always available
    if (event.metaKey) {
      switch (event.key) {
        case 'k':
          event.preventDefault();
          this.controlPanel.showModal();
          break;
        case 'f':
          if (event.shiftKey) {
            event.preventDefault();
            this.fullScreenEvent();
          }
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
        case '.':
          event.preventDefault();
          this.endEvent();
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
        } else {
          event.preventDefault();
          this.endEvent();
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
        case 'endPresentation':
          event.preventDefault();
          this.endEvent();
          break;
        default:
          break;
      }
    }
  };
};

window.customElements.define('slide-deck', slideDeck);
