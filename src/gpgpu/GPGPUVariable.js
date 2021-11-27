import { ShaderMaterial } from 'three';
import { GPGPU } from './GPGPU';
import { FloatPack } from './FloatPack';

class GPGPUVariable {

	constructor( input, {
		shader = GPGPUVariable.fragmentShader,
		uniforms = {}
	} = {} ) {

		if ( ! GPGPU.renderer ) throw new Error(
			'Use GPUVariable.init( renderer ) before instancing.'
		);

		this._shader = shader;
		this._uniforms = uniforms;

		this.init( input );

	}

	init( input ) {

		// The data can either be an array or a length
		const dataIsArray = Array.isArray( input );

		const size = ( dataIsArray )
			? GPGPU.getTextureSize( input.length )
			: GPGPU.getTextureSize( input );
		this._size = size;

		this.dataTexture = GPGPU.createTexture( size );
		this._buffer = this.dataTexture.image.data;
		this._data = ( dataIsArray ) ? input : new Float32Array( size * size );
		if ( dataIsArray ) FloatPack.pack( input, this.dataTexture.image.data );

		this.uniforms = this._uniforms;

		this._rt1 = GPGPU.createRenderTarget( size );
		this._rt2 = GPGPU.createRenderTarget( size );
		this.renderTarget = this._rt1;

	}

	compute() {

		// Toggling between 2 RenderTargets is required to avoid a framebuffer
		// feedback loop
		this.renderTarget = ( this.renderTarget === this._rt1 )
			? this._rt2
			: this._rt1;

		GPGPU.render( this.material, this.renderTarget );
		this.material.uniforms.GPGPU_data.value = this.renderTarget.texture;

	}

	dispose() {

		this._rt1.dispose();
		this._rt2.dispose();
		this.dataTexture.dispose();

	}

	/*-------------------------------------------------------------------------/

		Utils

	/-------------------------------------------------------------------------*/

	fill( number ) {

		this._data.fill( number );
		FloatPack.pack( this._data, this.dataTexture.image.data );

	}

	read() {

		// This is slow and intended for debug only

		GPGPU.renderer.readRenderTargetPixels(
			this.renderTarget, 0, 0, this._size, this._size, this._buffer
		);
		FloatPack.unpack( this._buffer, this._data );

		return this._data;

	}

	/*-------------------------------------------------------------------------/

		Getters & Setters

	/-------------------------------------------------------------------------*/

	get shader() {

		return this._shader;

	}

	set shader( shader ) {

		this._shader = shader;

		this.material = new ShaderMaterial( {
			uniforms: this._uniforms,
			vertexShader: GPGPUVariable.vertexShader,
			fragmentShader: shader
		} );

		const size = this.size.toFixed( 1 );
		this.material.defines.resolution = `vec2( ${size}, ${size} )`;

	}

	get uniforms() {

		return this._uniforms;

	}

	set uniforms( uniforms ) {

		uniforms.GPGPU_data = { value: this.dataTexture };
		this._uniforms = uniforms;
		this.shader = this._shader;

	}

	/*-------------------------------------------------------------------------/

		Read-only

	/-------------------------------------------------------------------------*/

	get size() {

		return this._size;

	}

	get output() {

		return this.material.uniforms.GPGPU_data.value;

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
