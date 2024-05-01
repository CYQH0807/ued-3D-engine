   varying highp vec2 vUv;
 
 void main(){

    float strength = 0.15 / distance(vUv,vec2(0.5,0.5)) -1. ;

	 gl_FragColor = vec4(strength,strength,strength,strength);

 }