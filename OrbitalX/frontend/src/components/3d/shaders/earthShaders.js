import * as THREE from 'three';

/**
 * GLSL Shaders & 4-Layer Concentric Earth Globe Generator
 * Based on OrbitalX Specification Manual: "3D World & 3D Orbital Simulator"
 */

// 1. Surface Core Shader (Day / Night Terminator + Ocean Specular Blinn-Phong + Bump)
// Implements exact mathematical formulation from DAY_NIGHT_TRANSITION_GUIDE.md Section 4 & 5
export const EarthSurfaceShader = {
  uniforms: {
    dayMap: { value: null },
    nightMap: { value: null },
    bumpMap: { value: null },
    specularMap: { value: null },
    sunDirection: { value: new THREE.Vector3(1.0, 0.3, 0.5).normalize() },
    dayNightMode: { value: 0 } // 0 = Terminator, 1 = Day Only, 2 = Night Only
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      // Transform normal to eye/view space (Section 5.1)
      vNormal = normalize(normalMatrix * normal);
      // Transform vertex position to eye/view space
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
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

      // Lighting intensity based on sun incidence angle (Section 4.1)
      float intensity = dot(normal, sunDir);

      // Smooth day/night transition (terminator zone, Section 4.2)
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
        vec3 cityLights = nightColor.rgb * 2.2;
        vec3 deepNavyOcean = vec3(0.015, 0.025, 0.05);
        color = max(cityLights, deepNavyOcean);

      } else {
        // ----------------------------------------------------
        // MODE 0: TERMINATOR MODE (Default realistic blend, Section 4.3 & 4.4)
        // ----------------------------------------------------
        vec3 nightSide = max(nightColor.rgb * 2.2, vec3(0.015, 0.025, 0.05));
        color = mix(nightSide, dayColor.rgb, blend);

        // Ocean sun glint (only on sunlit hemisphere, Section 4.4)
        float specIntensity = pow(max(dot(reflect(-sunDir, normal), normalize(-vPosition)), 0.0), 20.0);
        color += specular.r * specIntensity * 0.4 * blend;

        // Faint ambient light floor
        color += dayColor.rgb * 0.015;
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// 2. Atmosphere Fresnel Halo Shader (Section 5.3: Inverted Fresnel Limb Glow)
export const AtmosphereHaloShader = {
  uniforms: {
    glowColor: { value: new THREE.Color(0x00d8ff) },
    intensity: { value: 0.7 }
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 glowColor;
    uniform float intensity;

    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 viewDir = normalize(-vPosition);
      float fresnel = 1.0 - dot(viewDir, vNormal);
      fresnel = pow(max(0.0, fresnel), 4.5) * intensity;
      gl_FragColor = vec4(glowColor, fresnel);
    }
  `
};

/**
 * Builds the procedural 3D satellite mesh with deployable solar wings,
 * gold foil chassis, and Nadir pointing orientation (Section 7, Step 5).
 */
export function createProceduralSatelliteMesh(satelliteData) {
  const group = new THREE.Group();
  const isSelected = satelliteData.isSelected;
  const slotColor = satelliteData.slotColor || '#00F0FF';
  const color = new THREE.Color(slotColor);

  // Main Satellite Body (CubeSat / Spacecraft Bus)
  const bodyGeo = new THREE.BoxGeometry(1.2, 1.2, 1.6);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x222633,
    metalness: 0.9,
    roughness: 0.25,
    emissive: 0x050a15,
    emissiveIntensity: 0.2
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(bodyMesh);

  // Gold foil MLI thermal blanket trims on edges
  const foilGeo = new THREE.BoxGeometry(1.22, 0.08, 1.62);
  const foilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold foil
    metalness: 0.95,
    roughness: 0.15
  });
  const foilTop = new THREE.Mesh(foilGeo, foilMat);
  foilTop.position.y = 0.58;
  group.add(foilTop);

  const foilBottom = foilTop.clone();
  foilBottom.position.y = -0.58;
  group.add(foilBottom);

  // Deployable Photovoltaic Solar Wings (Left & Right)
  const wingGeo = new THREE.BoxGeometry(2.2, 0.9, 0.05);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x051336, // Deep space blue silicon
    metalness: 0.95,
    roughness: 0.2,
    emissive: 0x001533,
    emissiveIntensity: 0.4
  });

  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-1.8, 0, 0);
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(1.8, 0, 0);
  group.add(rightWing);

  // Status Beacon / Science Payload Node
  const beaconGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.95
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 0, 0.95);
  group.add(beacon);

  // If selected, add high-visibility pulsing targeting bracket
  if (isSelected) {
    const bracketGeo = new THREE.RingGeometry(3.0, 3.4, 32);
    const bracketMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const bracket = new THREE.Mesh(bracketGeo, bracketMat);
    group.add(bracket);
  }

  // Scale satellite group for proper visibility in orbit
  const scale = isSelected ? 1.6 : 1.15;
  group.scale.set(scale, scale, scale);

  return group;
}
