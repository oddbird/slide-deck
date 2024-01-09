# `slide-deck`

A Web Component for web presentations.

**[Demo](https://slide-deck.netlify.app)**

**⚠️ This is a pre-release**:
Breaking changes will be allowed in minor versions
until we achieve a stable v1.0 release

## Examples

General usage example:

```html
<script type="module" src="slide-deck.js"></script>

<slide-deck>
  <header><h1>This is a slide show</h1></header>
  <div><h2>Each child is a slide</h2></div>
  <div>
    <h2>We can add our own controls</h2>
    <p>Based on event handlers</p>
    <button slide-event>previous</button>
    <button slide-event>next</button>
    <p>Or specifically for changing views</p>
    <button set-view>grid</button>
    <button set-view>list</button>
  </div>
</slide-deck>
```

Define a simple fallback view:

```html
<style>
  slide-deck:not(:defined) {
    display: grid;

    > * {
      border-block-end: thin solid;
    }
  }
</style>
```

Set initial state with attributes,
or define your own view:

```html
<script type="module" src="slide-deck.js"></script>

<slide-deck key-control slide-view="fancy">
  <header><h1>Listening for arrow keys</h1></header>
  <div><h2>And using a fancy view</h2></div>
</slide-deck>
<style>
  slide-deck[slide-view="fancy"] {
    outline: 1px solid red;
  }
</style>
```

## Features

This Web Component allows you to:

- Create web-based slides
- Switch between different slide views
- Control presentations with a remote, or a keyboard
- Follow along in a second tab (speaker view)
- Toggle full-screen mode

## Keyboard Shortcuts

Always available:

- `command-k`: Toggle control panel
- `command-shift-enter`: Start presentation (from first slide)
- `command-enter`: Resume presentation (from active slide)
- `command-.`: End presentation
- `command-shift-f`: Toggle full-screen mode

When presenting (key-control is active):

- `N`/`rightArrow`/`downArrow`/`pageDown`: Next slide
- `P`/`leftArrow`/`upArrow`/`pageUp`: Previous slide
- `home`: First slide
- `end`: Last slide
- `W`/`,`: Toggle white screen
- `B`/`.`: Toggle black screen
- `escape`: Blur focused element, close control panel, or end presentation

These are based on
the [PowerPoint shortcuts](https://support.microsoft.com/en-us/office/use-keyboard-shortcuts-to-deliver-powerpoint-presentations-1524ffce-bd2a-45f4-9a7f-f18b992b93a0#bkmk_frequent_macos).

## Installation

You have a few options (choose one of these):

1. Install via [npm](https://www.npmjs.com/package/@oddbird/slide-deck): `npm install @oddbird/slide-deck`
1. [Download the source manually from GitHub](https://github.com/oddbird/slide-deck/releases) into your project.
1. Skip this step and use the script directly via a 3rd party CDN (not recommended for production use)

### Usage

Make sure you include the `<script>` in your project (choose one of these):

```html
<!-- Host yourself -->
<link rel="stylesheet" href="slide-deck.css">
<script type="module" src="slide-deck.js"></script>
```

```html
<!-- 3rd party CDN, not recommended for production use -->
<link rel="stylesheet" href="https://www.unpkg.com/@oddbird/slide-deck/slide-deck.css">
<script
  type="module"
  src="https://www.unpkg.com/@oddbird/slide-deck/slide-deck.js"
></script>
```

```html
<!-- 3rd party CDN, not recommended for production use -->
<link rel="stylesheet" href="https://esm.sh/@oddbird/slide-deck/slide-deck.css">
<script
  type="module"
  src="https://esm.sh/@oddbird/slide-deck"
></script>
```

## Credit

With thanks to the following people:

- [David Darnes](https://darn.es/) for the
  [Web Component repo template](https://github.com/daviddarnes/component-template)

## Support

At OddBird,
we enjoy collaborating and contributing
as part of an open web community.
But those contributions take time and effort.
If you're interested in supporting our
open-source work,
consider becoming a
[GitHub sponsor](https://github.com/sponsors/oddbird),
or contributing to our
[Open Collective](https://opencollective.com/oddbird-open-source).

❤️ Thanks!
