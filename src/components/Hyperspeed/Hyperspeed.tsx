// @ts-nocheck
'use client';

import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset } from 'postprocessing';
import { useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

import './Hyperspeed.css';

const DEFAULT_EFFECT_OPTIONS = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5] as [number, number],
  lightStickHeight: [1.3, 1.7] as [number, number],
  movingAwaySpeed: [60, 80] as [number, number],
  movingCloserSpeed: [-120, -160] as [number, number],
  carLightsLength: [400 * 0.03, 400 * 0.2] as [number, number],
  carLightsRadius: [0.05, 0.14] as [number, number],
  carWidthPercentage: [0.3, 0.5] as [number, number],
  carShiftX: [-0.8, 0.8] as [number, number],
  carFloorSeparation: [0, 5] as [number, number],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xffffff,
    brokenLines: 0xffffff,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
    sticks: 0x03b3c3,
  },
};

export interface HyperspeedHandle {
  /** Programmatically trigger the speed-up (warp) state — same as mousedown */
  speedUp: () => void;
  /** Return to normal cruise speed — same as mouseup */
  slowDown: () => void;
}

interface HyperspeedProps {
  effectOptions?: typeof DEFAULT_EFFECT_OPTIONS;
}

const Hyperspeed = forwardRef<HyperspeedHandle, HyperspeedProps>(({ effectOptions = DEFAULT_EFFECT_OPTIONS }, ref) => {
  const hyperspeed = useRef<HTMLDivElement>(null);
  const appRef = useRef<App | null>(null);

  // Imperative handle — lets parent call speedUp()/slowDown() without a pointer event
  useImperativeHandle(ref, () => ({
    speedUp: () => {
      if (!appRef.current) return;
      appRef.current.fovTarget = appRef.current.options.fovSpeedUp as number;
      appRef.current.speedUpTarget = appRef.current.options.speedUp as number;
      if ((appRef.current.options as Record<string, unknown>).onSpeedUp) {
        ((appRef.current.options as Record<string, () => void>).onSpeedUp)();
      }
    },
    slowDown: () => {
      if (!appRef.current) return;
      appRef.current.fovTarget = appRef.current.options.fov as number;
      appRef.current.speedUpTarget = 0;
      if ((appRef.current.options as Record<string, unknown>).onSlowDown) {
        ((appRef.current.options as Record<string, () => void>).onSlowDown)();
      }
    },
  }), []);

  const mergedOptions = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const mobileOverrides = isMobile
      ? {
          lightPairsPerRoadWay: 20,
          totalSideLightSticks: 10,
          lanesPerRoad: 3,
        }
      : {};

    return {
      ...DEFAULT_EFFECT_OPTIONS,
      ...effectOptions,
      ...mobileOverrides,
      colors: { ...DEFAULT_EFFECT_OPTIONS.colors, ...(effectOptions?.colors || {}) },
    };
  }, [effectOptions]);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.dispose();
      appRef.current = null;
      const container = hyperspeed.current;
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    }

    const mountainUniforms = {
      uFreq: { value: new THREE.Vector3(3, 6, 10) },
      uAmp: { value: new THREE.Vector3(30, 30, 20) },
    };

    const xyUniforms = {
      uFreq: { value: new THREE.Vector2(5, 2) },
      uAmp: { value: new THREE.Vector2(25, 15) },
    };

    const LongRaceUniforms = {
      uFreq: { value: new THREE.Vector2(2, 3) },
      uAmp: { value: new THREE.Vector2(35, 10) },
    };

    const turbulentUniforms = {
      uFreq: { value: new THREE.Vector4(4, 8, 8, 1) },
      uAmp: { value: new THREE.Vector4(25, 5, 10, 10) },
    };

    const deepUniforms = {
      uFreq: { value: new THREE.Vector2(4, 8) },
      uAmp: { value: new THREE.Vector2(10, 20) },
      uPowY: { value: new THREE.Vector2(20, 2) },
    };

    const nsin = (val: number) => Math.sin(val) * 0.5 + 0.5;

    interface Distortion {
      uniforms: Record<string, { value: THREE.Vector2 | THREE.Vector3 | THREE.Vector4 }>;
      getDistortion: string;
      getJS?: (progress: number, time: number) => THREE.Vector3;
    }

    const distortions: Record<string, Distortion> = {
      mountainDistortion: {
        uniforms: mountainUniforms,
        getDistortion: `
          uniform vec3 uAmp;
          uniform vec3 uFreq;
          #define PI 3.14159265358979
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          vec3 getDistortion(float progress){
            float movementProgressFix = 0.02;
            return vec3(
              cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
              nsin(progress * PI * uFreq.y + uTime) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + uTime) * uAmp.y,
              nsin(progress * PI * uFreq.z + uTime) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + uTime) * uAmp.z
            );
          }
        `,
        getJS: (progress: number, time: number) => {
          const movementProgressFix = 0.02;
          const uFreq = mountainUniforms.uFreq.value;
          const uAmp = mountainUniforms.uAmp.value;
          const distortion = new THREE.Vector3(
            Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x - Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
            nsin(progress * Math.PI * uFreq.y + time) * uAmp.y - nsin(movementProgressFix * Math.PI * uFreq.y + time) * uAmp.y,
            nsin(progress * Math.PI * uFreq.z + time) * uAmp.z - nsin(movementProgressFix * Math.PI * uFreq.z + time) * uAmp.z
          );
          const lookAtAmp = new THREE.Vector3(2, 2, 2);
          const lookAtOffset = new THREE.Vector3(0, 0, -5);
          return distortion.multiply(lookAtAmp).add(lookAtOffset);
        },
      },
      xyDistortion: {
        uniforms: xyUniforms,
        getDistortion: `
          uniform vec2 uFreq;
          uniform vec2 uAmp;
          #define PI 3.14159265358979
          vec3 getDistortion(float progress){
            float movementProgressFix = 0.02;
            return vec3(
              cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
              sin(progress * PI * uFreq.y + PI/2. + uTime) * uAmp.y - sin(movementProgressFix * PI * uFreq.y + PI/2. + uTime) * uAmp.y,
              0.
            );
          }
        `,
        getJS: (progress: number, time: number) => {
          const movementProgressFix = 0.02;
          const uFreq = xyUniforms.uFreq.value;
          const uAmp = xyUniforms.uAmp.value;
          const distortion = new THREE.Vector3(
            Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x - Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
            Math.sin(progress * Math.PI * uFreq.y + time + Math.PI / 2) * uAmp.y - Math.sin(movementProgressFix * Math.PI * uFreq.y + time + Math.PI / 2) * uAmp.y,
            0
          );
          const lookAtAmp = new THREE.Vector3(2, 0.4, 1);
          const lookAtOffset = new THREE.Vector3(0, 0, -3);
          return distortion.multiply(lookAtAmp).add(lookAtOffset);
        },
      },
      LongRaceDistortion: {
        uniforms: LongRaceUniforms,
        getDistortion: `
          uniform vec2 uFreq;
          uniform vec2 uAmp;
          #define PI 3.14159265358979
          vec3 getDistortion(float progress){
            float camProgress = 0.0125;
            return vec3(
              sin(progress * PI * uFreq.x + uTime) * uAmp.x - sin(camProgress * PI * uFreq.x + uTime) * uAmp.x,
              sin(progress * PI * uFreq.y + uTime) * uAmp.y - sin(camProgress * PI * uFreq.y + uTime) * uAmp.y,
              0.
            );
          }
        `,
        getJS: (progress: number, time: number) => {
          const camProgress = 0.0125;
          const uFreq = LongRaceUniforms.uFreq.value;
          const uAmp = LongRaceUniforms.uAmp.value;
          const distortion = new THREE.Vector3(
            Math.sin(progress * Math.PI * uFreq.x + time) * uAmp.x - Math.sin(camProgress * Math.PI * uFreq.x + time) * uAmp.x,
            Math.sin(progress * Math.PI * uFreq.y + time) * uAmp.y - Math.sin(camProgress * Math.PI * uFreq.y + time) * uAmp.y,
            0
          );
          const lookAtAmp = new THREE.Vector3(1, 1, 0);
          const lookAtOffset = new THREE.Vector3(0, 0, -5);
          return distortion.multiply(lookAtAmp).add(lookAtOffset);
        },
      },
      turbulentDistortion: {
        uniforms: turbulentUniforms,
        getDistortion: `
          uniform vec4 uFreq;
          uniform vec4 uAmp;
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          #define PI 3.14159265358979
          float getDistortionX(float progress){
            return (
              cos(PI * progress * uFreq.r + uTime) * uAmp.r +
              pow(cos(PI * progress * uFreq.g + uTime * (uFreq.g / uFreq.r)), 2.) * uAmp.g
            );
          }
          float getDistortionY(float progress){
            return (
              -nsin(PI * progress * uFreq.b + uTime) * uAmp.b +
              -pow(nsin(PI * progress * uFreq.a + uTime / (uFreq.b / uFreq.a)), 5.) * uAmp.a
            );
          }
          vec3 getDistortion(float progress){
            return vec3(
              getDistortionX(progress) - getDistortionX(0.0125),
              getDistortionY(progress) - getDistortionY(0.0125),
              0.
            );
          }
        `,
        getJS: (progress: number, time: number) => {
          const uFreq = turbulentUniforms.uFreq.value;
          const uAmp = turbulentUniforms.uAmp.value;
          const getX = (p: number) =>
            Math.cos(Math.PI * p * uFreq.x + time) * uAmp.x +
            Math.pow(Math.cos(Math.PI * p * uFreq.y + time * (uFreq.y / uFreq.x)), 2) * uAmp.y;
          const getY = (p: number) =>
            -nsin(Math.PI * p * uFreq.z + time) * uAmp.z -
            Math.pow(nsin(Math.PI * p * uFreq.w + time / (uFreq.z / uFreq.w)), 5) * uAmp.w;
          const distortion = new THREE.Vector3(getX(progress) - getX(progress + 0.007), getY(progress) - getY(progress + 0.007), 0);
          const lookAtAmp = new THREE.Vector3(-2, -5, 0);
          const lookAtOffset = new THREE.Vector3(0, 0, -10);
          return distortion.multiply(lookAtAmp).add(lookAtOffset);
        },
      },
      deepDistortion: {
        uniforms: deepUniforms,
        getDistortion: `
          uniform vec4 uFreq;
          uniform vec4 uAmp;
          uniform vec2 uPowY;
          float nsin(float val){ return sin(val) * 0.5 + 0.5; }
          #define PI 3.14159265358979
          float getDistortionX(float progress){
            return (sin(progress * PI * uFreq.x + uTime) * uAmp.x);
          }
          float getDistortionY(float progress){
            return (pow(abs(progress * uPowY.x), uPowY.y) + sin(progress * PI * uFreq.y + uTime) * uAmp.y);
          }
          vec3 getDistortion(float progress){
            return vec3(
              getDistortionX(progress) - getDistortionX(0.02),
              getDistortionY(progress) - getDistortionY(0.02),
              0.
            );
          }
        `,
        getJS: (progress: number, time: number) => {
          const uFreq = deepUniforms.uFreq.value;
          const uAmp = deepUniforms.uAmp.value;
          const uPowY = deepUniforms.uPowY.value;
          const getX = (p: number) => Math.sin(p * Math.PI * uFreq.x + time) * uAmp.x;
          const getY = (p: number) => Math.pow(p * uPowY.x, uPowY.y) + Math.sin(p * Math.PI * uFreq.y + time) * uAmp.y;
          const distortion = new THREE.Vector3(getX(progress) - getX(progress + 0.01), getY(progress) - getY(progress + 0.01), 0);
          const lookAtAmp = new THREE.Vector3(-2, -4, 0);
          const lookAtOffset = new THREE.Vector3(0, 0, -10);
          return distortion.multiply(lookAtAmp).add(lookAtOffset);
        },
      },
    };

    const distortion_uniforms = {
      uDistortionX: { value: new THREE.Vector2(80, 3) },
      uDistortionY: { value: new THREE.Vector2(-40, 2.5) },
    };

    const distortion_vertex = `
      #define PI 3.14159265358979
      uniform vec2 uDistortionX;
      uniform vec2 uDistortionY;
      float nsin(float val){ return sin(val) * 0.5 + 0.5; }
      vec3 getDistortion(float progress){
        progress = clamp(progress, 0., 1.);
        float xAmp = uDistortionX.r;
        float xFreq = uDistortionX.g;
        float yAmp = uDistortionY.r;
        float yFreq = uDistortionY.g;
        return vec3(
          xAmp * nsin(progress * PI * xFreq - PI / 2.),
          yAmp * nsin(progress * PI * yFreq - PI / 2.),
          0.
        );
      }
    `;

    const random = (base: number | [number, number]) => {
      if (Array.isArray(base)) return Math.random() * (base[1] - base[0]) + base[0];
      return Math.random() * base;
    };

    const pickRandom = <T,>(arr: T | T[]): T => {
      if (Array.isArray(arr)) return arr[Math.floor(Math.random() * arr.length)];
      return arr;
    };

    function lerp(current: number, target: number, speed = 0.1, limit = 0.001) {
      let change = (target - current) * speed;
      if (Math.abs(change) < limit) {
        change = target - current;
      }
      return change;
    }

    // ---- CarLights ----
    class CarLights {
      webgl: App;
      options: Record<string, unknown>;
      colors: number | number[];
      speed: [number, number];
      fade: THREE.Vector2;
      mesh!: THREE.Mesh;

      constructor(webgl: App, options: Record<string, unknown>, colors: number | number[], speed: [number, number], fade: THREE.Vector2) {
        this.webgl = webgl;
        this.options = options;
        this.colors = colors;
        this.speed = speed;
        this.fade = fade;
      }

      init() {
        const options = this.options as Record<string, number | number[] | Record<string, unknown>>;
        const curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
        const geometry = new THREE.TubeGeometry(curve, 40, 1, 8, false);
        const instanced = new THREE.InstancedBufferGeometry().copy(geometry);
        instanced.instanceCount = (options.lightPairsPerRoadWay as number) * 2;

        const laneWidth = (options.roadWidth as number) / (options.lanesPerRoad as number);
        const aOffset: number[] = [];
        const aMetrics: number[] = [];
        const aColor: number[] = [];

        let colors: THREE.Color | THREE.Color[];
        if (Array.isArray(this.colors)) {
          colors = this.colors.map((c) => new THREE.Color(c));
        } else {
          colors = new THREE.Color(this.colors);
        }

        for (let i = 0; i < (options.lightPairsPerRoadWay as number); i++) {
          const radius = random(options.carLightsRadius as [number, number]);
          const length = random(options.carLightsLength as [number, number]);
          const speed = random(this.speed);
          const carLane = i % (options.lanesPerRoad as number);
          let laneX = carLane * laneWidth - (options.roadWidth as number) / 2 + laneWidth / 2;
          const carWidth = random(options.carWidthPercentage as [number, number]) * laneWidth;
          const carShiftX = random(options.carShiftX as [number, number]) * laneWidth;
          laneX += carShiftX;
          const offsetY = random(options.carFloorSeparation as [number, number]) + radius * 1.3;
          const offsetZ = -random(options.length as number);

          aOffset.push(laneX - carWidth / 2, offsetY, offsetZ);
          aOffset.push(laneX + carWidth / 2, offsetY, offsetZ);
          aMetrics.push(radius, length, speed);
          aMetrics.push(radius, length, speed);

          const color = pickRandom(colors);
          const c = color as THREE.Color;
          aColor.push(c.r, c.g, c.b);
          aColor.push(c.r, c.g, c.b);
        }

        instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3, false));
        instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 3, false));
        instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false));

        const distortionObj = (options.distortion as Distortion);
        const material = new THREE.ShaderMaterial({
          fragmentShader: carLightsFragment,
          vertexShader: carLightsVertex,
          transparent: true,
          uniforms: Object.assign(
            { uTime: { value: 0 }, uTravelLength: { value: options.length }, uFade: { value: this.fade } },
            this.webgl.fogUniforms,
            distortionObj.uniforms
          ),
        });
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', distortionObj.getDistortion);
        };

        const mesh = new THREE.Mesh(instanced, material);
        mesh.frustumCulled = false;
        this.webgl.scene.add(mesh);
        this.mesh = mesh;
      }

      update(time: number) {
        (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      }
    }

    const carLightsFragment = `
      #define USE_FOG;
      ${THREE.ShaderChunk['fog_pars_fragment']}
      varying vec3 vColor;
      varying vec2 vUv;
      uniform vec2 uFade;
      void main() {
        vec3 color = vec3(vColor);
        float alpha = smoothstep(uFade.x, uFade.y, vUv.x);
        gl_FragColor = vec4(color, alpha);
        if (gl_FragColor.a < 0.0001) discard;
        ${THREE.ShaderChunk['fog_fragment']}
      }
    `;

    const carLightsVertex = `
      #define USE_FOG;
      ${THREE.ShaderChunk['fog_pars_vertex']}
      attribute vec3 aOffset;
      attribute vec3 aMetrics;
      attribute vec3 aColor;
      uniform float uTravelLength;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vColor;
      #include <getDistortion_vertex>
      void main() {
        vec3 transformed = position.xyz;
        float radius = aMetrics.r;
        float myLength = aMetrics.g;
        float speed = aMetrics.b;
        transformed.xy *= radius;
        transformed.z *= myLength;
        transformed.z += myLength - mod(uTime * speed + aOffset.z, uTravelLength);
        transformed.xy += aOffset.xy;
        float progress = abs(transformed.z / uTravelLength);
        transformed.xyz += getDistortion(progress);
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
        gl_Position = projectionMatrix * mvPosition;
        vUv = uv;
        vColor = aColor;
        ${THREE.ShaderChunk['fog_vertex']}
      }
    `;

    // ---- LightsSticks ----
    class LightsSticks {
      webgl: App;
      options: Record<string, unknown>;
      mesh!: THREE.Mesh;

      constructor(webgl: App, options: Record<string, unknown>) {
        this.webgl = webgl;
        this.options = options;
      }

      init() {
        const options = this.options as Record<string, number | number[] | Record<string, unknown>>;
        const geometry = new THREE.PlaneGeometry(1, 1);
        const instanced = new THREE.InstancedBufferGeometry().copy(geometry);
        const totalSticks = options.totalSideLightSticks as number;
        instanced.instanceCount = totalSticks;

        const stickoffset = (options.length as number) / (totalSticks - 1);
        const aOffset: number[] = [];
        const aColor: number[] = [];
        const aMetrics: number[] = [];

        let colors: THREE.Color | THREE.Color[];
        const stickColors = (options.colors as Record<string, number | number[]>).sticks;
        if (Array.isArray(stickColors)) {
          colors = stickColors.map((c) => new THREE.Color(c));
        } else {
          colors = new THREE.Color(stickColors as number);
        }

        for (let i = 0; i < totalSticks; i++) {
          const width = random(options.lightStickWidth as [number, number]);
          const height = random(options.lightStickHeight as [number, number]);
          aOffset.push((i - 1) * stickoffset * 2 + stickoffset * Math.random());
          const color = pickRandom(colors) as THREE.Color;
          aColor.push(color.r, color.g, color.b);
          aMetrics.push(width, height);
        }

        instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 1, false));
        instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false));
        instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 2, false));

        const distortionObj = options.distortion as Distortion;
        const material = new THREE.ShaderMaterial({
          fragmentShader: sideSticksFragment,
          vertexShader: sideSticksVertex,
          side: THREE.DoubleSide,
          uniforms: Object.assign(
            { uTravelLength: { value: options.length }, uTime: { value: 0 } },
            this.webgl.fogUniforms,
            distortionObj.uniforms
          ),
        });
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', distortionObj.getDistortion);
        };

        const mesh = new THREE.Mesh(instanced, material);
        mesh.frustumCulled = false;
        this.webgl.scene.add(mesh);
        this.mesh = mesh;
      }

      update(time: number) {
        (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      }
    }

    const sideSticksVertex = `
      #define USE_FOG;
      ${THREE.ShaderChunk['fog_pars_vertex']}
      attribute float aOffset;
      attribute vec3 aColor;
      attribute vec2 aMetrics;
      uniform float uTravelLength;
      uniform float uTime;
      varying vec3 vColor;
      mat4 rotationY( in float angle ) {
        return mat4(cos(angle),0,sin(angle),0, 0,1.0,0,0, -sin(angle),0,cos(angle),0, 0,0,0,1);
      }
      #include <getDistortion_vertex>
      void main(){
        vec3 transformed = position.xyz;
        float width = aMetrics.x;
        float height = aMetrics.y;
        transformed.xy *= vec2(width, height);
        float time = mod(uTime * 60. * 2. + aOffset, uTravelLength);
        transformed = (rotationY(3.14/2.) * vec4(transformed,1.)).xyz;
        transformed.z += - uTravelLength + time;
        float progress = abs(transformed.z / uTravelLength);
        transformed.xyz += getDistortion(progress);
        transformed.y += height / 2.;
        transformed.x += -width / 2.;
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
        gl_Position = projectionMatrix * mvPosition;
        vColor = aColor;
        ${THREE.ShaderChunk['fog_vertex']}
      }
    `;

    const sideSticksFragment = `
      #define USE_FOG;
      ${THREE.ShaderChunk['fog_pars_fragment']}
      varying vec3 vColor;
      void main(){
        vec3 color = vec3(vColor);
        gl_FragColor = vec4(color,1.);
        ${THREE.ShaderChunk['fog_fragment']}
      }
    `;

    // ---- Road ----
    class Road {
      webgl: App;
      options: Record<string, unknown>;
      uTime: { value: number };
      leftRoadWay!: THREE.Mesh;
      rightRoadWay!: THREE.Mesh;
      island!: THREE.Mesh;

      constructor(webgl: App, options: Record<string, unknown>) {
        this.webgl = webgl;
        this.options = options;
        this.uTime = { value: 0 };
      }

      createPlane(side: number, _width: number, isRoad: boolean) {
        const options = this.options as Record<string, number | Record<string, unknown>>;
        const colorsObj = options.colors as Record<string, number | number[]>;
        const segments = 100;
        const geometry = new THREE.PlaneGeometry(
          isRoad ? (options.roadWidth as number) : (options.islandWidth as number),
          options.length as number,
          20,
          segments
        );

        let uniforms: Record<string, { value: unknown }> = {
          uTravelLength: { value: options.length },
          uColor: { value: new THREE.Color(isRoad ? colorsObj.roadColor as number : colorsObj.islandColor as number) },
          uTime: this.uTime,
        };

        if (isRoad) {
          uniforms = Object.assign(uniforms, {
            uLanes: { value: options.lanesPerRoad },
            uBrokenLinesColor: { value: new THREE.Color(colorsObj.brokenLines as number) },
            uShoulderLinesColor: { value: new THREE.Color(colorsObj.shoulderLines as number) },
            uShoulderLinesWidthPercentage: { value: options.shoulderLinesWidthPercentage },
            uBrokenLinesLengthPercentage: { value: options.brokenLinesLengthPercentage },
            uBrokenLinesWidthPercentage: { value: options.brokenLinesWidthPercentage },
          });
        }

        const distortionObj = options.distortion as Distortion;
        const material = new THREE.ShaderMaterial({
          fragmentShader: isRoad ? roadFragment : islandFragment,
          vertexShader: roadVertex,
          side: THREE.DoubleSide,
          uniforms: Object.assign(uniforms, this.webgl.fogUniforms, distortionObj.uniforms),
        });
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', distortionObj.getDistortion);
        };

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.z = -(options.length as number) / 2;
        mesh.position.x += ((options.islandWidth as number) / 2 + (options.roadWidth as number) / 2) * side;
        this.webgl.scene.add(mesh);
        return mesh;
      }

      init() {
        this.leftRoadWay = this.createPlane(-1, this.options.roadWidth as number, true);
        this.rightRoadWay = this.createPlane(1, this.options.roadWidth as number, true);
        this.island = this.createPlane(0, this.options.islandWidth as number, false);
      }

      update(time: number) {
        this.uTime.value = time;
      }
    }

    const roadBaseFragment = `
      #define USE_FOG;
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uTime;
      #include <roadMarkings_vars>
      ${THREE.ShaderChunk['fog_pars_fragment']}
      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(uColor);
        #include <roadMarkings_fragment>
        gl_FragColor = vec4(color, 1.);
        ${THREE.ShaderChunk['fog_fragment']}
      }
    `;

    const islandFragment = roadBaseFragment.replace('#include <roadMarkings_fragment>', '').replace('#include <roadMarkings_vars>', '');

    const roadMarkings_vars = `
      uniform float uLanes;
      uniform vec3 uBrokenLinesColor;
      uniform vec3 uShoulderLinesColor;
      uniform float uShoulderLinesWidthPercentage;
      uniform float uBrokenLinesWidthPercentage;
      uniform float uBrokenLinesLengthPercentage;
    `;

    const roadMarkings_fragment = `
      uv.y = mod(uv.y + uTime * 0.05, 1.);
      float laneWidth = 1.0 / uLanes;
      float brokenLineWidth = laneWidth * uBrokenLinesWidthPercentage;
      float laneEmptySpace = 1. - uBrokenLinesLengthPercentage;
      float brokenLines = step(1.0 - brokenLineWidth, fract(uv.x * 2.0)) * step(laneEmptySpace, fract(uv.y * 10.0));
      float sideLines = step(1.0 - brokenLineWidth, fract((uv.x - laneWidth * (uLanes - 1.0)) * 2.0)) + step(brokenLineWidth, uv.x);
      brokenLines = mix(brokenLines, sideLines, uv.x);
    `;

    const roadFragment = roadBaseFragment.replace('#include <roadMarkings_fragment>', roadMarkings_fragment).replace('#include <roadMarkings_vars>', roadMarkings_vars);

    const roadVertex = `
      #define USE_FOG;
      uniform float uTime;
      ${THREE.ShaderChunk['fog_pars_vertex']}
      uniform float uTravelLength;
      varying vec2 vUv;
      #include <getDistortion_vertex>
      void main() {
        vec3 transformed = position.xyz;
        vec3 distortion = getDistortion((transformed.y + uTravelLength / 2.) / uTravelLength);
        transformed.x += distortion.x;
        transformed.z += distortion.y;
        transformed.y += -1. * distortion.z;
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
        gl_Position = projectionMatrix * mvPosition;
        vUv = uv;
        ${THREE.ShaderChunk['fog_vertex']}
      }
    `;

    function resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer, setSize: (w: number, h: number, u: boolean) => void) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return false;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) setSize(width, height, false);
      return needResize;
    }

    // ---- App ----
    class App {
      options: Record<string, unknown>;
      container: HTMLDivElement;
      hasValidSize: boolean;
      renderer: THREE.WebGLRenderer;
      composer: EffectComposer;
      camera: THREE.PerspectiveCamera;
      scene: THREE.Scene;
      fogUniforms: Record<string, { value: unknown }>;
      clock: THREE.Clock;
      disposed: boolean;
      road: Road;
      leftCarLights: CarLights;
      rightCarLights: CarLights;
      leftSticks: LightsSticks;
      fovTarget: number;
      speedUpTarget: number;
      speedUp: number;
      timeOffset: number;
      renderPass!: RenderPass;
      bloomPass!: EffectPass;

      constructor(container: HTMLDivElement, options: Record<string, unknown>) {
        this.options = options;
        if (this.options.distortion == null) {
          this.options.distortion = { uniforms: distortion_uniforms, getDistortion: distortion_vertex };
        }
        this.container = container;
        this.hasValidSize = false;

        const initW = Math.max(1, container.offsetWidth);
        const initH = Math.max(1, container.offsetHeight);

        // Cap pixel ratio for performance
        const pixelRatio = Math.min(window.devicePixelRatio, 1.5);

        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        this.renderer.setSize(initW, initH, false);
        this.renderer.setPixelRatio(pixelRatio);
        this.composer = new EffectComposer(this.renderer);
        container.append(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(options.fov as number, initW / initH, 0.1, 10000);
        this.camera.position.z = -5;
        this.camera.position.y = 8;
        this.camera.position.x = 0;
        this.scene = new THREE.Scene();
        this.scene.background = null;

        const colorsObj = options.colors as Record<string, number>;
        const fog = new THREE.Fog(colorsObj.background, (options.length as number) * 0.2, (options.length as number) * 500);
        this.scene.fog = fog;
        this.fogUniforms = {
          fogColor: { value: fog.color },
          fogNear: { value: fog.near },
          fogFar: { value: fog.far },
        };
        this.clock = new THREE.Clock();
        this.disposed = false;

        const colorsWithArrays = options.colors as Record<string, number | number[]>;
        this.road = new Road(this, options);
        this.leftCarLights = new CarLights(
          this, options, colorsWithArrays.leftCars, options.movingAwaySpeed as [number, number],
          new THREE.Vector2(0, 1 - (options.carLightsFade as number))
        );
        this.rightCarLights = new CarLights(
          this, options, colorsWithArrays.rightCars, options.movingCloserSpeed as [number, number],
          new THREE.Vector2(1, 0 + (options.carLightsFade as number))
        );
        this.leftSticks = new LightsSticks(this, options);

        this.fovTarget = options.fov as number;
        this.speedUpTarget = 0;
        this.speedUp = 0;
        this.timeOffset = 0;

        this.tick = this.tick.bind(this);
        this.init = this.init.bind(this);
        this.setSize = this.setSize.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        window.addEventListener('resize', this.onWindowResize);
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          this.hasValidSize = true;
        }
      }

      onWindowResize() {
        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;
        if (width <= 0 || height <= 0) { this.hasValidSize = false; return; }
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(width, height);
        this.hasValidSize = true;
      }

      initPasses() {
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.bloomPass = new EffectPass(this.camera, new BloomEffect({ luminanceThreshold: 0.2, luminanceSmoothing: 0, resolutionScale: 1 }));
        const smaaPass = new EffectPass(
          this.camera,
          new SMAAEffect({ preset: SMAAPreset.MEDIUM, searchImage: SMAAEffect.searchImageDataURL, areaImage: SMAAEffect.areaImageDataURL })
        );
        this.renderPass.renderToScreen = false;
        this.bloomPass.renderToScreen = false;
        smaaPass.renderToScreen = true;
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(smaaPass);
      }

      init() {
        this.initPasses();
        const options = this.options;
        this.road.init();
        this.leftCarLights.init();
        this.leftCarLights.mesh.position.setX(-(options.roadWidth as number) / 2 - (options.islandWidth as number) / 2);
        this.rightCarLights.init();
        this.rightCarLights.mesh.position.setX((options.roadWidth as number) / 2 + (options.islandWidth as number) / 2);
        this.leftSticks.init();
        this.leftSticks.mesh.position.setX(-((options.roadWidth as number) + (options.islandWidth as number) / 2));

        this.container.addEventListener('mousedown', this.onMouseDown);
        this.container.addEventListener('mouseup', this.onMouseUp);
        this.container.addEventListener('mouseout', this.onMouseUp);
        this.container.addEventListener('touchstart', this.onTouchStart, { passive: true });
        this.container.addEventListener('touchend', this.onTouchEnd, { passive: true });
        this.container.addEventListener('touchcancel', this.onTouchEnd, { passive: true });

        this.tick();
      }

      onMouseDown() {
        if ((this.options as Record<string, unknown>).onSpeedUp) ((this.options as Record<string, (() => void)>).onSpeedUp)();
        this.fovTarget = this.options.fovSpeedUp as number;
        this.speedUpTarget = this.options.speedUp as number;
      }
      onMouseUp() {
        if ((this.options as Record<string, unknown>).onSlowDown) ((this.options as Record<string, (() => void)>).onSlowDown)();
        this.fovTarget = this.options.fov as number;
        this.speedUpTarget = 0;
      }
      onTouchStart() {
        this.fovTarget = this.options.fovSpeedUp as number;
        this.speedUpTarget = this.options.speedUp as number;
      }
      onTouchEnd() {
        this.fovTarget = this.options.fov as number;
        this.speedUpTarget = 0;
      }

      update(delta: number) {
        const lerpPercentage = Math.exp(-(-60 * Math.log2(1 - 0.1)) * delta);
        this.speedUp += lerp(this.speedUp, this.speedUpTarget, lerpPercentage, 0.00001);
        this.timeOffset += this.speedUp * delta;
        const time = this.clock.elapsedTime + this.timeOffset;

        this.rightCarLights.update(time);
        this.leftCarLights.update(time);
        this.leftSticks.update(time);
        this.road.update(time);

        let updateCamera = false;
        const fovChange = lerp(this.camera.fov, this.fovTarget, lerpPercentage);
        if (fovChange !== 0) {
          this.camera.fov += fovChange * delta * 6;
          updateCamera = true;
        }

        const distortionObj = (this.options.distortion as Distortion);
        if (distortionObj.getJS) {
          const distortion = distortionObj.getJS(0.025, time);
          this.camera.lookAt(new THREE.Vector3(
            this.camera.position.x + distortion.x,
            this.camera.position.y + distortion.y,
            this.camera.position.z + distortion.z
          ));
          updateCamera = true;
        }
        if (updateCamera) this.camera.updateProjectionMatrix();
      }

      render(delta: number) {
        this.composer.render(delta);
      }

      dispose() {
        this.disposed = true;
        if (this.scene) {
          this.scene.traverse((object) => {
            const obj = object as THREE.Mesh;
            if (!obj.isMesh) return;
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach((material) => material.dispose());
              } else {
                obj.material.dispose();
              }
            }
          });
          this.scene.clear();
        }
        if (this.renderer) {
          this.renderer.dispose();
          this.renderer.forceContextLoss();
          if (this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
          }
        }
        if (this.composer) this.composer.dispose();
        window.removeEventListener('resize', this.onWindowResize);
        if (this.container) {
          this.container.removeEventListener('mousedown', this.onMouseDown);
          this.container.removeEventListener('mouseup', this.onMouseUp);
          this.container.removeEventListener('mouseout', this.onMouseUp);
          this.container.removeEventListener('touchstart', this.onTouchStart);
          this.container.removeEventListener('touchend', this.onTouchEnd);
          this.container.removeEventListener('touchcancel', this.onTouchEnd);
        }
      }

      setSize(width: number, height: number, updateStyles: boolean) {
        if (width <= 0 || height <= 0) { this.hasValidSize = false; return; }
        this.composer.setSize(width, height, updateStyles);
        this.hasValidSize = true;
      }

      tick() {
        if (this.disposed) return;
        if (!this.hasValidSize) {
          const w = this.container.offsetWidth;
          const h = this.container.offsetHeight;
          if (w > 0 && h > 0) {
            this.renderer.setSize(w, h, false);
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.composer.setSize(w, h);
            this.hasValidSize = true;
          } else {
            requestAnimationFrame(this.tick);
            return;
          }
        }
        if (resizeRendererToDisplaySize(this.renderer, this.setSize)) {
          const canvas = this.renderer.domElement;
          if (this.hasValidSize) {
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
          }
        }
        if (this.hasValidSize) {
          const delta = this.clock.getDelta();
          this.render(delta);
          this.update(delta);
        }
        requestAnimationFrame(this.tick);
      }
    }

    // ---- Initialize ----
    const container = hyperspeed.current;
    if (!container) return;

    const options: Record<string, unknown> = {
      ...mergedOptions,
      colors: { ...mergedOptions.colors },
    };
    const distortionName = options.distortion as string;
    if (typeof distortionName === 'string' && distortions[distortionName]) {
      options.distortion = distortions[distortionName];
    }

    const myApp = new App(container as HTMLDivElement, options);
    appRef.current = myApp;

    // Load and init
    const loadAndInit = async () => {
      myApp.init();
    };
    loadAndInit();

    return () => {
      if (appRef.current) {
        appRef.current.dispose();
        appRef.current = null;
      }
    };
  }, [mergedOptions]);

  return <div id="lights" ref={hyperspeed}></div>;
});

Hyperspeed.displayName = 'Hyperspeed';

export default Hyperspeed;
