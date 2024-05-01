varying vec3 iPosition;
uniform float time;
uniform vec3 color;
void main() {
  float height = iPosition.y + 22.;
  float white = (distance(vec2(iPosition.x, iPosition.z), vec2(0.0)) - 6.0) / (6.0 * (sqrt(2.0) - 1.0));
  float alphax = smoothstep(0.0, 1.0, white);
  float alphay = smoothstep(1.0, 0.3, height / 40.0 + sin(time) * 0.2);
  if(height < 0.1 || height > 99.9) {
    discard;
  }
  gl_FragColor = vec4(color + vec3(255., 0., 0.) * alphax * 0.0008, alphay * 0.6);
}