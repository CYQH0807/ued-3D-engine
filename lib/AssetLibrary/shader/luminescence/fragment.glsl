uniform vec3 glowColor;
uniform float alpha;
uniform sampler2D textureMap;
uniform float time;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  uv.x = vUv.x - time;
  vec3 mapColor = texture2D(textureMap, uv).rgb;
  vec3 color = mix(mapColor.rgb, glowColor.rgb, 0.7);
  gl_FragColor = vec4(color, alpha);

}