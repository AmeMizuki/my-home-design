import * as THREE from 'three';

export function createOceanMaterial() {
  return new THREE.ShaderMaterial({
    name: 'Window ocean',
    toneMapped: false,
    uniforms: {
      time: { value: 0 },
      windowCenter: { value: 0 },
      windowAxis: { value: new THREE.Vector2() },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float windowCenter;
      uniform vec2 windowAxis;
      varying vec3 vWorldPosition;
      const vec3 SUN = vec3(-0.36, 0.48, 0.80);
      const vec3 WIND = vec3(8.0, 0.0, 2.4); // metres/second
      const float PI = 3.14159265;

      float hash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), u.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z);
      }
      float cloudDensity(vec3 p, float detail) {
        float height = (p.y - 120.0) / 60.0;
        float envelope = smoothstep(0.0, 0.18, height) * (1.0 - smoothstep(0.65, 1.0, height));
        if (envelope <= 0.0) return 0.0;
        vec3 q = (p - WIND * time) * vec3(0.006, 0.017, 0.006);
        float billow = noise(q);
        if (detail > 0.01) billow = mix(billow, billow * 0.67 + noise(q * 2.03 + 11.7) * 0.33, detail);
        return max(0.0, billow - 0.52) * 3.8 * envelope;
      }
      vec3 skyLight(vec3 ray) {
        float altitude = sqrt(clamp(ray.y, 0.0, 1.0));
        vec3 sky = mix(vec3(0.53, 0.76, 0.86), vec3(0.035, 0.20, 0.57), altitude);
        float sunlight = max(0.0, dot(ray, SUN));
        sky += vec3(0.13, 0.10, 0.045) * pow(sunlight, 24.0);
        sky += vec3(1.0, 0.91, 0.72) * smoothstep(0.9993, 0.9998, sunlight);
        return sky;
      }
      vec3 cloudySky(vec3 origin, vec3 ray) {
        vec3 sky = skyLight(ray);
        if (ray.y <= 0.012) return sky;
        float entry = max(0.0, (120.0 - origin.y) / ray.y);
        float exit = min(9000.0, (180.0 - origin.y) / ray.y);
        if (entry >= exit) return sky;
        float stepLength = (exit - entry) / 24.0;
        float detail = 1.0 - smoothstep(0.15, 0.7, stepLength * 0.006);
        float distance = entry + stepLength * 0.5;
        float transmittance = 1.0;
        vec3 scattered = vec3(0.0);
        float g = 0.45;
        float phase = (1.0 - g * g) / (4.0 * PI * pow(1.0 + g * g - 2.0 * g * dot(ray, SUN), 1.5));
        for (int i = 0; i < 24; i++) {
          vec3 p = origin + ray * distance;
          float density = cloudDensity(p, detail);
          if (density > 0.001) {
            float shadow = cloudDensity(p + SUN * 35.0, detail) + cloudDensity(p + SUN * 80.0, detail) * 0.5;
            float sunlight = exp(-shadow * 2.8);
            vec3 lighting = vec3(0.46, 0.53, 0.64) + vec3(0.57, 0.52, 0.42) * sunlight;
            lighting += vec3(0.18, 0.16, 0.12) * phase * sunlight;
            float opacity = 1.0 - exp(-density * stepLength * 0.022);
            scattered += transmittance * opacity * lighting;
            transmittance *= 1.0 - opacity;
          }
          if (transmittance < 0.015) break;
          distance += stepLength;
        }
        return mix(sky, scattered + sky * transmittance, exp(-entry * 0.00045));
      }

      float shoreline(float x) {
        return 3.8 + 0.35 * sin(x * 0.7) + 0.16 * sin(x * 1.6);
      }
      float sandHeight(vec2 p) {
        return (shoreline(p.x) - p.y) * 0.075;
      }
      float wavePhase(vec2 p) {
        float offshore = max(0.0, p.y - shoreline(p.x));
        // Shorter wavelengths in shallow water; omega follows gravity-wave dispersion.
        float phaseDistance = offshore + 1.2 * log(1.0 + offshore / 0.45);
        float k = 0.9;
        float omega = sqrt(9.81 * k * tanh(k * 3.0));
        return k * phaseDistance + omega * time + p.x * 0.12;
      }
      float waterHeight(vec2 p) {
        float offshore = p.y - shoreline(p.x);
        float depth = max(0.06, offshore * 0.075);
        // Shoaling raises crests, then the depth limit breaks them before the beach.
        float amplitude = min(min(0.16 * pow(3.0 / depth, 0.25), 0.34), depth * 0.48);
        amplitude *= smoothstep(-0.2, 0.65, offshore);
        float phase = wavePhase(p);
        float swell = amplitude * (sin(phase) - 0.24 * cos(2.0 * phase));
        float crossWave = sin(p.x * 1.9 + p.y * 2.4 + time * 2.0) * 0.014;
        float runup = 0.045 + 0.11 * sin(time * 1.15 - p.x * 0.18);
        return swell + crossWave + runup * (1.0 - smoothstep(0.0, 3.5, offshore));
      }
      float surfaceHeight(vec2 p) {
        return max(sandHeight(p), waterHeight(p));
      }
      vec3 waterNormal(vec2 p, float height) {
        float epsilon = 0.035;
        return normalize(vec3(height - waterHeight(p + vec2(epsilon, 0.0)), epsilon,
          height - waterHeight(p + vec2(0.0, epsilon))));
      }
      vec3 reflectedSky(vec3 origin, vec3 ray) {
        vec3 sky = skyLight(ray);
        if (ray.y > 0.015) {
          vec3 p = origin + ray * ((150.0 - origin.y) / ray.y);
          float cloud = (1.0 - exp(-cloudDensity(p, 0.0) * 3.0)) * exp(-length(p - origin) * 0.00045);
          sky = mix(sky, vec3(0.79, 0.84, 0.87), cloud);
        }
        return sky;
      }
      float sunSpecular(vec3 normal, vec3 view) {
        vec3 halfVector = normalize(SUN + view);
        float nv = max(0.001, dot(normal, view)), nl = max(0.001, dot(normal, SUN));
        float nh = max(0.0, dot(normal, halfVector));
        float alpha = 0.10 * 0.10;
        float denom = nh * nh * (alpha * alpha - 1.0) + 1.0;
        float distribution = alpha * alpha / (PI * denom * denom);
        float geometry = nv / (nv * 0.92 + 0.08) * nl / (nl * 0.92 + 0.08);
        float fresnel = 0.02 + 0.98 * pow(1.0 - max(0.0, dot(halfVector, view)), 5.0);
        return min(5.0, distribution * geometry * fresnel / (4.0 * nv));
      }
      vec3 shadeCoast(vec3 p, vec3 ray, float distance) {
        float beach = sandHeight(p.xz), water = waterHeight(p.xz);
        float wet = 1.0 - smoothstep(0.06, 0.23, beach);
        float grain = noise(vec3(p.xz * 22.0, 7.3));
        vec3 sand = vec3(0.72, 0.55, 0.33) + (grain - 0.5) * 0.035;
        sand *= mix(1.0, 0.62, wet);
        float shoreSlope = 0.245 * cos(p.x * 0.7) + 0.256 * cos(p.x * 1.6);
        vec3 landNormal = normalize(vec3(-shoreSlope * 0.075, 1.0, 0.075));
        sand *= 0.64 + 0.36 * max(0.0, dot(landNormal, SUN));

        vec3 normal = waterNormal(p.xz, water);
        float depth = max(0.0, water - beach);
        vec3 absorption = exp(-vec3(1.3, 0.22, 0.10) * depth);
        vec3 sea = mix(vec3(0.007, 0.095, 0.16), vec3(0.025, 0.48, 0.40), absorption);
        float fresnel = 0.02 + 0.98 * pow(1.0 - max(0.0, dot(normal, -ray)), 5.0);
        sea = mix(sea, reflectedSky(p, reflect(ray, normal)), fresnel);
        sea += vec3(1.0, 0.94, 0.79) * sunSpecular(normal, -ray);

        float pixel = max(0.002, fwidth(water - beach));
        float waterMask = smoothstep(-pixel, pixel, water - beach);
        vec3 color = mix(sand, sea, waterMask);
        vec3 foamDomain = vec3(p.x * 9.0, 1.0, p.z * 12.0 + time * 2.2);
        float foamGrain = noise(foamDomain) * 0.65 + noise(foamDomain * 2.7 + 5.3) * 0.35;
        foamGrain = mix(foamGrain, 0.5, smoothstep(0.5, 1.5, max(fwidth(foamDomain.x), fwidth(foamDomain.z))));
        float breaking = smoothstep(0.6, 0.93, sin(wavePhase(p.xz)))
          * smoothstep(0.06, 0.18, depth) * (1.0 - smoothstep(0.7, 1.8, depth));
        float wash = 1.0 - smoothstep(0.008, 0.065, abs(water - beach));
        float retreat = wet * (1.0 - waterMask) * (1.0 - smoothstep(0.10, 0.20, beach)) * 0.24;
        float foam = clamp((breaking * 0.65 + wash * 0.85 + retreat) * smoothstep(0.25, 0.65, foamGrain), 0.0, 1.0);
        color = mix(color, vec3(0.88, 0.94, 0.92), foam);
        // Atmospheric extinction also hides sub-pixel distant wave detail.
        return mix(color, vec3(0.38, 0.62, 0.72), 1.0 - exp(-distance * 0.004));
      }
      vec3 coastView(vec3 origin, vec3 ray, float windowDistance) {
        if (ray.y >= -0.002) return cloudySky(origin, ray);
        float flatDistance = origin.y / -ray.y;
        // ponytail: distant waves flatten below pixel scale; add multiscale tracing for offshore close-ups.
        if (flatDistance > 100.0) {
          vec3 sea = reflectedSky(origin + ray * flatDistance, reflect(ray, vec3(0,1,0))) * 0.80;
          return mix(sea, vec3(0.48, 0.72, 0.82), 1.0 - exp(-flatDistance * 0.006));
        }
        float distance = max(windowDistance, (origin.y - 0.65) / -ray.y);
        vec3 point = origin + ray * distance;
        for (int i = 0; i < 64; i++) {
          point = origin + ray * distance;
          float above = point.y - surfaceHeight(point.xz);
          if (above < 0.002) break;
          distance += clamp(above * 0.5 / max(0.08, -ray.y), 0.008, 1.5);
        }
        return shadeCoast(point, ray, distance);
      }
      void main() {
        // Trace a metre-scale 3D coast using the actual eye/window ray, including parallax.
        vec2 outward = vec2(windowAxis.y, -windowAxis.x);
        vec3 origin = vec3((dot(cameraPosition.xz, windowAxis) - windowCenter) * 0.01,
          cameraPosition.y * 0.01, dot(cameraPosition.xz - vWorldPosition.xz, outward) * 0.01);
        vec3 delta = vec3(dot(vWorldPosition.xz - cameraPosition.xz, windowAxis),
          vWorldPosition.y - cameraPosition.y, dot(vWorldPosition.xz - cameraPosition.xz, outward)) * 0.01;
        vec3 color = coastView(origin, normalize(delta), length(delta) + 0.001);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}
