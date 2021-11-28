import { GPGPU } from './GPGPU';
import { FloatPack } from './FloatPack';

class GPGPUConstant {

	/**
	 * Create a float-packed 8bit DataTexture, for values that will never
	 * change ( ex: starting positions ).
	 * @param {Array} data 		An array of numbers to encode in texture form.
	 * @returns {DataTexture}	The encoded numbers.
	 */
	constructor( data ) {

		const textureSize = GPGPU.getTextureSize( data.length );
		const dataTexture = GPGPU.createDataTexture( textureSize );
		FloatPack.pack( data, dataTexture.image.data );

		return dataTexture;

	}

}

export { GPGPUConstant };
