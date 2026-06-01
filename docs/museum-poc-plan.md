# Indoor Museum Web App POC

## Summary

Prototype an indoor museum web app where desktop users walk around a single rectangular gallery using first-person WASD controls and mouse-look. The room contains display pedestals with placeholder 3D objects, such as fruits. Users can approach exhibits to view a local information panel.

## Primary Goals

- Prove walking feel: smooth first-person movement, camera height, mouse-look, and basic collision.
- Prove visual mood: wood plank flooring, darker areas, warm localized lighting, and shadows.
- Prove gallery flow: simple exhibit layout with pedestals and proximity-based info panels.

## Prototype Priorities

Build in this order:

1. Walking feel: first-person camera, WASD, mouse-look, and human-scale movement.
2. Collision: walls and pedestals should feel solid without adding a physics engine.
3. Exhibit loop: nearby pedestal shows one local info panel.
4. Visual mood: wood floor, warm exhibit lights, dark corners, and limited shadows.

Keep the POC lean. Prefer a few clear systems over a full engine-style folder tree. Bad movement will hurt the prototype more than unfinished art.

## Recommended Stack

```txt
Vite
TypeScript
Babylon.js
Optional UI overlay: React later, only if app shell becomes UI-heavy
Assets: GLB/glTF from Blender
```

### Why Babylon.js

- Engine-like primitives for cameras, lights, shadows, collisions, materials, and asset loading.
- TypeScript-friendly and maintainable for a greenfield project.
- Strong fit for browser-based 3D scenes without Unity WebGL build overhead.
- Supports both code-generated scenes and imported GLB assets.
- Good path toward performance work: baked lighting, LODs, texture compression, instancing, and WebGPU support.

### Why Not Unity for This POC

- Unity WebGL builds are heavier and less web-native.
- Unity scene data, lights, materials, and scripts do not transfer cleanly into a custom web app.
- If using Unity, likely commit to a full Unity WebGL app instead of a web-first Babylon app.
- Blender-to-GLB is a cleaner asset pipeline for web delivery.

## Scene Authoring Approach

Use a hybrid approach:

- Start with a code-generated rectangular room for speed.
- Use primitives for the first feel pass: floor, walls, pedestals, and fruit placeholders.
- Keep object creation interfaces GLB-compatible, but do not block the first prototype on asset loading.
- Add GLB loading after movement, collision, and exhibit panels work.
- Later, replace code-generated room or exhibit assets with Blender-authored GLB files.

## Initial Scene

- Single rectangular gallery.
- Flat walkable floor.
- Wood plank floor material.
- Simple walls and ceiling or partial ceiling depending on lighting tests.
- Six-ish pedestals arranged around the room.
- Placeholder fruit objects on pedestals.
- Warm localized lights near exhibits.
- Darker areas/corners for moody atmosphere.

## Controls

- Desktop only for now.
- First-person WASD movement.
- Mouse-look camera.
- Pointer lock required for natural first-person controls.
- Show a simple "Click to enter museum" state before pointer lock.
- Escape should release pointer lock and pause movement input.
- Basic collision against walls and pedestals.
- Use Babylon camera collisions and an ellipsoid first; do not add a physics engine for the POC.
- Babylon units should represent meters.
- Recommended player scale: height `1.7`, eye height `1.6`, collision radius around `0.35`.

## Exhibit Interaction

Use proximity-based info panels.

When user approaches a pedestal, show an overlay panel with exhibit metadata.

Example:

```txt
Title: Banana
Author: Jim Dean
```

Interaction rules:

- No click required for first prototype.
- Only nearest exhibit panel should show.
- Panel state is local to current user.
- Leaving proximity hides panel.

## Lighting Direction

Prototype should focus on moody lighting.

- Use point lights or spot lights for exhibit emphasis.
- Keep darker regions in room.
- Use shadows where affordable.
- Limit the first prototype to 1–2 shadow-casting lights.
- Use non-shadow lights or emissive materials for extra warmth and mood.
- For production, prefer mostly baked/static lighting and selective dynamic lights.
- Avoid many real-time shadow-casting point lights; expensive in browser.

## Materials

Initial material targets:

- Wood plank floor with PBR material.
- Basic wall material, likely matte/dark neutral.
- Pedestals with simple stone/painted material.
- Fruit placeholders can start with colored primitive meshes.

Future material improvements:

- Normal maps for floor planks.
- Roughness maps.
- Texture compression with KTX2/Basis.
- GLB material authoring in Blender.

## Future Multiplayer Considerations

Multiplayer is not part of first prototype, but architecture should not block it.

Potential future feature:

- Show other users walking around the museum.
- Other users appear as simple capsule avatars.
- Ghost/visitor avatars should have no collision with local user.
- Exhibit UI remains local only.
- No shared exhibit state for now.

Architecture should keep future multiplayer easy by separating:

- Local player control.
- Scene rendering.
- Exhibit/proximity UI.
- Optional ghost avatar rendering.
- Future network state synchronization.

## Suggested Prototype Architecture

```txt
src/
  main.ts
  scene/
    createScene.ts
    createGalleryRoom.ts
    createLighting.ts
    createPedestals.ts
  player/
    PlayerController.ts
  exhibits/
    ExhibitSystem.ts
    exhibitData.ts
  ui/
    ExhibitPanel.ts
```

### System Boundaries

#### PlayerController

Responsible for:

- WASD movement.
- Mouse-look.
- Camera setup.
- Collision with static scene geometry.

Should not know about exhibit metadata or UI.

#### ExhibitSystem

Responsible for:

- Registering exhibit positions and metadata.
- Detecting nearest exhibit within proximity radius.
- Emitting current exhibit state for UI.

Should remain local-only.

#### GhostAvatarSystem

Do not build for the first prototype. Keep it as a future boundary only.

Future responsibilities:

- Rendering non-colliding capsule avatars.
- Updating avatar transforms from mock or network state.
- Showing optional nameplates later.

No collision with local player.

#### Asset Loading

Do not build a full asset-loading layer until the primitive prototype feels good.

Future responsibilities:

- Loading GLB/glTF objects.
- Allowing fallback primitives while assets are missing.
- Keeping room/assets replaceable without rewriting gameplay systems.

## First Milestone

Build one room in five passes:

1. Rectangular gallery with first-person WASD + mouse-look.
2. Wall and pedestal collision using Babylon camera collisions.
3. 5–6 pedestals with placeholder fruit objects.
4. Proximity info panel for nearest exhibit.
5. Wood floor, moody lights, dark areas, and limited shadows.

## Non-Goals for First Prototype

- Real multiplayer.
- Mobile controls.
- Full museum map.
- Final art quality.
- Unity integration.
- Shared exhibit interactions.
- Complex avatar customization.
