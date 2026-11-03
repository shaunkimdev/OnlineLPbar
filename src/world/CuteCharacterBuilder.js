import * as THREE from 'three';

/**
 * Builds a cute 1.8~2-head-tall character with the chubby body silhouette of `캐릭터샘플.png`,
 * balanced outward arms, and smooth, volumetric, popular Korean hairstyles:
 * - Boy ('male'): Trendy Korean 6:4 Dandy / As-Perm Cut (자연스러운 가르마 애즈펌 댄디컷)
 * - Girl ('female'): Trendy Korean Rounded Full-Bang + Side-Bang C-Curl Bob (시스루 라운드 풀뱅 + 사이드뱅 C컬 단발 & 리본핀)
 */
export function createCuteMascotCharacter(gender = 'male', options = {}) {
  const isFemale = gender === 'female';
  const root = new THREE.Group();

  // Warm skin material for head, ears, nose & hands
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffe2c8,
    roughness: 0.6,
    metalness: 0.02
  });

  // Soft silky hair material (warm dark brown / chestnut)
  const hairColor = options.hairColor || (isFemale ? 0x4a2a1b : 0x2c1b12);
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.52,
    metalness: 0.05
  });

  // Outfit materials
  const topColor = options.bodyColor || (isFemale ? 0xfbe0dc : 0xedf2f8);
  const topMat = new THREE.MeshStandardMaterial({
    color: topColor,
    roughness: 0.68,
    metalness: 0.03
  });

  const accentColor = isFemale ? 0xe86f80 : 0x4f77a8;
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.52,
    metalness: 0.04
  });

  const legColor = isFemale ? 0xfff6f4 : 0x3a4860;
  const legMat = new THREE.MeshStandardMaterial({
    color: legColor,
    roughness: 0.72,
    metalness: 0.02
  });

  const shoeColor = isFemale ? 0xc95260 : 0x292d36;
  const shoeMat = new THREE.MeshStandardMaterial({
    color: shoeColor,
    roughness: 0.68
  });

  // =========================================================================
  // 1. CHUBBY BELL-SHAPED TORSO (통통한 종 모양 상체)
  // =========================================================================
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const torsoCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.235, 0.35, 0.46, 36),
    topMat
  );
  torsoCylinder.position.y = 0.57;
  torsoCylinder.castShadow = true;
  torsoCylinder.receiveShadow = true;
  bodyGroup.add(torsoCylinder);

  // Rounded bottom hem ring
  const hipRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.312, 0.042, 16, 36),
    accentMat
  );
  hipRing.rotation.x = Math.PI / 2;
  hipRing.position.y = 0.35;
  bodyGroup.add(hipRing);

  // Lower underbody cap
  const underCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.325, 24, 16),
    legMat
  );
  underCap.scale.set(1, 0.25, 0.94);
  underCap.position.y = 0.34;
  bodyGroup.add(underCap);

  // Cozy neck collar ring
  const collarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.035, 14, 32),
    accentMat
  );
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.set(0, 0.78, 0.01);
  bodyGroup.add(collarRing);

  // =========================================================================
  // 2. OUTWARD CUTE ARMS (몸통 바깥쪽으로 귀엽게 뻗은 양팔과 손)
  // =========================================================================
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.27, 0.69, 0.02);
  leftArmPivot.rotation.z = -0.48; // Outward to the left (-X)

  const leftArmMesh = _createProportionedArm(topMat, accentMat, skinMat, false);
  leftArmPivot.add(leftArmMesh);
  bodyGroup.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.27, 0.69, 0.02);
  rightArmPivot.rotation.z = 0.48; // Outward to the right (+X)

  const rightArmMesh = _createProportionedArm(topMat, accentMat, skinMat, true);
  rightArmPivot.add(rightArmMesh);
  bodyGroup.add(rightArmPivot);

  // =========================================================================
  // 3. STUBBY LEGS WITH SHOES (통통하고 귀여운 다리)
  // =========================================================================
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.15, 0.36, 0);
  const leftLegMesh = _createStubbyLeg(legMat, shoeMat);
  leftLegPivot.add(leftLegMesh);
  root.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.15, 0.36, 0);
  const rightLegMesh = _createStubbyLeg(legMat, shoeMat);
  rightLegPivot.add(rightLegMesh);
  root.add(rightLegPivot);

  // =========================================================================
  // 4. OVERSIZED ROUND HEAD + CRISP 3D FACE + SEAMLESS POPULAR HAIRSTYLE
  // =========================================================================
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.80, 0);
  bodyGroup.add(headPivot);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.43, 0);
  headPivot.add(headGroup);

  // Main oversized round skin-toned head sphere
  // Semi-axes: Rx = 0.46 * 1.06 = 0.4876, Ry = 0.46 * 0.98 = 0.4508, Rz = 0.46 * 0.98 = 0.4508
  const headSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 48, 40),
    skinMat
  );
  headSphere.scale.set(1.06, 0.98, 0.98);
  headSphere.castShadow = true;
  headSphere.receiveShadow = true;
  headGroup.add(headSphere);

  // Cute round ears on left & right sides
  [-0.485, 0.485].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.086, 16, 16), skinMat);
    ear.scale.set(0.55, 0.92, 0.72);
    ear.position.set(ex, -0.03, -0.01);
    headGroup.add(ear);
  });

  // Crisp 3D Facial Features on the front (+Z) of the head
  _build3DFacialFeatures(headGroup, isFemale, skinMat, hairMat);

  // Seamless Volumetric Popular Hairstyle
  if (isFemale) {
    _buildPopularGirlHair(headGroup, hairMat, accentMat);
  } else {
    _buildPopularBoyHair(headGroup, hairMat);
  }

  // =========================================================================
  // 5. HELD LP JACKET IN HANDS (LP 선택 시 손에 들고 있는 3D 앨범 자켓)
  // =========================================================================
  const heldLPMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const heldLPMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.46, 0.026),
    heldLPMat
  );
  heldLPMesh.position.set(0.40, 0.52, 0.25);
  heldLPMesh.rotation.y = 0.32;
  heldLPMesh.rotation.z = -0.12;
  heldLPMesh.visible = false;
  bodyGroup.add(heldLPMesh);

  return {
    root,
    bodyGroup,
    headPivot,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    heldLPMesh,
    heldLPMat,
    gender
  };
}

/**
 * Builds crisp 3D eyes, catchlights, eyebrows, rosy cheeks, button nose, and smile
 * on the front of the head (`+Z`).
 */
function _build3DFacialFeatures(headGroup, isFemale, skinMat, hairMat) {
  const faceGroup = new THREE.Group();

  const eyeDarkMat = new THREE.MeshBasicMaterial({ color: 0x1c1310 });
  const eyeShineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blushMat = new THREE.MeshBasicMaterial({
    color: isFemale ? 0xff8298 : 0xff9482,
    transparent: true,
    opacity: 0.58
  });
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x8a382f });

  // 1) Left & Right Glossy Oval Eyes (at y = -0.025, z = 0.438)
  [-0.15, 0.15].forEach((ex) => {
    const isLeft = ex < 0;
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(ex, -0.025, 0.438);
    eyeGroup.rotation.y = isLeft ? -0.15 : 0.15;

    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.052, 22, 22), eyeDarkMat);
    eyeBall.scale.set(0.88, 1.18, 0.35);
    eyeGroup.add(eyeBall);

    // Upper-left catchlight
    const shineBig = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), eyeShineMat);
    shineBig.scale.set(1, 1, 0.45);
    shineBig.position.set(-0.015, 0.02, 0.016);
    eyeGroup.add(shineBig);

    // Lower-right catchlight
    const shineSmall = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 10), eyeShineMat);
    shineSmall.scale.set(1, 1, 0.45);
    shineSmall.position.set(0.015, -0.017, 0.016);
    eyeGroup.add(shineSmall);

    if (isFemale) {
      const lash1 = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.011, 0.012), eyeDarkMat);
      lash1.position.set(isLeft ? -0.04 : 0.04, 0.034, 0.01);
      lash1.rotation.z = isLeft ? -0.42 : 0.42;
      eyeGroup.add(lash1);

      const lash2 = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.009, 0.012), eyeDarkMat);
      lash2.position.set(isLeft ? -0.044 : 0.044, 0.014, 0.01);
      lash2.rotation.z = isLeft ? -0.18 : 0.18;
      eyeGroup.add(lash2);
    }

    faceGroup.add(eyeGroup);
  });

  // 2) Soft Arched Eyebrows (at y = +0.078, z = 0.434)
  [-0.15, 0.15].forEach((bx) => {
    const isLeft = bx < 0;
    const brow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.011, 0.058, 8, 12),
      hairMat
    );
    brow.position.set(bx, 0.078, 0.434);
    brow.rotation.z = Math.PI / 2 + (isLeft ? 0.10 : -0.10);
    brow.rotation.y = isLeft ? -0.16 : 0.16;
    faceGroup.add(brow);
  });

  // 3) Soft Pink Oval Blush Cheeks
  [-0.24, 0.24].forEach((cx) => {
    const isLeft = cx < 0;
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.054, 16, 16), blushMat);
    cheek.scale.set(1.25, 0.72, 0.25);
    cheek.position.set(cx, -0.092, 0.398);
    cheek.rotation.y = isLeft ? -0.32 : 0.32;
    faceGroup.add(cheek);
  });

  // 4) Cute Tiny 3D Button Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 14), skinMat);
  nose.scale.set(1.1, 0.85, 0.75);
  nose.position.set(0, -0.058, 0.456);
  faceGroup.add(nose);

  // 5) Happy Curved Smile
  const smileArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.009, 10, 24, Math.PI * 0.75),
    mouthMat
  );
  smileArc.position.set(0, -0.115, 0.436);
  smileArc.rotation.z = Math.PI * 1.125;
  smileArc.rotation.x = -0.12;
  faceGroup.add(smileArc);

  headGroup.add(faceGroup);
}

/**
 * Generates a single, continuous, watertight 3D volumetric hair shell around the head ellipsoid.
 * Coordinate system around the head:
 * - theta = 0 is top crown (+Y), theta = PI/2 is equator (y = 0)
 * - phi = 0 is Left (-X), phi = PI/2 is Front Face (+Z), phi = PI is Right (+X), phi = 3*PI/2 is Back (-Z)
 */
function _createVolumetricHairGeometry(profileFn, radialSegs = 96, heightSegs = 36) {
  const geo = new THREE.BufferGeometry();
  const positions = [];
  const indices = [];

  // Head base semi-axes (slightly inside skin surface so hair roots never have a gap)
  const baseRx = 0.46 * 1.06;
  const baseRy = 0.46 * 0.98;
  const baseRz = 0.46 * 0.98;

  for (let i = 0; i <= radialSegs; i++) {
    const u = i / radialSegs;
    const phi = u * Math.PI * 2;
    const { maxTheta, thickness, bottomFlare = 0, strandGroove = 0 } = profileFn(phi);

    for (let j = 0; j <= heightSegs; j++) {
      const v = j / heightSegs; // 0 at crown, 1 at hair hemline

      // Smoothly map v -> theta, with the very last 12% tucking under the hair hemline for a thick rounded edge!
      const tEdge = v <= 0.88 ? v / 0.88 : 1.0 - (v - 0.88) * 0.18;
      const theta = tEdge * maxTheta;

      // Plush volumetric puff profile from crown (v=0) to bottom edge (v=1)
      let puff = 0;
      if (v <= 0.88) {
        const tv = v / 0.88;
        puff = thickness * Math.pow(Math.sin(tv * Math.PI * 0.78 + 0.18), 0.75);
        // Optional outward C-curl flare near bottom of bob
        puff += bottomFlare * Math.pow(tv, 2.6);
        // Subtle silky hair strand groove along the surface
        puff += strandGroove * Math.sin(tv * Math.PI);
      } else {
        // Tuck smoothly back toward the skin at v = 1.0 so the bottom of the bangs is thick & rounded
        const tuck = (1.0 - v) / 0.12;
        puff = (thickness * 0.45 + bottomFlare) * Math.max(0, tuck);
      }

      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      const rx = baseRx + puff;
      const ry = baseRy + puff * 0.95;
      const rz = baseRz + puff;

      const x = -rx * cosP * sinT;
      const y = ry * cosT + 0.015; // slight crown lift
      const z = rz * sinP * sinT;

      positions.push(x, y, z);
    }
  }

  const stride = heightSegs + 1;
  for (let i = 0; i < radialSegs; i++) {
    for (let j = 0; j < heightSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);

      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Helper: Smooth cosine bell bump centered at `centerPhi` with half-width `halfWidth`
 */
function _angularBell(phi, centerPhi, halfWidth) {
  let diff = Math.abs(phi - centerPhi);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  if (diff >= halfWidth) return 0;
  return 0.5 * (1 + Math.cos((diff / halfWidth) * Math.PI));
}

/**
 * 👦 POPULAR BOY HAIRSTYLE: Trendy Korean 6:4 As-Perm / Dandy Cut (인기 남자 시스루 댄디 / 애즈펌)
 * - Smooth, continuous volumetric hair shell with a natural 6:4 forehead part
 * - Soft, thick bangs that curve gently across the forehead above the eyebrows (never blocking the eyes!)
 * - Clean ear-cut arches on the sides + tapered nape in the back
 */
function _buildPopularBoyHair(headGroup, hairMat) {
  const geo = _createVolumetricHairGeometry((phi) => {
    // 1. Base dandy cut length around the head
    // Back of head (phi = 1.5 * PI): extends down to nape (0.66 * PI)
    const backWeight = _angularBell(phi, 1.5 * Math.PI, 0.65 * Math.PI);

    // Ears (phi = 0 and phi = PI): neat arch over the ears (0.44 * PI)
    const leftEarArch = _angularBell(phi, 0.0, 0.22 * Math.PI);
    const rightEarArch = _angularBell(phi, Math.PI, 0.22 * Math.PI);

    // Sideburns right in front of the ears (phi = 0.16 * PI and phi = 0.84 * PI)
    const leftSideburn = _angularBell(phi, 0.16 * Math.PI, 0.09 * Math.PI);
    const rightSideburn = _angularBell(phi, 0.84 * Math.PI, 0.09 * Math.PI);

    // Front Forehead Dandy Bangs (phi around 0.5 * PI):
    // Sits cleanly at 0.375 * PI (y = +0.175, nicely above the eyebrows at y = +0.078!)
    const frontZone = _angularBell(phi, 0.5 * Math.PI, 0.38 * Math.PI);

    // 6:4 Natural As-Perm Part Notch (애즈펌 가르마 포인트 at phi = 0.46 * PI)
    const asPermPart = _angularBell(phi, 0.46 * Math.PI, 0.085 * Math.PI);

    let maxTheta =
      0.385 * Math.PI * frontZone +
      0.66 * Math.PI * backWeight +
      0.45 * Math.PI * (1 - frontZone - backWeight);

    // Arch cleanly above the ears
    maxTheta -= 0.065 * Math.PI * (leftEarArch + rightEarArch);
    // Add neat sideburns in front of the ears
    maxTheta += 0.075 * Math.PI * (leftSideburn + rightSideburn);
    // Carve the gentle 6:4 forehead part so a cute triangle of forehead shows
    maxTheta -= 0.075 * Math.PI * asPermPart;

    // Clamp front face zone strictly <= 0.385 * PI so eyebrows & eyes are 100% open!
    const strictFrontFace = _angularBell(phi, 0.5 * Math.PI, 0.28 * Math.PI);
    if (strictFrontFace > 0.2) {
      maxTheta = Math.min(maxTheta, 0.385 * Math.PI - 0.065 * Math.PI * asPermPart);
    }

    const strandGroove = 0.005 * Math.cos(phi * 18);
    const thickness = 0.058 + 0.012 * frontZone;

    return {
      maxTheta,
      thickness,
      bottomFlare: 0.006,
      strandGroove
    };
  });

  const hairMesh = new THREE.Mesh(geo, hairMat);
  hairMesh.castShadow = true;
  hairMesh.receiveShadow = true;
  headGroup.add(hairMesh);
}

/**
 * 👧 POPULAR GIRL HAIRSTYLE: Trendy Korean Rounded Full-Bang + Side-Bang C-Curl Bob
 * (인기 여자 라운드 시스루뱅 + 애교머리 사이드뱅 + 중단발 C컬 단발 + 리본 헤어핀)
 * - Smooth, continuous rounded full bangs across the forehead ending right above the eyebrows
 * - Soft cheek-framing side bangs (애교머리) curving down beside the cheeks
 * - Plush, voluminous C-curl bob wrapping around the sides and back
 * - Cute pastel coral ribbon hairpin clipped on the side
 */
function _buildPopularGirlHair(headGroup, hairMat, accentMat) {
  const geo = _createVolumetricHairGeometry((phi) => {
    // Back & Sides C-Curl Bob (phi around 1.5 * PI, wrapping around ears to phi = 0.16*PI and 0.84*PI)
    const bobBackAndSides = 1.0 - _angularBell(phi, 0.5 * Math.PI, 0.34 * Math.PI);

    // Cheek-framing Side-Bangs (애교머리 / 사이드뱅 at phi = 0.21 * PI and phi = 0.79 * PI)
    const leftSideBang = _angularBell(phi, 0.21 * Math.PI, 0.08 * Math.PI);
    const rightSideBang = _angularBell(phi, 0.79 * Math.PI, 0.08 * Math.PI);

    // Center Front Face Zone (phi ∈ [0.26 * PI, 0.74 * PI]) — Rounded Full Bangs (라운드 시스루 풀뱅)
    // Sits at theta = 0.375 * PI (y = +0.175, right above her eyebrows at y = +0.078!)
    let maxTheta = 0.375 * Math.PI + 0.38 * Math.PI * bobBackAndSides;

    // Gentle side-bang transition framing the outer temples
    maxTheta += 0.085 * Math.PI * (leftSideBang + rightSideBang);

    // Tiny delicate see-through micro-slits in the front bangs for authentic Korean see-through bang texture
    const centerFront = _angularBell(phi, 0.5 * Math.PI, 0.22 * Math.PI);
    const microSlit1 = _angularBell(phi, 0.45 * Math.PI, 0.025 * Math.PI);
    const microSlit2 = _angularBell(phi, 0.56 * Math.PI, 0.025 * Math.PI);
    maxTheta -= 0.032 * Math.PI * (microSlit1 + microSlit2);

    // Strictly guarantee the eye/eyebrow corridor (phi ∈ [0.28 * PI, 0.72 * PI]) stays above the eyebrows!
    if (centerFront > 0.25) {
      maxTheta = Math.min(maxTheta, 0.382 * Math.PI - 0.032 * Math.PI * (microSlit1 + microSlit2));
    }

    const strandGroove = 0.0045 * Math.cos(phi * 22);
    const thickness = 0.062 + 0.018 * bobBackAndSides;
    // Cute outward C-curl flare at the bottom of her bob hair!
    const bottomFlare = 0.042 * bobBackAndSides;

    return {
      maxTheta,
      thickness,
      bottomFlare,
      strandGroove
    };
  });

  const hairMesh = new THREE.Mesh(geo, hairMat);
  hairMesh.castShadow = true;
  hairMesh.receiveShadow = true;
  headGroup.add(hairMesh);

  // Cute Pastel Coral Ribbon Hairpin clipped neatly on the side of her hair!
  const pinGroup = new THREE.Group();
  pinGroup.position.set(0.36, 0.22, 0.33);
  pinGroup.rotation.y = 0.65;
  pinGroup.rotation.z = -0.28;
  pinGroup.rotation.x = -0.22;

  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 14), accentMat);
  const loopL = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.085, 14), accentMat);
  loopL.rotation.z = -Math.PI / 2;
  loopL.position.x = -0.042;
  loopL.scale.set(1, 1, 0.52);

  const loopR = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.085, 14), accentMat);
  loopR.rotation.z = Math.PI / 2;
  loopR.position.x = 0.042;
  loopR.scale.set(1, 1, 0.52);

  pinGroup.add(knot, loopL, loopR);
  headGroup.add(pinGroup);
}

/**
 * Properly proportioned cute arm extending outward from the shoulder
 */
function _createProportionedArm(sleeveMat, cuffMat, skinMat, isRight) {
  const g = new THREE.Group();

  // Rounded shoulder joint
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.082, 18, 18), sleeveMat);
  g.add(shoulder);

  // Cute moderate sleeve cylinder (0.28m length)
  const armCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.09, 0.28, 20),
    sleeveMat
  );
  armCyl.position.y = -0.14;
  armCyl.castShadow = true;
  g.add(armCyl);

  // Cute sleeve cuff ring at the wrist
  const cuff = new THREE.Mesh(
    new THREE.TorusGeometry(0.082, 0.018, 12, 24),
    cuffMat
  );
  cuff.rotation.x = Math.PI / 2;
  cuff.position.y = -0.28;
  g.add(cuff);

  // Plump skin-toned round hand below the cuff
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.086, 20, 20), skinMat);
  hand.position.y = -0.335;
  hand.scale.set(1.0, 0.95, 0.88);
  hand.castShadow = true;
  g.add(hand);

  // Cute thumb nub on the inner-front side of the hand
  const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), skinMat);
  const sideDir = isRight ? -1 : 1;
  thumb.position.set(sideDir * 0.062, -0.31, 0.042);
  g.add(thumb);

  return g;
}

function _createStubbyLeg(legMat, shoeMat) {
  const g = new THREE.Group();

  // Stubby thick pillar leg
  const legCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.132, 0.26, 24),
    legMat
  );
  legCyl.position.y = -0.14;
  legCyl.castShadow = true;
  legCyl.receiveShadow = true;
  g.add(legCyl);

  // Rounded chubby shoe
  const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.134, 24, 16), shoeMat);
  shoe.scale.set(1.02, 0.56, 1.18);
  shoe.position.set(0, -0.29, 0.025);
  shoe.castShadow = true;
  g.add(shoe);

  return g;
}

/**
 * Animates the cute character (`waddle` walk, seated pose, or idle breathing + head tilt)
 */
export function animateCuteMascot(rig, { isMoving, isSeated, hasHeldLP, elapsed }) {
  if (!rig) return;

  if (isSeated) {
    rig.bodyGroup.position.y = -0.06;
    rig.bodyGroup.rotation.z = 0;
    rig.leftLegPivot.rotation.x = -1.15;
    rig.rightLegPivot.rotation.x = -1.15;
    rig.leftArmPivot.rotation.x = -0.28;
    rig.leftArmPivot.rotation.z = -0.38; // Outward left
    rig.rightArmPivot.rotation.x = hasHeldLP ? -0.65 : -0.28;
    rig.rightArmPivot.rotation.z = 0.38; // Outward right
    rig.headGroup.rotation.z = Math.sin(elapsed * 2.2) * 0.07;
    rig.headGroup.rotation.x = Math.sin(elapsed * 1.5) * 0.04;
    return;
  }

  if (isMoving) {
    const cycle = elapsed * 10.5;
    const legSwing = Math.sin(cycle) * 0.58;

    rig.leftLegPivot.rotation.x = legSwing;
    rig.rightLegPivot.rotation.x = -legSwing;

    rig.bodyGroup.position.y = Math.abs(Math.sin(cycle)) * 0.065;
    rig.bodyGroup.rotation.z = Math.sin(cycle) * 0.055;

    // Cute head tilt while waddling
    rig.headGroup.rotation.z = -Math.sin(cycle) * 0.14;
    rig.headGroup.rotation.x = 0.03 + Math.abs(Math.cos(cycle)) * 0.04;

    // Arms spread outward (-Z rot for left arm, +Z rot for right arm) and swing!
    rig.leftArmPivot.rotation.x = -legSwing * 0.65;
    rig.leftArmPivot.rotation.z = -0.48 - Math.abs(Math.sin(cycle)) * 0.08;

    if (hasHeldLP) {
      rig.rightArmPivot.rotation.x = -0.62;
      rig.rightArmPivot.rotation.z = 0.32;
    } else {
      rig.rightArmPivot.rotation.x = legSwing * 0.65;
      rig.rightArmPivot.rotation.z = 0.48 + Math.abs(Math.sin(cycle)) * 0.08;
    }
  } else {
    rig.leftLegPivot.rotation.x = 0;
    rig.rightLegPivot.rotation.x = 0;
    rig.bodyGroup.position.y = Math.sin(elapsed * 2.6) * 0.018;
    rig.bodyGroup.rotation.z = 0;

    rig.headGroup.rotation.z = Math.sin(elapsed * 1.6) * 0.06;
    rig.headGroup.rotation.x = Math.cos(elapsed * 1.2) * 0.03;

    // Outward resting pose (-0.46 rad for left, +0.46 rad for right)
    rig.leftArmPivot.rotation.x = 0;
    rig.leftArmPivot.rotation.z = -0.46 - Math.sin(elapsed * 2.6) * 0.04;

    if (hasHeldLP) {
      rig.rightArmPivot.rotation.x = -0.62;
      rig.rightArmPivot.rotation.z = 0.32;
    } else {
      rig.rightArmPivot.rotation.x = 0;
      rig.rightArmPivot.rotation.z = 0.46 + Math.sin(elapsed * 2.6) * 0.04;
    }
  }
}
