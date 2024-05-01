varying vec3 iPosition;
void main() {
  iPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}