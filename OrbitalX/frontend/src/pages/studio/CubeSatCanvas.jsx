import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FORM_FACTORS, CUBESAT_COMPONENTS } from './cubesatComponents';
import { buildChassisFrame } from './utils/buildChassisFrame';
import { buildComponentMesh } from './utils/buildComponentMesh';
import { getCameraMetrics, getChassisDimensions, getBayConfiguration } from './utils/buildComponentBays';
import StudioCanvasOverlays from './components/StudioCanvasOverlays';

export { getCameraMetrics };

export default function CubeSatCanvas({ 
  formFactor = '1U', 
  mountedComponents = {}, 
  isAssembling = false,
  isValidating = false,
  autoRotate = false,
  onLoadPreset = null,
  lastAction = null,
  highlightedComponentId = null,
  onSelectComponent = null
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const frameGroupRef = useRef(null);
  const componentsGroupRef = useRef(null);
  const removalGroupRef = useRef(null);
  const activeRemovalMarkersRef = useRef([]);
  const lastPositionsRef = useRef({});
  const scanLineRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const cameraRef = useRef(null);
  const gridHelperRef = useRef(null);
  const highlightedComponentIdRef = useRef(highlightedComponentId);
  const lastActionRef = useRef(lastAction);

  // Dynamic feedback state
  const [actionBanner, setActionBanner] = useState(null);
  const [hoveredComponent, setHoveredComponent] = useState(null);

  // Dynamic dimensions based on form factor up to 16U
  const { unitsX, unitsY, unitsZ, chassisWidth, chassisHeight, chassisDepth } = getChassisDimensions(formFactor);

  // Sync refs to avoid breaking memoization
  useEffect(() => {
    highlightedComponentIdRef.current = highlightedComponentId;
    lastActionRef.current = lastAction;
  }, [highlightedComponentId, lastAction]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup with dynamic scale
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 120);
    const { dist: initialDist, targetY: initialTargetY } = getCameraMetrics(formFactor);
    camera.position.set(initialDist * 0.58, initialDist * 0.32 + initialTargetY, initialDist * 0.75);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 40;
    controls.minDistance = 3.5;
    controls.target.set(0, initialTargetY, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controls.update();
    controlsRef.current = controls;

    // 5. Lighting
    scene.add(new THREE.AmbientLight(0x101b33, 2.5));
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(8, 12, 8);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00f0ff, 2.0);
    cyanRimLight.position.set(-8, -4, -6);
    scene.add(cyanRimLight);

    const goldAccentLight = new THREE.PointLight(0xffb000, 1.2, 10);
    goldAccentLight.position.set(0, 4, 0);
    scene.add(goldAccentLight);

    // 6. Holographic floor grid
    const gridHelper = new THREE.GridHelper(16, 32, 0x00f0ff, 0x15233e);
    gridHelper.position.y = -chassisHeight / 2 - 0.35;
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 7. Groups
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const frameGroup = new THREE.Group();
    mainGroup.add(frameGroup);
    frameGroupRef.current = frameGroup;

    const componentsGroup = new THREE.Group();
    mainGroup.add(componentsGroup);
    componentsGroupRef.current = componentsGroup;

    const removalGroup = new THREE.Group();
    mainGroup.add(removalGroup);
    removalGroupRef.current = removalGroup;

    // 8. Validation scan laser
    const scanGeo = new THREE.RingGeometry(0.1, 2.8, 32);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const scanLine = new THREE.Mesh(scanGeo, scanMat);
    scanLine.rotation.x = Math.PI / 2;
    scene.add(scanLine);
    scanLineRef.current = scanLine;

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const startTime = performance.now();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsedTime = (performance.now() - startTime) / 1000;
      controls.update();

      if (scanLineRef.current) {
        if (isValidating) {
          scanLineRef.current.material.opacity = 0.6 + Math.sin(elapsedTime * 8) * 0.3;
          scanLineRef.current.position.y = Math.sin(elapsedTime * 3) * (chassisHeight / 2);
        } else {
          scanLineRef.current.material.opacity = 0;
        }
      }

      const now = Date.now();

      // Subtle highlights in componentsGroup
      if (componentsGroupRef.current) {
        componentsGroupRef.current.traverse((child) => {
          if (child.userData?.isAddHighlight) {
            const until = child.userData.highlightUntil || 0;
            if (until > now) {
              const remaining = Math.max(0, (until - now) / 1600);
              child.children?.forEach(c => {
                if (c.material) c.material.opacity = remaining * 0.45;
              });
              child.visible = true;
            } else {
              child.visible = false;
            }
          }
          if (child.userData?.isSelectionHighlight && child.visible) {
            const pulse = 0.35 + Math.sin(elapsedTime * 4) * 0.15;
            child.children?.forEach(c => {
              if (c.material) c.material.opacity = pulse;
            });
          }
        });
      }

      // Vacated Slot Markers
      if (activeRemovalMarkersRef.current.length > 0) {
        activeRemovalMarkersRef.current = activeRemovalMarkersRef.current.filter((marker) => {
          const remaining = (marker.expiresAt - now) / marker.duration;
          if (remaining <= 0) {
            if (removalGroupRef.current && marker.group) {
              removalGroupRef.current.remove(marker.group);
            }
            marker.geometries?.forEach(g => g?.dispose?.());
            marker.materials?.forEach(m => m?.dispose?.());
            return false;
          }
          marker.materials?.forEach(m => {
            if (m) m.opacity = Math.max(0, remaining * 0.45);
          });
          return true;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animFrameIdRef.current);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  // Update OrbitControls autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Re-build Chassis Frame when formFactor changes
  useEffect(() => {
    buildChassisFrame(frameGroupRef.current, {
      chassisWidth,
      chassisHeight,
      chassisDepth,
      unitsX,
      unitsY,
      unitsZ
    });
  }, [formFactor, chassisHeight, chassisWidth, chassisDepth, unitsX, unitsY, unitsZ]);

  // Dynamic camera framing
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const { dist, targetY } = getCameraMetrics(formFactor);
    controls.target.set(0, targetY, 0);
    camera.position.set(dist * 0.58, dist * 0.32 + targetY, dist * 0.75);
    camera.updateProjectionMatrix();
    controls.update();

    if (gridHelperRef.current) {
      gridHelperRef.current.position.y = -chassisHeight / 2 - 0.35;
    }
  }, [formFactor, chassisHeight, chassisWidth, chassisDepth]);

  // Re-build Mounted Component Meshes (Clean & fast, not rebuilding on hover)
  useEffect(() => {
    const compGroup = componentsGroupRef.current;
    if (!compGroup) return;

    while (compGroup.children.length > 0) {
      const obj = compGroup.children[0];
      compGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    const w = chassisWidth;
    const h = chassisHeight;
    const d = chassisDepth;

    const { bayOffsets, bayY, getBayForComp, materials } = getBayConfiguration({ unitsX, unitsZ, w, d, h });

    Object.entries(mountedComponents).forEach(([compId, count]) => {
      if (!count || count <= 0) return;

      for (let i = 0; i < count; i++) {
        const itemGroup = buildComponentMesh(compId, i, {
          bayOffsets,
          bayY,
          getBayForComp,
          unitsZ,
          unitsY,
          w,
          h,
          d,
          isAssembling,
          ...materials
        });

        itemGroup.userData = { componentId: compId, instanceIndex: i };

        const box = new THREE.Box3().setFromObject(itemGroup);
        const size = new THREE.Vector3();
        box.getSize(size);
        const compW = Math.max(size.x, 1.3);
        const compH = Math.max(size.y, 0.35);
        const compD = Math.max(size.z, 1.3);

        lastPositionsRef.current[compId] = {
          x: itemGroup.position.x,
          y: itemGroup.position.y,
          z: itemGroup.position.z,
          w: compW,
          h: compH,
          d: compD
        };

        const isRecentlyAdded = lastActionRef.current?.type === 'ADD' && 
                                lastActionRef.current?.componentId === compId && 
                                (Date.now() - (lastActionRef.current?.timestamp || 0) < 1800);

        const addHighlightGroup = new THREE.Group();
        addHighlightGroup.name = 'add_highlight';
        addHighlightGroup.userData = { 
          isAddHighlight: true, 
          highlightUntil: isRecentlyAdded ? Date.now() + 1600 : 0 
        };

        const cageGeo = new THREE.BoxGeometry(compW * 1.03, compH * 1.05, compD * 1.03);
        const cageMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          wireframe: true,
          transparent: true,
          opacity: isRecentlyAdded ? 0.45 : 0
        });
        addHighlightGroup.add(new THREE.Mesh(cageGeo, cageMat));
        addHighlightGroup.visible = isRecentlyAdded;
        itemGroup.add(addHighlightGroup);

        const selGroup = new THREE.Group();
        selGroup.name = 'selection_highlight';
        selGroup.userData = { isSelectionHighlight: true };
        const selCageGeo = new THREE.BoxGeometry(compW * 1.03, compH * 1.05, compD * 1.03);
        const selCageMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.4
        });
        selGroup.add(new THREE.Mesh(selCageGeo, selCageMat));
        selGroup.visible = (highlightedComponentIdRef.current === compId);
        itemGroup.add(selGroup);

        compGroup.add(itemGroup);
      }
    });

  }, [mountedComponents, formFactor, isAssembling, chassisHeight, chassisWidth, chassisDepth]);

  // Fast selection highlight sync (Zero-lag traversal, no mesh tear-down)
  useEffect(() => {
    const compGroup = componentsGroupRef.current;
    if (!compGroup) return;

    compGroup.traverse((obj) => {
      if (obj.name === 'selection_highlight') {
        const parentCompId = obj.parent?.userData?.componentId;
        obj.visible = (parentCompId === highlightedComponentId);
      }
    });
  }, [highlightedComponentId]);

  // Vacated bay highlight & action toast trigger
  useEffect(() => {
    if (!lastAction) return;

    setActionBanner({
      type: lastAction.type,
      componentId: lastAction.componentId,
      componentName: lastAction.componentName || lastAction.componentId,
      timestamp: Date.now()
    });

    const bannerTimeout = setTimeout(() => {
      setActionBanner(null);
    }, 1800);

    if (lastAction.type === 'REMOVE') {
      const removalGroup = removalGroupRef.current;
      if (removalGroup) {
        const compId = lastAction.componentId;
        const lastPos = lastPositionsRef.current[compId] || { x: 0, y: 0, z: 0, w: 2.0, d: 2.0, h: 0.45 };

        const markerGroup = new THREE.Group();
        markerGroup.position.set(lastPos.x, lastPos.y, lastPos.z);

        const boxGeo = new THREE.BoxGeometry(lastPos.w * 1.03, lastPos.h || 0.45, lastPos.d * 1.03);
        const boxMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.45 });
        markerGroup.add(new THREE.Mesh(boxGeo, boxMat));

        removalGroup.add(markerGroup);

        activeRemovalMarkersRef.current.push({
          group: markerGroup,
          materials: [boxMat],
          geometries: [boxGeo],
          expiresAt: Date.now() + 1600,
          duration: 1600
        });
      }
    }

    return () => clearTimeout(bannerTimeout);
  }, [lastAction]);

  // Raycasting helper
  const raycastComponentId = (e) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !componentsGroupRef.current) return null;
    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    const intersects = raycaster.intersectObjects(componentsGroupRef.current.children, true);
    if (!intersects.length) return null;
    let obj = intersects[0].object;
    while (obj && !obj.userData?.componentId && obj.parent && obj.parent !== componentsGroupRef.current) {
      obj = obj.parent;
    }
    return obj?.userData?.componentId || null;
  };

  const handlePointerMove = (e) => {
    const compId = raycastComponentId(e);
    if (compId) {
      const compData = CUBESAT_COMPONENTS.find(c => c.id === compId);
      if (compData) {
        setHoveredComponent({ ...compData, screenX: e.clientX, screenY: e.clientY });
        return;
      }
    }
    setHoveredComponent(null);
  };

  const handlePointerLeave = () => setHoveredComponent(null);

  const handleClick = (e) => {
    if (!onSelectComponent) return;
    const compId = raycastComponentId(e);
    if (compId) onSelectComponent(compId);
  };

  const totalMounted = Object.values(mountedComponents).reduce((a, b) => a + b, 0);

  return (
    <div 
      className="w-full h-full relative select-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      <StudioCanvasOverlays
        actionBanner={actionBanner}
        hoveredComponent={hoveredComponent}
        totalMounted={totalMounted}
        formFactor={formFactor}
        onLoadPreset={onLoadPreset}
        isAssembling={isAssembling}
        isValidating={isValidating}
      />
    </div>
  );
}

