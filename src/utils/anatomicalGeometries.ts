import * as THREE from 'three';

/**
 * Anatomical Geometry Generator for Lifelike Human Limbs and Organic Body Topology
 * Generates smooth, biologically proportional, chiseled human musculature and joints.
 */

// Helper: clamp values between 0 and 1
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// Helper: compute vertex normals cleanly and guarantee no NaN positions
function finalizeGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geo.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      let modified = false;
      if (!Number.isFinite(x)) { x = 0; modified = true; }
      if (!Number.isFinite(y)) { y = 0; modified = true; }
      if (!Number.isFinite(z)) { z = 0; modified = true; }
      if (modified) {
        pos.setXYZ(i, x, y, z);
      }
    }
    pos.needsUpdate = true;
  }
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * 1. Anatomical Upper Arm (Brachium)
 * Features:
 * - Proximal humeral head & deltoid insertion
 * - Anterior biceps brachii muscle belly
 * - Posterior triceps brachii (long head & lateral head)
 * - Tapering distal tendon inserting into cubital fossa & olecranon
 */
export function createAnatomicalUpperArm(isLeft: boolean): THREE.BufferGeometry {
  const radialSegments = 28;
  const heightSegments = 24;
  const length = 0.28;
  const geo = new THREE.CylinderGeometry(0.052, 0.042, length, radialSegments, heightSegments, false);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i); // range -length/2 to +length/2
    let z = pos.getZ(i);

    const normY = clamp01((y + length / 2) / length); // 0 at elbow, 1 at shoulder

    // Biceps belly anteriorly (negative Z is anterior in our character coordinate frame)
    if (z < 0) {
      // Biceps peak around 40%-60% of upper arm length
      const bicepPeak = Math.sin(normY * Math.PI) * Math.max(0, -z);
      z -= bicepPeak * 0.45;
    }

    // Triceps belly posteriorly (positive Z is posterior)
    if (z > 0) {
      // Triceps is prominent in proximal 50%-85%
      const tricepPeak = Math.sin(Math.pow(normY, 0.8) * Math.PI) * Math.max(0, z);
      z += tricepPeak * 0.40;
    }

    // Lateral deltoid flare at proximal end (shoulder connection)
    const sideSign = isLeft ? -1 : 1;
    if (x * sideSign > 0 && normY > 0.65) {
      const shoulderFlare = Math.sin((normY - 0.65) / 0.35 * Math.PI) * Math.abs(x);
      x += sideSign * shoulderFlare * 0.35;
    }

    // Flatten slightly laterally at distal end (approaching epicondyles of elbow)
    if (normY < 0.15) {
      const epicondyleWidth = (1 - normY / 0.15);
      x *= (1 + epicondyleWidth * 0.22);
      z *= (1 - epicondyleWidth * 0.15);
    }

    pos.setXYZ(i, x, y, z);
  }

  // Offset anchor so pivot is at top (shoulder joint)
  geo.translate(0, -length / 2, 0);
  return finalizeGeometry(geo);
}

/**
 * 2. Anatomical Forearm (Antebrachium)
 * Features:
 * - Prominent proximal muscular flare of Brachioradialis on lateral/radial border
 * - Volar flexor-pronator group curvature
 * - Dorsal extensor ridge
 * - Tapers down to elliptical wrist with styloid processes (radial & ulnar)
 */
export function createAnatomicalForearm(isLeft: boolean): THREE.BufferGeometry {
  const radialSegments = 28;
  const heightSegments = 24;
  const length = 0.26;
  const geo = new THREE.CylinderGeometry(0.046, 0.028, length, radialSegments, heightSegments, false);
  const pos = geo.attributes.position;
  const sideSign = isLeft ? -1 : 1;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const normY = clamp01((y + length / 2) / length); // 0 at wrist, 1 at elbow

    // Brachioradialis muscle on lateral/radial side in upper 40% of forearm
    if (x * sideSign > 0 && normY > 0.45) {
      const brachioBulge = Math.sin((normY - 0.45) / 0.55 * Math.PI) * Math.abs(x);
      x += sideSign * brachioBulge * 0.42;
    }

    // Volar flexor belly (anterior, z < 0) in proximal half
    if (z < 0 && normY > 0.35) {
      const flexorBulge = Math.sin((normY - 0.35) / 0.65 * Math.PI) * Math.abs(z);
      z -= flexorBulge * 0.30;
    }

    // Natural distal taper into an elliptical cross-section wrist (wider horizontally than deep)
    if (normY < 0.3) {
      const wristTaper = (1 - normY / 0.3);
      x *= (1 + wristTaper * 0.18); // wider in lateral dimension
      z *= (1 - wristTaper * 0.22); // flatter anterior-posterior
    }

    // Styloid process of ulna (pinky side, dorsal/posterior)
    if (normY < 0.12 && x * sideSign < 0 && z > 0) {
      x -= sideSign * 0.005;
      z += 0.004;
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.translate(0, -length / 2, 0);
  return finalizeGeometry(geo);
}

/**
 * 3. Anatomical Thigh (Femur & Quadriceps / Hamstrings)
 * Features:
 * - Muscular anterior Quadriceps envelope: Rectus femoris crest, Vastus lateralis flare
 * - Distal medial Vastus Medialis Oblique (VMO "teardrop" muscle directly above inner knee)
 * - Posterior dual-bellied Hamstrings curve
 * - Tapering suprapatellar tendon junction
 */
export function createAnatomicalThigh(isLeft: boolean): THREE.BufferGeometry {
  const radialSegments = 32;
  const heightSegments = 28;
  const length = 0.40;
  const geo = new THREE.CylinderGeometry(0.086, 0.062, length, radialSegments, heightSegments, false);
  const pos = geo.attributes.position;
  const sideSign = isLeft ? -1 : 1;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const normY = clamp01((y + length / 2) / length); // 0 at knee, 1 at hip

    // A. Vastus Medialis ("Teardrop" muscle on inner knee, normY between 0.12 and 0.38)
    if (x * sideSign < 0 && normY >= 0.10 && normY <= 0.40) {
      const vmoCurve = Math.sin((normY - 0.10) / 0.30 * Math.PI);
      x -= sideSign * vmoCurve * 0.024;
      if (z < 0) z -= vmoCurve * 0.016; // anterior inner sweep
    }

    // B. Vastus Lateralis (Outer thigh sweeping contour in upper 70%)
    if (x * sideSign > 0 && normY >= 0.30 && normY <= 0.85) {
      const latCurve = Math.sin((normY - 0.30) / 0.55 * Math.PI);
      x += sideSign * latCurve * 0.026;
    }

    // C. Rectus Femoris (Anterior quad ridge along front)
    if (z < 0) {
      const quadCurve = Math.sin(Math.pow(normY, 0.75) * Math.PI) * Math.max(0, -z);
      z -= quadCurve * 0.32;
    }

    // D. Hamstrings (Posterior curve, semitendinosus & biceps femoris)
    if (z > 0 && normY > 0.25) {
      const hamCurve = Math.sin((normY - 0.25) / 0.75 * Math.PI) * Math.max(0, z);
      z += hamCurve * 0.30;
    }

    // E. Distal Knee Condyle expansion (femoral epicondyles right at knee joint)
    if (normY < 0.10) {
      const condyleWidth = (1 - normY / 0.10);
      x *= (1 + condyleWidth * 0.14);
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.translate(0, -length / 2, 0);
  return finalizeGeometry(geo);
}

/**
 * 4. Anatomical Lower Leg / Calf (Crus)
 * Features:
 * - Distinctly ASYMMETRICAL Gastrocnemius:
 *   Medial head descends lower and is bulkier; Lateral head is shorter and higher
 * - Soleus muscle underlying the calf
 * - Sharp, defined anterior Tibial Crest (shin bone ridge)
 * - Tapering, tendonous Achilles Tendon inserting into heel
 * - Asymmetrical Malleoli (Inner ankle is higher and anterior; outer ankle is lower and posterior)
 */
export function createAnatomicalCalf(isLeft: boolean): THREE.BufferGeometry {
  const radialSegments = 32;
  const heightSegments = 28;
  const length = 0.38;
  const geo = new THREE.CylinderGeometry(0.066, 0.038, length, radialSegments, heightSegments, false);
  const pos = geo.attributes.position;
  const sideSign = isLeft ? -1 : 1;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const normY = clamp01((y + length / 2) / length); // 0 at ankle, 1 at knee

    // Posterior calf bellies (z > 0)
    if (z > 0) {
      // Medial calf head: lower, extends from 0.40 to 0.88
      if (x * sideSign < 0 && normY >= 0.40 && normY <= 0.90) {
        const medialPeak = Math.sin((normY - 0.40) / 0.50 * Math.PI);
        z += medialPeak * 0.034;
        x -= sideSign * medialPeak * 0.015;
      }
      // Lateral calf head: higher, extends from 0.52 to 0.95
      else if (x * sideSign > 0 && normY >= 0.50 && normY <= 0.95) {
        const lateralPeak = Math.sin((normY - 0.50) / 0.45 * Math.PI);
        z += lateralPeak * 0.028;
        x += sideSign * lateralPeak * 0.018;
      }
    }

    // Anterior Tibial Crest (Shin bone: sharp anterior ridge at z < 0)
    if (z < 0) {
      // Flatten the antero-medial face (subcutaneous surface of tibia)
      if (x * sideSign < 0) {
        z *= 0.92;
      }
      // Tibialis anterior muscle fullness on antero-lateral side
      if (x * sideSign > 0 && normY > 0.45) {
        const tibialis = Math.sin((normY - 0.45) / 0.55 * Math.PI) * 0.012;
        z -= tibialis;
        x += sideSign * tibialis * 0.5;
      }
    }

    // Achilles tendon narrowing in lower 30%
    if (normY < 0.32 && normY > 0.08) {
      if (z > 0) {
        // Tight, firm Achilles cord
        const achillesTight = (1 - Math.abs(normY - 0.20) / 0.12);
        x *= 0.85;
      }
    }

    // Asymmetric Malleoli (Ankle bones) at bottom (normY < 0.12)
    if (normY < 0.12) {
      // Medial malleolus (inner, higher: normY around 0.07-0.10)
      if (x * sideSign < 0 && normY >= 0.05 && normY <= 0.11) {
        x -= sideSign * 0.010;
        z -= 0.003; // sits slightly anterior
      }
      // Lateral malleolus (outer, lower: normY around 0.02-0.07)
      if (x * sideSign > 0 && normY >= 0.01 && normY <= 0.07) {
        x += sideSign * 0.012;
        z += 0.005; // sits slightly posterior
      }
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.translate(0, -length / 2, 0);
  return finalizeGeometry(geo);
}

/**
 * 5. Anatomical Foot with Medial Longitudinal Arch, Calcaneus & Articulated Toes
 */
export function createAnatomicalFoot(isLeft: boolean): THREE.BufferGeometry {
  const length = 0.23;
  const width = 0.095;
  const height = 0.072;
  const geo = new THREE.BoxGeometry(width, height, length, 16, 8, 20);
  const pos = geo.attributes.position;
  const sideSign = isLeft ? -1 : 1;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // z ranges from -length/2 (toes) to +length/2 (heel)
    const normZ = clamp01((z + length / 2) / length); // 0 at toes, 1 at heel

    // Medial longitudinal arch: bottom of inner foot lifted off ground
    if (y < 0 && x * sideSign < 0 && normZ > 0.25 && normZ < 0.80) {
      const archLift = Math.sin((normZ - 0.25) / 0.55 * Math.PI) * (1 - Math.abs(x) / (width / 2));
      y += archLift * 0.022;
    }

    // Instep slope: top of foot slopes down towards toes
    if (y > 0) {
      if (normZ < 0.6) {
        y *= (normZ / 0.6 * 0.65 + 0.35);
      }
    }

    // Heel rounding (calcaneus)
    if (normZ > 0.85) {
      const heelCurve = (normZ - 0.85) / 0.15;
      x *= (1 - heelCurve * 0.35);
      z += Math.sin(heelCurve * Math.PI / 2) * 0.012;
    }

    // Ball of foot expansion (metatarsal heads around normZ = 0.25)
    if (normZ > 0.15 && normZ < 0.35) {
      const ballSpread = Math.sin((normZ - 0.15) / 0.20 * Math.PI);
      x *= (1 + ballSpread * 0.16);
    }

    // Asymmetric toe profile (hallux / big toe is longer and sits medial)
    if (normZ < 0.15) {
      const toeTaper = (0.15 - normZ) / 0.15;
      if (x * sideSign > 0) {
        // Lateral lesser toes slope back faster
        z += toeTaper * 0.020;
        x *= (1 - toeTaper * 0.22);
      }
    }

    pos.setXYZ(i, x, y, z);
  }

  // Anchor at ankle joint: heel posterior, instep anterior
  geo.translate(0, -height / 2, -length * 0.25);
  return finalizeGeometry(geo);
}

/**
 * 6. Anatomical Hand with Thenar/Hypothenar Palms and Finger Proportions
 */
export function createAnatomicalPalm(isLeft: boolean): THREE.BufferGeometry {
  const width = 0.065;
  const length = 0.082;
  const depth = 0.026;
  const geo = new THREE.BoxGeometry(width, length, depth, 14, 16, 8);
  const pos = geo.attributes.position;
  const sideSign = isLeft ? -1 : 1;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const normY = clamp01((y + length / 2) / length); // 0 at knuckles, 1 at wrist

    // Thenar eminence (thumb muscular mound on palm surface z < 0, lateral side)
    if (z < 0 && x * sideSign > 0 && normY > 0.35) {
      const thenarMound = Math.sin((normY - 0.35) / 0.65 * Math.PI) * Math.max(0, x * sideSign);
      z -= thenarMound * 0.35;
    }

    // Hypothenar eminence (medial palm pad on pinky side, z < 0)
    if (z < 0 && x * sideSign < 0 && normY > 0.40) {
      const hypoMound = Math.sin((normY - 0.40) / 0.60 * Math.PI) * Math.max(0, -x * sideSign);
      z -= hypoMound * 0.25;
    }

    // Palmar cup (central depression of palm)
    if (z < 0 && Math.abs(x) < width * 0.35 && normY > 0.25 && normY < 0.75) {
      z += 0.004;
    }

    // Knuckle arch (metacarpal heads curve slightly)
    if (normY < 0.2) {
      y += (1 - Math.pow(x / (width / 2), 2)) * 0.005;
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.translate(0, -length / 2, 0);
  return finalizeGeometry(geo);
}

/**
 * 7. Anatomical Digit / Finger with 2-segment knuckle definition
 */
export function createAnatomicalFinger(length: number, thickness: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(thickness * 0.85, thickness * 0.72, length, 12, 10);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const normY = clamp01((y + length / 2) / length); // 0 at tip, 1 at knuckle

    // Intermediate interphalangeal joint thickening (middle knuckle)
    if (Math.abs(normY - 0.50) < 0.15) {
      const jointBulge = Math.cos((normY - 0.50) / 0.15 * Math.PI * 0.5);
      x *= (1 + jointBulge * 0.16);
      z *= (1 + jointBulge * 0.20);
    }

    // Fleshy palmar finger pad (distal pulp)
    if (normY < 0.25 && z < 0) {
      z -= (0.25 - normY) * thickness * 0.45;
    }

    // Finger nail bed on dorsal side (z > 0)
    if (normY < 0.28 && z > 0) {
      z *= 0.95;
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.translate(0, -length / 2, 0);
  return finalizeGeometry(geo);
}

/**
 * 8. Sculpted Anatomical Chest & Ribcage (Pectorals, Sternum, S-Clavicle)
 */
export function createSculptedRibcage(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.22, 0.185, 0.27, 32, 16);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const normY = clamp01((y + 0.135) / 0.27); // 0 at bottom ribcage, 1 at clavicles

    // Pectoral cleft (central sternum depression between pectorals)
    if (z < 0 && Math.abs(x) < 0.035 && normY > 0.35) {
      z += 0.015; // indent at sternum
    }

    // Pectoral major fullness on left and right
    if (z < 0 && Math.abs(x) >= 0.035 && Math.abs(x) <= 0.18 && normY >= 0.40 && normY <= 0.90) {
      const pecFullness = Math.sin((normY - 0.40) / 0.50 * Math.PI) * Math.sin((Math.abs(x) - 0.035) / 0.145 * Math.PI);
      z -= pecFullness * 0.032;
    }

    // Latissimus dorsi flare on postero-lateral wings
    if (Math.abs(x) > 0.15 && z >= -0.05 && normY > 0.25) {
      const latFlare = Math.sin((normY - 0.25) / 0.75 * Math.PI) * (Math.abs(x) - 0.15);
      x += (x > 0 ? 1 : -1) * latFlare * 0.40;
    }

    // Thoracic spine groove on back
    if (z > 0 && Math.abs(x) < 0.028) {
      z -= 0.012;
    }

    pos.setXYZ(i, x, y, z);
  }

  return finalizeGeometry(geo);
}

/**
 * 9. S-Curve Clavicle (Collarbone)
 */
export function createSCurveClavicle(isLeft: boolean): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const sideSign = isLeft ? -1 : 1;
  const segments = 16;
  const length = 0.15;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 at sternum, 1 at acromion (shoulder)
    const x = sideSign * t * length;
    // Classic anatomical S-curve: medial 2/3 convex anteriorly, lateral 1/3 concave anteriorly
    const z = Math.sin(t * Math.PI * 1.5) * 0.015;
    const y = Math.sin(t * Math.PI) * 0.008;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.TubeGeometry(curve, 20, 0.012, 10, false);
  return finalizeGeometry(tube);
}

/**
 * 10. Sculpted Abdomen with 6-pack Rectus Abdominis, Linea Alba, Umbilicus & Obliques
 */
export function createSculptedAbdomen(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.182, 0.174, 0.19, 32, 20);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const normY = clamp01((y + 0.095) / 0.19); // 0 at waistline, 1 at ribcage

    // Anterior abdomen detailing (z < 0)
    if (z < 0) {
      // Linea Alba (central vertical tendon groove)
      if (Math.abs(x) < 0.018) {
        z += 0.012; // deep groove
      }

      // Umbilicus (belly button at normY ≈ 0.28)
      if (Math.abs(x) < 0.022 && Math.abs(normY - 0.28) < 0.045) {
        z += 0.016; // navel indentation
      }

      // Rectus Abdominis Segments (3 tendinous intersections / 6-pack bellies)
      if (Math.abs(x) >= 0.018 && Math.abs(x) <= 0.12) {
        // Modulate with sinusoidal horizontal ridges
        const abBumps = Math.sin(normY * Math.PI * 3.2);
        if (abBumps > 0) {
          z -= abBumps * 0.016 * (1 - Math.abs(x) / 0.13);
        } else {
          z -= abBumps * 0.008; // tendinous inscriptions indent
        }
      }

      // External Obliques on sides (x > 0.12)
      if (Math.abs(x) > 0.12 && normY < 0.75) {
        const obliqueRoll = Math.sin((normY - 0.1) / 0.65 * Math.PI) * (Math.abs(x) - 0.12);
        x += (x > 0 ? 1 : -1) * obliqueRoll * 0.22;
      }
    }

    // Lumbar spine groove posteriorly
    if (z > 0 && Math.abs(x) < 0.03) {
      z -= 0.010;
    }

    pos.setXYZ(i, x, y, z);
  }

  return finalizeGeometry(geo);
}

/**
 * 11. Sculpted Gluteus Maximus & Pelvic Belt
 */
export function createSculptedGluteus(isLeft: boolean): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.128, 24, 24);
  const sideSign = isLeft ? -1 : 1;
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Sculpt natural anatomical gluteal fold at bottom
    if (y < -0.04) {
      y *= 0.85;
      z *= 0.92;
    }

    // Prominent posterior projection (z > 0)
    if (z > 0) {
      z *= 1.25;
      // Medial gluteal cleft flattening
      if (x * sideSign < 0) {
        x *= 0.75;
      }
    }

    pos.setXYZ(i, x, y, z);
  }

  return finalizeGeometry(geo);
}

/**
 * 12. Anatomical Knee Joint Structure (Patella & Tendon)
 */
export function createAnatomicalKneeAssembly(): THREE.Group {
  const group = new THREE.Group();

  // Patella bone (teardrop-shaped kneecap)
  const patellaGeo = new THREE.ConeGeometry(0.038, 0.065, 16);
  patellaGeo.rotateX(Math.PI);
  patellaGeo.scale(1.1, 1.0, 0.65);
  const patellaMat = new THREE.MeshStandardMaterial({
    color: 0xead5c3,
    roughness: 0.5,
  });
  const patellaMesh = new THREE.Mesh(patellaGeo, patellaMat);
  patellaMesh.position.set(0, 0.015, -0.052);
  group.add(patellaMesh);

  // Infrapatellar tendon running down to tibial tuberosity
  const tendonGeo = new THREE.BoxGeometry(0.024, 0.052, 0.012);
  const tendonMat = new THREE.MeshStandardMaterial({
    color: 0xdec1ac,
    roughness: 0.45,
  });
  const tendonMesh = new THREE.Mesh(tendonGeo, tendonMat);
  tendonMesh.position.set(0, -0.035, -0.048);
  group.add(tendonMesh);

  return group;
}
