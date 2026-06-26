/**
 * Water surface shaders.
 *
 * The mesh is a full-screen quad drawn directly in clip space, so it always
 * fills the viewport regardless of camera. The fragment shader builds a moving
 * height field from layered simplex noise, derives a surface normal, and lights
 * it with a single key light to produce drifting specular glints — "light on
 * water." The pointer pushes a decaying radial ripple into the field so the
 * surface reacts where you move. Output is mostly transparent; only the
 * highlights show through (the canvas is screen-blended over the wallpaper),
 * which keeps it cheap and never muddies the video.
 */

export const waterVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const waterFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uPointer;     // normalized 0..1, y already flipped to GL space
  uniform float uPointerOn;   // 0 or 1
  uniform float uIntensity;   // overall strength of the effect

  // --- Ashima 2D simplex noise -------------------------------------------
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                              + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  // -----------------------------------------------------------------------

  // Layered, flowing height field at a point.
  float waterHeight(vec2 p, float t) {
    float h = 0.0;
    h += 0.50 * snoise(p * 1.4 + vec2(t * 0.06,  t * 0.04));
    h += 0.28 * snoise(p * 2.7 + vec2(-t * 0.09, t * 0.05));
    h += 0.16 * snoise(p * 5.3 + vec2(t * 0.12, -t * 0.10));

    // Pointer ripple: a ring that travels outward and fades with distance.
    float d = distance(p, uPointer * vec2(uResolution.x / uResolution.y, 1.0) * 2.0);
    float ring = sin(d * 18.0 - t * 3.0) * exp(-d * 3.5);
    h += ring * 0.35 * uPointerOn;

    return h;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(vUv.x * aspect, vUv.y) * 2.0;
    float t = uTime;

    // Surface normal via finite differences of the height field.
    float e = 0.0035 * aspect;
    float hL = waterHeight(p - vec2(e, 0.0), t);
    float hR = waterHeight(p + vec2(e, 0.0), t);
    float hD = waterHeight(p - vec2(0.0, e), t);
    float hU = waterHeight(p + vec2(0.0, e), t);
    vec3 normal = normalize(vec3(hL - hR, hD - hU, 0.55));

    // Key light drifting slowly across the surface.
    vec3 lightDir = normalize(vec3(sin(t * 0.1) * 0.5, 0.6, 0.8));
    vec3 viewDir  = vec3(0.0, 0.0, 1.0);
    vec3 halfDir  = normalize(lightDir + viewDir);

    float spec = pow(max(dot(normal, halfDir), 0.0), 26.0);
    float fres = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

    // Cool aqua glint, leaning to white at the peaks.
    vec3 glint = mix(vec3(0.18, 0.62, 0.85), vec3(1.0), spec);
    float alpha = (spec * 0.9 + fres * 0.10) * uIntensity;

    // Soft vignette so edges never form a hard rectangle over the wallpaper.
    float vig = smoothstep(1.15, 0.35, distance(vUv, vec2(0.5)));
    alpha *= vig;

    gl_FragColor = vec4(glint, clamp(alpha, 0.0, 1.0));
  }
`;
