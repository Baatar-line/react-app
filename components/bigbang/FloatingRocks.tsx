'use client';

import { useEffect, useRef } from 'react';

type ThreeWindow = Window & typeof globalThis & { THREE?: any };
type PlaceCard = { name: string; sub?: string; rating?: string | number; thumb?: string; onClick?: () => void };

export default function FloatingRocks({ places, mapOpen = false, onReady }: { places: PlaceCard[]; mapOpen?: boolean; onReady?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const placesRef = useRef(places);
  const mapOpenRef = useRef(mapOpen);
  placesRef.current = places;
  mapOpenRef.current = mapOpen;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    let retry = 0;

    const start = () => {
      const host = hostRef.current;
      const THREE = (window as ThreeWindow).THREE;
      if (!host || !THREE) {
        retry = window.setTimeout(start, 100);
        return;
      }

      const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
      const lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;
      const hash = (n: number) => {
        const value = Math.sin(n) * 43758.5453123;
        return value - Math.floor(value);
      };
      const noise3 = (x: number, y: number, z: number) => {
        const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
        const fx = x - ix, fy = y - iy, fz = z - iz;
        const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
        const n = ix + iy * 57 + iz * 113;
        const mix = (a: number, b: number, t: number) => a + (b - a) * t;
        return mix(
          mix(mix(hash(n), hash(n + 1), ux), mix(hash(n + 57), hash(n + 58), ux), uy),
          mix(mix(hash(n + 113), hash(n + 114), ux), mix(hash(n + 170), hash(n + 171), ux), uy),
          uz,
        );
      };
      const fbm = (x: number, y: number, z: number, octaves: number) => {
        let amplitude = 0.5, frequency = 1, sum = 0;
        for (let i = 0; i < octaves; i += 1) {
          sum += amplitude * noise3(x * frequency, y * frequency, z * frequency);
          frequency *= 2.07;
          amplitude *= 0.5;
        }
        return sum;
      };
      const smooth = (edge0: number, edge1: number, value: number) => {
        const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
      };

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0a1610, 0.04);
      const cliffScene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120);
      camera.position.set(0, 0, 11);
      const cliffCamera = camera.clone();

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.setClearColor(0x0a1610, 0);
      // Foreground WebGL layer: floating rocks and atmosphere. Cards live
      // beneath this canvas, while page navigation remains above the host.
      renderer.domElement.className = 'pointer-events-none absolute inset-0 z-[4] h-full w-full touch-none';
      host.appendChild(renderer.domElement);

      const cliffRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      cliffRenderer.setSize(window.innerWidth, window.innerHeight);
      cliffRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      cliffRenderer.outputColorSpace = THREE.SRGBColorSpace;
      cliffRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      cliffRenderer.toneMappingExposure = 1.18;
      cliffRenderer.setClearColor(0x07100b, 0);
      cliffRenderer.domElement.className = 'pointer-events-none absolute inset-0 z-[1] h-full w-full touch-none';
      host.appendChild(cliffRenderer.domElement);

      scene.add(new THREE.HemisphereLight(0xcad8bd, 0x07100b, 0.9));
      const key = new THREE.DirectionalLight(0xffecd0, 2.15);
      key.position.set(4, 7, 8.5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x6fa879, 0.48);
      fill.position.set(-6, 0, 1.5);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xc2ef57, 1.05);
      rim.position.set(-3, 4, -8);
      scene.add(rim);
      const interactiveLight = new THREE.PointLight(0xd9ff9a, 0, 7.5, 2);
      interactiveLight.position.set(0, 0, 5);
      scene.add(interactiveLight);
      // The cliff is rendered separately so DOM cards can occupy the layer
      // between it and the foreground stones.
      cliffScene.add(new THREE.HemisphereLight(0xcad8bd, 0x07100b, 1.05));
      const cliffKey = new THREE.DirectionalLight(0xffecd0, 2.05);
      cliffKey.position.set(4, 7, 8.5);
      cliffScene.add(cliffKey);
      const cliffRim = new THREE.DirectionalLight(0xa7d94e, 0.72);
      cliffRim.position.set(-4, 3, 2);
      cliffScene.add(cliffRim);

      const stoneA = new THREE.Color(0xb4afa5);
      const stoneB = new THREE.Color(0x68665f);
      const mossA = new THREE.Color(0x789646);
      const mossB = new THREE.Color(0xb5d969);
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = textureCanvas.height = 256;
      const textureContext = textureCanvas.getContext('2d')!;
      const textureImage = textureContext.createImageData(256, 256);
      for (let y = 0; y < 256; y += 1) {
        for (let x = 0; x < 256; x += 1) {
          const broad = fbm(x / 38, y / 38, 3.7, 4);
          const pores = fbm(x / 7, y / 7, 12.4, 3);
          const shade = Math.round(clamp(118 + broad * 105 + pores * 32, 0, 255));
          const pixel = (y * 256 + x) * 4;
          textureImage.data[pixel] = shade;
          textureImage.data[pixel + 1] = shade;
          textureImage.data[pixel + 2] = shade;
          textureImage.data[pixel + 3] = 255;
        }
      }
      textureContext.putImageData(textureImage, 0, 0);
      const surfaceTexture = new THREE.CanvasTexture(textureCanvas);
      surfaceTexture.wrapS = surfaceTexture.wrapT = THREE.RepeatWrapping;
      surfaceTexture.repeat.set(2.4, 1.8);
      surfaceTexture.colorSpace = THREE.SRGBColorSpace;
      surfaceTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const textureManager = new THREE.LoadingManager();
      textureManager.onLoad = () => requestAnimationFrame(() => onReady?.());
      const textureLoader = new THREE.TextureLoader(textureManager);
      const referenceTextures = [
        '/assets/rocks/moss-rock-1.jpg',
        '/assets/rocks/moss-rock-2.jpg',
        '/assets/rocks/moss-rock-3.jpg',
      ].map((url, index) => {
        const texture = textureLoader.load(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.repeat.set(1.15 + index * 0.12, 0.72);
        texture.offset.set(index * 0.13, 0.12 + index * 0.05);
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return texture;
      });
      const cliffTexture = textureLoader.load('/assets/rocks/moss-cliff-reference.jpg');
      cliffTexture.colorSpace = THREE.SRGBColorSpace;
      cliffTexture.wrapS = cliffTexture.wrapT = THREE.MirroredRepeatWrapping;
      cliffTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      // Full-bleed rock face behind the floating stones. The supplied photo is
      // used as albedo while the subdivided plane is physically displaced, so
      // light and pointer parallax reveal actual relief instead of a flat image.
      // Oversized beyond the camera frustum so the reference is naturally
      // cropped at every viewport ratio and reads as a massive rock wall.
      const cliffGeometry = new THREE.PlaneGeometry(65, 42, 120, 78);
      const cliffPositions = cliffGeometry.attributes.position;
      const cliffVertex = new THREE.Vector3();
      for (let i = 0; i < cliffPositions.count; i += 1) {
        cliffVertex.fromBufferAttribute(cliffPositions, i);
        const broad = fbm(cliffVertex.x * 0.105 + 4.1, cliffVertex.y * 0.12, 8.3, 5);
        const fractured = fbm(cliffVertex.x * 0.42, cliffVertex.y * 0.46 + 2.4, 17.1, 4);
        const fine = fbm(cliffVertex.x * 1.15 + 9.2, cliffVertex.y * 1.1, 23.7, 2);
        const shelf = Math.sin((cliffVertex.y + fractured * 1.2) * 1.55) * 0.16;
        // Terrace-like shelves and deeper broken pockets give the silhouette
        // the heavy mass of a cliff rather than a softly rippled sheet.
        const pocket = Math.pow(Math.max(0, 0.46 - fractured), 1.7) * 2.4;
        cliffPositions.setZ(i, (broad - 0.5) * 3.35 + (fractured - 0.5) * 0.86 + (fine - 0.5) * 0.14 + shelf * 1.2 - pocket * 1.15);
      }
      cliffGeometry.computeVertexNormals();
      const cliffMaterial = new THREE.MeshStandardMaterial({
        map: cliffTexture,
        // The reference image also drives micro relief: its bright moss rises
        // subtly above the dark stone and stays aligned with the colour map.
        bumpMap: cliffTexture,
        bumpScale: 0.24,
        displacementMap: cliffTexture,
        displacementScale: 0.34,
        displacementBias: -0.14,
        roughness: 0.91,
        metalness: 0,
        color: 0xaeb99d,
        emissive: 0x050b06,
        emissiveIntensity: 0.1,
      });
      const cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
      // Farther than every rock (the farthest floating rock is z=-6.8), its
      // shadows and all particles. renderOrder is an extra guard for the
      // transparent atmospheric layers drawn later.
      cliff.position.set(1.15, 0, -18);
      cliff.rotation.set(-0.018, -0.022, 0);
      cliff.renderOrder = -20;
      cliffScene.add(cliff);
      const buildRock = (seed: number, detail: number) => {
        const geometry = new THREE.IcosahedronGeometry(1, detail);
        const positions = geometry.attributes.position;
        const colors = new Float32Array(positions.count * 3);
        const vertex = new THREE.Vector3();
        const color = new THREE.Color();
        for (let i = 0; i < positions.count; i += 1) {
          vertex.fromBufferAttribute(positions, i).normalize();
          const lobes = fbm(vertex.x * 1.35 + seed, vertex.y * 1.35 + seed * 0.7, vertex.z * 1.35, 3);
          const crag = fbm(vertex.x * 4.4 + seed * 2, vertex.y * 4.4, vertex.z * 4.4 + seed, 4);
          const pits = fbm(vertex.x * 13 + seed, vertex.y * 13 - seed, vertex.z * 13, 3);
          // Broad mass + chipped planes + a faint sedimentary band. Keeping
          // the highest-frequency contribution small avoids a melted look.
          const strata = Math.sin((vertex.y * 8.5 + crag * 1.8 + seed) * Math.PI) * 0.018;
          const chipped = Math.pow(Math.abs(crag - 0.5) * 2, 2.4) * 0.09;
          vertex.multiplyScalar(1 + (lobes - 0.5) * 0.78 + (crag - 0.5) * 0.23 + (pits - 0.5) * 0.035 + strata - chipped);
          positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
          const up = clamp(vertex.y / vertex.length(), -1, 1);
          const patch = fbm(vertex.x * 2.6 + seed * 3, vertex.y * 2.6, vertex.z * 2.6, 3);
          // Broad connected colonies: elevation decides where moss can grow,
          // while low-frequency noise breaks the edge into natural patches.
          const moss = smooth(0.27, 0.61, patch * 0.56 + up * 0.52 + 0.1);
          const grit = fbm(vertex.x * 9 + 40, vertex.y * 9, vertex.z * 9, 2);
          color.copy(stoneB).lerp(stoneA, smooth(0.35, 0.7, grit));
          color.lerp(mossA.clone().lerp(mossB, smooth(0.4, 0.75, grit)), moss);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        // Recalculate normals from the displaced surface. This gives the
        // larger cuts honest highlights instead of the waxy, spherical
        // shading produced by radial normals.
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        return geometry;
      };

      // Fixed opening composition: keep the stones gently scattered across
      // the viewport instead of letting the whole group read as one cluster.
      // These are deliberately static seeds/coordinates, so every fresh
      // visit starts from the same balanced arrangement.
      const layout = [
        { p: [0.9, 0.2, -0.8], s: 2.05, seed: 1.7, spin: 0.055 },
        { p: [-4.25, 2.35, -3.4], s: 1.12, seed: 5.1, spin: 0.085 },
        { p: [4.15, -2.05, -2.2], s: 1.3, seed: 9.3, spin: -0.07 },
        { p: [-4.45, -2.45, 1.6], s: 0.78, seed: 14.2, spin: 0.12 },
        { p: [4.35, 2.55, 1.1], s: 0.68, seed: 21.6, spin: -0.1 },
        { p: [-2.6, -0.45, -6.8], s: 0.92, seed: 27.4, spin: 0.065 },
        { p: [5.7, 0.75, -4.1], s: 1.02, seed: 32.8, spin: -0.078 },
        { p: [-5.65, -1.05, -3.2], s: 1.08, seed: 38.6, spin: 0.072 },
      ];
      const rocks = layout.map((config, index) => {
        const material = new THREE.MeshPhysicalMaterial({
          vertexColors: true,
          map: referenceTextures[index % referenceTextures.length],
          bumpMap: surfaceTexture,
          bumpScale: 0.075,
          roughness: 0.84,
          metalness: 0,
          clearcoat: 0.015,
          clearcoatRoughness: 0.94,
        });
        const mesh = new THREE.Mesh(buildRock(config.seed, config.s > 1.3 ? 6 : 5), material);
        mesh.scale.set(config.s, config.s * (0.78 + (index % 3) * 0.12), config.s * 0.92);
        mesh.rotation.set(config.seed, config.seed * 1.7 + (index === 0 ? Math.PI : 0), config.seed * 0.4);
        const base = new THREE.Vector3(...config.p);
        mesh.position.copy(base);
        scene.add(mesh);
        return {
          mesh, material, base, spin: config.spin,
          amplitude: new THREE.Vector3(0.18 + (index % 3) * 0.06, 0.28 + (index % 2) * 0.1, 0.12),
          speed: new THREE.Vector3(0.1 + index * 0.013, 0.075 + index * 0.016, 0.06 + index * 0.01),
          phase: new THREE.Vector3(index * 1.9, index * 2.7 + 1.1, index * 3.3),
          velocity: new THREE.Vector3(), angularVelocity: new THREE.Vector2(), offset: new THREE.Vector3(),
          dragging: false, depth: 0, glow: 0, grabOffset: new THREE.Vector3(),
        };
      });

      // Camera-facing, feathered occlusion beneath each rock separates close
      // objects from the background without requiring an artificial floor.
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = shadowCanvas.height = 128;
      const shadowContext = shadowCanvas.getContext('2d')!;
      const shadowGradient = shadowContext.createRadialGradient(64, 64, 3, 64, 64, 62);
      shadowGradient.addColorStop(0, 'rgba(0,0,0,.72)');
      shadowGradient.addColorStop(0.45, 'rgba(0,0,0,.26)');
      shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
      shadowContext.fillStyle = shadowGradient;
      shadowContext.fillRect(0, 0, 128, 128);
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const rockShadows = rocks.map((rock, index) => {
        const material = new THREE.SpriteMaterial({
          map: shadowTexture,
          color: 0x020604,
          transparent: true,
          opacity: index === 0 ? 0.28 : 0.2,
          depthWrite: false,
          depthTest: true,
          blending: THREE.NormalBlending,
        });
        const sprite = new THREE.Sprite(material);
        const scale = layout[index].s * 2.35;
        sprite.scale.set(scale, scale * 0.58, 1);
        scene.add(sprite);
        return { sprite, material, rock };
      });

      // A restrained field of dust catches the rim light and gives the empty
      // areas depth. Points are intentionally tiny and slow, never star-like.
      const dustPositions = new Float32Array(72 * 3);
      for (let i = 0; i < 72; i += 1) {
        dustPositions[i * 3] = (hash(i * 9.17) - 0.5) * 15;
        dustPositions[i * 3 + 1] = (hash(i * 13.31) - 0.5) * 9;
        dustPositions[i * 3 + 2] = -5 + hash(i * 21.73) * 10;
      }
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      const dustMaterial = new THREE.PointsMaterial({
        color: 0xd8e9b3,
        size: 0.018,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const dust = new THREE.Points(dustGeometry, dustMaterial);
      scene.add(dust);

      // Small fragments make the large stones feel like weathered rock rather
      // than isolated spheres. They share the same material language, but are
      // deliberately sparse so the navigation remains the visual priority.
      const fragments = Array.from({ length: 14 }, (_, index) => {
        const parent = rocks[index % rocks.length];
        const angle = hash(index * 7.13) * Math.PI * 2;
        const radius = 1.15 + hash(index * 11.9) * 1.25;
        const geometry = buildRock(48 + index * 1.73, 2);
        const material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          map: referenceTextures[index % referenceTextures.length],
          bumpMap: surfaceTexture,
          bumpScale: 0.035,
          roughness: 0.94,
          metalness: 0,
        });
        const mesh = new THREE.Mesh(geometry, material);
        const size = 0.055 + hash(index * 19.1) * 0.095;
        mesh.scale.set(size * 1.25, size * 0.72, size);
        mesh.rotation.set(hash(index) * 5, hash(index + 2) * 5, hash(index + 4) * 5);
        scene.add(mesh);
        return {
          mesh, material, parent,
          local: new THREE.Vector3(Math.cos(angle) * radius, (hash(index * 3.4) - 0.5) * 1.5, Math.sin(angle) * radius * 0.55),
          phase: index * 0.83,
        };
      });

      const svgNamespace = 'http://www.w3.org/2000/svg';
      const tetherLayer = document.createElementNS(svgNamespace, 'svg');
      tetherLayer.classList.add('hidden');
      const cardLayout = [
        { rock: 1, at: [-1.9, 2.45, 1.2] },
        { rock: 3, at: [-1.55, -2.35, 1.8] },
        { rock: 2, at: [4.25, -0.45, 2.2] },
      ];
      const cards = cardLayout.map((config, index) => {
        const element = document.createElement('div');
        // DOM cards must sit above the WebGL canvas (z-2). The cliff now fills
        // that canvas, so the old z-1 value placed cards invisibly behind it.
        element.className = 'floating-rock-card absolute left-0 top-0 z-[3] cursor-grab select-none rounded-lg border border-[rgba(194,239,87,.2)] backdrop-blur-[6px]';
        element.style.width = '210px';
        element.style.height = '140px';
        element.innerHTML = '<span class="floating-case-photo"></span><i class="floating-case-screw screw-tl"></i><i class="floating-case-screw screw-tr"></i><i class="floating-case-screw screw-bl"></i><i class="floating-case-screw screw-br"></i><span class="floating-place-rating"></span><span class="floating-place-name"></span><span class="floating-place-sub"></span>';
        host.appendChild(element);
        const line = document.createElementNS(svgNamespace, 'line');
        line.setAttribute('stroke', 'rgba(194,239,87,.32)');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '3 4');
        const knot = document.createElementNS(svgNamespace, 'circle');
        knot.setAttribute('r', '3');
        knot.setAttribute('fill', 'none');
        knot.setAttribute('stroke', 'rgba(194,239,87,.5)');
        tetherLayer.append(line, knot);
        return {
          element, line, knot, rockIndex: config.rock,
          anchor: new THREE.Vector3(...config.at), velocity: new THREE.Vector3(),
          phase: index * 2.4, speed: 0.22 + index * 0.05,
          dragging: false, depth: 0, grabOffset: new THREE.Vector3(), tilt: 0, tiltTarget: 0,
          halfWidth: 105, halfHeight: 70, placeKey: '', moved: false,
          revealOffset: new THREE.Vector3(), revealAmount: 0,
        };
      });
      const syncPlaceCards = () => {
        const currentPlaces = placesRef.current.filter(Boolean);
        cards.forEach((card, index) => {
          const place = currentPlaces.length ? currentPlaces[index % currentPlaces.length] : undefined;
          const key = place ? `${place.name}-${place.sub || ''}-${place.thumb || ''}` : '';
          // Older hot-reloaded versions painted the photo on the outer case.
          // Always clear it so only the recessed inner plate owns the image.
          card.element.style.backgroundImage = '';
          if (key === card.placeKey) return;
          card.placeKey = key;
          const photo = card.element.querySelector('.floating-case-photo') as HTMLElement;
          photo.style.backgroundImage = place?.thumb || '';
          card.element.setAttribute('aria-label', place?.name || '');
          const rating = card.element.querySelector('.floating-place-rating') as HTMLElement;
          const name = card.element.querySelector('.floating-place-name') as HTMLElement;
          const sub = card.element.querySelector('.floating-place-sub') as HTMLElement;
          rating.textContent = place ? `★ ${place.rating ?? ''}` : '';
          name.textContent = place?.name || '';
          sub.textContent = place?.sub || '';
        });
      };
      syncPlaceCards();

      const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const dragPoint = new THREE.Vector3();
      let dragged: any = null;
      let hovered: any = null;
      let pointerX = -1, pointerY = -1;
      let draggedCard: any = null;
      const toWorld = (x: number, y: number, depth: number) => dragPoint.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, depth).unproject(camera);
      const wallDistance = 400;
      const returnInset = 80;
      const restitution = 0.72;
      const restSpeed = 3.6e-5;
      const projectedPoint = new THREE.Vector3();
      const previousPoint = new THREE.Vector3();
      const correction = new THREE.Vector3();
      const screenPoint = { x: 0, y: 0 };
      const projectToScreen = (position: any) => {
        projectedPoint.copy(position).project(camera);
        screenPoint.x = (projectedPoint.x * 0.5 + 0.5) * innerWidth;
        screenPoint.y = (-projectedPoint.y * 0.5 + 0.5) * innerHeight;
      };
      const moveToScreenPoint = (position: any, x: number, y: number) => {
        previousPoint.copy(position);
        position.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, projectedPoint.z).unproject(camera);
        correction.copy(position).sub(previousPoint);
      };
      const bounceAtWall = (position: any, velocity: any) => {
        projectToScreen(position);
        let x = screenPoint.x, y = screenPoint.y;
        let hit = false;
        if (x < -wallDistance) { x = -wallDistance; velocity.x = Math.abs(velocity.x) * restitution; hit = true; }
        else if (x > innerWidth + wallDistance) { x = innerWidth + wallDistance; velocity.x = -Math.abs(velocity.x) * restitution; hit = true; }
        if (y < -wallDistance) { y = -wallDistance; velocity.y = -Math.abs(velocity.y) * restitution; hit = true; }
        else if (y > innerHeight + wallDistance) { y = innerHeight + wallDistance; velocity.y = Math.abs(velocity.y) * restitution; hit = true; }
        if (hit) moveToScreenPoint(position, x, y);
        else correction.set(0, 0, 0);
      };
      const returnToScreen = (position: any, strength = 0.02) => {
        projectToScreen(position);
        let x = screenPoint.x, y = screenPoint.y;
        if (x < returnInset) x += (returnInset - x) * strength;
        else if (x > innerWidth - returnInset) x += (innerWidth - returnInset - x) * strength;
        if (y < returnInset) y += (returnInset - y) * strength;
        else if (y > innerHeight - returnInset) y += (innerHeight - returnInset - y) * strength;
        if (x !== screenPoint.x || y !== screenPoint.y) moveToScreenPoint(position, x, y);
        else correction.set(0, 0, 0);
      };
      const pick = (x: number, y: number) => {
        ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(rocks.map((rock) => rock.mesh), false)[0];
        return hit ? rocks.find((rock) => rock.mesh === hit.object) : null;
      };
      const onPointerDown = (event: PointerEvent) => {
        const rock = pick(event.clientX, event.clientY);
        if (!rock) return;
        host.setPointerCapture(event.pointerId);
        dragged = rock;
        rock.dragging = true;
        rock.velocity.set(0, 0, 0);
        rock.angularVelocity.set(0, 0);
        rock.depth = rock.mesh.position.clone().project(camera).z;
        rock.grabOffset.copy(rock.mesh.position).sub(toWorld(event.clientX, event.clientY, rock.depth));
      };
      const onPointerMove = (event: PointerEvent) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!dragged) {
          mouse.targetX = (event.clientX / innerWidth) * 2 - 1;
          mouse.targetY = -(event.clientY / innerHeight) * 2 + 1;
          return;
        }
        const wanted = toWorld(event.clientX, event.clientY, dragged.depth).add(dragged.grabOffset);
        const nextBase = wanted.clone().sub(dragged.offset);
        dragged.velocity.copy(nextBase).sub(dragged.base).multiplyScalar(0.5);
        dragged.angularVelocity.y += dragged.velocity.x * 0.09;
        dragged.angularVelocity.x += dragged.velocity.y * 0.06;
        dragged.base.copy(nextBase);
      };
      const onPointerUp = () => {
        if (dragged) dragged.dragging = false;
        dragged = null;
      };
      const onResize = () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        cliffCamera.aspect = innerWidth / innerHeight;
        cliffCamera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        cliffRenderer.setSize(innerWidth, innerHeight);
        const compact = innerWidth < 768;
        rocks.forEach((rock, index) => { rock.mesh.visible = !compact || index < 5; });
        rockShadows.forEach((shadow, index) => { shadow.sprite.visible = !compact || index < 5; });
        fragments.forEach((fragment, index) => { fragment.mesh.visible = !compact && index < 12; });
        dust.visible = !compact;
      };
      host.addEventListener('pointerdown', onPointerDown);
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerup', onPointerUp);
      host.addEventListener('pointercancel', onPointerUp);
      cards.forEach((card, index) => {
        card.halfWidth = card.element.offsetWidth / 2;
        card.halfHeight = card.element.offsetHeight / 2;
        card.element.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          event.stopPropagation();
          card.element.setPointerCapture(event.pointerId);
          card.dragging = true;
          card.moved = false;
          card.element.classList.add('floating-rock-card-dragging');
          draggedCard = card;
          card.depth = card.anchor.clone().project(camera).z;
          card.grabOffset.copy(card.anchor).sub(toWorld(event.clientX, event.clientY, card.depth));
          card.velocity.set(0, 0, 0);
        });
        card.element.addEventListener('pointermove', (event) => {
          if (!card.dragging) return;
          card.moved = true;
          const next = toWorld(event.clientX, event.clientY, card.depth).add(card.grabOffset);
          card.velocity.copy(next).sub(card.anchor).multiplyScalar(0.55);
          card.tiltTarget = clamp(card.velocity.x * -7, -9, 9);
          card.anchor.copy(next);
        });
        const releaseCard = () => {
          card.dragging = false;
          card.element.classList.remove('floating-rock-card-dragging');
          card.tiltTarget = 0;
          draggedCard = null;
        };
        card.element.addEventListener('pointerup', releaseCard);
        card.element.addEventListener('pointercancel', releaseCard);
        card.element.addEventListener('click', () => {
          if (card.moved) return;
          const currentPlaces = placesRef.current.filter(Boolean);
          currentPlaces[index % currentPlaces.length]?.onClick?.();
        });
      });
      window.addEventListener('resize', onResize);
      onResize();

      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const clock = new THREE.Clock();
      let animationFrame = 0;
      let frame = 0;
      const animate = () => {
        if (disposed) return;
        animationFrame = requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.05);
        const time = clock.elapsedTime;
        const motion = reducedMotion ? 0 : 1;
        if (frame % 30 === 0) syncPlaceCards();
        mouse.x = lerp(mouse.x, mouse.targetX, 0.035);
        mouse.y = lerp(mouse.y, mouse.targetY, 0.035);
        camera.position.set(mouse.x * 1.5 * motion, mouse.y * motion, 11 + Math.sin(time * 0.09) * 0.35 * motion);
        camera.lookAt(0, 0, 0);
        cliffCamera.position.copy(camera.position);
        cliffCamera.quaternion.copy(camera.quaternion);
        cliff.rotation.y = -0.022 + mouse.x * 0.0035 * motion;
        cliff.rotation.x = -0.018 - mouse.y * 0.0025 * motion;
        interactiveLight.position.set(mouse.x * 4.8, mouse.y * 3.2, 5);
        interactiveLight.intensity = lerp(interactiveLight.intensity, pointerX >= 0 && !reducedMotion ? 0.72 : 0.22, 0.045);
        dust.rotation.z = Math.sin(time * 0.035) * 0.018 * motion;
        dust.position.y = Math.sin(time * 0.07) * 0.08 * motion;
        if (!dragged && frame % 3 === 0 && pointerX >= 0) hovered = pick(pointerX, pointerY);

        rocks.forEach((rock) => {
          if (!rock.dragging && rock.velocity.lengthSq() > 1e-7) {
            rock.base.add(rock.velocity);
            rock.velocity.multiplyScalar(0.968);
          }
          rock.offset.set(
            Math.sin(time * rock.speed.x + rock.phase.x) * rock.amplitude.x * motion,
            Math.sin(time * rock.speed.y + rock.phase.y) * rock.amplitude.y * motion,
            Math.sin(time * rock.speed.z + rock.phase.z) * rock.amplitude.z * motion,
          );
          rock.mesh.position.copy(rock.base).add(rock.offset);
          if (!rock.dragging) {
            bounceAtWall(rock.mesh.position, rock.velocity);
            rock.base.add(correction);
            if (rock.velocity.lengthSq() < restSpeed) {
              returnToScreen(rock.mesh.position);
              rock.base.add(correction);
            }
          }
          rock.angularVelocity.multiplyScalar(0.95);
          rock.mesh.rotation.y += rock.spin * delta * motion + rock.angularVelocity.y;
          rock.mesh.rotation.x += rock.spin * 0.35 * delta * motion + rock.angularVelocity.x;
          const glowTarget = rock.dragging ? 0.012 : rock === hovered ? 0.004 : 0;
          rock.glow = lerp(rock.glow, glowTarget, 0.12);
          rock.material.emissive.setRGB(rock.glow * 0.22, rock.glow * 0.62, rock.glow * 0.16);
        });
        fragments.forEach((fragment, index) => {
          fragment.mesh.position.copy(fragment.parent.mesh.position).add(fragment.local);
          fragment.mesh.position.y += Math.sin(time * (0.18 + index * 0.006) + fragment.phase) * 0.055 * motion;
          fragment.mesh.rotation.y += (index % 2 ? -1 : 1) * delta * 0.035 * motion;
        });
        rockShadows.forEach((shadow) => {
          shadow.sprite.position.copy(shadow.rock.mesh.position);
          shadow.sprite.position.x += 0.16;
          shadow.sprite.position.y -= 0.2;
          shadow.sprite.position.z -= 0.72;
        });
        // Opening the map pulls only cards covered by its footprint completely
        // outside the SVG: one above it and two beside it. The cards never sit
        // on top of the map. Closing it eases them back to their original
        // floating positions. Keeping this in world space
        // means dragging, camera parallax and the return animation compose
        // naturally instead of fighting separate CSS transforms.
        const mapIsOpen = mapOpenRef.current;
        cards.forEach((card, cardIndex) => {
          if (!card.dragging && card.velocity.lengthSq() > 1e-7) {
            card.anchor.add(card.velocity);
            card.velocity.multiplyScalar(0.962);
          }
          const revealTarget = mapIsOpen ? 1 : 0;
          const revealEase = mapIsOpen ? 0.09 : 0.018;
          card.revealAmount = lerp(card.revealAmount, revealTarget, reducedMotion ? 1 : revealEase);

          const baseScreen = card.anchor.clone().project(camera);
          const baseX = (baseScreen.x * 0.5 + 0.5) * innerWidth;
          const baseY = (-baseScreen.y * 0.5 + 0.5) * innerHeight;
          const mapLeft = innerWidth * 0.3;
          const mapRight = innerWidth - 30;
          const mapTop = 136;
          const mapBottom = innerHeight - 114;
          const covered = baseX + card.halfWidth > mapLeft && baseX - card.halfWidth < mapRight
            && baseY + card.halfHeight > mapTop && baseY - card.halfHeight < mapBottom;
          // These three responsive targets match the blue X marks in the
          // supplied 1920x864 composition: upper-left, below the map, and
          // lower-right. Ratios preserve the same layout on other desktops.
          const targetRatios = [
            [0.257, 0.161],
            [0.407, 0.859],
            [0.906, 0.764],
          ];
          const slotX = clamp(innerWidth * targetRatios[cardIndex][0], card.halfWidth, innerWidth - card.halfWidth);
          const slotY = clamp(innerHeight * targetRatios[cardIndex][1], card.halfHeight, innerHeight - card.halfHeight);
          const targetX = covered ? slotX : baseX;
          const targetY = covered ? slotY : baseY;
          const targetWorld = toWorld(targetX, targetY, baseScreen.z);
          card.revealOffset.copy(targetWorld).sub(card.anchor).multiplyScalar(card.revealAmount);

          const world = card.anchor.clone().add(card.revealOffset);
          if (!card.dragging) world.y += Math.sin(time * card.speed + card.phase) * 0.2 * motion;
          if (!card.dragging) {
            bounceAtWall(world, card.velocity);
            card.anchor.add(correction);
            if (card.velocity.lengthSq() < restSpeed) {
              returnToScreen(world);
              card.anchor.add(correction);
            }
          }
          const projected = world.clone().project(camera);
          const x = (projected.x * 0.5 + 0.5) * innerWidth;
          const y = (-projected.y * 0.5 + 0.5) * innerHeight;
          const distance = camera.position.distanceTo(world);
          const scale = clamp(11 / distance, 0.66, 1.18);
          card.tilt = lerp(card.tilt, card.tiltTarget, 0.14);
          card.element.style.transform = `translate3d(${x - card.halfWidth}px,${y - card.halfHeight}px,0) scale(${scale}) rotate(${card.tilt}deg)`;
          card.element.style.opacity = '1';
          card.element.style.zIndex = '3';
          card.element.style.cursor = card.dragging ? 'grabbing' : 'grab';
          const rockPoint = rocks[card.rockIndex].mesh.position.clone().project(camera);
          const rockX = (rockPoint.x * 0.5 + 0.5) * innerWidth;
          const rockY = (-rockPoint.y * 0.5 + 0.5) * innerHeight;
          card.line.setAttribute('x1', String(x)); card.line.setAttribute('y1', String(y));
          card.line.setAttribute('x2', String(rockX)); card.line.setAttribute('y2', String(rockY));
          card.knot.setAttribute('cx', String(rockX)); card.knot.setAttribute('cy', String(rockY));
        });
        host.style.cursor = dragged ? 'grabbing' : hovered ? 'grab' : 'default';
        cliffRenderer.render(cliffScene, cliffCamera);
        renderer.render(scene, camera);
        frame += 1;
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', onResize);
        host.removeEventListener('pointerdown', onPointerDown);
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerup', onPointerUp);
        host.removeEventListener('pointercancel', onPointerUp);
        rocks.forEach((rock) => {
          rock.mesh.geometry.dispose();
          rock.material.dispose();
        });
        fragments.forEach((fragment) => {
          fragment.mesh.geometry.dispose();
          fragment.material.dispose();
        });
        rockShadows.forEach((shadow) => shadow.material.dispose());
        shadowTexture.dispose();
        dustGeometry.dispose();
        dustMaterial.dispose();
        surfaceTexture.dispose();
        referenceTextures.forEach((texture) => texture.dispose());
        cliffTexture.dispose();
        cliffGeometry.dispose();
        cliffMaterial.dispose();
        renderer.dispose();
        cliffRenderer.dispose();
        cards.forEach((card) => card.element.remove());
        tetherLayer.remove();
        renderer.domElement.remove();
        cliffRenderer.domElement.remove();
      };
    };

    start();
    return () => {
      disposed = true;
      window.clearTimeout(retry);
      cleanup();
    };
  }, [onReady]);

  return (
    <div ref={hostRef} aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(120%_90%_at_50%_45%,transparent_42%,rgba(4,10,7,.12)_80%,rgba(3,8,5,.28)_100%)]" />
      <div className="floating-rocks-grain pointer-events-none absolute -inset-1/2 z-[2] opacity-[.06]" />
    </div>
  );
}
