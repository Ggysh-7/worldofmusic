# 3D Album Box Music Website - Codex Implementation Spec

## 1. Project Goal

Build a single-page 3D interactive music collection website.

Core idea:

Transform each album cover into a 3D album box. Users browse a spatial
album collection, select an album, open it, reveal the disc, and play
music.

Main experience:

    Browse Albums
        ↓
    Select Album
        ↓
    Focus Album
        ↓
    Open Box
        ↓
    Play Music
        ↓
    Close And Return

------------------------------------------------------------------------

# 2. Visual Style

Style keywords:

-   Minimal
-   Premium
-   Spatial UI
-   Editorial design
-   Apple-style product showcase

Design principles:

-   Large white/black empty space
-   Album artwork as the main visual focus
-   Minimal interface elements
-   Smooth cinematic transitions
-   Strong 3D depth perception

------------------------------------------------------------------------

# 3. Main Interaction Logic

## Album Initial State

When page loads:

-   Album boxes enter from the right side.
-   Each album has staggered animation.
-   Albums stop in a horizontal collection layout.

Animation:

    x: 120vw → 0
    opacity: 0 → 1
    rotationY: -90 → 0

Use GSAP timeline.

------------------------------------------------------------------------

# 4. Album Browse State

Default state:

All albums are displayed as 3D boxes.

Each album contains:

    AlbumBox
     ├── Front Cover
     ├── Spine
     └── Thickness

Display:

-   Side view
-   Slight perspective rotation
-   Horizontal arrangement

Scrolling:

Control album group movement.

Recommended:

GSAP ScrollTrigger

or

React state + wheel event.

------------------------------------------------------------------------

# 5. Hover Interaction

When mouse enters album:

Apply tilted-card effect.

Effects:

-   rotateX
-   rotateY
-   scale increase
-   shadow change
-   lighting reflection

Example:

    pointer position
            ↓
    calculate offset
            ↓
    apply rotation

------------------------------------------------------------------------

# 6. Album Selection State

Click an album.

Current album:

    SIDE VIEW

    ↓

    Move to center

    ↓

    Rotate front

    ↓

    Scale up

Animation:

Position:

    side position
          ↓
    screen center

Rotation:

    rotateY 90deg
          ↓
    rotateY 0deg

Scale:

    1
    ↓
    1.3

Other albums:

Remain:

-   Side view
-   Smaller scale
-   Background position

------------------------------------------------------------------------

# 7. Album Open State

Click selected album again.

Open animation:

    Album Cover
            ↓
    moves left

    Disc
            ↓
    slides out

Structure:

    Album Box

     ├── Cover
     ├── Inner Sleeve
     └── Disc

Animation:

Cover:

    rotateY(-25deg)
    translateX(-80px)

Disc:

    translateX(120px)
    rotate(360deg)

------------------------------------------------------------------------

# 8. Music Playing State

When disc appears:

Start audio.

Features:

-   Play/Pause
-   Progress bar
-   Current time
-   Duration

Disc animation:

Infinite rotation.

    rotation: 360deg
    duration: 4s
    repeat: infinity

------------------------------------------------------------------------

# 9. Close Logic

Click current album:

    Stop Music

    ↓

    Disc returns

    ↓

    Cover closes

    ↓

    Album returns to collection

Reset:

    activeAlbum = null
    albumState = browse

------------------------------------------------------------------------

# 10. Recommended Tech Stack

## Frontend

React + Vite

## 3D

Three.js

Recommended React integration:

-   @react-three/fiber
-   @react-three/drei

## Animation

GSAP

Use for:

-   entrance animation
-   album movement
-   opening animation
-   transitions

## Audio

HTML Audio API

or

Howler.js

------------------------------------------------------------------------

# 11. Component Structure

    src

    ├── components

    │   ├── AlbumScene.jsx
    │   ├── AlbumBox.jsx
    │   ├── Disc.jsx
    │   ├── MusicPlayer.jsx
    │   └── UI.jsx


    ├── data

    │   └── albums.js


    ├── animations

    │   └── albumAnimations.js


    ├── store

    │   └── albumStore.js


    ├── assets

    │   ├── covers
    │   └── audio


    └── App.jsx

------------------------------------------------------------------------

# 12. Data Structure

Album data:

``` js
{
 id:1,
 title:"Blue Hour",
 artist:"Artist Name",
 cover:"cover.webp",
 audio:"music.mp3"
}
```

------------------------------------------------------------------------

# 13. State Management

Required states:

``` js
{
 albums:[],
 activeAlbum:null,

 status:
 "browse"
}
```

Status values:

    browse
    focus
    open
    playing
    closing

------------------------------------------------------------------------

# 14. Three.js Scene Structure

    Scene

     ├── Camera
     ├── Lights
     └── AlbumGroup

          ├── AlbumBox
          │
          ├── Cover Mesh
          ├── Spine Mesh
          └── Disc Mesh

------------------------------------------------------------------------

# 15. Development Steps

## Phase 1

Create React project.

Install:

    three
    @react-three/fiber
    @react-three/drei
    gsap

## Phase 2

Create 3D album box.

Implement:

-   cover texture
-   spine
-   thickness

## Phase 3

Create album collection layout.

Implement:

-   horizontal arrangement
-   perspective
-   scrolling

## Phase 4

Add interactions.

Implement:

-   hover tilt
-   focus animation
-   open animation

## Phase 5

Add music system.

Implement:

-   audio loading
-   play/pause
-   progress

## Phase 6

Optimization.

Implement:

-   texture compression
-   lazy loading
-   mobile adaptation

------------------------------------------------------------------------

# 16. Performance Requirements

Optimize:

-   Use WebP textures.
-   Avoid unnecessary 3D meshes.
-   Use GPU accelerated transforms.
-   Reduce animation calculations.
-   Lazy load album resources.

------------------------------------------------------------------------

# 17. Final Product Goal

Create a digital music collection experience.

The user should feel like:

"Picking up a physical album from a shelf, opening it, and playing the
record."

The main value is not the player UI.

The main value is the spatial interaction experience.
