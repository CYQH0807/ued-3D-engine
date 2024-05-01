varying vec2 vUv;

void main() {
	vUv = uv;

	vec4 modelPosition = modelViewMatrix * vec4(position, 1.0);
	// 投影矩阵 * 视图矩阵 * 模型矩阵 * 顶点坐标
	gl_Position = projectionMatrix * viewMatrix * modelPosition;
}