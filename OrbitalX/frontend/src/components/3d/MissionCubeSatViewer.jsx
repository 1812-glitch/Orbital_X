import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function MissionCubeSatViewer({
  formFactor = '3U',
  interactive = true,
  autoRotate = true,
  className = "w-full h-48"
}) {
  const mountRef = useRef(null);
  const animIdRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions for 1U up to 16U
    const is16U = formFactor === '16U';
    const is12U = formFactor === '12U';
    const is6U = formFactor === '6U';
    const is2U = formFactor === '2U';
    const is1U = formFactor === '1U';

    const w = (is16U || is12U || is6U) ? 3.0 : 1.6;
    const h = is16U ? 6.2 : (is12U || is6U || formFactor === '3U') ? 4.8 : is2U ? 3.2 : 1.6;
    const d = (is16U || is12U) ? 3.0 : 1.6;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    const camDist = is16U ? 14 : is12U ? 12 : is6U ? 10 : 8;
    camera.position.set(camDist * 0.7, camDist * 0.4, camDist * 0.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = interactive;
    controls.enableRotate = interactive;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.8;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0x00f0ff, 2.2);
    sun.position.set(5, 10, 7);
    scene.add(sun);

    const goldLight = new THREE.DirectionalLight(0xffb000, 1.5);
    goldLight.position.set(-5, -5, -5);
    scene.add(goldLight);

    // CubeSat Body Group
    const satGroup = new THREE.Group();
    scene.add(satGroup);

    // Chassis Box
    const busMat = new THREE.MeshStandardMaterial({ color: 0x141b2d, metalness: 0.85, roughness: 0.3 });
    const bus = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), busMat);
    satGroup.add(bus);

    // Gold Rail Edges
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
    const rThick = 0.07;
    [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([rx, rz]) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(rThick, h + 0.04, rThick), railMat);
      rail.position.set(rx, 0, rz);
      satGroup.add(rail);
    });

    // Dark blue silicon solar cells
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x051336,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x001533,
      emissiveIntensity: 0.5
    });
    const frontCell = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, h * 0.92, 0.02), cellMat);
    frontCell.position.set(0, 0, d / 2 + 0.015);
    satGroup.add(frontCell);

    const backCell = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, h * 0.92, 0.02), cellMat);
    backCell.position.set(0, 0, -d / 2 - 0.015);
    satGroup.add(backCell);

    // Symmetrical Deployable Solar Wings
    const wingW = d * 0.85;
    const wingH = h * 0.85;
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x071b38, metalness: 0.95, roughness: 0.2 });

    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(wingW * 1.6, wingH, 0.04), wingMat);
    leftWing.position.set(-w / 2 - (wingW * 1.6) / 2, 0, 0);
    satGroup.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(wingW * 1.6, wingH, 0.04), wingMat);
    rightWing.position.set(w / 2 + (wingW * 1.6) / 2, 0, 0);
    satGroup.add(rightWing);

    // Status LED
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    led.position.set(0, h / 2 + 0.08, 0);
    satGroup.add(led);

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
    };
  }, [formFactor, interactive, autoRotate]);

  return (
    <div className={`relative overflow-hidden rounded-lg bg-[#050810]/90 border border-gray-800 ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-2 left-2 pointer-events-none bg-[#0A0F1F]/80 backdrop-blur-md px-2 py-0.5 rounded border border-gray-800 font-mono text-[10px] text-[#00F0FF] flex items-center space-x-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
        <span>3D {formFactor} CUBESAT CAD</span>
      </div>
    </div>
  );
}
