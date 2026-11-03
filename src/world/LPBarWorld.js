import * as THREE from 'three';
import { getLPCoverDataURL, getProceduralLPCoverDataURL } from '../data/lpCatalog.js';
import { createCuteMascotCharacter, animateCuteMascot } from './CuteCharacterBuilder.js';

export class LPBarWorld {
  constructor(container, shelvesData, tablesData, callbacks = {}) {
    this.container = container;
    this.shelvesData = shelvesData;
    this.tablesData = tablesData;
    this.userSongsData = callbacks.initialUserSongs || [];
    this.callbacks = callbacks;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0907);
    this.scene.fog = new THREE.FogExp2(0x0d0907, 0.022);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.textureLoader = new THREE.TextureLoader();
    this.coverTextureCache = new Map();

    // Camera modes: 'walk' | 'shelf-closeup' | 'table-closeup' | 'zone-overview'
    this.cameraMode = 'walk';
    this.cameraOrbitAngle = 0; // User right-drag orbit offset
    this.cameraZoomDist = 7.8;
    this.cameraCurrentPos = new THREE.Vector3(0, 6.5, 6);
    this.cameraCurrentLook = new THREE.Vector3(0, 1.4, -2);
    this.cameraTargetPos = new THREE.Vector3(0, 6.5, 6);
    this.cameraTargetLook = new THREE.Vector3(0, 1.4, -2);

    // Character state
    this.charPos = new THREE.Vector3(0, 0, -5.5); // Start near the front shelves & 2p tables
    this.charRotY = 0; // Start facing toward camera (+Z) so the cute face & hairstyle are immediately visible
    this.walkTarget = null;
    this.walkTargetCallback = null;
    this.keys = {};
    this.stepTimer = 0;
    this.isSeated = false;
    this.seatedTableId = null;
    this.heldLP = null;

    // Auto shelf close-up state
    this.autoShelfCloseup = true;
    this.lastExitedShelfId = null;
    this.activeShelfId = null;
    this.nearestInteractable = null;

    // Scene object registries
    this.shelfMeshes = new Map(); // shelfId -> { group, hitBox, spotLight, activeSleeveMesh, ... }
    this.tableMeshes = new Map(); // tableId -> { group, hitBox, turntable, chairPositions, lampLight, notesParticles, ... }
    this.userCornerEntry = null; // 3D Real User Story LP Corner booth
    this.clickableObjects = [];
    this.floorMesh = null;

    // Mood lighting presets
    this.moodIndex = 0;
    this.moodPresets = [
      { name: 'Warm Amber', bg: 0x0d0907, ambient: 0xffcfa3, ambInt: 0.55, mainLight: 0xffaa55, exposure: 1.15 },
      { name: 'Midnight Blue', bg: 0x060a14, ambient: 0x7098ff, ambInt: 0.5, mainLight: 0x6ea8ff, exposure: 1.1 },
      { name: 'Velvet Crimson', bg: 0x120609, ambient: 0xff8595, ambInt: 0.5, mainLight: 0xff6b4a, exposure: 1.12 },
      { name: 'Dawn Lo-Fi', bg: 0x0b1114, ambient: 0x9be3d6, ambInt: 0.58, mainLight: 0xffd194, exposure: 1.18 }
    ];

    this._buildLighting();
    this._buildRoomArchitecture();
    this._buildFrontGenreShelves();
    this._buildUserStoryLPCorner();
    this._buildAllTablesWithTurntables();
    this._buildCharacter();
    this._buildAtmosphereParticles();
    this._bindEvents();

    this._animate();
  }

  _getCoverTexture(lp) {
    if (!lp) return null;
    if (this.coverTextureCache.has(lp.id)) {
      return this.coverTextureCache.get(lp.id);
    }

    const fallbackDataUrl = getProceduralLPCoverDataURL(lp);
    const tex = this.textureLoader.load(fallbackDataUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.coverTextureCache.set(lp.id, tex);

    // If LP has an external coverImage URL (e.g. iTunes / Spotify artwork), load it with CORS and upgrade the texture
    if (lp.coverImage && typeof lp.coverImage === 'string' && lp.coverImage.startsWith('http')) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 512, 512);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 492, 492);
        const upgraded = new THREE.CanvasTexture(canvas);
        upgraded.colorSpace = THREE.SRGBColorSpace;
        tex.image = upgraded.image;
        tex.needsUpdate = true;
      };
      img.src = lp.coverImage;
    }

    return tex;
  }

  // =========================================================================
  // 1. LIGHTING & ATMOSPHERE
  // =========================================================================
  _buildLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffcfa3, 0.55);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffe0b2, 0x1a0f0a, 0.45);
    this.scene.add(this.hemiLight);

    // Main warm overhead directional/spot glow
    this.mainDirLight = new THREE.DirectionalLight(0xffb870, 0.85);
    this.mainDirLight.position.set(6, 14, 8);
    this.mainDirLight.castShadow = true;
    this.mainDirLight.shadow.mapSize.width = 2048;
    this.mainDirLight.shadow.mapSize.height = 2048;
    this.mainDirLight.shadow.camera.near = 1;
    this.mainDirLight.shadow.camera.far = 40;
    const d = 18;
    this.mainDirLight.shadow.camera.left = -d;
    this.mainDirLight.shadow.camera.right = d;
    this.mainDirLight.shadow.camera.top = d;
    this.mainDirLight.shadow.camera.bottom = -d;
    this.mainDirLight.shadow.bias = -0.0005;
    this.scene.add(this.mainDirLight);

    // Fireplace warm flickering light on right wall
    this.fireLight = new THREE.PointLight(0xff5511, 2.2, 14, 1.5);
    this.fireLight.position.set(14.2, 1.5, 1.2);
    this.scene.add(this.fireLight);

    // Rainy window cool moonlight on left wall
    this.windowLight = new THREE.PointLight(0x4f86c6, 1.4, 14, 1.5);
    this.windowLight.position.set(-14.2, 3.5, 1.0);
    this.scene.add(this.windowLight);
  }

  cycleMood() {
    this.moodIndex = (this.moodIndex + 1) % this.moodPresets.length;
    const m = this.moodPresets[this.moodIndex];
    this.scene.background.setHex(m.bg);
    this.scene.fog.color.setHex(m.bg);
    this.ambientLight.color.setHex(m.ambient);
    this.ambientLight.intensity = m.ambInt;
    this.mainDirLight.color.setHex(m.mainLight);
    this.renderer.toneMappingExposure = m.exposure;
    return m.name;
  }

  // =========================================================================
  // 2. ROOM ARCHITECTURE (Floor, Walls, Window, Fireplace, Bar Counter)
  // =========================================================================
  _buildRoomArchitecture() {
    // Procedural wood plank floor texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d');
    fctx.fillStyle = '#261710';
    fctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 32) {
      fctx.fillStyle = y % 64 === 0 ? '#2c1b12' : '#22140d';
      fctx.fillRect(0, y, 512, 30);
      fctx.strokeStyle = '#140b07';
      fctx.lineWidth = 2;
      fctx.strokeRect(0, y, 512, 32);
      // Plank joints
      const jointX = (y * 7) % 512;
      fctx.beginPath();
      fctx.moveTo(jointX, y);
      fctx.lineTo(jointX, y + 32);
      fctx.stroke();
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(10, 10);
    floorTex.colorSpace = THREE.SRGBColorSpace;

    const floorGeo = new THREE.PlaneGeometry(34, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.55,
      metalness: 0.08
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.floorMesh.userData = { type: 'floor' };
    this.scene.add(this.floorMesh);

    // Walls (Front, Left, Right, Back)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1b120e,
      roughness: 0.85
    });
    const wainscotMat = new THREE.MeshStandardMaterial({
      color: 0x2f1d14,
      roughness: 0.65
    });

    // Front Wall (behind Genre LP Bookshelves at z = -12)
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(34, 9, 0.5), wallMat);
    frontWall.position.set(0, 4.5, -12.2);
    frontWall.receiveShadow = true;
    this.scene.add(frontWall);

    // Neon Sign on Front Wall above the 6 LP Bookshelves
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 160;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#140c09';
    sctx.fillRect(0, 0, 1024, 160);
    sctx.strokeStyle = '#d99b4e';
    sctx.lineWidth = 6;
    sctx.strokeRect(12, 12, 1000, 136);
    sctx.fillStyle = '#ffcf87';
    sctx.font = '700 44px "Cormorant Garamond", serif';
    sctx.textAlign = 'center';
    sctx.fillText('MIDNIGHT GROOVE · POPULAR VINYL ARCHIVE', 512, 76);
    sctx.fillStyle = '#d99b4e';
    sctx.font = '500 24px "Noto Sans KR", sans-serif';
    sctx.fillText('장르별 인기 LP 책장 — 가까이 가면 정면 클로즈업으로 LP를 넘겨볼 수 있습니다', 512, 122);

    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const frontBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 2.1),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    frontBanner.position.set(0, 6.4, -11.9);
    this.scene.add(frontBanner);

    // Left Wall (with Night Window)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 28), wallMat);
    leftWall.position.set(-16.8, 4.5, 0);
    this.scene.add(leftWall);

    const leftWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 28), wainscotMat);
    leftWainscot.position.set(-16.7, 0.75, 0);
    this.scene.add(leftWainscot);

    // Panoramic Night Window on Left Wall
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 512;
    winCanvas.height = 256;
    const wctx = winCanvas.getContext('2d');
    const wgrad = wctx.createLinearGradient(0, 0, 0, 256);
    wgrad.addColorStop(0, '#050b16');
    wgrad.addColorStop(0.6, '#102542');
    wgrad.addColorStop(1, '#1d2d44');
    wctx.fillStyle = wgrad;
    wctx.fillRect(0, 0, 512, 256);
    // City bokeh lights
    const bokehColors = ['#ffbe0b', '#fb5607', '#ff006e', '#3a86ff', '#8ecae6'];
    for (let i = 0; i < 65; i++) {
      wctx.fillStyle = bokehColors[i % bokehColors.length];
      wctx.globalAlpha = 0.25 + Math.random() * 0.55;
      wctx.beginPath();
      wctx.arc(Math.random() * 512, 110 + Math.random() * 130, 4 + Math.random() * 14, 0, Math.PI * 2);
      wctx.fill();
    }
    const winTex = new THREE.CanvasTexture(winCanvas);
    winTex.colorSpace = THREE.SRGBColorSpace;
    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 4.2),
      new THREE.MeshBasicMaterial({ map: winTex })
    );
    windowGlass.rotation.y = Math.PI / 2;
    windowGlass.position.set(-16.45, 4.2, 1.2);
    this.scene.add(windowGlass);

    // Right Wall (with Cozy Fireplace & Vintage Horn Speakers)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 28), wallMat);
    rightWall.position.set(16.8, 4.5, 0);
    this.scene.add(rightWall);

    this._buildFireplace(16.2, 1.2);
    this._buildBackBarCounter(0, 10.6);
  }

  _buildFireplace(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const brickMat = new THREE.MeshStandardMaterial({ color: 0x4a251b, roughness: 0.9 });
    const mantle = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 4.2), brickMat);
    mantle.position.y = 1.6;
    group.add(mantle);

    const hearth = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.6, 2.4),
      new THREE.MeshBasicMaterial({ color: 0x120804 })
    );
    hearth.position.set(-0.1, 0.9, 0);
    group.add(hearth);

    // Glowing fire embers
    const emberGeo = new THREE.SphereGeometry(0.45, 12, 12);
    this.fireGlowMesh = new THREE.Mesh(
      emberGeo,
      new THREE.MeshBasicMaterial({ color: 0xff6b1a })
    );
    this.fireGlowMesh.scale.set(0.6, 0.9, 1.8);
    this.fireGlowMesh.position.set(-0.35, 0.65, 0);
    group.add(this.fireGlowMesh);

    this.scene.add(group);
  }

  _buildBackBarCounter(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3b2114, roughness: 0.45 });
    const topMat = new THREE.MeshStandardMaterial({ color: 0x5c3420, roughness: 0.25, metalness: 0.1 });

    const counterBody = new THREE.Mesh(new THREE.BoxGeometry(14, 1.15, 1.4), woodMat);
    counterBody.position.y = 0.575;
    counterBody.castShadow = true;
    counterBody.receiveShadow = true;
    group.add(counterBody);

    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.12, 1.65), topMat);
    counterTop.position.y = 1.2;
    group.add(counterTop);

    // Back liquor shelf
    const backShelf = new THREE.Mesh(new THREE.BoxGeometry(13, 3.6, 0.5), woodMat);
    backShelf.position.set(0, 2.2, 1.8);
    group.add(backShelf);

    // Glowing bottles on back bar
    const bottleColors = [0xd99b4e, 0x5ec2b7, 0xe06d53, 0x8ecae6, 0xf4a261];
    for (let i = -5; i <= 5; i++) {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.11, 0.45, 10),
        new THREE.MeshStandardMaterial({
          color: bottleColors[Math.abs(i) % bottleColors.length],
          emissive: bottleColors[Math.abs(i) % bottleColors.length],
          emissiveIntensity: 0.35,
          roughness: 0.2
        })
      );
      bottle.position.set(i * 1.05, 1.65, 1.5);
      group.add(bottle);
    }

    const barLight = new THREE.PointLight(0xffaa44, 1.4, 10);
    barLight.position.set(0, 3.5, 0.5);
    group.add(barLight);

    this.scene.add(group);
  }

  // =========================================================================
  // 3. FRONT GENRE LP BOOKSHELVES (6 Genre Racks with Close-up 3D Records)
  // =========================================================================
  _buildFrontGenreShelves() {
    this.shelvesData.forEach((shelf, idx) => {
      const group = new THREE.Group();
      group.position.set(shelf.position.x, 0, shelf.position.z);

      // Cabinet wood frame
      const cabinetMat = new THREE.MeshStandardMaterial({
        color: shelf.woodColor || 0x4a2e1b,
        roughness: 0.5,
        metalness: 0.08
      });
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd4a359,
        roughness: 0.3,
        metalness: 0.75
      });

      // Main bookshelf body (width: 3.8m, height: 3.5m, depth: 1.1m)
      const backBoard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.5, 0.14), cabinetMat);
      backBoard.position.set(0, 1.75, -0.48);
      backBoard.castShadow = true;
      group.add(backBoard);

      // Left & Right side panels
      const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.5, 1.1), cabinetMat);
      leftSide.position.set(-1.82, 1.75, 0);
      const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.5, 1.1), cabinetMat);
      rightSide.position.set(1.82, 1.75, 0);
      group.add(leftSide, rightSide);

      // Horizontal shelves (Base, Tier 1, Tier 2, TopDiggingBin, Roof)
      [0.15, 1.05, 1.95, 2.85, 3.45].forEach((y) => {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 1.1), cabinetMat);
        plank.position.set(0, y, 0);
        group.add(plank);
      });

      // Genre Header Sign Plate on top of Bookshelf
      const headerCanvas = document.createElement('canvas');
      headerCanvas.width = 512;
      headerCanvas.height = 128;
      const hctx = headerCanvas.getContext('2d');
      hctx.fillStyle = '#18110d';
      hctx.fillRect(0, 0, 512, 128);
      hctx.strokeStyle = shelf.accent;
      hctx.lineWidth = 6;
      hctx.strokeRect(8, 8, 496, 112);

      hctx.fillStyle = shelf.accent;
      hctx.font = '700 32px "JetBrains Mono", monospace';
      hctx.textAlign = 'center';
      hctx.fillText(shelf.name, 256, 56);

      hctx.fillStyle = '#f5ebe0';
      hctx.font = '600 24px "Noto Sans KR", sans-serif';
      hctx.fillText(`${shelf.koName} · 인기 LP`, 256, 98);

      const headerTex = new THREE.CanvasTexture(headerCanvas);
      headerTex.colorSpace = THREE.SRGBColorSpace;
      const headerBoard = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.78, 0.12),
        new THREE.MeshBasicMaterial({ map: headerTex })
      );
      headerBoard.position.set(0, 3.95, 0.35);
      group.add(headerBoard);

      // Populate lower tiers (Tier 1 & Tier 2) with rows of colorful LP spines + angled jackets
      const spineColors = [0xd99b4e, 0xe76f51, 0x2a9d8f, 0xe9c46a, 0x8ecae6, 0xf4a261, 0xc77dff, 0xf2e8cf];
      for (let tier = 0; tier < 2; tier++) {
        const yCenter = 0.58 + tier * 0.9;
        // Spine rows
        for (let sx = -1.55; sx <= 1.55; sx += 0.09) {
          if (Math.abs(sx) < 0.12) continue; // divider gap
          const spine = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.72, 0.72),
            new THREE.MeshStandardMaterial({
              color: spineColors[Math.floor(Math.abs(sx * 17 + tier * 5)) % spineColors.length],
              roughness: 0.45
            })
          );
          spine.position.set(sx, yCenter, -0.04);
          spine.rotation.z = (Math.sin(sx * 10) * 0.04);
          group.add(spine);
        }
      }

      // Eye-Level Featured LP Jackets on Tier 3 (y = 2.4) facing forward!
      // When the camera zooms into this shelf, you see the records right in front of you!
      const featuredJacketMeshes = [];
      const records = shelf.records.slice(0, 4);
      records.forEach((rec, rIdx) => {
        const tex = this._getCoverTexture(rec);
        const jMat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.35
        });
        const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.74, 0.03), jMat);
        const xPos = -1.25 + rIdx * 0.83;
        jacket.position.set(xPos, 2.42, 0.18);
        jacket.rotation.x = -0.14; // Tilted slightly back on display ledge
        group.add(jacket);
        featuredJacketMeshes.push(jacket);
      });

      // Brass ledge lip on eye-level shelf
      const brassLip = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 0.05), brassMat);
      brassLip.position.set(0, 2.02, 0.48);
      group.add(brassLip);

      // Cozy Carpet Runner in front of this genre shelf
      const rugMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(shelf.accent).multiplyScalar(0.38),
        roughness: 0.9
      });
      const rug = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 1.7), rugMat);
      rug.position.set(0, 0.01, 1.55);
      rug.receiveShadow = true;
      group.add(rug);

      // Dedicated warm spotlight for this shelf
      const spot = new THREE.PointLight(shelf.accent, 1.35, 6.5);
      spot.position.set(0, 3.8, 1.6);
      group.add(spot);

      // Invisible interaction hitbox for raycasting clicks
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(3.9, 4.2, 2.2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.set(0, 2.1, 0.4);
      hitBox.userData = {
        type: 'shelf',
        shelfId: shelf.id,
        shelfIndex: idx,
        standPoint: new THREE.Vector3(shelf.position.x, 0, shelf.position.z + 2.15)
      };
      group.add(hitBox);
      this.clickableObjects.push(hitBox);

      this.scene.add(group);
      this.shelfMeshes.set(shelf.id, {
        group,
        shelfData: shelf,
        spotLight: spot,
        featuredJacketMeshes,
        hitBox,
        standPoint: new THREE.Vector3(shelf.position.x, 0, shelf.position.z + 2.15)
      });
    });
  }

  // =========================================================================
  // 3B. REAL USER RECOMMENDED LP CORNER (찐 유저 추천 사연 LP 코너 & 청음 부스)
  // =========================================================================
  _buildUserStoryLPCorner() {
    const cornerPos = { x: -14.8, z: -6.4 };
    const standPoint = new THREE.Vector3(-12.25, 0, -6.4);

    const group = new THREE.Group();
    group.position.set(cornerPos.x, 0, cornerPos.z);
    group.rotation.y = Math.PI / 2; // Facing +X toward the center lounge

    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0x3b1d36,
      roughness: 0.42,
      metalness: 0.12
    });
    const counterWoodMat = new THREE.MeshStandardMaterial({
      color: 0x4f2a3c,
      roughness: 0.32,
      metalness: 0.1
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xffcf87,
      roughness: 0.25,
      metalness: 0.82
    });
    const neonPinkMat = new THREE.MeshStandardMaterial({
      color: 0xff5e97,
      emissive: 0xff2a7a,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });
    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x00b8e6,
      emissiveIntensity: 0.75,
      roughness: 0.2
    });

    // Main booth backboard & side frames (4.2m wide, 3.7m tall)
    const backBoard = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.7, 0.16), cabinetMat);
    backBoard.position.set(0, 1.85, -0.5);
    backBoard.castShadow = true;
    group.add(backBoard);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.7, 1.2), cabinetMat);
    leftWall.position.set(-2.02, 1.85, 0);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.7, 1.2), cabinetMat);
    rightWall.position.set(2.02, 1.85, 0);
    group.add(leftWall, rightWall);

    // Neon side accent strips
    const leftNeon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.5, 0.06), neonPinkMat);
    leftNeon.position.set(-2.02, 1.85, 0.62);
    const rightNeon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.5, 0.06), neonCyanMat);
    rightNeon.position.set(2.02, 1.85, 0.62);
    group.add(leftNeon, rightNeon);

    // Horizontal shelves + Listening Counter Desk at y = 1.05
    [0.15, 1.05, 1.98, 2.88, 3.62].forEach((y, idx) => {
      const depth = idx === 1 ? 1.45 : 1.15;
      const zOff = idx === 1 ? 0.14 : 0;
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, idx === 1 ? 0.12 : 0.1, depth),
        idx === 1 ? counterWoodMat : cabinetMat
      );
      plank.position.set(0, y, zOff);
      group.add(plank);
    });

    // Top Glowing Signboard ("💌 찐 유저 추천 사연 LP 코너")
    const headerCanvas = document.createElement('canvas');
    headerCanvas.width = 640;
    headerCanvas.height = 160;
    const hctx = headerCanvas.getContext('2d');
    const hgrad = hctx.createLinearGradient(0, 0, 640, 160);
    hgrad.addColorStop(0, '#24112c');
    hgrad.addColorStop(0.5, '#3b1538');
    hgrad.addColorStop(1, '#16243b');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 640, 160);

    hctx.strokeStyle = '#ff6b9d';
    hctx.lineWidth = 6;
    hctx.strokeRect(8, 8, 624, 144);
    hctx.strokeStyle = '#00d4ff';
    hctx.lineWidth = 2;
    hctx.strokeRect(16, 16, 608, 128);

    hctx.fillStyle = '#00d4ff';
    hctx.font = '700 24px "JetBrains Mono", monospace';
    hctx.textAlign = 'center';
    hctx.fillText('★ USER STORY & LISTENING CORNER ★', 320, 52);

    hctx.fillStyle = '#fff4d6';
    hctx.font = '700 34px "Noto Sans KR", sans-serif';
    hctx.fillText('💌 찐 유저 추천 사연 LP 코너', 320, 98);

    hctx.fillStyle = '#ff9ebb';
    hctx.font = '500 20px "Noto Sans KR", sans-serif';
    hctx.fillText('1인칭 시점으로 사연과 함께 음악을 들어보세요', 320, 132);

    const headerTex = new THREE.CanvasTexture(headerCanvas);
    headerTex.colorSpace = THREE.SRGBColorSpace;
    const headerBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.92, 0.14),
      new THREE.MeshBasicMaterial({ map: headerTex })
    );
    headerBoard.position.set(0, 4.18, 0.36);
    group.add(headerBoard);

    // Lower tier colorful vinyl spines
    const spineColors = [0xff6b9d, 0xc084fc, 0x7dd3fc, 0xfcd34d, 0xffb088, 0x00d4ff];
    for (let sx = -1.75; sx <= 1.75; sx += 0.085) {
      if (Math.abs(sx) < 0.55) continue;
      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.72, 0.72),
        new THREE.MeshStandardMaterial({
          color: spineColors[Math.floor(Math.abs(sx * 19)) % spineColors.length],
          roughness: 0.4
        })
      );
      spine.position.set(sx, 0.56, -0.05);
      spine.rotation.z = Math.sin(sx * 9) * 0.04;
      group.add(spine);
    }

    // Story Postcard Notes pinned on the backboard (Tier 2 at y = 1.52)
    const postcardColors = [0xfff4d6, 0xffd6e7, 0xd6f5ff, 0xe8d6ff, 0xffe8cc];
    for (let i = 0; i < 6; i++) {
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.34, 0.015),
        new THREE.MeshBasicMaterial({ color: postcardColors[i % postcardColors.length] })
      );
      const px = -1.55 + i * 0.62;
      const py = 1.54 + (i % 2 === 0 ? 0.06 : -0.05);
      card.position.set(px, py, -0.39);
      card.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.06;
      group.add(card);
    }

    // Eye-Level Featured User LP Jackets (Tier 3 at y = 2.42)
    const featuredJacketMeshes = [];
    for (let rIdx = 0; rIdx < 4; rIdx++) {
      const rec = this.userSongsData[rIdx];
      const tex = rec ? this._getCoverTexture(rec) : null;
      const jMat = new THREE.MeshStandardMaterial({
        map: tex,
        color: 0xffffff,
        roughness: 0.32
      });
      const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.035), jMat);
      jacket.position.set(-1.32 + rIdx * 0.88, 2.42, 0.18);
      jacket.rotation.x = -0.14;
      group.add(jacket);
      featuredJacketMeshes.push({ mesh: jacket, mat: jMat });
    }

    // Brass ledge lip on eye-level shelf
    const brassLip = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.05, 0.05), brassMat);
    brassLip.position.set(0, 2.04, 0.5);
    group.add(brassLip);

    // Built-in 3D Listening Station Turntable right on the User Corner Counter (y = 1.11)
    const cornerTurntable = this._create3DTurntable();
    cornerTurntable.group.position.set(0, 1.11, 0.36);
    group.add(cornerTurntable.group);

    // Cozy reading lamp on the User Corner counter
    const cornerLamp = this._createTableLamp();
    cornerLamp.position.set(-1.15, 1.11, 0.42);
    group.add(cornerLamp);

    // Carpet Runner in front of the User LP Corner
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0x5c2248,
      roughness: 0.88
    });
    const rug = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.02, 1.9), rugMat);
    rug.position.set(0, 0.01, 1.65);
    rug.receiveShadow = true;
    group.add(rug);

    // Dedicated warm magenta-gold spotlight
    const spot = new THREE.PointLight(0xff7eb3, 1.85, 8.0);
    spot.position.set(0, 3.9, 1.8);
    group.add(spot);

    // Floating 3D Badge Sprite above the User LP Corner so users spot it immediately
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 512;
    badgeCanvas.height = 112;
    const bctx = badgeCanvas.getContext('2d');
    bctx.fillStyle = 'rgba(34, 14, 38, 0.94)';
    bctx.strokeStyle = '#ff6b9d';
    bctx.lineWidth = 4;
    bctx.beginPath();
    bctx.roundRect(8, 8, 496, 96, 22);
    bctx.fill();
    bctx.stroke();

    bctx.textAlign = 'center';
    bctx.fillStyle = '#00d4ff';
    bctx.font = '700 20px "JetBrains Mono", monospace';
    bctx.fillText('★ NEW · 1인칭 사연 청음 부스 ★', 256, 40);
    bctx.fillStyle = '#fff4d6';
    bctx.font = '700 25px "Noto Sans KR", sans-serif';
    bctx.fillText('💌 찐 유저 추천 LP 코너 (클릭 / E)', 256, 78);

    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    badgeTex.colorSpace = THREE.SRGBColorSpace;
    const badgeSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: badgeTex, transparent: true, depthTest: false })
    );
    badgeSprite.scale.set(2.8, 0.62, 1);
    badgeSprite.position.set(0, 4.95, 0.5);
    group.add(badgeSprite);

    // Invisible interaction hitbox for raycasting clicks
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(4.3, 4.5, 2.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.set(0, 2.2, 0.5);
    hitBox.userData = {
      type: 'user-corner',
      standPoint: standPoint.clone()
    };
    group.add(hitBox);
    this.clickableObjects.push(hitBox);

    this.scene.add(group);
    this.userCornerEntry = {
      id: 'user-corner',
      group,
      position: cornerPos,
      standPoint,
      spotLight: spot,
      featuredJacketMeshes,
      turntable: cornerTurntable,
      badgeSprite,
      hitBox,
      activeLP: this.userSongsData[0] || null,
      isPlaying: false
    };

    this.updateUserCornerVisuals(this.userSongsData, this.userSongsData[0] || null, false);
  }

  updateUserCornerVisuals(userSongs, activeLP = null, isPlaying = false) {
    if (!this.userCornerEntry) return;
    if (Array.isArray(userSongs)) {
      this.userSongsData = userSongs;
    }

    const { featuredJacketMeshes, turntable } = this.userCornerEntry;
    this.userCornerEntry.activeLP = activeLP || this.userSongsData[0] || null;
    this.userCornerEntry.isPlaying = Boolean(isPlaying);

    // Update the 4 eye-level featured user LP jackets
    featuredJacketMeshes.forEach((slot, idx) => {
      const rec = this.userSongsData[idx];
      if (rec) {
        const tex = this._getCoverTexture(rec);
        slot.mat.map = tex;
        slot.mat.needsUpdate = true;
        slot.mesh.visible = true;
      } else {
        slot.mesh.visible = false;
      }
    });

    // Update the 3D turntable on the User LP Corner counter
    const lpOnPlatter = this.userCornerEntry.activeLP;
    if (lpOnPlatter) {
      const tex = this._getCoverTexture(lpOnPlatter);
      turntable.vinylDisc.visible = true;
      turntable.centerLabel.visible = true;
      turntable.centerLabelMat.map = tex;
      turntable.centerLabelMat.color.setHex(0xffffff);
      turntable.centerLabelMat.needsUpdate = true;

      turntable.standJacketMesh.visible = true;
      turntable.standJacketMat.map = tex;
      turntable.standJacketMat.needsUpdate = true;
    }

    if (this.userCornerEntry.isPlaying && lpOnPlatter) {
      turntable.targetArmAngle = 0.46;
      turntable.ledMat.color.setHex(0xff5e97);
    } else {
      turntable.targetArmAngle = 0.0;
      turntable.ledMat.color.setHex(0x554433);
    }
  }

  // =========================================================================
  // 4. 2-PERSON & 4-PERSON TABLES WITH INDIVIDUAL 3D TURNTABLES
  // =========================================================================
  _buildAllTablesWithTurntables() {
    const woodTableMat = new THREE.MeshStandardMaterial({
      color: 0x4a2916,
      roughness: 0.35,
      metalness: 0.08
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e22,
      roughness: 0.4,
      metalness: 0.7
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd9a04e,
      roughness: 0.28,
      metalness: 0.8
    });
    const cushion2PMat = new THREE.MeshStandardMaterial({
      color: 0x6e2b23,
      roughness: 0.65
    });
    const cushion4PMat = new THREE.MeshStandardMaterial({
      color: 0x23423b,
      roughness: 0.65
    });

    this.tablesData.forEach((tData) => {
      const is4P = tData.capacity === 4;
      const group = new THREE.Group();
      group.position.set(tData.position.x, 0, tData.position.z);

      // 1) Tabletop & Pedestal
      const tableW = is4P ? 2.65 : 1.75;
      const tableD = is4P ? 1.65 : 1.45;
      const tableH = 0.82;

      const topMesh = new THREE.Mesh(
        new THREE.BoxGeometry(tableW, 0.09, tableD),
        woodTableMat
      );
      topMesh.position.y = tableH;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      // Brass rim accent around tabletop
      const rimMesh = new THREE.Mesh(
        new THREE.BoxGeometry(tableW + 0.03, 0.04, tableD + 0.03),
        brassMat
      );
      rimMesh.position.y = tableH - 0.01;
      group.add(rimMesh);

      // Table legs / pedestal
      if (is4P) {
        [-0.95, 0.95].forEach((lx) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, tableH, 12), darkMetalMat);
          leg.position.set(lx, tableH / 2, 0);
          const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.05, 16), brassMat);
          base.position.set(lx, 0.025, 0);
          group.add(leg, base);
        });
      } else {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, tableH, 12), darkMetalMat);
        leg.position.set(0, tableH / 2, 0);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.05, 16), brassMat);
        base.position.set(0, 0.025, 0);
        group.add(leg, base);
      }

      // 2) Chairs (2 chairs for 2-person table, 4 chairs for 4-person table)
      const chairWorldSeats = [];
      const chairConfigs = is4P
        ? [
            { x: -0.65, z: -1.18, rotY: 0 },
            { x: 0.65, z: -1.18, rotY: 0 },
            { x: -0.65, z: 1.18, rotY: Math.PI },
            { x: 0.65, z: 1.18, rotY: Math.PI }
          ]
        : [
            { x: -1.18, z: 0, rotY: Math.PI / 2 },
            { x: 1.18, z: 0, rotY: -Math.PI / 2 }
          ];

      chairConfigs.forEach((cfg) => {
        const chair = this._createChairMesh(is4P ? cushion4PMat : cushion2PMat, woodTableMat);
        chair.position.set(cfg.x, 0, cfg.z);
        chair.rotation.y = cfg.rotY;
        group.add(chair);

        chairWorldSeats.push({
          pos: new THREE.Vector3(tData.position.x + cfg.x, 0, tData.position.z + cfg.z),
          rotY: cfg.rotY
        });
      });

      // 3) Dedicated 3D LP Turntable on the Table!
      const ttPos = is4P ? { x: 0, y: tableH + 0.045, z: 0 } : { x: 0, y: tableH + 0.045, z: -0.1 };
      const turntable = this._create3DTurntable();
      turntable.group.position.set(ttPos.x, ttPos.y, ttPos.z);
      group.add(turntable.group);

      // 4) Warm Table Lamp + Whiskey Glasses on Coasters
      const lampPos = is4P ? { x: -0.88, z: -0.42 } : { x: -0.55, z: 0.38 };
      const lampGroup = this._createTableLamp();
      lampGroup.position.set(lampPos.x, tableH + 0.045, lampPos.z);
      group.add(lampGroup);

      const tableLight = new THREE.PointLight(0xffad52, 0.9, 5.2);
      tableLight.position.set(0, tableH + 0.95, 0);
      group.add(tableLight);

      // Floating Table Code Sign above table
      const labelSprite = this._createTableLabelSprite(tData);
      labelSprite.position.set(0, tableH + 1.45, 0);
      group.add(labelSprite);

      // Whiskey Glasses & Coasters
      const glassOffsets = is4P
        ? [
            { x: -0.75, z: 0.45 },
            { x: 0.75, z: 0.45 },
            { x: 0.75, z: -0.45 }
          ]
        : [
            { x: 0.55, z: 0.35 },
            { x: -0.52, z: -0.35 }
          ];
      glassOffsets.forEach((go) => {
        const coaster = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.01, 16),
          new THREE.MeshStandardMaterial({ color: 0xd8b88a })
        );
        coaster.position.set(go.x, tableH + 0.05, go.z);
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.055, 0.13, 12),
          new THREE.MeshStandardMaterial({
            color: 0xe09f3e,
            transparent: true,
            opacity: 0.78,
            roughness: 0.15
          })
        );
        glass.position.set(go.x, tableH + 0.12, go.z);
        group.add(coaster, glass);
      });

      // Invisible clickable hitbox for the whole table
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(tableW + 1.2, 2.0, tableD + 1.2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.set(0, 1.0, 0);
      hitBox.userData = {
        type: 'table',
        tableId: tData.id,
        standPoint: new THREE.Vector3(tData.position.x, 0, tData.position.z + (is4P ? 1.55 : 1.25))
      };
      group.add(hitBox);
      this.clickableObjects.push(hitBox);

      this.scene.add(group);
      this.tableMeshes.set(tData.id, {
        group,
        tableData: tData,
        turntable,
        chairWorldSeats,
        tableLight,
        labelSprite,
        hitBox
      });
    });
  }

  _createChairMesh(cushionMat, woodMat) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.09, 0.58), cushionMat);
    seat.position.y = 0.48;
    seat.castShadow = true;
    g.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.09), cushionMat);
    back.position.set(0, 0.76, -0.25);
    back.castShadow = true;
    g.add(back);

    [
      [-0.24, -0.24],
      [0.24, -0.24],
      [-0.24, 0.24],
      [0.24, 0.24]
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.48, 8), woodMat);
      leg.position.set(lx, 0.24, lz);
      g.add(leg);
    });
    return g;
  }

  _create3DTurntable() {
    const group = new THREE.Group();

    // 1) Walnut Plinth (Turntable base)
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.09, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x5c3018, roughness: 0.3, metalness: 0.1 })
    );
    plinth.position.y = 0.045;
    plinth.castShadow = true;
    group.add(plinth);

    // Brushed aluminum top plate
    const topPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.70, 0.015, 0.56),
      new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.35, metalness: 0.75 })
    );
    topPlate.position.y = 0.092;
    group.add(topPlate);

    // 2) Spinning Platter + Vinyl Record Group
    const platterGroup = new THREE.Group();
    platterGroup.position.set(-0.07, 0.105, 0);

    const metalPlatter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.245, 0.022, 32),
      new THREE.MeshStandardMaterial({ color: 0xbec4cc, roughness: 0.25, metalness: 0.85 })
    );
    platterGroup.add(metalPlatter);

    // Black Vinyl Record Disc (visible when an LP is placed on this table)
    const vinylDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 0.008, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 0.2, metalness: 0.45 })
    );
    vinylDisc.position.y = 0.014;
    vinylDisc.visible = false;
    platterGroup.add(vinylDisc);

    // Vinyl Center Label (textured with the LP cover art!)
    const centerLabelMat = new THREE.MeshBasicMaterial({ color: 0xd99b4e });
    const centerLabel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.082, 0.011, 24),
      centerLabelMat
    );
    centerLabel.position.y = 0.015;
    centerLabel.visible = false;
    platterGroup.add(centerLabel);

    // Center spindle
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.045, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 })
    );
    spindle.position.y = 0.022;
    platterGroup.add(spindle);

    group.add(platterGroup);

    // 3) Pivoting Tonearm (바늘 / 톤암)
    const tonearmPivot = new THREE.Group();
    tonearmPivot.position.set(0.22, 0.125, -0.16);

    const baseGimbal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4a359, metalness: 0.85, roughness: 0.2 })
    );
    tonearmPivot.add(baseGimbal);

    const armBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.34, 10),
      new THREE.MeshStandardMaterial({ color: 0xe5e5e5, metalness: 0.9, roughness: 0.15 })
    );
    armBar.rotation.x = Math.PI / 2;
    armBar.position.set(0, 0.025, 0.13);
    tonearmPivot.add(armBar);

    const cartridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.022, 0.055),
      new THREE.MeshStandardMaterial({ color: 0xd9534f })
    );
    cartridge.position.set(-0.01, 0.018, 0.29);
    tonearmPivot.add(cartridge);

    // Rest angle = 0; Playing angle = 0.46 rad (swung over the vinyl disc)
    tonearmPivot.rotation.y = 0;
    group.add(tonearmPivot);

    // 4) Power / Strobe LED
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x554433 });
    const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), ledMat);
    ledMesh.position.set(-0.28, 0.105, 0.21);
    group.add(ledMesh);

    // 5) "Now Playing" LP Jacket Stand next to the turntable
    const standGroup = new THREE.Group();
    standGroup.position.set(0.46, 0.21, -0.14);
    standGroup.rotation.y = -0.35;
    standGroup.rotation.x = -0.18;

    const standJacketMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const standJacketMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.38, 0.018),
      standJacketMat
    );
    standJacketMesh.visible = false;
    standGroup.add(standJacketMesh);
    group.add(standGroup);

    return {
      group,
      platterGroup,
      vinylDisc,
      centerLabel,
      centerLabelMat,
      tonearmPivot,
      ledMat,
      standJacketMesh,
      standJacketMat,
      targetArmAngle: 0
    };
  }

  _createTableLamp() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.03, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4a359, metalness: 0.8, roughness: 0.25 })
    );
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4a359, metalness: 0.8 })
    );
    stem.position.y = 0.14;
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.16, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xffd28a,
        emissive: 0xff9e3d,
        emissiveIntensity: 0.65,
        side: THREE.DoubleSide
      })
    );
    shade.position.y = 0.28;
    g.add(base, stem, shade);
    return g;
  }

  _createTableLabelSprite(tData) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    this._drawTableSpriteCanvas(ctx, tData);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.9, 0.48, 1);
    sprite.userData = { canvas, ctx, tex };
    return sprite;
  }

  _drawTableSpriteCanvas(ctx, tData) {
    ctx.clearRect(0, 0, 384, 96);
    ctx.fillStyle = tData.isPlaying ? 'rgba(38, 22, 12, 0.92)' : 'rgba(18, 14, 12, 0.78)';
    ctx.strokeStyle = tData.isPlaying ? '#ffae42' : 'rgba(217, 155, 78, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(6, 6, 372, 84, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = tData.capacity === 4 ? '#7cd4b8' : '#ffcf87';
    ctx.font = '700 22px "Noto Sans KR", sans-serif';
    ctx.fillText(`${tData.capacity}인석 · ${tData.code}`, 192, 38);

    ctx.fillStyle = '#e8dfd5';
    ctx.font = '500 18px "Noto Sans KR", sans-serif';
    if (tData.currentLP) {
      const statusIcon = tData.isPlaying ? '🎵 ' : '⏸ ';
      const shortT = tData.currentLP.title.length > 18 ? tData.currentLP.title.slice(0, 17) + '…' : tData.currentLP.title;
      ctx.fillText(statusIcon + shortT, 192, 68);
    } else {
      ctx.fillStyle = '#a39589';
      ctx.fillText('💿 턴테이블 대기 중', 192, 68);
    }
  }

  updateTableTurntableVisual(tableId) {
    const entry = this.tableMeshes.get(tableId);
    if (!entry) return;
    const { tableData, turntable, tableLight, labelSprite } = entry;

    if (tableData.currentLP) {
      const tex = this._getCoverTexture(tableData.currentLP);
      turntable.vinylDisc.visible = true;
      turntable.centerLabel.visible = true;
      turntable.centerLabelMat.map = tex;
      turntable.centerLabelMat.color.setHex(0xffffff);
      turntable.centerLabelMat.needsUpdate = true;

      turntable.standJacketMesh.visible = true;
      turntable.standJacketMat.map = tex;
      turntable.standJacketMat.needsUpdate = true;
    } else {
      turntable.vinylDisc.visible = false;
      turntable.centerLabel.visible = false;
      turntable.standJacketMesh.visible = false;
    }

    if (tableData.isPlaying && tableData.currentLP) {
      turntable.targetArmAngle = 0.46; // Tonearm over vinyl groove
      turntable.ledMat.color.setHex(0xff7722);
      tableLight.intensity = 1.65;
    } else {
      turntable.targetArmAngle = 0.0; // Tonearm on rest
      turntable.ledMat.color.setHex(0x554433);
      tableLight.intensity = 0.9;
    }

    // Redraw floating label
    const { ctx, tex } = labelSprite.userData;
    this._drawTableSpriteCanvas(ctx, tableData);
    tex.needsUpdate = true;
  }

  // =========================================================================
  // 5. 3D CUTE CHARACTER (Single selected Boy or Girl with `캐릭터샘플.png` proportions)
  // =========================================================================
  _buildCharacter() {
    this.playerGender = 'male'; // 'male' | 'female'

    // Player container group
    this.charGroup = new THREE.Group();
    this.charGroup.position.copy(this.charPos);

    // Build both cute 2-head-tall rigs (only the selected one is visible/attached)
    this.maleRig = createCuteMascotCharacter('male');
    this.femaleRig = createCuteMascotCharacter('female');

    // Soft warm key light following the character
    const charGlow = new THREE.PointLight(0xffe6c2, 0.65, 5.0);
    charGlow.position.set(0, 2.3, 0.4);
    this.charGroup.add(charGlow);

    this.scene.add(this.charGroup);

    this._attachRigsByGender();
  }

  _attachRigsByGender() {
    if (this.maleRig.root.parent) {
      this.maleRig.root.parent.remove(this.maleRig.root);
    }
    if (this.femaleRig.root.parent) {
      this.femaleRig.root.parent.remove(this.femaleRig.root);
    }

    this.activePlayerRig = this.playerGender === 'male' ? this.maleRig : this.femaleRig;
    this.charGroup.add(this.activePlayerRig.root);

    // Sync held LP onto active player rig
    this.setCharacterHeldLP(this.heldLP);
  }

  setPlayerGender(gender) {
    if (gender !== 'male' && gender !== 'female') return;
    if (this.playerGender === gender) return;

    if (this.activePlayerRig) {
      this.activePlayerRig.heldLPMesh.visible = false;
    }

    this.playerGender = gender;
    this._attachRigsByGender();

    // Turn character toward the camera when switching so the user can see the face & hair
    if (!this.isSeated && this.cameraMode === 'walk') {
      this.charRotY = this.cameraOrbitAngle;
      this.charGroup.rotation.y = this.charRotY;
    }
  }

  setCharacterHeldLP(lp) {
    this.heldLP = lp;
    if (!this.activePlayerRig) return;

    if (lp) {
      const tex = this._getCoverTexture(lp);
      this.activePlayerRig.heldLPMat.map = tex;
      this.activePlayerRig.heldLPMat.needsUpdate = true;
      this.activePlayerRig.heldLPMesh.visible = true;
    } else {
      this.activePlayerRig.heldLPMesh.visible = false;
    }
  }

  // =========================================================================
  // 6. ATMOSPHERE PARTICLES (Floating Dust Motes & Spinning Table Notes)
  // =========================================================================
  _buildAtmosphereParticles() {
    const count = 140;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = 0.5 + Math.random() * 6.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd699,
      size: 0.06,
      transparent: true,
      opacity: 0.45
    });
    this.dustPoints = new THREE.Points(geo, mat);
    this.scene.add(this.dustPoints);
  }

  // =========================================================================
  // 7. CAMERA TRANSITIONS (Walk View, Shelf Front Close-Up, Table Close-Up)
  // =========================================================================
  enterShelfCloseup(shelfId) {
    const entry = this.shelfMeshes.get(shelfId);
    if (!entry) return;

    this.isSeated = false;
    this.seatedTableId = null;
    this.walkTarget = null;
    this.activeShelfId = shelfId;
    this.cameraMode = 'shelf-closeup';

    // Move character neatly in front of this shelf facing it
    this.charPos.set(entry.shelfData.position.x, 0, entry.shelfData.position.z + 2.1);
    this.charRotY = Math.PI; // Facing -Z (straight at the shelf)
    this.charGroup.position.copy(this.charPos);
    this.charGroup.rotation.y = this.charRotY;

    // 1st-person front-facing close-up camera looking directly at the shelf's records
    const sx = entry.shelfData.position.x;
    const sz = entry.shelfData.position.z;
    this.cameraTargetPos.set(sx, 2.42, sz + 1.85);
    this.cameraTargetLook.set(sx, 2.38, sz - 0.2);

    if (this.callbacks.onEnterShelfCloseup) {
      this.callbacks.onEnterShelfCloseup(entry.shelfData);
    }
  }

  exitShelfCloseup() {
    if (this.activeShelfId) {
      this.lastExitedShelfId = this.activeShelfId;
    }
    this.activeShelfId = null;
    this.cameraMode = 'walk';
    // Step character slightly back so they can freely walk around
    this.charPos.z = Math.min(this.charPos.z + 0.65, 8.5);
  }

  enterUserCornerCloseup() {
    if (!this.userCornerEntry) return;

    this.isSeated = false;
    this.seatedTableId = null;
    this.walkTarget = null;
    this.activeShelfId = 'user-corner';
    this.cameraMode = 'user-corner-closeup';

    // Move character neatly in front of the User Story LP Corner facing it (-X)
    const sp = this.userCornerEntry.standPoint;
    this.charPos.copy(sp);
    this.charRotY = -Math.PI / 2; // Facing -X directly at the User LP Corner
    this.charGroup.position.copy(this.charPos);
    this.charGroup.rotation.y = this.charRotY;

    // 1st-Person front-facing close-up camera looking straight into the User Story LP Corner
    const cx = this.userCornerEntry.position.x;
    const cz = this.userCornerEntry.position.z;
    this.cameraTargetPos.set(cx + 2.35, 2.32, cz);
    this.cameraTargetLook.set(cx - 0.2, 2.22, cz);

    if (this.callbacks.onEnterUserCornerCloseup) {
      this.callbacks.onEnterUserCornerCloseup();
    }
  }

  exitUserCornerCloseup() {
    if (this.activeShelfId === 'user-corner') {
      this.lastExitedShelfId = 'user-corner';
    }
    this.activeShelfId = null;
    this.cameraMode = 'walk';
    this.charPos.x = Math.min(this.charPos.x + 0.7, 14.0);
    this.charGroup.position.copy(this.charPos);
  }

  sitAtTable(tableId) {
    const entry = this.tableMeshes.get(tableId);
    if (!entry) return;

    this.activeShelfId = null;
    this.walkTarget = null;
    this.isSeated = true;
    this.seatedTableId = tableId;
    this.cameraMode = 'table-closeup';

    // Place player character on Chair #0 of this table
    const seat0 = entry.chairWorldSeats[0];
    this.charPos.copy(seat0.pos);
    this.charRotY = seat0.rotY;
    this.charGroup.position.copy(this.charPos);
    this.charGroup.rotation.y = this.charRotY;

    // Camera glides to a warm close-up view of this table & its 3D turntable
    const tx = entry.tableData.position.x;
    const tz = entry.tableData.position.z;
    this.cameraTargetPos.set(tx + 0.55, 1.72, tz + 1.18);
    this.cameraTargetLook.set(tx, 0.92, tz - 0.05);

    if (this.callbacks.onSitAtTable) {
      this.callbacks.onSitAtTable(entry.tableData);
    }
  }

  leaveTable() {
    if (!this.isSeated) return;
    const prevTableId = this.seatedTableId;
    this.isSeated = false;
    this.seatedTableId = null;
    this.cameraMode = 'walk';

    const entry = this.tableMeshes.get(prevTableId);
    if (entry) {
      this.charPos.set(
        entry.tableData.position.x,
        0,
        entry.tableData.position.z + (entry.tableData.capacity === 4 ? 1.85 : 1.45)
      );
      this.charGroup.position.copy(this.charPos);
    }
  }

  focusZone(zone) {
    if (zone === 'walk') {
      this.exitShelfCloseup();
      this.exitUserCornerCloseup();
      this.leaveTable();
      this.cameraMode = 'walk';
    } else if (zone === 'user-corner') {
      this.leaveTable();
      this.enterUserCornerCloseup();
    } else if (zone === 'shelves') {
      this.exitUserCornerCloseup();
      this.leaveTable();
      // Walk character to the front shelves corridor
      this.charPos.set(0, 0, -8.2);
      this.charRotY = Math.PI;
      this.cameraMode = 'walk';
    } else if (zone === 'tables-2p') {
      this.exitShelfCloseup();
      this.exitUserCornerCloseup();
      this.leaveTable();
      this.charPos.set(0, 0, -2.2);
      this.charRotY = 0;
      this.cameraMode = 'walk';
    } else if (zone === 'tables-4p') {
      this.exitShelfCloseup();
      this.exitUserCornerCloseup();
      this.leaveTable();
      this.charPos.set(0, 0, 4.2);
      this.charRotY = 0;
      this.cameraMode = 'walk';
    }
  }

  // =========================================================================
  // 8. INPUT EVENTS (Keyboard WASD/Arrows, Mouse Click-to-Walk/Interact, Orbit)
  // =========================================================================
  _bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Right-click drag to orbit camera in walk mode, wheel to zoom
    let isRightDragging = false;
    let prevX = 0;
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        isRightDragging = true;
        prevX = e.clientX;
      } else if (e.button === 0 && this.cameraMode === 'walk') {
        this._handleCanvasClick(e);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isRightDragging) {
        const dx = e.clientX - prevX;
        prevX = e.clientX;
        this.cameraOrbitAngle -= dx * 0.006;
      }
    });

    window.addEventListener('mouseup', () => {
      isRightDragging = false;
    });

    this.renderer.domElement.addEventListener(
      'wheel',
      (e) => {
        if (this.cameraMode === 'walk') {
          this.cameraZoomDist = Math.max(4.2, Math.min(13.5, this.cameraZoomDist + e.deltaY * 0.005));
        }
      },
      { passive: true }
    );
  }

  _handleCanvasClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1) Check if clicked a Shelf or a Table
    const hits = this.raycaster.intersectObjects(this.clickableObjects, false);
    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (data.type === 'user-corner') {
        const dist = this.charPos.distanceTo(data.standPoint);
        if (dist < 2.9) {
          this.enterUserCornerCloseup();
        } else {
          this.walkTarget = data.standPoint.clone();
          this.walkTargetCallback = () => this.enterUserCornerCloseup();
        }
        return;
      }
      if (data.type === 'shelf') {
        const dist = this.charPos.distanceTo(data.standPoint);
        if (dist < 2.9) {
          this.enterShelfCloseup(data.shelfId);
        } else {
          this.walkTarget = data.standPoint.clone();
          this.walkTargetCallback = () => this.enterShelfCloseup(data.shelfId);
        }
        return;
      }
      if (data.type === 'table') {
        const dist = this.charPos.distanceTo(data.standPoint);
        if (dist < 2.9) {
          this.sitAtTable(data.tableId);
        } else {
          this.walkTarget = data.standPoint.clone();
          this.walkTargetCallback = () => this.sitAtTable(data.tableId);
        }
        return;
      }
    }

    // 2) Otherwise check floor click to walk
    if (this.floorMesh) {
      const floorHit = this.raycaster.intersectObject(this.floorMesh);
      if (floorHit.length > 0) {
        const pt = floorHit[0].point;
        this.walkTarget = new THREE.Vector3(
          Math.max(-14.5, Math.min(14.5, pt.x)),
          0,
          Math.max(-9.2, Math.min(8.8, pt.z))
        );
        this.walkTargetCallback = null;
      }
    }
  }

  // =========================================================================
  // 9. MAIN ANIMATION & PROXIMITY LOOP
  // =========================================================================
  _animate() {
    requestAnimationFrame(() => this._animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    this._updateCharacterMovement(dt, elapsed);
    this._updateProximityAndAutoCloseup();
    this._updateTurntablesAndLights(dt, elapsed);
    this._updateCamera(dt);

    this.renderer.render(this.scene, this.camera);
  }

  _updateCharacterMovement(dt, elapsed) {
    if (this.cameraMode !== 'walk' || this.isSeated) {
      // Idle seated / shelf-browsing pose for player character
      animateCuteMascot(this.activePlayerRig, {
        isMoving: false,
        isSeated: this.isSeated,
        hasHeldLP: Boolean(this.heldLP),
        elapsed
      });
      return;
    }

    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // If user presses manual movement keys, cancel click-to-walk target
    if (moveX !== 0 || moveZ !== 0) {
      this.walkTarget = null;
      this.walkTargetCallback = null;
    }

    let isMoving = false;
    const speed = 5.4;

    if (moveX !== 0 || moveZ !== 0) {
      isMoving = true;
      const moveVec = new THREE.Vector3(moveX, 0, moveZ).normalize();
      moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraOrbitAngle);

      this.charPos.x += moveVec.x * speed * dt;
      this.charPos.z += moveVec.z * speed * dt;
      this.charRotY = Math.atan2(moveVec.x, moveVec.z);
    } else if (this.walkTarget) {
      const diff = new THREE.Vector3().subVectors(this.walkTarget, this.charPos);
      diff.y = 0;
      const dist = diff.length();
      if (dist > 0.2) {
        isMoving = true;
        diff.normalize();
        this.charPos.x += diff.x * speed * dt;
        this.charPos.z += diff.z * speed * dt;
        this.charRotY = Math.atan2(diff.x, diff.z);
      } else {
        this.walkTarget = null;
        if (this.walkTargetCallback) {
          const cb = this.walkTargetCallback;
          this.walkTargetCallback = null;
          cb();
        }
      }
    }

    // Clamp inside bar room bounds
    this.charPos.x = Math.max(-14.6, Math.min(14.6, this.charPos.x));
    this.charPos.z = Math.max(-9.1, Math.min(8.6, this.charPos.z));

    this.charGroup.position.copy(this.charPos);
    this.charGroup.rotation.y = this.charRotY;

    // Animate cute 2-head-tall waddling character (`캐릭터샘플.png` proportions)
    animateCuteMascot(this.activePlayerRig, {
      isMoving,
      isSeated: false,
      hasHeldLP: Boolean(this.heldLP),
      elapsed
    });

    if (isMoving) {
      this.stepTimer += dt;
      if (this.stepTimer > 0.34) {
        this.stepTimer = 0;
        if (this.callbacks.onFootstep) this.callbacks.onFootstep();
      }
    }
  }

  _updateProximityAndAutoCloseup() {
    if (this.cameraMode !== 'walk') {
      if (this.callbacks.onProximityChange) {
        this.callbacks.onProximityChange(null);
      }
      return;
    }

    // Clear lastExitedShelfId once character steps away from that shelf or user corner
    if (this.lastExitedShelfId) {
      if (this.lastExitedShelfId === 'user-corner' && this.userCornerEntry) {
        if (this.charPos.distanceTo(this.userCornerEntry.standPoint) > 2.55) {
          this.lastExitedShelfId = null;
        }
      } else {
        const exitedShelf = this.shelfMeshes.get(this.lastExitedShelfId);
        if (exitedShelf && this.charPos.distanceTo(exitedShelf.standPoint) > 2.55) {
          this.lastExitedShelfId = null;
        }
      }
    }

    let closest = null;
    let minDist = Infinity;

    // 0) Check distance to the Real User Story LP Corner (찐 유저 추천 사연 LP 코너)
    if (this.userCornerEntry) {
      const d = this.charPos.distanceTo(this.userCornerEntry.standPoint);
      if (d < 2.6 && d < minDist) {
        minDist = d;
        closest = {
          type: 'user-corner',
          id: 'user-corner',
          data: {
            code: 'USER STORY CORNER',
            name: '찐 유저 추천 사연 LP 코너',
            subtitle: '유저들이 직접 고른 인생곡과 사연을 1인칭 청음 시점으로 감상해보세요'
          },
          dist: d
        };
      }
    }

    // 1) Check distance to the 6 Genre LP Bookshelves
    for (const [shelfId, entry] of this.shelfMeshes.entries()) {
      const d = this.charPos.distanceTo(entry.standPoint);
      if (d < 2.4 && d < minDist) {
        minDist = d;
        closest = {
          type: 'shelf',
          id: shelfId,
          data: entry.shelfData,
          dist: d
        };
      }
    }

    // 2) Check distance to the 8 Tables (2-person & 4-person)
    for (const [tableId, entry] of this.tableMeshes.entries()) {
      const d = this.charPos.distanceTo(new THREE.Vector3(entry.tableData.position.x, 0, entry.tableData.position.z));
      if (d < 2.65 && d < minDist) {
        minDist = d;
        closest = {
          type: 'table',
          id: tableId,
          data: entry.tableData,
          dist: d
        };
      }
    }

    // Trigger Auto Close-up if walking right up to the User LP Corner or a Genre Bookshelf
    if (
      closest &&
      closest.type === 'user-corner' &&
      this.autoShelfCloseup &&
      closest.dist < 1.85 &&
      this.lastExitedShelfId !== 'user-corner'
    ) {
      this.enterUserCornerCloseup();
      return;
    }

    if (
      closest &&
      closest.type === 'shelf' &&
      this.autoShelfCloseup &&
      closest.dist < 1.75 &&
      this.lastExitedShelfId !== closest.id
    ) {
      this.enterShelfCloseup(closest.id);
      return;
    }

    this.nearestInteractable = closest;
    if (this.callbacks.onProximityChange) {
      this.callbacks.onProximityChange(closest);
    }
  }

  _updateTurntablesAndLights(dt, elapsed) {
    // Rotate spinning platters & animate tonearms on all 8 tables
    for (const entry of this.tableMeshes.values()) {
      const { tableData, turntable } = entry;
      if (tableData.isPlaying && tableData.currentLP) {
        const rpmSpeed = tableData.rpm === 45 ? 4.7 : 3.49; // rad/sec
        turntable.platterGroup.rotation.y -= rpmSpeed * dt;
      }
      // Smoothly interpolate tonearm angle
      turntable.tonearmPivot.rotation.y +=
        (turntable.targetArmAngle - turntable.tonearmPivot.rotation.y) * Math.min(1, dt * 6);
    }

    // Rotate spinning platter & tonearm on the 3D User Story LP Corner turntable
    if (this.userCornerEntry) {
      const { turntable, isPlaying, activeLP } = this.userCornerEntry;
      if (isPlaying && activeLP) {
        const rpmSpeed = activeLP.rpm === 45 ? 4.7 : 3.49;
        turntable.platterGroup.rotation.y -= rpmSpeed * dt;
      }
      turntable.tonearmPivot.rotation.y +=
        (turntable.targetArmAngle - turntable.tonearmPivot.rotation.y) * Math.min(1, dt * 6);
    }

    // Flicker fireplace light
    if (this.fireLight) {
      this.fireLight.intensity = 2.0 + Math.sin(elapsed * 9) * 0.25 + Math.cos(elapsed * 15) * 0.15;
    }

    // Slowly drift dust particles
    if (this.dustPoints) {
      this.dustPoints.rotation.y = elapsed * 0.015;
    }
  }

  _updateCamera(dt) {
    if (this.cameraMode === 'walk') {
      const offset = new THREE.Vector3(0, this.cameraZoomDist * 0.62, this.cameraZoomDist);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraOrbitAngle);

      this.cameraTargetPos.copy(this.charPos).add(offset);
      this.cameraTargetLook.set(this.charPos.x, 1.35, this.charPos.z - 1.2);
    }

    const lerpSpeed = Math.min(1, dt * 6.5);
    this.cameraCurrentPos.lerp(this.cameraTargetPos, lerpSpeed);
    this.cameraCurrentLook.lerp(this.cameraTargetLook, lerpSpeed);

    this.camera.position.copy(this.cameraCurrentPos);
    this.camera.lookAt(this.cameraCurrentLook);
  }
}
