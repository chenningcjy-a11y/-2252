import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ExerciseGuide, WorkoutPhase } from '../types';
import { 
  createCompressionFabricTexture, 
  createGymMatTexture, 
  createShoeSoleTexture 
} from '../utils/modelTextures';
import {
  createAnatomicalUpperArm,
  createAnatomicalForearm,
  createAnatomicalPalm,
  createAnatomicalFinger,
  createAnatomicalThigh,
  createAnatomicalCalf,
  createAnatomicalFoot,
  createSculptedRibcage,
  createSCurveClavicle,
  createSculptedAbdomen,
  createSculptedGluteus,
  createAnatomicalKneeAssembly
} from '../utils/anatomicalGeometries';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Flame, 
  Compass, 
  Sparkles,
  Activity,
  Layers,
  Play
} from 'lucide-react';

interface Human3DExerciseModelProps {
  exercise: ExerciseGuide;
  phase: WorkoutPhase;
  currentSide: 'A' | 'B';
  currentRep: number;
  totalRepsCurrentSide: number;
  repSubPhase: 'extend' | 'hold' | 'return' | 'ready';
  timeRemaining: number;
}

type CameraPreset = 'side' | 'isometric' | 'top' | 'front';

export const Human3DExerciseModel: React.FC<Human3DExerciseModelProps> = ({
  exercise,
  phase,
  currentSide,
  currentRep,
  totalRepsCurrentSide,
  repSubPhase,
  timeRemaining,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js Scene & Object References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterRootRef = useRef<THREE.Group | null>(null);

  // Special visual overlays
  const coreAuraRef = useRef<THREE.Mesh | null>(null);
  const gluteAuraRef = useRef<THREE.Mesh | null>(null);
  const obliqueAuraRef = useRef<THREE.Mesh | null>(null);
  const spineLaserLineRef = useRef<THREE.Line | null>(null);

  // Materials map for toggling X-Ray / Wireframe modes
  const materialsRef = useRef<THREE.Material[]>([]);

  // Limb hierarchy nodes references for 1:1 biomechanical kinematics
  const limbsRef = useRef<{
    torsoGroup: THREE.Group;
    chestGroup: THREE.Group;
    pelvisGroup: THREE.Group;
    headGroup: THREE.Group;
    neckGroup: THREE.Group;
    leftClavicle: THREE.Group;
    leftShoulder: THREE.Group;
    leftElbow: THREE.Group;
    leftWrist: THREE.Group;
    rightClavicle: THREE.Group;
    rightShoulder: THREE.Group;
    rightElbow: THREE.Group;
    rightWrist: THREE.Group;
    leftHip: THREE.Group;
    leftKnee: THREE.Group;
    leftAnkle: THREE.Group;
    rightHip: THREE.Group;
    rightKnee: THREE.Group;
    rightAnkle: THREE.Group;
  } | null>(null);

  // Camera & interaction state
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [showMuscleAura, setShowMuscleAura] = useState<boolean>(true);
  const [showSpineAxis, setShowSpineAxis] = useState<boolean>(true);
  const [isWireframeMode, setIsWireframeMode] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Target kinematics values for continuous smooth interpolation (damping)
  const currentPoseRef = useRef({
    rootY: 0,
    rootRotX: 0,
    rootRotY: 0,
    rootRotZ: 0,
    pelvisRotX: 0,
    pelvisPosZ: 0,
    torsoRotX: 0,
    headRotX: 0,
    lShoulderX: 0,
    lShoulderZ: 0,
    lElbowX: 0,
    rShoulderX: 0,
    rShoulderZ: 0,
    rElbowX: 0,
    lHipX: 0,
    lKneeX: 0,
    rHipX: 0,
    rKneeX: 0,
  });

  const targetPoseRef = useRef({ ...currentPoseRef.current });

  // Orbit control tracking refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 4.5, theta: Math.PI / 4, phi: Math.PI / 3.1 });

  const isDeadBug = exercise.id === 'dead-bug';
  const isBirdDog = exercise.id === 'bird-dog';
  const isPlank = exercise.id === 'plank';
  const isSidePlank = exercise.id === 'side-plank';
  const isGluteBridge = exercise.id === 'glute-bridge';

  // Real-time Sub-phase Guidance Text
  const getSubPhaseLabel = () => {
    if (phase === 'prep_countdown') return '准备姿势就位，深吸气收紧下腹';
    if (phase === 'switch_side_prep') return '🔄 换边就绪，对侧核心动力链激活';
    if (phase === 'resting') return '💆 组间休息，调整深长腹式呼吸';
    if (phase === 'manual_next_wait') return '🎉 本项训练全部完成！';

    if (isPlank) return '🔥 腹横肌环形收紧，维持头-脊椎-足跟三点一线';
    if (isSidePlank) return currentSide === 'A' ? '🔥 侧向动力链激活：支撑侧腹全力顶起（侧A）' : '🔥 侧向动力链激活：支撑侧腹全力顶起（侧B）';

    switch (repSubPhase) {
      case 'extend':
        return '缓慢对角伸展 · 感受对角筋膜张力（呼气）';
      case 'hold':
        return '顶峰悬停 1-2秒 · 保持躯干如磐石静止';
      case 'return':
        return '平稳离心还原 · 避免腰椎代偿（吸气）';
      default:
        return '3D生物力学解剖学模型运作中';
    }
  };

  // Camera preset application
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    let theta = Math.PI / 4;
    let phi = Math.PI / 3.1;
    let radius = 4.5;

    if (preset === 'side') {
      // 90 degree sagittal side view (inspecting lumbar curvature & neutrality)
      theta = Math.PI / 2;
      phi = Math.PI / 2.25;
      radius = 4.3;
    } else if (preset === 'isometric') {
      // 45 degree isometric perspective
      theta = Math.PI / 4;
      phi = Math.PI / 3.0;
      radius = 4.5;
    } else if (preset === 'top') {
      // Top-down coronal view (contralateral alignment & spinal straightness)
      theta = Math.PI / 4;
      phi = 0.12;
      radius = 4.7;
    } else if (preset === 'front') {
      // Frontal close-up
      theta = 0;
      phi = Math.PI / 2.3;
      radius = 4.1;
    }

    cameraSphericalRef.current = { radius: radius * (1 / zoomLevel), theta, phi };
    updateCameraPosition();
  }, [zoomLevel]);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    
    // Focus target height based on exercise type
    const targetY = isDeadBug || isGluteBridge ? 0.35 : isPlank || isSidePlank ? 0.42 : 0.58;
    
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi) + targetY;
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, targetY, 0);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => {
      const next = Math.max(0.65, Math.min(1.85, prev + delta));
      cameraSphericalRef.current.radius = (4.5 / next);
      updateCameraPosition();
      return next;
    });
  };

  // Toggle Wireframe / X-Ray Mode
  const toggleWireframe = () => {
    const nextState = !isWireframeMode;
    setIsWireframeMode(nextState);
    materialsRef.current.forEach(mat => {
      if ('wireframe' in mat) {
        (mat as THREE.MeshStandardMaterial).wireframe = nextState;
      }
    });
  };

  // Build Scene, High-Density Mannequin, PBR Materials & Shaders
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const height = containerRef.current.clientHeight || 270;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer with PCF Soft Shadows & Antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting Rig (High-end Athletic Studio 4-Point Lighting)
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.95);
    scene.add(ambientLight);

    // Warm Sun Key Light (casts crisp yet soft anatomically grounding shadows)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    keyLight.position.set(4, 7, 4.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.0008;
    scene.add(keyLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    fillLight.position.set(-4, 4, -2.5);
    scene.add(fillLight);

    // Rim Silhouette Light (Chiseled muscular outline)
    const rimLight = new THREE.DirectionalLight(0x0284c7, 0.8);
    rimLight.position.set(0, -1, -4.5);
    scene.add(rimLight);

    // Subtle Ground Bounce Light
    const bounceLight = new THREE.DirectionalLight(0x0ea5e9, 0.35);
    bounceLight.position.set(0, -3, 2);
    scene.add(bounceLight);

    // 5. Environment: Pedestal & High-Traction Gym Training Mat
    // Studio circular pedestal
    const pedestalGeo = new THREE.CylinderGeometry(2.5, 2.6, 0.08, 64);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.15,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.04;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // High-Traction Training Mat with Biomechanical Alignment Markings
    const matGroup = new THREE.Group();
    const matGeo = new THREE.BoxGeometry(1.28, 0.035, 2.55);
    const matTexture = createGymMatTexture();
    const matMat = new THREE.MeshStandardMaterial({
      map: matTexture,
      roughness: 0.6,
      metalness: 0.08,
    });
    const matMesh = new THREE.Mesh(matGeo, matMat);
    matMesh.position.y = 0.018;
    matMesh.receiveShadow = true;
    matGroup.add(matMesh);
    scene.add(matGroup);

    // 6. High-Definition Anatomical Materials
    const compressionFabricTex = createCompressionFabricTexture();
    const shoeSoleTex = createShoeSoleTexture();

    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xebba9e, // Natural healthy human skin tone
      roughness: 0.44,
      metalness: 0.0,
      clearcoat: 0.06,
      clearcoatRoughness: 0.3,
      sheen: 0.32,
      sheenColor: new THREE.Color(0xffcca8), // Warm epidermal subsurface scattering sheen
    });

    const compressionTopMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark navy high-tech compression shirt
      bumpMap: compressionFabricTex,
      bumpScale: 0.02,
      roughness: 0.55,
      metalness: 0.12,
    });

    const compressionShortsMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, // Matte charcoal compression shorts
      roughness: 0.7,
      metalness: 0.05,
    });

    const muscleAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Ergonomic athletic piping
      roughness: 0.3,
      metalness: 0.4,
    });

    const jointTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Joint hubs
      roughness: 0.35,
      metalness: 0.6,
    });

    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Fitness grip glove
      roughness: 0.6,
      metalness: 0.2,
    });

    const shoeUpperMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // High-performance sneaker upper
      roughness: 0.4,
      metalness: 0.1,
    });

    const shoeMidsoleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // EVA foam midsole
      roughness: 0.7,
    });

    const shoeSoleMat = new THREE.MeshStandardMaterial({
      map: shoeSoleTex,
      roughness: 0.6,
    });

    const headbandMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.8,
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.9,
    });

    // Store materials for wireframe toggle
    materialsRef.current = [
      skinMat, 
      compressionTopMat, 
      compressionShortsMat, 
      muscleAccentMat, 
      jointTitaniumMat, 
      gloveMat, 
      shoeUpperMat, 
      shoeMidsoleMat, 
      headbandMat, 
      visorMat
    ];

    // 7. ULTRA-FINE 3D ANATOMICAL HUMAN MANNEQUIN
    const characterRoot = new THREE.Group();
    characterRootRef.current = characterRoot;
    scene.add(characterRoot);

    // Anatomical Root Node Hierarchy
    const pelvisGroup = new THREE.Group();
    const torsoGroup = new THREE.Group();
    const chestGroup = new THREE.Group();
    const neckGroup = new THREE.Group();
    const headGroup = new THREE.Group();

    const leftClavicle = new THREE.Group();
    const leftShoulder = new THREE.Group();
    const leftElbow = new THREE.Group();
    const leftWrist = new THREE.Group();

    const rightClavicle = new THREE.Group();
    const rightShoulder = new THREE.Group();
    const rightElbow = new THREE.Group();
    const rightWrist = new THREE.Group();

    const leftHip = new THREE.Group();
    const leftKnee = new THREE.Group();
    const leftAnkle = new THREE.Group();

    const rightHip = new THREE.Group();
    const rightKnee = new THREE.Group();
    const rightAnkle = new THREE.Group();

    characterRoot.add(pelvisGroup);

    // ==========================================
    // A. PELVIS & GLUTEAL ANATOMY
    // ==========================================
    // Pelvis Core Block
    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.170, 0.18, 32), compressionShortsMat);
    pelvisMesh.castShadow = true;
    pelvisGroup.add(pelvisMesh);

    // Ergonomic Waistband with compression piping
    const waistbandMesh = new THREE.Mesh(new THREE.TorusGeometry(0.182, 0.012, 16, 32), muscleAccentMat);
    waistbandMesh.rotation.x = Math.PI / 2;
    waistbandMesh.position.y = 0.08;
    pelvisGroup.add(waistbandMesh);

    // Anatomically Sculpted Gluteus Maximus (Dual muscle lobes on posterior pelvis)
    const gluteLeftGeo = createSculptedGluteus(true);
    const gluteLeft = new THREE.Mesh(gluteLeftGeo, compressionShortsMat);
    gluteLeft.position.set(-0.082, -0.025, 0.075);
    gluteLeft.castShadow = true;
    pelvisGroup.add(gluteLeft);

    const gluteRightGeo = createSculptedGluteus(false);
    const gluteRight = new THREE.Mesh(gluteRightGeo, compressionShortsMat);
    gluteRight.position.set(0.082, -0.025, 0.075);
    gluteRight.castShadow = true;
    pelvisGroup.add(gluteRight);

    // Connect Torso to Pelvis (Lumbar-Pelvic connection)
    pelvisGroup.add(torsoGroup);
    torsoGroup.position.y = 0.11;

    // ==========================================
    // B. ABDOMINAL WALL & CORE ANATOMY (6-PACK, OBLIQUES, LINEA ALBA)
    // ==========================================
    // Lower Torso / Core Trunk with unified biological musculature
    const abdomenGeo = createSculptedAbdomen();
    const abdomenMesh = new THREE.Mesh(abdomenGeo, compressionTopMat);
    abdomenMesh.position.y = 0.095;
    abdomenMesh.castShadow = true;
    torsoGroup.add(abdomenMesh);

    // Dynamic Core Tension Aura (Glowing abdominal ring during core engagement)
    const coreAuraGeo = new THREE.CylinderGeometry(0.24, 0.23, 0.28, 32);
    const coreAuraMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald core activation glow
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const coreAura = new THREE.Mesh(coreAuraGeo, coreAuraMat);
    coreAura.position.y = 0.12;
    torsoGroup.add(coreAura);
    coreAuraRef.current = coreAura;

    // Glute Tension Aura
    const gluteAuraGeo = new THREE.SphereGeometry(0.25, 18, 18);
    const gluteAuraMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e, // Rose glow for glute activation
      transparent: true,
      opacity: 0.3,
      wireframe: true,
    });
    const gluteAura = new THREE.Mesh(gluteAuraGeo, gluteAuraMat);
    gluteAura.position.set(0, -0.04, 0.09);
    pelvisGroup.add(gluteAura);
    gluteAuraRef.current = gluteAura;

    // Oblique Lateral Tension Aura
    const obliqueAuraGeo = new THREE.TorusGeometry(0.24, 0.04, 12, 32);
    const obliqueAuraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Sky blue glow for side chain
      transparent: true,
      opacity: 0.3,
      wireframe: true,
    });
    const obliqueAura = new THREE.Mesh(obliqueAuraGeo, obliqueAuraMat);
    obliqueAura.rotation.x = Math.PI / 2;
    obliqueAura.position.y = 0.08;
    torsoGroup.add(obliqueAura);
    obliqueAuraRef.current = obliqueAura;

    // ==========================================
    // C. CHEST, PECTORALS, LATS & UPPER BACK
    // ==========================================
    torsoGroup.add(chestGroup);
    chestGroup.position.y = 0.18;

    // Thoracic Ribcage with sculpted pectorals, sternal groove, and latissimus V-taper
    const ribcageGeo = createSculptedRibcage();
    const ribcageMesh = new THREE.Mesh(ribcageGeo, compressionTopMat);
    ribcageMesh.position.y = 0.135;
    ribcageMesh.castShadow = true;
    chestGroup.add(ribcageMesh);

    // Anatomical S-Curve Clavicles (Collarbones)
    const clavLeftGeo = createSCurveClavicle(true);
    const clavLeft = new THREE.Mesh(clavLeftGeo, muscleAccentMat);
    clavLeft.position.set(0, 0.25, -0.125);
    chestGroup.add(clavLeft);

    const clavRightGeo = createSCurveClavicle(false);
    const clavRight = new THREE.Mesh(clavRightGeo, muscleAccentMat);
    clavRight.position.set(0, 0.25, -0.125);
    chestGroup.add(clavRight);

    // ==========================================
    // D. NECK, HEAD & ATHLETIC FACIAL FEATURES
    // ==========================================
    chestGroup.add(neckGroup);
    neckGroup.position.y = 0.26;

    // Muscular Neck with Bilateral Sternocleidomastoids
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.088, 0.12, 24), skinMat);
    neckMesh.position.y = 0.05;
    neckMesh.castShadow = true;
    neckGroup.add(neckMesh);

    // Left & Right Sternocleidomastoid muscle columns
    const scmGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.11, 10);
    const scmLeft = new THREE.Mesh(scmGeo, skinMat);
    scmLeft.position.set(-0.032, 0.05, -0.045);
    scmLeft.rotation.set(0.12, 0, -0.22);
    neckGroup.add(scmLeft);

    const scmRight = new THREE.Mesh(scmGeo, skinMat);
    scmRight.position.set(0.032, 0.05, -0.045);
    scmRight.rotation.set(0.12, 0, 0.22);
    neckGroup.add(scmRight);

    neckGroup.add(headGroup);
    headGroup.position.y = 0.12;

    // Cranium with refined human proportions
    const craniumGeo = new THREE.SphereGeometry(0.125, 24, 24);
    craniumGeo.scale(0.96, 1.15, 1.08);
    const craniumMesh = new THREE.Mesh(craniumGeo, skinMat);
    craniumMesh.position.y = 0.08;
    craniumMesh.castShadow = true;
    headGroup.add(craniumMesh);

    // Sculpted Jawline & Chin
    const chinGeo = new THREE.ConeGeometry(0.065, 0.08, 12);
    chinGeo.scale(1.2, 0.9, 0.9);
    const chinMesh = new THREE.Mesh(chinGeo, skinMat);
    chinMesh.rotation.x = Math.PI;
    chinMesh.position.set(0, 0.01, -0.06);
    headGroup.add(chinMesh);

    // Subtle Human Lips & Philtrum contour
    const lipsGeo = new THREE.BoxGeometry(0.042, 0.015, 0.018);
    const lipsMesh = new THREE.Mesh(lipsGeo, skinMat);
    lipsMesh.position.set(0, 0.024, -0.128);
    headGroup.add(lipsMesh);

    // Athletic Haircut / Textured Cap
    const hairGeo = new THREE.SphereGeometry(0.13, 20, 20, 0, Math.PI * 2, 0, Math.PI / 1.6);
    hairGeo.scale(0.98, 1.12, 1.05);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.y = 0.11;
    headGroup.add(hairMesh);

    // Athletic Pro Sweatband
    const sweatbandGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.03, 24);
    const sweatband = new THREE.Mesh(sweatbandGeo, headbandMat);
    sweatband.position.y = 0.11;
    headGroup.add(sweatband);

    // Pro Athletic Visor / Sport Glasses
    const visorGeo = new THREE.BoxGeometry(0.15, 0.038, 0.07);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.08, -0.115);
    headGroup.add(visor);

    // Refined Nose Bridge
    const noseGeo = new THREE.ConeGeometry(0.024, 0.05, 8);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0.06, -0.138);
    headGroup.add(nose);

    // Anatomical Ears (Left & Right)
    const earGeo = new THREE.BoxGeometry(0.02, 0.055, 0.035);
    const earLeft = new THREE.Mesh(earGeo, skinMat);
    earLeft.position.set(-0.125, 0.07, 0.01);
    headGroup.add(earLeft);

    const earRight = new THREE.Mesh(earGeo, skinMat);
    earRight.position.set(0.125, 0.07, 0.01);
    headGroup.add(earRight);

    // ==========================================
    // E. ARMS & HANDS WITH ARTICULATED FINGERS & MUSCULAR CONTOURS
    // ==========================================
    // Helper to build high-definition human arm
    const buildArm = (isLeft: boolean) => {
      const side = isLeft ? -1 : 1;

      const clavicleNode = isLeft ? leftClavicle : rightClavicle;
      const shoulderNode = isLeft ? leftShoulder : rightShoulder;
      const elbowNode = isLeft ? leftElbow : rightElbow;
      const wristNode = isLeft ? leftWrist : rightWrist;

      chestGroup.add(clavicleNode);
      clavicleNode.position.set(side * 0.12, 0.24, 0);

      clavicleNode.add(shoulderNode);
      shoulderNode.position.set(side * 0.14, 0, 0);

      // Anatomical 3-Head Deltoid Wrap (Anterior, Medial, Posterior)
      const deltoidGroup = new THREE.Group();
      // Deltoid muscle body wrapping over the humerus head
      const deltoidMainGeo = new THREE.SphereGeometry(0.075, 24, 20);
      deltoidMainGeo.scale(0.88, 1.30, 0.96);
      const deltoidMain = new THREE.Mesh(deltoidMainGeo, compressionTopMat);
      deltoidMain.position.set(side * 0.015, -0.02, 0);
      deltoidGroup.add(deltoidMain);

      // Anterior Deltoid Head (front)
      const antDeltGeo = new THREE.SphereGeometry(0.052, 16, 16);
      antDeltGeo.scale(0.9, 1.2, 0.85);
      const antDelt = new THREE.Mesh(antDeltGeo, compressionTopMat);
      antDelt.position.set(side * 0.012, -0.03, -0.032);
      deltoidGroup.add(antDelt);

      // Posterior Deltoid Head (back)
      const postDelt = new THREE.Mesh(antDeltGeo, compressionTopMat);
      postDelt.position.set(side * 0.012, -0.03, 0.032);
      deltoidGroup.add(postDelt);

      shoulderNode.add(deltoidGroup);

      // Anatomical Upper Arm (Brachium with Biceps belly & Triceps horseshoe)
      const upperArmGeo = createAnatomicalUpperArm(isLeft);
      const upperArm = new THREE.Mesh(upperArmGeo, skinMat);
      upperArm.castShadow = true;
      shoulderNode.add(upperArm);

      // Elbow Joint Node with Olecranon Process (posterior elbow tip)
      shoulderNode.add(elbowNode);
      elbowNode.position.set(0, -0.28, 0);

      const olecranonGeo = new THREE.SphereGeometry(0.034, 16, 16);
      olecranonGeo.scale(0.9, 0.8, 1.3);
      const olecranon = new THREE.Mesh(olecranonGeo, skinMat);
      olecranon.position.set(0, 0, 0.024);
      elbowNode.add(olecranon);

      // Anatomical Forearm (Antebrachium with Brachioradialis flare & wrist taper)
      const forearmGeo = createAnatomicalForearm(isLeft);
      const forearm = new THREE.Mesh(forearmGeo, skinMat);
      forearm.castShadow = true;
      elbowNode.add(forearm);

      // Wrist Node with Biometric Fitness Tracker Band
      elbowNode.add(wristNode);
      wristNode.position.set(0, -0.26, 0);

      const wristband = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.022, 20), muscleAccentMat);
      wristNode.add(wristband);

      // Anatomical Hand with Thenar/Hypothenar pads & Articulated Digits
      const handGroup = new THREE.Group();
      
      // Palm with biological thenar and hypothenar mounds
      const palmGeo = createAnatomicalPalm(isLeft);
      const palmMesh = new THREE.Mesh(palmGeo, skinMat);
      palmMesh.castShadow = true;
      handGroup.add(palmMesh);

      // Opposable Anatomical Thumb (2-segment with thumb pad)
      const thumbBase = new THREE.Group();
      thumbBase.position.set(side * 0.032, -0.022, -0.014);
      thumbBase.rotation.set(0.3, -side * 0.4, side * 0.45);

      const thumbProximalGeo = createAnatomicalFinger(0.024, 0.010);
      const thumbProximal = new THREE.Mesh(thumbProximalGeo, skinMat);
      thumbBase.add(thumbProximal);

      const thumbDistalGeo = createAnatomicalFinger(0.020, 0.009);
      const thumbDistal = new THREE.Mesh(thumbDistalGeo, skinMat);
      thumbDistal.position.set(0, -0.024, 0);
      thumbDistal.rotation.x = 0.25; // natural thumb flexion
      thumbBase.add(thumbDistal);
      handGroup.add(thumbBase);

      // 4 Individually Sculpted Human Fingers (Index, Middle, Ring, Pinky)
      const fingerSpecs = [
        { xOffset: side * 0.021, length: 0.041, thickness: 0.0085, curl: 0.18 }, // Index
        { xOffset: side * 0.007, length: 0.046, thickness: 0.0090, curl: 0.16 }, // Middle (longest)
        { xOffset: -side * 0.007, length: 0.042, thickness: 0.0086, curl: 0.20 }, // Ring
        { xOffset: -side * 0.021, length: 0.033, thickness: 0.0076, curl: 0.24 }, // Pinky
      ];

      fingerSpecs.forEach((spec) => {
        const fingerNode = new THREE.Group();
        fingerNode.position.set(spec.xOffset, -0.082, 0);
        fingerNode.rotation.x = spec.curl; // Relaxed natural finger resting curve

        // Proximal & intermediate phalanx
        const phalanx1Geo = createAnatomicalFinger(spec.length * 0.58, spec.thickness);
        const phalanx1 = new THREE.Mesh(phalanx1Geo, skinMat);
        phalanx1.castShadow = true;
        fingerNode.add(phalanx1);

        // Distal phalanx with finger pad
        const phalanx2Geo = createAnatomicalFinger(spec.length * 0.42, spec.thickness * 0.88);
        const phalanx2 = new THREE.Mesh(phalanx2Geo, skinMat);
        phalanx2.position.set(0, -spec.length * 0.58, 0);
        phalanx2.rotation.x = spec.curl * 0.8; // additional distal curl
        phalanx2.castShadow = true;
        fingerNode.add(phalanx2);

        handGroup.add(fingerNode);
      });

      wristNode.add(handGroup);
    };

    buildArm(true);
    buildArm(false);

    // ==========================================
    // F. LEGS: ANATOMICAL QUADS, VMO TEARDROP, CALVES & FEET
    // ==========================================
    const buildLeg = (isLeft: boolean) => {
      const side = isLeft ? -1 : 1;

      const hipNode = isLeft ? leftHip : rightHip;
      const kneeNode = isLeft ? leftKnee : rightKnee;
      const ankleNode = isLeft ? leftAnkle : rightAnkle;

      pelvisGroup.add(hipNode);
      hipNode.position.set(side * 0.115, -0.08, 0);

      // Smooth Anatomical Hip Cap
      const hipCapGeo = new THREE.SphereGeometry(0.080, 20, 20);
      const hipCap = new THREE.Mesh(hipCapGeo, compressionShortsMat);
      hipNode.add(hipCap);

      // Anatomical Thigh (Quadriceps, Vastus Medialis Oblique Teardrop, Hamstrings)
      const thighGeo = createAnatomicalThigh(isLeft);
      const thigh = new THREE.Mesh(thighGeo, skinMat);
      thigh.castShadow = true;
      hipNode.add(thigh);

      // Knee Joint Node with Anatomical Patella & Patellar Ligament
      hipNode.add(kneeNode);
      kneeNode.position.set(0, -0.40, 0);

      const kneeAssembly = createAnatomicalKneeAssembly();
      kneeNode.add(kneeAssembly);

      // Popliteal fossa back cushion
      const poplitealGeo = new THREE.SphereGeometry(0.042, 16, 16);
      poplitealGeo.scale(0.9, 0.9, 0.7);
      const poplitealMesh = new THREE.Mesh(poplitealGeo, skinMat);
      poplitealMesh.position.set(0, 0, 0.026);
      kneeNode.add(poplitealMesh);

      // Anatomical Calf (Asymmetric Twin Gastrocnemius, Tibial Crest & Achilles Tendon)
      const calfGeo = createAnatomicalCalf(isLeft);
      const calf = new THREE.Mesh(calfGeo, skinMat);
      calf.castShadow = true;
      kneeNode.add(calf);

      // Ankle Node with Asymmetric Malleoli
      kneeNode.add(ankleNode);
      ankleNode.position.set(0, -0.38, 0);

      // Anatomical Foot with Medial Arch, Calcaneus Heel, and Toes
      const footGeo = createAnatomicalFoot(isLeft);
      const footMesh = new THREE.Mesh(footGeo, skinMat);
      footMesh.castShadow = true;
      ankleNode.add(footMesh);

      // High-Performance Cross-Training Sneaker / Ergonomic Cushioned Sole
      const shoeGroup = new THREE.Group();

      // Ergonomic EVA Foam Cushioned Midsole contoured to the human foot arch
      const midsoleGeo = new THREE.BoxGeometry(0.098, 0.032, 0.23);
      midsoleGeo.translate(0, -0.048, -0.05);
      const midsole = new THREE.Mesh(midsoleGeo, shoeMidsoleMat);
      midsole.castShadow = true;
      shoeGroup.add(midsole);

      // High-Traction Outsole with tread pattern
      const outsoleGeo = new THREE.BoxGeometry(0.100, 0.012, 0.235);
      outsoleGeo.translate(0, -0.068, -0.05);
      const outsole = new THREE.Mesh(outsoleGeo, shoeSoleMat);
      shoeGroup.add(outsole);

      // Dynamic Athletic Sneaker Counter & Heel Wrap
      const heelWrapGeo = new THREE.CylinderGeometry(0.046, 0.048, 0.05, 16, 1, false, 0, Math.PI);
      heelWrapGeo.rotateY(Math.PI / 2);
      heelWrapGeo.translate(0, -0.02, 0.055);
      const heelWrap = new THREE.Mesh(heelWrapGeo, shoeUpperMat);
      shoeGroup.add(heelWrap);

      // Dynamic Athletic Accent Stripe
      const stripeGeo = new THREE.BoxGeometry(0.102, 0.010, 0.12);
      stripeGeo.translate(0, -0.046, -0.05);
      const stripe = new THREE.Mesh(stripeGeo, muscleAccentMat);
      shoeGroup.add(stripe);

      ankleNode.add(shoeGroup);
    };

    buildLeg(true);
    buildLeg(false);

    // ==========================================
    // G. BIOMECHANICAL AXIS LASER (SPINAL NEUTRALITY GUIDE)
    // ==========================================
    const spineLaserPoints = [
      new THREE.Vector3(0, 0.52, 0), // Head vertex
      new THREE.Vector3(0, 0.40, 0), // C7 Cervical
      new THREE.Vector3(0, 0.22, 0), // T12 Thoracic
      new THREE.Vector3(0, 0.08, 0), // L5 Lumbar
      new THREE.Vector3(0, -0.08, 0), // Sacrum / Coccyx
    ];
    const spineLaserGeo = new THREE.BufferGeometry().setFromPoints(spineLaserPoints);
    const spineLaserMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    const spineLaserLine = new THREE.Line(spineLaserGeo, spineLaserMat);
    torsoGroup.add(spineLaserLine);
    spineLaserLineRef.current = spineLaserLine;

    // Save limbs hierarchy references
    limbsRef.current = {
      torsoGroup,
      chestGroup,
      pelvisGroup,
      headGroup,
      neckGroup,
      leftClavicle,
      leftShoulder,
      leftElbow,
      leftWrist,
      rightClavicle,
      rightShoulder,
      rightElbow,
      rightWrist,
      leftHip,
      leftKnee,
      leftAnkle,
      rightHip,
      rightKnee,
      rightAnkle,
    };

    // ==========================================
    // H. RENDER & ANIMATION LOOP WITH SMOOTH LERP
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera auto-orbit if enabled
      if (autoRotate && !isDraggingRef.current) {
        cameraSphericalRef.current.theta += 0.005;
        updateCameraPosition();
      }

      // Smooth kinematic damping (exponential lerp for organic, lifelike transitions)
      const current = currentPoseRef.current;
      const target = targetPoseRef.current;
      const smoothFactor = 0.085;

      current.rootY = THREE.MathUtils.lerp(current.rootY, target.rootY, smoothFactor);
      current.rootRotX = THREE.MathUtils.lerp(current.rootRotX, target.rootRotX, smoothFactor);
      current.rootRotY = THREE.MathUtils.lerp(current.rootRotY, target.rootRotY, smoothFactor);
      current.rootRotZ = THREE.MathUtils.lerp(current.rootRotZ, target.rootRotZ, smoothFactor);

      current.pelvisRotX = THREE.MathUtils.lerp(current.pelvisRotX, target.pelvisRotX, smoothFactor);
      current.pelvisPosZ = THREE.MathUtils.lerp(current.pelvisPosZ, target.pelvisPosZ, smoothFactor);
      current.torsoRotX = THREE.MathUtils.lerp(current.torsoRotX, target.torsoRotX, smoothFactor);
      current.headRotX = THREE.MathUtils.lerp(current.headRotX, target.headRotX, smoothFactor);

      current.lShoulderX = THREE.MathUtils.lerp(current.lShoulderX, target.lShoulderX, smoothFactor);
      current.lShoulderZ = THREE.MathUtils.lerp(current.lShoulderZ, target.lShoulderZ, smoothFactor);
      current.lElbowX = THREE.MathUtils.lerp(current.lElbowX, target.lElbowX, smoothFactor);

      current.rShoulderX = THREE.MathUtils.lerp(current.rShoulderX, target.rShoulderX, smoothFactor);
      current.rShoulderZ = THREE.MathUtils.lerp(current.rShoulderZ, target.rShoulderZ, smoothFactor);
      current.rElbowX = THREE.MathUtils.lerp(current.rElbowX, target.rElbowX, smoothFactor);

      current.lHipX = THREE.MathUtils.lerp(current.lHipX, target.lHipX, smoothFactor);
      current.lKneeX = THREE.MathUtils.lerp(current.lKneeX, target.lKneeX, smoothFactor);
      current.rHipX = THREE.MathUtils.lerp(current.rHipX, target.rHipX, smoothFactor);
      current.rKneeX = THREE.MathUtils.lerp(current.rKneeX, target.rKneeX, smoothFactor);

      // Micro-breathing oscillation (subtle chest heave to simulate vital respiration)
      const breathingOsc = Math.sin(elapsedTime * 2.8) * 0.012;

      // Apply to Three.js Object Nodes
      if (characterRootRef.current && limbsRef.current) {
        const limbs = limbsRef.current;
        characterRootRef.current.position.set(0, current.rootY, 0);
        characterRootRef.current.rotation.set(current.rootRotX, current.rootRotY, current.rootRotZ);

        limbs.pelvisGroup.position.z = current.pelvisPosZ;
        limbs.pelvisGroup.rotation.x = current.pelvisRotX;
        limbs.torsoGroup.rotation.x = current.torsoRotX;
        limbs.chestGroup.scale.set(1 + breathingOsc, 1, 1 + breathingOsc);
        limbs.headGroup.rotation.x = current.headRotX;

        limbs.leftShoulder.rotation.set(current.lShoulderX, 0, current.lShoulderZ);
        limbs.leftElbow.rotation.set(current.lElbowX, 0, 0);

        limbs.rightShoulder.rotation.set(current.rShoulderX, 0, current.rShoulderZ);
        limbs.rightElbow.rotation.set(current.rElbowX, 0, 0);

        limbs.leftHip.rotation.set(current.lHipX, 0, 0);
        limbs.leftKnee.rotation.set(current.lKneeX, 0, 0);

        limbs.rightHip.rotation.set(current.rHipX, 0, 0);
        limbs.rightKnee.rotation.set(current.rKneeX, 0, 0);
      }

      // Pulse muscle auras
      if (coreAuraRef.current) {
        coreAuraRef.current.visible = showMuscleAura;
        const scale = 1 + Math.sin(elapsedTime * 4.2) * 0.035;
        coreAuraRef.current.scale.set(scale, 1, scale);
      }

      if (gluteAuraRef.current) {
        gluteAuraRef.current.visible = showMuscleAura && (isGluteBridge || isPlank || isBirdDog);
        const scale = 1 + Math.sin(elapsedTime * 3.8) * 0.045;
        gluteAuraRef.current.scale.set(scale, scale, scale);
      }

      if (obliqueAuraRef.current) {
        obliqueAuraRef.current.visible = showMuscleAura && isSidePlank;
        const scale = 1 + Math.sin(elapsedTime * 4.5) * 0.04;
        obliqueAuraRef.current.scale.set(scale, scale, scale);
      }

      if (spineLaserLineRef.current) {
        spineLaserLineRef.current.visible = showSpineAxis;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler with ResizeObserver support
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 280;
      if (w === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Update Biomechanical Kinematics of the 3D Athletic Model
  useEffect(() => {
    const target = targetPoseRef.current;

    // Reset base pose values
    target.rootY = 0;
    target.rootRotX = 0;
    target.rootRotY = 0;
    target.rootRotZ = 0;

    target.pelvisPosZ = 0;
    target.pelvisRotX = 0;
    target.torsoRotX = 0;
    target.headRotX = 0;

    target.lShoulderX = 0;
    target.lShoulderZ = 0;
    target.lElbowX = 0;

    target.rShoulderX = 0;
    target.rShoulderZ = 0;
    target.rElbowX = 0;

    target.lHipX = 0;
    target.lKneeX = 0;
    target.rHipX = 0;
    target.rKneeX = 0;

    // Calculate progression t: 0 (starting) -> 1 (peak extension / full hold)
    let t = 0;
    if (phase === 'exercising') {
      if (repSubPhase === 'extend') t = 0.85;
      else if (repSubPhase === 'hold') t = 1.0;
      else if (repSubPhase === 'return') t = 0.25;
      else t = 0.1;
    } else if (phase === 'resting' || phase === 'prep_countdown') {
      t = 0; // standard neutral tutorial posture
    }

    // ==========================================
    // 1. DEAD BUG (死虫式 - 1:1 仰卧抗伸展生物力学)
    // ==========================================
    if (isDeadBug) {
      target.rootY = 0.18;
      target.rootRotX = -Math.PI / 2; // Supine on back

      // Starting Tabletop 90°/90° for both legs
      target.lHipX = -Math.PI / 2;
      target.lKneeX = Math.PI / 2;
      target.rHipX = -Math.PI / 2;
      target.rKneeX = Math.PI / 2;

      // Starting Arms straight up to ceiling
      target.lShoulderX = -Math.PI / 2;
      target.rShoulderX = -Math.PI / 2;

      if (currentSide === 'A') {
        // Right arm overhead extension + Left leg straight forward
        target.rShoulderX = -Math.PI / 2 - (t * 1.35);
        target.lHipX = -Math.PI / 2 + (t * 1.3);
        target.lKneeX = Math.PI / 2 - (t * 1.4);
      } else {
        // Left arm overhead extension + Right leg straight forward
        target.lShoulderX = -Math.PI / 2 - (t * 1.35);
        target.rHipX = -Math.PI / 2 + (t * 1.3);
        target.rKneeX = Math.PI / 2 - (t * 1.4);
      }
    }

    // ==========================================
    // 2. BIRD DOG (鸟狗式 - 1:1 四足对角抗扭转)
    // ==========================================
    else if (isBirdDog) {
      target.rootY = 0.48;
      target.headRotX = -0.15; // Neutral neck gazing at mat

      // Quadruped knees 90° under hips
      target.lHipX = -Math.PI / 2;
      target.lKneeX = Math.PI / 2;
      target.rHipX = -Math.PI / 2;
      target.rKneeX = Math.PI / 2;

      if (currentSide === 'A') {
        // Right arm straight forward + Left leg kicked straight back
        target.rShoulderX = -Math.PI / 2 * t;
        target.lHipX = -Math.PI / 2 + (t * (Math.PI / 2));
        target.lKneeX = Math.PI / 2 - (t * (Math.PI / 2));
      } else {
        // Left arm forward + Right leg back
        target.lShoulderX = -Math.PI / 2 * t;
        target.rHipX = -Math.PI / 2 + (t * (Math.PI / 2));
        target.rKneeX = Math.PI / 2 - (t * (Math.PI / 2));
      }
    }

    // ==========================================
    // 3. PLANK (平板支撑 - 1:1 前臂俯卧纯平钢板)
    // ==========================================
    else if (isPlank) {
      target.rootY = 0.33;
      target.rootRotX = 0.12;
      target.headRotX = -0.15;

      // Forearm 90° support
      target.lShoulderX = -Math.PI / 2;
      target.lElbowX = Math.PI / 2;
      target.rShoulderX = -Math.PI / 2;
      target.rElbowX = Math.PI / 2;

      // Legs completely straight, heels pressing back
      target.lHipX = 0;
      target.lKneeX = 0;
      target.rHipX = 0;
      target.rKneeX = 0;
    }

    // ==========================================
    // 4. SIDE PLANK (侧平板 - 1:1 侧腹侧向抗屈)
    // ==========================================
    else if (isSidePlank) {
      const isSideA = currentSide === 'A';
      target.rootY = 0.35;
      target.rootRotZ = isSideA ? -Math.PI / 2.3 : Math.PI / 2.3;

      if (isSideA) {
        target.rShoulderZ = Math.PI / 2.4;
        target.rElbowX = Math.PI / 2;
        target.lShoulderZ = -Math.PI / 2; // Top arm to ceiling
      } else {
        target.lShoulderZ = -Math.PI / 2.4;
        target.lElbowX = Math.PI / 2;
        target.rShoulderZ = Math.PI / 2; // Top arm to ceiling
      }
    }

    // ==========================================
    // 5. GLUTE BRIDGE (臀桥 - 1:1 仰卧顶髋后链爆发)
    // ==========================================
    else if (isGluteBridge) {
      target.rootRotX = -Math.PI / 2;
      target.lKneeX = Math.PI / 1.35;
      target.rKneeX = Math.PI / 1.35;

      const bridgeHeight = t * 0.28;
      target.rootY = 0.18 + bridgeHeight;
      target.pelvisPosZ = bridgeHeight * 0.8;
      target.lHipX = -bridgeHeight * 1.8;
      target.rHipX = -bridgeHeight * 1.8;
    }
  }, [exercise.id, phase, currentSide, repSubPhase, isDeadBug, isBirdDog, isPlank, isSidePlank, isGluteBridge]);

  // Touch & Mouse Orbit Controls Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    cameraSphericalRef.current.theta -= deltaX * 0.01;
    cameraSphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.15, cameraSphericalRef.current.phi - deltaY * 0.01));

    updateCameraPosition();
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
    const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

    cameraSphericalRef.current.theta -= deltaX * 0.012;
    cameraSphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.15, cameraSphericalRef.current.phi - deltaY * 0.012));

    updateCameraPosition();
    previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md relative overflow-hidden select-none shadow-2xl"
    >
      {/* Background glow according to phase */}
      <div 
        className={`absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          phase === 'resting' 
            ? 'bg-blue-500/15' 
            : phase === 'exercising' 
              ? 'bg-emerald-500/20' 
              : 'bg-amber-500/20'
        }`} 
      />

      {/* Top Header Controls: 3D Badge + Angle Preset Buttons */}
      <div className="w-full flex items-center justify-between text-xs mb-2 z-10 px-1 gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/90 text-sky-400 border border-sky-500/40 text-[11px] font-bold shadow-sm">
            <Compass className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
            <span>超精细解剖真人模型</span>
          </span>

          <span className="text-[10px] text-slate-400 hidden sm:inline-block">
            (360°滑动旋转 / 滚轮缩放)
          </span>
        </div>

        {/* 4 Camera Presets (侧面90° / 45°立体 / 俯视对齐 / 正面) */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
          <button
            id="cam-preset-side-btn"
            onClick={() => applyCameraPreset('side')}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
              cameraPreset === 'side'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="侧面90°观察：检查腰椎曲度与身体直线"
          >
            侧视90°
          </button>
          <button
            id="cam-preset-iso-btn"
            onClick={() => applyCameraPreset('isometric')}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
              cameraPreset === 'isometric'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="45°立体透视：检查动作协调与空间纵深"
          >
            立体45°
          </button>
          <button
            id="cam-preset-top-btn"
            onClick={() => applyCameraPreset('top')}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
              cameraPreset === 'top'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="俯视对齐：检查脊柱中轴与对角线对称"
          >
            俯视轴
          </button>
          <button
            id="cam-preset-front-btn"
            onClick={() => applyCameraPreset('front')}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
              cameraPreset === 'front'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="正面近景：检查双肩下沉与对齐"
          >
            正视
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div 
        className="relative w-full h-[230px] sm:h-[280px] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 cursor-grab active:cursor-grabbing flex items-center justify-center shadow-inner"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Controls Overlay (Zoom, Muscle Aura, Spinal Axis, Wireframe & Reset) */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 z-20 bg-zinc-900/90 p-1 rounded-xl border border-zinc-700/80 backdrop-blur-md shadow-lg">
          <button
            id="zoom-in-btn"
            onClick={(e) => { e.stopPropagation(); handleZoom(0.2); }}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="zoom-out-btn"
            onClick={(e) => { e.stopPropagation(); handleZoom(-0.2); }}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-zinc-700 mx-0.5" />

          {/* Toggle Muscle Aura */}
          <button
            id="toggle-muscle-aura-btn"
            onClick={(e) => { e.stopPropagation(); setShowMuscleAura(!showMuscleAura); }}
            className={`p-1.5 rounded-lg transition ${
              showMuscleAura 
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="发力肌群透视高亮"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Toggle Spinal Neutral Axis Laser */}
          <button
            id="toggle-spine-axis-btn"
            onClick={(e) => { e.stopPropagation(); setShowSpineAxis(!showSpineAxis); }}
            className={`p-1.5 rounded-lg transition ${
              showSpineAxis 
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="脊柱中立基准激光线"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Wireframe / X-Ray Mode */}
          <button
            id="toggle-wireframe-btn"
            onClick={(e) => { e.stopPropagation(); toggleWireframe(); }}
            className={`p-1.5 rounded-lg transition ${
              isWireframeMode 
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="解剖结构线框透视"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Reset Camera */}
          <button
            id="reset-cam-btn"
            onClick={(e) => { e.stopPropagation(); applyCameraPreset('isometric'); }}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="视角复位"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Exercise Side Tag & Anatomical Specs */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 text-[11px] font-mono text-zinc-200 shadow-md">
            {exercise.type === 'reps-unilateral' && (
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${currentSide === 'A' ? 'bg-zinc-200' : 'bg-zinc-400'}`} />
                {currentSide === 'A' ? '侧A：右手 + 左腿对角联动' : '侧B：左手 + 右腿对角联动'}
              </span>
            )}
            {exercise.type === 'timed-unilateral' && (
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${currentSide === 'A' ? 'bg-zinc-200' : 'bg-zinc-400'}`} />
                {currentSide === 'A' ? '侧A（右侧小臂与下侧躯干支撑）' : '侧B（左侧小臂与下侧躯干支撑）'}
              </span>
            )}
            {exercise.type === 'timed-hold' && '全核心等长抗拉力学'}
            {exercise.type === 'reps' && '后侧链双侧对称顶髋'}
          </span>
        </div>
      </div>

      {/* Real-time Cue Sub-text */}
      <div className="w-full text-center mt-2 z-10 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 text-zinc-200 font-semibold text-xs tracking-wider border border-zinc-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span>{getSubPhaseLabel()}</span>
        </span>
      </div>
    </div>
  );
};
