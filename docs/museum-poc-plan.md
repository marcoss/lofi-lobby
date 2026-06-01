# Indoor Museum Web App POC

## Summary

Prototype an indoor museum web app where desktop users walk around a single rectangular gallery using first-person WASD controls and mouse-look. The room contains display pedestals with placeholder 3D objects, such as fruits. Users can approach exhibits to view a local information panel.

## Primary Goals

- Prove walking feel: smooth first-person movement, camera height, mouse-look, and basic collision.
- Prove visual mood: wood plank flooring, darker areas, warm localized lighting, and shadows.
- Prove gallery flow: simple exhibit layout with pedestals and proximity-based info panels.

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
- Use GLB-ready asset loading from day one.
- Use placeholder primitives or simple GLB models for fruits and pedestals.
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
- Pointer lock likely required for natural first-person controls.
- Basic collision against walls and pedestals.
- Player height should feel human-scale.

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
  engine/
    createEngine.ts
    createScene.ts
  scene/
    createGalleryRoom.ts
    createLighting.ts
    createPedestals.ts
    loadAssets.ts
  player/
    PlayerController.ts
  exhibits/
    ExhibitSystem.ts
    exhibitData.ts
  avatars/
    GhostAvatarSystem.ts
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

Not required for first version, but useful future boundary.

Responsible for:

- Rendering non-colliding capsule avatars.
- Updating avatar transforms from mock or network state.
- Showing optional nameplates later.

No collision with local player.

#### Asset Loading

Responsible for:

- Loading GLB/glTF objects.
- Allowing fallback primitives while assets are missing.
- Keeping room/assets replaceable without rewriting gameplay systems.

## First Milestone

Build one room with:

- Rectangular gallery.
- Wood floor.
- Moody lights and dark areas.
- First-person WASD + mouse-look.
- Wall/pedestal collision.
- 5–6 pedestals.
- Placeholder fruit objects.
- Proximity info panel.

## Non-Goals for First Prototype

- Real multiplayer.
- Mobile controls.
- Full museum map.
- Final art quality.
- Unity integration.
- Shared exhibit interactions.
- Complex avatar customization.
