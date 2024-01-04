# Changes

**⚠️ This is a pre-release**:
Breaking changes will be allowed in minor versions
until we achieve a stable v1.0 release

## v0.1.2 - unreleased

- 🚀 NEW: Add support for slide parts – `slide-canvas` & `slide-note`
  (these parts require light DOM styles)
- 🚀 NEW: Slide parts can be hidden
  with the `hide-parts="note | canvas"` attribute
  (both parts cannot be hidden at the same time)
- 🚀 NEW: Add support for `hide-part="note | canvas"` buttons
  to toggle hiding the notes and canvass
- 💥 BREAKING: Removed the shadow DOM content wrapper,
  and all shadow DOM styles
- 💥 BREAKING: Renamed and added control-panel parts,
  to allow for more customization of the default panel
- 🚀 NEW: Default styles are in `slide-deck.css`
  and can be applied from the light DOM
- 🚀 NEW: The entire control panel can be replaced
  from the light DOM using `slot=control-panel`
  on a slotted `dialog` element
- 🐞 FIXED: Slotted controls are no longer treated as slides
- 🚀 NEW: When `key-control` is activated (including on-load),
  we target the stored active slide (or the first slide)
- 🐞 FIXED: When restoring the active slide from memory,
  we go to the first slide if there's no stored state

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
