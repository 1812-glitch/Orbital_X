# Complete Guide: Implementing Earth Day/Night Terminator Transition in WebGL / Three.js

This document provides a comprehensive, step-by-step engineering and mathematical guide to implementing a photorealistic **Earth Day/Night Transition (Terminator Line)** in Three.js and React Three Fiber (as implemented in OrbitalX).

---

## Table of Contents
1. [Core Architectural Concept](#1-core-architectural-concept)
2. [Required Texture Assets](#2-required-texture-assets)
3. [The Layered Concentric Sphere Model](#3-the-layered-concentric-sphere-model)
4. [Mathematical Formulation](#4-mathematical-formulation)
   - [4.1 Lambertian Sun Vector Dot Product](#41-lambertian-sun-vector-dot-product)
   - [4.2 The Twilight Band (Hermite Smoothstep)](#42-the-twilight-band-hermite-smoothstep)
   - [4.3 Texture Blending & Ambient Floor](#43-texture-blending--ambient-floor)
   - [4.4 Ocean Specular Glint (Blinn-Phong Model)](#44-ocean-specular-glint-blinn-phong-model)
   - [4.5 Atmospheric Fresnel Limb Glow](#45-atmospheric-fresnel-limb-glow)
5. [Complete GLSL Shader Code](#5-complete-glsl-shader-code)
   - [5.1 Earth Vertex Shader](#51-earth-vertex-shader)
   - [5.2 Earth Fragment Shader](#52-earth-fragment-shader)
   - [5.3 Atmosphere Vertex & Fragment Shaders](#53-atmosphere-vertex--fragment-shaders)
6. [Complete React Three Fiber Component Implementation](#6-complete-react-three-fiber-component-implementation)
7. [Physics & Orbital Eclipse Integration](#7-physics--orbital-eclipse-integration)
8. [Performance Best Practices](#8-performance-best-practices)
9. [3D Earth Simulator Background (BG) & Deep Space Environment](#9-3d-earth-simulator-background-bg--deep-space-environment)

---

## 1. Core Architectural Concept

Standard Three.js materials (`MeshStandardMaterial` or `MeshPhongMaterial`) support basic directional lighting, but they **cannot** natively blend two separate texture sets (a daytime surface map and a nighttime city illumination map) across a soft terminator boundary with masked specular highlights.

To achieve NASA-grade realism, we employ:
- A custom **GLSL ShaderMaterial** that samples both Day and Night textures simultaneously.
- A **Sun direction vector uniform** defining the celestial illumination source.
- A **per-fragment dot product** calculating the angle of solar incidence.
- A **Hermite interpolation curve (`smoothstep`)** that generates a physically authentic 15-degree twilight zone (penumbra).
- A **specular mask** that limits solar sun glints exclusively to daytime oceans.
- A **Fresnel atmospheric shell** that simulates Rayleigh scattering around the limb of the planet.

---

## 2. Required Texture Assets

All maps should be equidistant cylindrical projections (2:1 aspect ratio, e.g., 2048x1024 or 4096x2048):

| Asset Name | Format | Source | Description |
| :--- | :--- | :--- | :--- |
| `earth_day.jpg` | RGB JPEG | NASA Visible Earth (Blue Marble) | Daytime surface albedo (continents, oceans, ice). |
| `earth_night.jpg` | RGB JPEG | NASA Black Marble | Nighttime artificial lighting and urban grids. |
| `earth_specular.jpg` | Greyscale / Red Mask | NASA Earth Observatory | Water bodies (white = 1.0) vs land (black = 0.0). |
| `earth_bump.jpg` | Greyscale Heightmap | USGS / NASA | Topographical elevation for surface relief. |
| `earth_clouds.png` | RGBA PNG | NASA Weather Satellite Composite | Cloud formations with transparent alpha channel. |

---

## 3. The Layered Concentric Sphere Model

The 3D planet is built from three nested spheres with identical centers but slightly staggered radii:

```
+-------------------------------------------------------+
|  Atmospheric Fresnel Glow Mesh (Scale: 1.025 - 1.05)  |  <- BackSide additive glow
|  +-------------------------------------------------+  |
|  |  Cloud Deck Mesh (Scale: 1.005)                 |  |  <- Rotates faster (+25%)
|  |  +-------------------------------------------+  |  |
|  |  |  Earth Surface Globe (Scale: 1.000)       |  |  |  <- Custom Day/Night Shader
|  |  +-------------------------------------------+  |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

1. **Earth Surface ($R = 5.0$, Scale = 1.000)**: Renders the custom day/night GLSL shader.
2. **Cloud Deck ($R = 5.0$, Scale = 1.005)**: Renders `earth_clouds.png` on a semitransparent additive material, rotating independently to simulate atmospheric drift.
3. **Atmospheric Fresnel Glow ($R = 5.0$, Scale = 1.025)**: Renders inverted normals on `THREE.BackSide` to cast a soft blue limb glow around the planet horizon.

---

## 4. Mathematical Formulation

### 4.1 Lambertian Sun Vector Dot Product

Given:
- Surface normal in view/eye space: $\vec{N} = \text{normalize}(\mathbf{vNormal})$
- Sun direction vector in view/eye space: $\vec{S} = \text{normalize}(\mathbf{sunDirection})$

The cosine of the angle of incidence is calculated per fragment:
$$\text{intensity} = \vec{N} \cdot \vec{S}$$

- $\text{intensity} > 0$: The point faces the Sun (Day).
- $\text{intensity} < 0$: The point faces away from the Sun (Night).
- $\text{intensity} = 0$: Geometric terminator line.

```glsl
vec3 normal = normalize(vNormal);
vec3 sunDir = normalize(sunDirection);
float intensity = dot(normal, sunDir);
```

---

### 4.2 The Twilight Band (Hermite Smoothstep)

A binary condition (`intensity > 0.0 ? day : night`) creates an unrealistic, razor-sharp edge. Real planets possess an atmosphere that scatters light across twilight zones (civil, nautical, and astronomical twilight).

To model this, we use the GLSL cubic Hermite interpolator `smoothstep(edge0, edge1, x)`:
$$\text{blend} = \text{smoothstep}(-0.15, 0.25, \text{intensity})$$

```glsl
float blend = smoothstep(-0.15, 0.25, intensity);
```

- When $\text{intensity} \le -0.15$: $\text{blend} = 0.0$ (100% full night).
- When $\text{intensity} \ge +0.25$: $\text{blend} = 1.0$ (100% full daylight).
- Between $-0.15$ and $+0.25$: A continuous $S$-curve creates a smooth ~15° twilight gradient.

---

### 4.3 Texture Blending & Ambient Floor

With the interpolation factor $\text{blend} \in [0.0, 1.0]$, we linearly interpolate between the night city lights and the daylight surface:

```glsl
vec4 dayColor = texture2D(dayMap, vUv);
vec4 nightColor = texture2D(nightMap, vUv);

// Blend night map into day map across terminator zone
vec3 color = mix(nightColor.rgb * 1.4, dayColor.rgb, blend);

// Ambient floor to prevent pitch blackness on dark unlit terrain
color += dayColor.rgb * 0.015;
```

> **Why `nightColor.rgb * 1.4`?**  
> Unboosted night textures often appear dim against deep space black backgrounds. A 1.4x - 1.6x scalar gives urban lights a vivid, incandescent glow.

---

### 4.4 Ocean Specular Glint (Blinn-Phong Model)

Water surfaces produce a bright, concentrated reflection of the Sun (solar glint), while land is rough and diffuse.

1. **Reflection Vector**:
   $$\vec{R} = \text{reflect}(-\vec{S}, \vec{N})$$
2. **View Vector**:
   $$\vec{V} = \text{normalize}(-\mathbf{vPosition})$$
3. **Specular Exponent**:
   $$\text{specIntensity} = \max(\vec{R} \cdot \vec{V}, 0.0)^{20}$$

```glsl
vec4 specular = texture2D(specularMap, vUv);

// Blinn-Phong specular glint on water surfaces
float specIntensity = pow(max(dot(reflect(-sunDir, normal), normalize(-vPosition)), 0.0), 20.0);

// Crucial: Multiply by 'blend' so specular highlights never appear on the night side!
color += specular.r * specIntensity * 0.4 * blend;
```

---

### 4.5 Atmospheric Fresnel Limb Glow

Atmospheric scattering is thickest when looking through the limb (edge) of the planet sphere. This is simulated using the inverted Fresnel equation:

$$\text{fresnel} = \left(1.0 - \vec{V} \cdot \vec{N}\right)^{4.5} \times \text{intensity}$$

```glsl
// Inside Atmosphere Fragment Shader:
vec3 viewDir = normalize(-vPosition);
float fresnel = 1.0 - dot(viewDir, vNormal);
fresnel = pow(fresnel, 4.5) * intensity;
gl_FragColor = vec4(glowColor, fresnel);
```

By rendering this shader on `THREE.BackSide` with `transparent: true` and `depthWrite: false`, the atmosphere manifests as a soft glowing halo extending beyond the planetary perimeter.

---

## 5. Complete GLSL Shader Code

### 5.1 Earth Vertex Shader

```glsl
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vUv = uv;
  // Transform normal to eye space
  vNormal = normalize(normalMatrix * normal);
  // Transform vertex position to eye space
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

---

### 5.2 Earth Fragment Shader

```glsl
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D bumpMap;
uniform sampler2D specularMap;
uniform vec3 sunDirection;
uniform int dayNightMode; // 0: Terminator, 1: Day Only, 2: Night Only

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(sunDirection);

  // Lighting intensity based on sun incidence angle
  float intensity = dot(normal, sunDir);

  // Smooth day/night transition (terminator zone)
  float blend = smoothstep(-0.15, 0.25, intensity);

  // Sample textures
  vec4 dayColor = texture2D(dayMap, vUv);
  vec4 nightColor = texture2D(nightMap, vUv);
  vec4 specular = texture2D(specularMap, vUv);

  vec3 color;
  if (dayNightMode == 1) {
    // ----------------------------------------------------
    // MODE 1: DAY ONLY (Full daylight across surface)
    // ----------------------------------------------------
    float dayLight = max(intensity * 0.4 + 0.8, 0.65);
    color = dayColor.rgb * dayLight;
    float specIntensity = pow(max(dot(reflect(-sunDir, normal), normalize(-vPosition)), 0.0), 16.0);
    color += specular.r * specIntensity * 0.35;

  } else if (dayNightMode == 2) {
    // ----------------------------------------------------
    // MODE 2: NIGHT ONLY (City lights glowing worldwide)
    // ----------------------------------------------------
    color = nightColor.rgb * 1.6 + vec3(0.015, 0.025, 0.05);

  } else {
    // ----------------------------------------------------
    // MODE 0: TERMINATOR MODE (Default realistic blend)
    // ----------------------------------------------------
    color = mix(nightColor.rgb * 1.4, dayColor.rgb, blend);

    // Ocean sun glint (only on sunlit hemisphere)
    float specIntensity = pow(max(dot(reflect(-sunDir, normal), normalize(-vPosition)), 0.0), 20.0);
    color += specular.r * specIntensity * 0.4 * blend;

    // Faint ambient light floor
    color += dayColor.rgb * 0.015;
  }

  gl_FragColor = vec4(color, 1.0);
}
```

---

### 5.3 Atmosphere Vertex & Fragment Shaders

```glsl
// Atmosphere Vertex Shader
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// Atmosphere Fragment Shader
uniform vec3 glowColor;
uniform float intensity;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDir = normalize(-vPosition);
  float fresnel = 1.0 - dot(viewDir, vNormal);
  fresnel = pow(fresnel, 4.5) * intensity;
  gl_FragColor = vec4(glowColor, fresnel);
}
```

---

## 6. Complete React Three Fiber Component Implementation

Here is the ready-to-use component in React Three Fiber:

```jsx
import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const EARTH_RADIUS = 5.0;

export default function Earth({ dayNightMode = "terminator" }) {
  const earthRef = useRef();
  const cloudsRef = useRef();

  // Map mode string to integer uniform
  const modeInt = dayNightMode === "day" ? 1 : dayNightMode === "night" ? 2 : 0;

  // 1. Load NASA Textures with Anisotropic Filtering
  const [dayMap, nightMap, bumpMap, specularMap, cloudsMap] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const day = loader.load("/textures/earth_day.jpg");
    const night = loader.load("/textures/earth_night.jpg");
    const bump = loader.load("/textures/earth_bump.jpg");
    const spec = loader.load("/textures/earth_specular.jpg");
    const clouds = loader.load("/textures/earth_clouds.png");

    [day, night, bump, spec, clouds].forEach((t) => {
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = 4;
    });

    return [day, night, bump, spec, clouds];
  }, []);

  // 2. Define Fixed Normalized Sun Vector (pointing from Sun towards Earth)
  const sunDirection = useMemo(() => new THREE.Vector3(1, 0.3, 0.5).normalize(), []);

  // 3. Custom Earth Shader Material
  const earthMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          dayMap: { value: dayMap },
          nightMap: { value: nightMap },
          bumpMap: { value: bumpMap },
          specularMap: { value: specularMap },
          sunDirection: { value: sunDirection },
          dayNightMode: { value: modeInt },
        },
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
      }),
    [dayMap, nightMap, bumpMap, specularMap, sunDirection]
  );

  // Sync mode changes reactively
  useEffect(() => {
    if (earthMaterial.uniforms.dayNightMode) {
      earthMaterial.uniforms.dayNightMode.value = modeInt;
    }
  }, [modeInt, earthMaterial]);

  // 4. Atmosphere Halo Glow Material
  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          glowColor: {
            value: new THREE.Color(
              dayNightMode === "night"
                ? "#2563eb"
                : dayNightMode === "day"
                ? "#67e8f9"
                : "#4da8da"
            ),
          },
          intensity: { value: dayNightMode === "night" ? 0.45 : 0.7 },
        },
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [dayNightMode]
  );

  // 5. Differential Planetary Rotation
  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02; // Globe rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.025; // Clouds drift faster
    }
  });

  return (
    <group>
      {/* Layer 1: Core Earth Sphere */}
      <mesh ref={earthRef} material={earthMaterial}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      </mesh>

      {/* Layer 2: Cloud Layer with Additive Blending */}
      <mesh ref={cloudsRef} scale={1.005}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={dayNightMode === "night" ? 0.1 : 0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Layer 3: Atmospheric Fresnel Rim Glow */}
      <mesh scale={1.025} material={atmosphereMaterial}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      </mesh>

      {/* Layer 4: Subtle Deep-Space Backing Glow */}
      <mesh scale={1.05}>
        <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={dayNightMode === "night" ? "#1e1b4b" : "#1a8fcc"}
          transparent
          opacity={0.02}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
```

---

## 7. Physics & Orbital Eclipse Integration

The terminator is not only visual; it drives mission critical calculations for orbiting satellites.

### Geometric Eclipse Detection Algorithm
In a Keplerian orbit, a satellite is in **Earth's Umbra (Eclipse)** when Earth blocks direct line-of-sight to the Sun:

```javascript
// Calculate satellite position in orbit
const orbitPhase = (orbitAngle % (Math.PI * 2)) / (Math.PI * 2);

// Umbra fraction (typical LEO ~35% orbital eclipse duration)
const ECLIPSE_FRACTION = 0.35;
const isEclipsed = orbitPhase > (1 - ECLIPSE_FRACTION);

// Power subsystem impact:
const effectivePowerGen = isEclipsed ? 0.0 : nominalSolarArrayPower; // Watts
const netPower = effectivePowerGen - systemPowerConsumption;

// Battery SoC update (Watt-hours)
const deltaWh = (netPower * dt) / 3600;
setBatterySoC(prev => Math.max(0, Math.min(100, prev + (deltaWh / batteryCapacityWh) * 100)));
```

---

## 8. Performance Best Practices

1. **Keep Shaders in Fragment Stage Only**: Perform the vector math (`dot`, `reflect`, `smoothstep`) in the fragment shader. Passing interpolated normals from the vertex shader (`vNormal = normalize(normalMatrix * normal)`) maintains 60+ FPS effortlessly on mobile and desktop WebGL.
2. **Disable `depthWrite` on Atmosphere and Clouds**: Since both the cloud layer and the atmosphere mesh are translucent hulls over the planet, set `depthWrite: false` to prevent Z-buffer sorting artifacts.
3. **Use Mipmapping and Anisotropy**: Textures mapped onto 3D spheres suffer severe moiré near the horizons unless `LinearMipmapLinearFilter` and `anisotropy = 4` (or 8) are enabled.
4. **Uniform Mutation Without Recompilation**: When toggling between Terminator, Day, and Night modes, update `material.uniforms.dayNightMode.value` directly. Never construct a new `ShaderMaterial` instance on every frame or state change.

---

## 9. 3D Earth Simulator Background (BG) & Deep Space Environment

> [!NOTE]
> **3D Globe Background (BG) Architecture**:  
> This section explicitly documents the entire background (BG) setup for the 3D Earth Simulator in `OrbitalViewer.jsx`. The cosmic background is not an image file or skybox; it is an engineered 4-part composite comprising the background clear color `#050810`, a 3D volumetric starfield particle system, an atmospheric horizon falloff hull, and a celestial tri-light space rig.

### 9.1 Background (BG) Quick Reference Specification Table

| BG Layer / Element | Technology / Syntax | Value / Color | Role in 3D Simulator Background (BG) |
| :--- | :--- | :--- | :--- |
| **Canvas Background Color** | `<color attach="background" />` | `#050810` (Obsidian Navy) | Primary deep-space background color; eliminates glare & pure-black flat artifacts |
| **Outer Wrapper Container** | CSS Tailwind | `bg-[#050810]` | Seamless letterbox / pillarbox container matching the WebGL clear color |
| **3D Starfield System** | `@react-three/drei` `<Stars />` | 3,000 particles, $R=200$ | Volumetric far-field stars providing motion parallax when orbiting the globe |
| **Horizon Falloff Hull** | `THREE.BackSide` Mesh | $R = 5.25$, Opacity `0.02` | Ultra-soft gradient blending the planet's atmospheric limb into the background |
| **Space Lighting Rig** | Directional + Ambient + Point | `#fff5e0`, `#4488ff` | Sunlight illumination, shadow fill, and cool blue Earthshine reflections |

---

### 9.2 Background (BG) Canvas & Container Setup (`#050810`)

Rather than using harsh pure black (`#000000`) or standard browser white, a tailored obsidian deep-space tone (`#050810`) is assigned to both the Three.js WebGL scene background and the HTML parent container:

```jsx
// Wrapper div container
<div className="relative w-full h-[calc(100vh-6rem)] rounded-lg overflow-hidden border border-orbital-border bg-[#050810]">
  {/* WebGL 3D Canvas */}
  <Canvas
    camera={{ position: [0, 8, 15], fov: 50, near: 0.1, far: 500 }}
    gl={{ antialias: true, alpha: false }}
  >
    {/* Deep Space Background (BG) attachment node */}
    <color attach="background" args={["#050810"]} />
    <Scene />
  </Canvas>
</div>
```

- **Why `#050810` instead of `#000000`?**: Real space viewed from orbit contains faint cosmic background radiation and faint zodiacal glow. `#050810` (very dark navy/black) creates high contrast for neon satellite orbits and glowing night-side city grids without clinical black clipping.
- **`alpha: false` Performance Optimization**: Setting `alpha: false` informs the WebGL context that the background is completely opaque. This allows the browser to bypass alpha compositing with the underlying DOM tree, saving substantial GPU memory bandwidth.

---

### 9.3 Background (BG) Volumetric Starfield System (`<Stars />`)

To make the space background feel physically alive when panning, zooming, and tracking satellites, a volumetric particle starfield is embedded within the 3D scene:

```jsx
import { Stars } from "@react-three/drei";

<Stars
  radius={200}    // Outer bounding radius of star sphere
  depth={100}     // Volumetric shell thickness (particles populated between R=100 and R=200)
  count={3000}    // 3,000 starlight points
  factor={3}      // Particle size multiplier
  saturation={0}  // 0% saturation = pure white natural starlight
  fade            // Smoothly attenuates stars near camera clipping boundaries
  speed={0.5}     // Subtle cosmic drift & twinkle animation over time
/>
```

- **True 3D Motion Parallax**: With `depth={100}`, stars exist at varying distances in 3D space. When the user rotates the Earth or follows a fast-moving satellite, foreground stars exhibit greater parallax shift than background stars.
- **Frustum Clipping Guard**: With the camera's far clipping plane configured at `far: 500`, star particles at `radius: 200` are completely within the rendering envelope and never abruptly pop in or out.

---

### 9.4 Background (BG) Horizon Blending: Atmospheric Deep-Space Falloff Hull (Layer 4)

Standard 3D globes suffer from a harsh, razor-sharp edge between the outer atmosphere and the dark space background. OrbitalX eliminates this using an oversized concentric sphere ($R = 5.25$, scale `1.05`) rendered with `THREE.BackSide`:

```jsx
{/* Outer soft atmospheric glow blending into the background (BG) */}
<mesh scale={1.05}>
  <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
  <meshBasicMaterial
    color={dayNightMode === "night" ? "#1e1b4b" : "#1a8fcc"}
    transparent
    opacity={0.02}
    side={THREE.BackSide}
    depthWrite={false}
  />
</mesh>
```

- **Smooth Horizon Gradient**: The 2% opacity indigo/cyan material softens the planet's outer rim into the `#050810` background, mimicking how Earth's outer exosphere diffuses into the darkness of space.

---

### 9.5 Background (BG) Celestial Multi-Source Lighting Rig

To illuminate the 3D environment authentically against the dark background:

```jsx
{/* 1. Ambient cosmic bounce (subtle fill preventing unlit objects from going pitch black) */}
<ambientLight intensity={dayNightMode === "day" ? 0.35 : 0.15} />

{/* 2. Direct sunlight: Warm solar beam positioned at [50, 20, 30] */}
<directionalLight
  position={[50, 20, 30]}
  intensity={dayNightMode === "night" ? 0.6 : 1.5}
  color="#fff5e0"
/>

{/* 3. Earthshine backfill: Cool planetary reflection from opposite direction [-30, -10, -20] */}
<pointLight position={[-30, -10, -20]} intensity={0.3} color="#4488ff" />
```


