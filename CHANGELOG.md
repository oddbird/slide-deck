# Changes

**⚠️ This is a pre-release**:
Breaking changes will be allowed in minor versions
until we achieve a stable v1.0 release

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
