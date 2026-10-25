import * as THREE from 'three';

/**
 * GLSL Shaders & 4-Layer Concentric Earth Globe Generator
 * Based on OrbitalX Specification Manual: "3D World & 3D Orbital Simulator"
 */

// 1. Surface Core Shader (High-Fidelity Photorealistic Earth with Clean Day/Night Mode Toggle, NO Terminator Line)
export const EarthSurfaceShader = {
  uniforms: {
    dayMap: { value: null },
    nightMap: { value: null },
    bumpMap: { value: null },
    specularMap: { value: null },
    isNight: { value: 0.0 }, // 0.0 = DAY, 1.0 = NIGHT
    lightDirection: { value: new THREE.Vector3(0.5, 0.3, 1.0).normalize() }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform sampler2D bumpMap;
    uniform sampler2D specularMap;
    uniform vec3 lightDirection;
    uniform float isNight; // 0.0 = DAY mode, 1.0 = NIGHT mode

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(lightDirection);
      vec3 viewDir = normalize(-vPosition);
      float rim = 1.0 - max(dot(viewDir, normal), 0.0);

      // --- DAY MODE ILLUMINATION ---
      float NdotL = max(dot(normal, lightDir), 0.0);
      float diffuse = NdotL * 0.45 + 0.65;

      vec4 dayColor = texture2D(dayMap, vUv);
      vec4 specColor = texture2D(specularMap, vUv);

      // Blinn-Phong specular reflection on daylight oceans
      vec3 halfDir = normalize(lightDir + viewDir);
      float specAngle = max(dot(normal, halfDir), 0.0);
      float specular = pow(specAngle, 24.0) * specColor.r * 0.45;

      // Daylight atmospheric rim brightening
      vec3 dayRimGlow = vec3(0.0, 0.4, 0.8) * pow(rim, 3.5) * 0.25;
      vec3 dayFinal = dayColor.rgb * diffuse + vec3(specular) + dayRimGlow;

      // --- NIGHT MODE ILLUMINATION (Black Marble + Glowing Golden City Lights, NO Terminator) ---
      vec4 nightColor = texture2D(nightMap, vUv);
      vec3 cityLights = nightColor.rgb * vec3(1.65, 1.45, 1.15) * 1.5;
      vec3 nightOcean = vec3(0.015, 0.025, 0.05);
      float lightMask = clamp(max(nightColor.r, max(nightColor.g, nightColor.b)) * 2.2, 0.0, 1.0);
      vec3 nightBase = mix(nightOcean, cityLights, lightMask);
      vec3 nightRimGlow = vec3(0.0, 0.35, 0.75) * pow(rim, 4.0) * 0.4;
      vec3 nightFinal = nightBase + nightRimGlow;

      // Clean toggle between Day and Night (No terminator line across globe)
      vec3 finalColor = mix(dayFinal, nightFinal, isNight);
      gl_FragColor = vec4(finalColor, 1.0);
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
  const slotColor = satelliteData.slotColor || satelliteData.orbitColor || '#00F0FF';
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
  const scale = isSelected ? 1.65 : 1.35;
  group.scale.set(scale, scale, scale);

  return group;
}
