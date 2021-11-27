import { FloatPack } from '../gpgpu/FloatPack';

export default /*glsl*/`

uniform sampler2D GPGPU_data;
uniform sampler2D GPGPU_startX;
uniform sampler2D GPGPU_startY;
uniform sampler2D GPGPU_startZ;
uniform vec3 uCursor;

${ FloatPack.glsl }

void main() {
	
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	float data = unpackFloat( texture2D( GPGPU_data, uv ) );

	float startX = unpackFloat( texture2D( GPGPU_startX, uv ) );
	float startY = unpackFloat( texture2D( GPGPU_startY, uv ) );
	float startZ = unpackFloat( texture2D( GPGPU_startZ, uv ) );

	float multiplier = -1.0;
	vec3 diff = uCursor - vec3( data, startY, startZ );
	float dist = pow( length( diff ), 3.0 );
	float force = multiplier * 6.67408 / dist;
	force = clamp( force, -5.0, 5.0 );

	float target = mix( startX, uCursor.x, force );

	float lerpSpeed = 0.03;
	data = mix( data, target, lerpSpeed );

	gl_FragColor = packFloat( data );

}

`;
