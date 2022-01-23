import { Uniform } from 'three';
import { GPGPU } from './GPGPU';

class GPGPUConstant {

	/**
	 * Create a float-packed 8bit DataTexture, for values that will never
	 * change ( ex: starting positions ).
	 * @param {Array} data 		An array of numbers to encode in texture form.
	 * @returns {DataTexture}	The encoded numbers.
	 */
	constructor( data, textureSize ) {

		if ( ! textureSize ) textureSize = GPGPU.getTextureSize( data.length );
		const dataTexture = GPGPU.createDataTexture( textureSize );
		dataTexture.needsUpdate = true;
		GPGPU.FloatPack.pack( data, dataTexture.image.data );
		return new Uniform( dataTexture );

	}

}

export { GPGPUConstant };
