'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Cabinet3D({ 
  ancho = 100, 
  alto = 240, 
  profundidad = 35 
}: {
  ancho: number;
  alto: number;
  profundidad: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rotationRef = useRef({ x: 0.05, y: 0.45 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5efe5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.3, 4.2);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.55);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff0d8, 1.1);
    directionalLight.position.set(4, 6, 3.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const handleStart = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      lastPosRef.current = { x: clientX, y: clientY };
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;
      const dx = clientX - lastPosRef.current.x;
      const dy = clientY - lastPosRef.current.y;
      rotationRef.current.y += dx * 0.008;
      rotationRef.current.x += dy * 0.006;
      rotationRef.current.x = Math.max(-0.25, Math.min(0.4, rotationRef.current.x));
      lastPosRef.current = { x: clientX, y: clientY };
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    renderer.domElement.addEventListener('mousedown', (e) =>
      handleStart(e.clientX, e.clientY)
    );
    window.addEventListener('mousemove', (e) =>
      handleMove(e.clientX, e.clientY)
    );
    window.addEventListener('mouseup', handleEnd);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const cabinetGroup = scene.getObjectByName('cabinet');
      if (cabinetGroup) {
        cabinetGroup.rotation.y = rotationRef.current.y;
        cabinetGroup.rotation.x = rotationRef.current.x;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.domElement.removeEventListener('mousedown', (e: any) =>
        handleStart(e.clientX, e.clientY)
      );
      window.removeEventListener('mousemove', (e: any) =>
        handleMove(e.clientX, e.clientY)
      );
      window.removeEventListener('mouseup', handleEnd);
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const oldCabinet = sceneRef.current.getObjectByName('cabinet');
    if (oldCabinet) {
      sceneRef.current.remove(oldCabinet);
      oldCabinet.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }

    const group = new THREE.Group();
    group.name = 'cabinet';

    const totalW = (ancho / 100) * 0.7;
    const h = (alto / 100) * 0.7;
    const d = (profundidad / 100) * 0.7;

    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f1e8,
      roughness: 0.42,
      metalness: 0.04,
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9cdb8,
      roughness: 0.78,
    });

    const wall = 0.018;

    const leftSide = new THREE.Mesh(
      new THREE.BoxGeometry(wall, h, d),
      sideMaterial
    );
    leftSide.position.x = -totalW / 2;
    leftSide.position.y = h / 2;
    leftSide.castShadow = true;
    group.add(leftSide);

    const rightSide = new THREE.Mesh(
      new THREE.BoxGeometry(wall, h, d),
      sideMaterial
    );
    rightSide.position.x = totalW / 2;
    rightSide.position.y = h / 2;
    rightSide.castShadow = true;
    group.add(rightSide);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(totalW - wall * 2, wall, d),
      sideMaterial
    );
    top.position.y = h - wall / 2;
    top.castShadow = true;
    group.add(top);

    const bottom = new THREE.Mesh(
      new THREE.BoxGeometry(totalW - wall * 2, wall, d),
      sideMaterial
    );
    bottom.position.y = wall / 2;
    group.add(bottom);

    const doorWidth = (totalW - wall * 2) / 2 - 0.01;
    const doorThickness = 0.018;

    const leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, h - wall * 2, doorThickness),
      doorMaterial
    );
    leftDoor.position.x = -doorWidth / 2 - 0.005;
    leftDoor.position.y = h / 2;
    leftDoor.position.z = d / 2 - doorThickness / 2;
    leftDoor.castShadow = true;
    group.add(leftDoor);

    const rightDoor = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, h - wall * 2, doorThickness),
      doorMaterial
    );
    rightDoor.position.x = doorWidth / 2 + 0.005;
    rightDoor.position.y = h / 2;
    rightDoor.position.z = d / 2 - doorThickness / 2;
    rightDoor.castShadow = true;
    group.add(rightDoor);

    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xb08d57,
      roughness: 0.28,
      metalness: 0.85,
    });

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.04, 16),
      handleMaterial
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.y = h * 0.45;
    handle.position.z = d / 2;
    handle.castShadow = true;
    group.add(handle);

    sceneRef.current.add(group);
  }, [ancho, alto, profundidad]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #F5EFE5 0%, #EBE2D2 100%)',
        cursor: 'grab',
      }}
    />
  );
}