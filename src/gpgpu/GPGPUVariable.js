import { ShaderMaterial } from 'three';
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
	 * @param {Number|Array} input 	Either a length ( ex: 1000 if this variable
	 * is for 1000 particules ), or an array of numbers ( ex: the position x
	 * of each of the 1000 particules ).
	 * @param {Object} options
	 * @param {String} options.name 	Name of the variable
	 * @param {String} options.prefix 	Prefix for the name of the variable
	 * @param {Number} options.defaultValue 	Value to default the data to
	 * if the input is a length.
	 * @param {String} options.shader 	The fragmentShader that will be used
	 * for GPGPU computations. See GPGPU.fragmentShader for an example/template.
	 * @param {String} options.uniforms 	Uniforms used by the fragmentShader.
	 * Note that an uniform will be created automatically, using the prefix+name
	 * of the variable, for the data texture current value.
	 */
	constructor( input, {
		name = 'data',
		prefix = 'GPGPU_',
		defaultValue = 0,
		shader = GPGPUVariable.fragmentShader,
		uniforms = {}
	} = {} ) {

		if ( ! GPGPU.renderer ) throw new Error(
			'Use GPUVariable.init( renderer ) before instancing.'
		);

		// DataTexture

		const inputIsLength = ( typeof input === 'number' );

		const textureSize = ( inputIsLength )
			? GPGPU.getTextureSize( input )
			: GPGPU.getTextureSize( input.length );
		this.textureSize = textureSize;

		this.dataTexture = GPGPU.createDataTexture( textureSize );

		if ( inputIsLength ) input = this.createDataArray( defaultValue );
		if ( ! inputIsLength || defaultValue ) FloatPack.pack( input, this.buffer );

		// Uniforms

		this.name = ( prefix ) ? prefix + name : name;
		uniforms[ this.name ] = { value: this.dataTexture };
		this.uniforms = uniforms;

		// ShaderMaterial

		this.material = new ShaderMaterial( {
			uniforms: this.uniforms,
			vertexShader: GPGPUVariable.vertexShader,
			fragmentShader: shader
		} );
		const sizeToFixed = textureSize.toFixed( 1 );
		this.material.defines.resolution = `vec2( ${sizeToFixed}, ${sizeToFixed} )`;

		// RenderTarget x2

		this.rt1 = GPGPU.createRenderTarget( textureSize );
		this.rt2 = GPGPU.createRenderTarget( textureSize );
		this.renderTarget = this.rt1;

	}

	/**
	 * Process the data in the fragment shader.
	 * The result can then be accessed via this.output.
	 */
	compute() {

		// Toggling between 2 RenderTargets is required to avoid
		// a framebuffer feedback loop
		this.renderTarget = ( this.renderTarget === this.rt1 )
			? this.rt2 : this.rt1;

		GPGPU.render( this.material, this.renderTarget );
		this.material.uniforms[ this.name ].value = this.renderTarget.texture;

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
	 * @returns {[Number]}		An array of numbers.
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

	/*-------------------------------------------------------------------------/

		Read-only

	/-------------------------------------------------------------------------*/

	get buffer() {

		return this.dataTexture.image.data;

	}

	get output() {

		return this.material.uniforms[ this.name ].value;

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
