# Changes

**⚠️ This is a pre-release**:
Breaking changes will be allowed in minor versions
until we achieve a stable v1.0 release

## v0.1.2 - unreleased

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
