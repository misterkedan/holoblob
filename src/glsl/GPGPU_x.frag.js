import { FloatPack } from '../gpgpu/FloatPack';

export default /*glsl*/`

uniform sampler2D GPGPU_x;
uniform sampler2D GPGPU_y;
uniform sampler2D GPGPU_z;
uniform sampler2D GPGPU_startX;
uniform vec3 uCursor;

${ FloatPack.glsl }

void main() {
	
	vec2 uv = gl_FragCoord.xy / resolution.xy;

	float x = unpackFloat( texture2D( GPGPU_x, uv ) );
	float y = unpackFloat( texture2D( GPGPU_y, uv ) );
	float z = unpackFloat( texture2D( GPGPU_z, uv ) );
	float startX = unpackFloat( texture2D( GPGPU_startX, uv ) );

	vec3 diff = uCursor - vec3( x, y, z );

	const float G = 6.674;
	float force = -1.0 * G / pow( length( diff ), 3.0 );
	float targetX = mix( startX, uCursor.x, clamp( force, -G, G ) );

	const float lerpSpeed = 0.03;
	x = mix( x, targetX, lerpSpeed );

	gl_FragColor = packFloat( x );

}

`;
