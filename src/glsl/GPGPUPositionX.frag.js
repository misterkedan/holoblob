import { FloatPack } from './FloatPack';

export default /*glsl*/`

uniform sampler2D tData;

${ FloatPack.glsl }

void main() {
	
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	float data = unpackFloat( texture2D( tData, uv ) );

	// Modify data...

	gl_FragColor = packFloat( data );

}

`;
