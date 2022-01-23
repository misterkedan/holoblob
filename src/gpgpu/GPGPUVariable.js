import { ShaderMaterial, Uniform } from 'three';
import { GPGPU } from './GPGPU';
import { FloatPack } from './FloatPack';

class GPGPUVariable {

	/**
	 * Creates a variable for a set of data ( ex: position x of a set of vertices ).
	 * This variable will be encoded into an 8 bit texture using float packing,
	 * for maximum compatibility, and computed in a fragment shader to force
	 * computations on the GPU. The output texture can then be used as a uniform
	 * sampler2D in another shader, allowing for variable data sets.
	 *
	 * @param {Object} options				Options.
	 * @param {Number} options.length 		The length of the data set.
	 * This will be overridden by options.data.length if options.data is defined,
	 * and by textureSize if it is defined ( in that case, the length will be
	 * textureSize * textureSize ).
	 * @param {Array}  options.data			The starting data.
	 * @param {Number} options.textureSize	The texture size of the DataTexture.
	 * This is not required, but can be set manually to avoid recomputing the
	 * texture size several times.
	 * @param {String} options.name 		Name of the variable.
	 * @param {String} options.prefix 		Prefix for the name of the variable
	 * @param {Number} options.defaultValue Value to default the data to if
	 * the input is a length.
	 * @param {String} options.shader 		The fragmentShader that will be used
	 * for GPGPU computations. See GPGPU.fragmentShader for an example/template.
	 * @param {String} options.uniforms 	Uniforms used by the fragmentShader.
	 * Note that an uniform will be created automatically, using the prefix+name
	 * of the variable, for the data texture current value.
	 */
	constructor( {
		data,
		defaultValue,
		textureSize,
		length = 65536, // 256 x 256
		name = 'data',
		prefix = 'GPGPU_',
		shader = GPGPUVariable.fragmentShader,
		uniforms = {}
	} = {} ) {

		if ( ! GPGPU.renderer ) throw new Error(
			'Use GPUVariable.init( renderer ) before instancing.'
		);

		// Length & texture size

		if ( data ) length = data.length;
		else if ( textureSize ) length = textureSize * textureSize;

		if ( ! textureSize ) textureSize = GPGPU.getTextureSize( length );
		this.textureSize = textureSize;

		// RenderTarget x2

		this.rt1 = GPGPU.createRenderTarget( textureSize );
		this.rt2 = GPGPU.createRenderTarget( textureSize );
		this.renderTarget = this.rt1;

		// DataTexture

		this.dataTexture = GPGPU.createDataTexture( textureSize );
		this.dataTexture.needsUpdate = true;

		if ( data ) {

			this.write( data );

		} else {

			data = this.createDataArray( defaultValue );
			if ( defaultValue ) this.write( data );

		}

		// Uniforms

		this.output = new Uniform( this.dataTexture );

		this.name = ( prefix ) ? prefix + name : name;
		this.uniforms = uniforms;
		this.uniforms[ this.name ] = this.output;

		// ShaderMaterial

		this.material = new ShaderMaterial( {
			uniforms: this.uniforms,
			vertexShader: GPGPUVariable.vertexShader,
			fragmentShader: shader
		} );
		const sizeToFixed = textureSize.toFixed( 1 );
		this.material.defines.resolution = `vec2( ${sizeToFixed}, ${sizeToFixed} )`;

	}

	/**
	 * Process the data in the fragment shader.
	 * The result can then be accessed via this.output.
	 */
	update() {

		// Toggling between 2 RenderTargets is required to avoid
		// a framebuffer feedback loop
		this.renderTarget = ( this.renderTarget === this.rt1 )
			? this.rt2 : this.rt1;

		GPGPU.render( this.material, this.renderTarget );
		this.output.value = this.renderTarget.texture;

	}

	/**
	 * This needs to be called if the variable won't be used anymore,
	 * to avoid memory leaks.
	 */
	dispose() {

		this.rt1.dispose();
		this.rt2.dispose();
		this.dataTexture.dispose();
		this.material.dispose();

	}

	/*-------------------------------------------------------------------------/

		Utils

	/-------------------------------------------------------------------------*/

	/**
	 * Creates a data array for this variable.
	 * @param {Number} fill 	A number to fill the data array with.
	 * If no value is provided, all numbers will default to 0.
	 * @returns {Array}		An array of numbers.
	 */
	createDataArray( fill ) {

		const array = new Float32Array( this.textureSize * this.textureSize );
		if ( fill ) array.fill( fill );
		return array;

	}

	/**
	 * Returns an array with the unpacked current values.
	 * Note that this is slow and intended for debugging only.
	 * @returns {Array}	The current data.
	 */
	read() {

		GPGPU.renderer.readRenderTargetPixels(
			this.renderTarget, 0, 0,
			this.textureSize, this.textureSize,
			this.buffer
		);

		const data = this.createDataArray();
		FloatPack.unpack( this.buffer, data );

		return data;

	}

	/**
	 * Encode numeric data in this instance's DataTexture.
	 * @param {Array} data 		An array of numbers to encode.
	 */
	write( data ) {

		FloatPack.pack( data, this.buffer );

	}

	/*-------------------------------------------------------------------------/

		Read-only

	/-------------------------------------------------------------------------*/

	get buffer() {

		return this.dataTexture.image.data;

	}

}

/*-----------------------------------------------------------------------------/

	Static

/-----------------------------------------------------------------------------*/

GPGPUVariable.vertexShader = /*glsl*/`
    void main() {

        gl_Position = vec4( position, 1.0 );

    }
`;

// Template for float-packed GPGPU computations
GPGPUVariable.fragmentShader = /*glsl*/`
    uniform sampler2D GPGPU_data;

    ${ FloatPack.glsl }

    void main() {
        
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        float data = unpackFloat( texture2D( GPGPU_data, uv ) );

        // Modify data...

        gl_FragColor = packFloat( data );

    }
`;

export { GPGPUVariable };
