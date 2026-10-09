/**
 * WebGL1. Los índices del arreglo de ripples son constantes a propósito:
 * en varios GPU `u_rip[i]` dentro de un for no compila.
 * 8 ondas × xyz (x, y, tiempo).
 */
export const RIPPLE_COUNT = 8;

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

function rippleBlock(index: number): string {
  const x = index * 3;
  const y = x + 1;
  const z = x + 2;
  return `
  {
    float age = u_time - u_rip[${z}];
    if (age > 0.0 && age < 2.6) {
      vec2 rp = vec2(u_rip[${x}], u_rip[${y}]);
      rp.x *= u_res.x / u_res.y;
      vec2 dv = p - rp;
      float rd = length(dv) + 0.0001;
      float front = age * 0.42;
      float env = exp(-2.1 * age) * exp(-12.0 * abs(rd - front));
      disp += (dv / rd) * sin(26.0 * (rd - front)) * env * 0.04 * u_intensity;
    }
  }`;
}

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_rip[${RIPPLE_COUNT * 3}];
uniform float u_intensity;
uniform float u_light;
uniform vec3 u_deep;
uniform vec3 u_mid;
uniform vec3 u_accent;
uniform vec3 u_paper;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;
  float t = u_time * 0.16;

  vec2 disp = vec2(0.0);
  ${Array.from({ length: RIPPLE_COUNT }, (_, i) => rippleBlock(i)).join("\n")}

  vec2 q = vec2(fbm(p * 2.1 + t + disp * 9.0),
                fbm(p * 2.1 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 2.1 + 3.4 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(p * 2.1 + 3.4 * q + vec2(8.3, 2.8) - 0.12 * t));
  float f = fbm(p * 2.1 + 3.0 * r + disp * 14.0);

  vec3 darkCol = mix(u_deep, u_mid, smoothstep(0.15, 0.85, f));
  float caustica = pow(clamp(f * 1.75 - 0.34, 0.0, 1.0), 3.0);
  darkCol = mix(darkCol, u_accent, caustica * 0.85 * u_intensity);
  darkCol += u_accent * 0.22 * u_intensity * smoothstep(0.66, 0.71, f) * (1.0 - smoothstep(0.71, 0.78, f));

  float vein = smoothstep(0.2, 0.84, f);
  float caustic = smoothstep(0.56, 0.7, f) * (1.0 - smoothstep(0.7, 0.82, f));
  vec3 aguaClara = vec3(0.89, 0.91, 1.0);
  vec3 lightCol = mix(u_paper, aguaClara, 0.82);
  lightCol = mix(lightCol, u_accent, vein * 0.38 * max(u_intensity, 0.55));
  lightCol += u_accent * 0.28 * u_intensity * caustic;

  vec2 m = u_mouse;
  m.x *= u_res.x / u_res.y;
  float md = length(p - m);
  darkCol += u_accent * 0.09 * u_intensity * exp(-md * 3.2);
  lightCol += u_accent * 0.03 * u_intensity * exp(-md * 3.2);

  float vig = smoothstep(1.3, 0.3, length(uv - vec2(0.5, 0.45)) * 1.3);
  darkCol *= mix(0.4, 1.0, vig);
  lightCol *= mix(0.94, 1.0, vig);

  vec3 col = mix(darkCol, lightCol, u_light);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const WATER_SHADERS = { vert: VERT, frag: FRAG };
