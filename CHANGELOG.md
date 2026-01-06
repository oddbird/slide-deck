# Changes

**⚠️ This is a pre-release**:
Breaking changes will be allowed in minor versions
until we achieve a stable v1.0 release

## v0.2.1 - UNRELEASED

- 🚀 NEW: The `control-panel` event
  and `toggleControlPanel()` public method
  make it easier to trigger the control panel externally.

## v0.2.0 - 2025-10-31

- 🚀 NEW: The `key-control` attribute
  accepts values of `none` or `escape`,
  to turn off keyboard navigation
  (and optionally leave escape-to-blur intact).
  This attribute can be applied to individual elements in a deck,
  for more detailed control --
  eg turning off navigation while a form has focus.
- 🚀 NEW: Provide a `slide-deck.webc` component.
- 🚀 NEW: All attributes have associated getters and setters:
  - `key-control` -> `keyControl` (boolean | 'none' | 'escape')
  - `follow-active` -> `followActive` (boolean)
  - `full-screen` -> `fullScreen` (boolean)
  - `slide-view` -> `slideView` (string)
- 🚀 NEW: Use the `?slide-view=viewName` query parameter
  to create links to specific slide views.
  When present on load, the query parameter will override
  the session storage as well as any hardcoded attribute value.
- 💥 BREAKING: The `slideView` property setter
  should be used for changing views,
  rather than manipulating the `slide-view` attribute directly.
  This will also update session storage and the url query parameter.
- 💥 BREAKING: When the `start` and `resume` events are fired,
  the slide-deck is put into a `publicView`
  (the default is `slideshow`).
  When the `join-as-speaker` event is fired,
  the slide-deck is put into a `privateView`
  (the default is `speaker`).
  These can be changed by setting the
  `publicView` and `privateView` properties with JS,
  or by setting the `public-view` and `private-view` attributes in HTML.
- 💥 BREAKING: Renamed the custom event handlers and matching public methods:
  - `reset` = `reset()`
  - `join` = `join()`
  - `resume` = `resume()`
  - `start` = `start()`
  - `join-as-speaker` = `joinAsSpeaker()`
  - `blank-slide` = `blankSlide()`
  - `next` = `next()`
  - `previous` = `previous()`
  - `to-slide` = `toSlide()`
  - `to-saved` = `toSavedSlide()`
  - `scroll-to-active` = `scrollToActive()`
  - `full-screen` = `toggleFullScreen()`
  - `key-control` = `toggleKeyControl()`
  - `follow-active` = `toggleFollowActive()`
- 🐞 FIXED: Keyboard events are given proper priority, so that
  (for example) you can open the control panel from a blank slide.
- 🐞 FIXED: Navigation shortcuts aren't invoked
  when a modifier key is being pressed.
- 🐞 FIXED: Slideshow view maintains `16/9` slide ratio
  when in portrait orientation.
- 🚀 NEW: `--slide-active-id` contains the id of the currently active slide.
- 🚀 NEW: `--slide-deck-progress` is a percentage based on the current active slide.
- 💥 BREAKING: Renamed some of the `slide-deck.css` custom properties,
  and made minor changes to the styles (especially sizing/spacing).
- 👀 INTERNAL: Renamed static `storageKeys` to `storeValues`,
  and static `controlKeys` to `navKeys` for clarity.

## v0.1.4 - 2024-02-28

- 🐞 FIXED: session view preference overrides attribute
  when deck is first constructed

## v0.1.3 - 2024-02-13

- 💥 BREAKING: All events and `slide-event` controls use
  lowercase hyphenated names, for consistency with html conventions
  (`toggleControl` -> `toggle-control`,
  `toggleFollow` -> `toggle-follow`,
  `toggleFullscreen` -> `toggle-fullscreen`)
- 🚀 NEW: Use the `to-slide` attribute on buttons in the slide deck
  to move focus to any slide -- either the parent slide of the button,
  or the slide index given as a value of the attribute
- 🚀 NEW: Custom `goToSlide` event accepts an integer value
  in the `event.detail` property
- 🚀 NEW: `--slide-count-string` and `--slide-index-string`
  can be used for CSS generated content
- 🐞 FIXED: Less nesting for lower specificity in the `slide-deck.css` theme
- 🐞 FIXED: Provide shadow-DOM control-panel styles

## v0.1.2 - 2024-01-16

- 💥 BREAKING: Disabled the full-screen keyboard shortcut,
  until we have a chance to address the various
  fullscreen browser issues
- 💥 BREAKING: Removed the 'end presentation' event
  and keyboard shortcuts, which were more confusing than useful
- 💥 BREAKING: Removed the shadow DOM content wrapper,
  and all shadow DOM styles for slide layout
- 💥 BREAKING: The `reset` event targets the first slide
  rather than the slide-deck container
- 🚀 NEW / 💥 BREAKING: Renamed and added control-panel parts,
  to allow for more customization of the default panel
  including pressed buttons with `:part(button pressed)`
- 🚀 NEW: Set `aria-current='true'` on active slide
- 🚀 NEW: View settings are maintained across page refresh
  using `sessionStorage`
- 🚀 NEW: Add support for slide parts – `slide-canvas` & `slide-note`
- 🚀 NEW: Each slide is labeled with either
  `slide-item='container'` (if it has nested parts)
  or `slide-item='canvas' slide-canvas` (if there are no nested parts)
- 🚀 NEW: The slide-deck has a `--slide-count` property,
  and each slide has a `--slide-index`
- 🚀 NEW: Default styles are in `slide-deck.css`
  and can be applied from the light DOM
- 🚀 NEW: The entire control panel can be replaced
  from the light DOM using `slot=control-panel`
  on a slotted `dialog` element
- 🚀 NEW: Blank slides are implemented as shadow DOM dialogues,
  which can be replaced from the light DOM using `slot=blank-slide`
  on a slotted `dialog` element
- 🚀 NEW: When `key-control` is activated (including on-load),
  we target the stored active slide (or the first slide)
- 🚀 NEW: Support for keyboard shortcuts on Windows/Linux
  using `control` instead of `command`
- 🐞 FIXED: Slotted controls are no longer treated as slides
- 🐞 FIXED: When restoring the active slide from memory,
  we go to the first slide if there's no stored state
- 🐞 FIXED: Use any key to exit a blank-slide mode

## v0.1.1 - 2023-12-26

- 💥 BREAKING: Updated keyboard shortcuts
  to match [PowerPoint](https://support.microsoft.com/en-us/office/use-keyboard-shortcuts-to-deliver-powerpoint-presentations-1524ffce-bd2a-45f4-9a7f-f18b992b93a0#bkmk_frequent_macos),
  including `command-.` as 'end presentation'
  rather than 'toggle full-screen' (now `command-shift-f`)
- 🚀 NEW: Support for blank-screen shortcuts
  (inspired by [Curtis Wilcox](https://codepen.io/ccwilcox/details/NWJWwOE))
- 🚀 NEW: Both start/resume events target active slides
- 🚀 NEW: Control panel includes toggle for keyboard controls
- 🚀 NEW: Control panel buttons have `aria-pressed` styles
- 🚀 NEW: All slide-event buttons that toggle a boolean state
  get `aria-pressed` values that update with the state
- 🐞 FIXED: Scroll to the active slide when changing views
- 🐞 FIXED: Control panel view toggles were broken
- 🐞 FIXED: Control panel prevents propagation of keyboard shortcuts
- 👀 INTERNAL: The current slide is stored in an `activeSlide` property

## v0.1.0 - 2023-12-22

Initial draft
based on
[Miriam's Proof of Concept](https://codepen.io/miriamsuzanne/pen/eYXOLjE?editors=1010).
