// src/components/SquaresScene.jsx
'use client'

import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

extend({ OrbitControls });

const SquaresScene = () => {
  return (
    <div className="row-span-1 row-start-1 -mt-9 aspect-square md:col-span-1 md:col-start-2 md:mt-0">
      <Canvas
      className="z-0"
        shadows
        camera={{ position: [0, 0, 8], fov: 75, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.1} />
        <directionalLight
          position={[0, 10, 0.5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
        />
        <directionalLight position={[0, 0, 4]} intensity={0.12} />
        <Squares />
        <Environment preset="sunset" />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

const Squares = () => {
  const squaresGroup = useRef();
  const squares = useRef([]);
  const pointer = useRef(new THREE.Vector2());
  const mousePos = useRef(new THREE.Vector3(20, 20, 0));
  const raycaster = useRef(new THREE.Raycaster());
  const Noise = useMemo(() => new ImprovedNoise(), []);
  const timeScale = 0.0005;
  
  const { camera } = useThree();

  const handlePointerMove = (event) => {
    pointer.current.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
  };

  useEffect(() => {
    document.addEventListener("mousemove", handlePointerMove);

    return () => {
      document.removeEventListener("mousemove", handlePointerMove);
    };
  }, []);

  useEffect(() => {
    const numCols = 50;
    const numRows = 26;
    const spacingX = 0.2;
    const spacingY = 0.4;
    const startX = -5;
    const startY = -5;
    let offsetY = 0;

    for (let i = 0; i < numCols; i += 1) {
      for (let j = 0; j < numRows; j += 1) {
        offsetY = (i % 2) * -spacingX;
        let square = getSquare({
          x: startX + i * spacingX,
          y: offsetY + startY + j * spacingY,
        });
        squares.current.push(square);
        squaresGroup.current.add(square.mesh);
      }
    }
  }, []);

  useFrame((state) => {
    handleRaycast();
    squares.current.forEach((square) =>
      square.update(state.clock.getElapsedTime())
    );
  });

  const handleRaycast = () => {
    raycaster.current.setFromCamera(pointer.current, camera);
    const intersects = raycaster.current.intersectObjects(
      squaresGroup.current.children,
      false
    );
    if (intersects.length > 0) {
      mousePos.current.copy(intersects[0].point);
    }
  };

  const getSquare = (pos) => {
    const { x, y } = pos;
    const z = 0;
    const material = new THREE.MeshStandardMaterial({
      color: 0xf0f0ff,
      flatShading: true,
      emissive: new THREE.Color(0x000000),
    });
    const sqLength = 0.2;
    const squareShape = new THREE.Shape()
      .moveTo(0, 0)
      .lineTo(0, sqLength)
      .lineTo(sqLength, sqLength)
      .lineTo(sqLength, 0)
      .lineTo(0, 0);
    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelSegments: 12,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.02,
    };
    const geometry = new THREE.ExtrudeGeometry(squareShape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.z = 45 * (Math.PI / 180);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const nFreq = 0.33;
    const nScale = 0.5;
    let emisiveIntensity = 0.0;

    const update = (t) => {
      const ns = Noise.noise(
        mesh.position.x * nFreq,
        mesh.position.y * nFreq,
        t
      );
      mesh.position.z = ns * nScale;
      const distance = mesh.position.distanceTo(mousePos.current);
      if (distance < 0.5) {
        let hue = (t * 0.1) % 1;
        mesh.material.color.setHSL(hue, 1.0, 0.5);
        mesh.material.emissive.setHSL(hue, 1.0, 0.5);
        emisiveIntensity = 0.5;
      } else {
        emisiveIntensity -= 0.005;
      }
      mesh.material.emissiveIntensity = Math.max(0.0, emisiveIntensity);
    };

    return { mesh, update };
  };

  return (
    <group ref={squaresGroup}>
      {squares.current.map((square, index) => (
        <primitive key={index} object={square.mesh} />
      ))}
    </group>
  );
};

export default SquaresScene;
