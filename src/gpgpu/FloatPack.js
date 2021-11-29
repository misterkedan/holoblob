/**
 * @author Pierre Keda
 *
 * Functions to encode/decode 32 bit floating point numbers in RGBA8 texels.
 * This allows to store GPU computed data in basic textures, which is less
 * convenient than float/half-float textures, but compatible with way more
 * devices, especially mobiles.
 */

const glsl = /*glsl*/`

vec4 packFloat( float value ) {

	if ( value == 0.0 ) return vec4( 0.0, 0.0, 0.0, 0.0 );

	float mag = abs( value );
	
	float exponent = floor( log2( mag ) );
	exponent += float( exp2( exponent ) <= mag / 2.0 );
	exponent -= float( exp2( exponent ) > mag );

	float mantissa = ( exponent > 100.0 )
		? mag / 1024.0 / exp2( exponent - 10.0 ) - 1.0
		: mag / float( exp2( exponent ) ) - 1.0;

	float r = exponent + 127.0;
	mantissa *= 256.0;

	float g = floor( mantissa );
	mantissa -= g;
	mantissa *= 256.0;

	float b = floor( mantissa );
	mantissa -= b;
	mantissa *= 128.0;

	float a = floor( mantissa ) * 2.0 + float( value < 0.0 );

	return vec4( r, g, b, a ) / 255.0;

}

float unpackFloat( vec4 value ) {

	float r = floor( value.r * 255.0 + 0.5 );
	float g = floor( value.g * 255.0 + 0.5 );
	float b = floor( value.b * 255.0 + 0.5 );
	float a = floor( value.a * 255.0 + 0.5 );

	float exponent = r - 127.0;
	float sign = 1.0 - mod( a, 2.0 ) * 2.0;
	float mantissa = float( r > 0.0 ) + g / 256.0 + b / 65536.0
		+ floor( a / 2.0 ) / 8388608.0;
	return sign * mantissa * exp2( exponent );

}

`;

function pack( data, buffer ) {

	if ( ! buffer ) buffer = new Uint8Array( data.length * 4 );

	let value, mag, exponent, exp2, mantissa, g, b;

	for ( let i = 0, j = 0, l = data.length; i < l; i ++ ) {

		value = data[ i ];

		if ( value !== 0 ) {

			mag = Math.abs( value );

			exponent = Math.floor( Math.log2( mag ) );
			exp2 = Math.pow( 2, exponent );
			exponent += ( exp2 <= mag / 2 );
			exponent -= ( exp2 > mag );

			mantissa = ( exponent > 100 )
				? mag / 1024 / Math.pow( 2, exponent - 10 ) - 1
				: mag / exp2 - 1;

			buffer[ j ] = exponent + 127;
			mantissa *= 256;

			g = Math.floor( mantissa );
			buffer[ j + 1 ] = g;
			mantissa = ( mantissa - g ) * 256;

			b = Math.floor( mantissa );
			buffer[ j + 2 ] = b;
			mantissa = ( mantissa - b ) * 128;

			buffer[ j + 3 ] = Math.floor( mantissa ) * 2 + ( value < 0 );

		}

		j += 4;

	}

	return buffer;

}

function unpack( buffer, data ) {

	let r, g, b, a, exponent, sign, mantissa, float;

	if ( ! data ) data = new Float32Array( buffer.length / 4 );

	for ( let i = 0, j = 0, l = buffer.length; i < l; i += 4 ) {

		r = buffer[ i ];
		g = buffer[ i + 1 ];
		b = buffer[ i + 2 ];
		a = buffer[ i + 3 ];

		exponent = r - 127;
		sign = 1 - ( a % 2 ) * 2;
		mantissa = ( r > 0.0 ) + g / 256 + b / 65536 + Math.floor( a / 2.0 )
			/ 8388608;

		float = sign * mantissa * Math.pow( 2, exponent );

		data[ j ] = float;

		j ++;

	}

}

const FloatPack = { glsl, pack, unpack };

export { FloatPack };
