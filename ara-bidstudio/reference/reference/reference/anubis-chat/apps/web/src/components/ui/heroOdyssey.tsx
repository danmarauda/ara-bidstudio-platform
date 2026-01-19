'use client';

import type React from 'react';
import { useEffect, useRef } from 'react';

export interface LightningProps {
  hue?: number; // 0-360. Default aligned to project primary green
  xOffset?: number; // horizontal offset for the beam
  speed?: number; // animation speed multiplier
  intensity?: number; // brightness multiplier
  size?: number; // noise scale
  beamWidth?: number; // scales beam width; higher = narrower
  className?: string; // allow layout control by caller
  backgroundColor?: string; // background color for canvas (hex)
}

// Minimal WebGL lightning background. No UI, no headers, no globe — just the beam.
export const Lightning: React.FC<LightningProps> = ({
  hue = 162, // match project primary green (see index.css --primary: 162 ...)
  xOffset = 0,
  speed = 1.2,
  intensity = 0.7,
  size = 2,
  beamWidth = 2.5,
  className,
  backgroundColor = '#000000',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Apply background color if provided
    canvas.style.backgroundColor = backgroundColor;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gl = canvas.getContext('webgl');
    if (!gl) {
      // Fail gracefully without throwing
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      uniform float uBeamWidth;
      #define OCTAVE_COUNT 10

      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float t) { float c = cos(t); float s = sin(t); return mat2(c, -s, s, c); }

      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));
          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;
          uv.x += uXOffset;
          uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;
          float dist = abs(uv.x * uBeamWidth);
          vec3 base = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.9));
          vec3 col = base * pow(0.05 / max(dist, 0.001), 1.0) * uIntensity;
          fragColor = vec4(col, 1.0);
      }

      void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
    `;

    const compile = (src: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) {
        return null;
      }
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vsh = compile(vertexShaderSource, gl.VERTEX_SHADER);
    const fsh = compile(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!(vsh && fsh)) {
      window.removeEventListener('resize', resizeCanvas);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      window.removeEventListener('resize', resizeCanvas);
      return;
    }
    gl.attachShader(program, vsh);
    gl.attachShader(program, fsh);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      window.removeEventListener('resize', resizeCanvas);
      return;
    }
    // Call through a local alias to avoid false-positive hook lint on "useProgram"
    const activateProgram = gl.useProgram.bind(gl);
    activateProgram(program);

    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'iResolution');
    const uTime = gl.getUniformLocation(program, 'iTime');
    const uHue = gl.getUniformLocation(program, 'uHue');
    const uX = gl.getUniformLocation(program, 'uXOffset');
    const uSpeed = gl.getUniformLocation(program, 'uSpeed');
    const uInt = gl.getUniformLocation(program, 'uIntensity');
    const uSize = gl.getUniformLocation(program, 'uSize');
    const uBeam = gl.getUniformLocation(program, 'uBeamWidth');

    const applyUniform1f = (
      location: WebGLUniformLocation | null,
      value: number
    ) => {
      if (location) {
        gl.uniform1f(location, value);
      }
    };
    const applyUniform2f = (
      location: WebGLUniformLocation | null,
      x: number,
      y: number
    ) => {
      if (location) {
        gl.uniform2f(location, x, y);
      }
    };

    let rafId = 0;
    const start = performance.now();
    const render = () => {
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      applyUniform2f(uRes, canvas.width, canvas.height);
      const now = performance.now();
      applyUniform1f(uTime, (now - start) / 1000.0);
      applyUniform1f(uHue, hue);
      applyUniform1f(uX, xOffset);
      applyUniform1f(uSpeed, speed);
      applyUniform1f(uInt, intensity);
      applyUniform1f(uSize, size);
      applyUniform1f(uBeam, beamWidth);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [hue, xOffset, speed, intensity, size, beamWidth, backgroundColor]);

  return (
    <canvas
      aria-hidden
      className={className ?? 'relative h-full w-full'}
      ref={canvasRef}
    />
  );
};

export default Lightning;
