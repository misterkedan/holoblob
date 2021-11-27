import { ShaderMaterial } from 'three';
import { GPGPU } from './GPGPU';
import { FloatPack } from './FloatPack';

class GPGPUVariable {

	constructor( {
		data,
		shader = GPGPUVariable.fragmentShader,
		uniforms = {}
	} = {} ) {

		if ( ! GPGPU.renderer ) throw new Error(
			'Use GPUVariable.init( renderer ) before instancing.'
		);

		this._shader = shader;
		this._uniforms = uniforms;
		this.data = data;

	}

	compute() {

		// Toggling between 2 RenderTargets is required to avoid a framebuffer
		// feedback loop
		this.renderTarget = ( this.renderTarget === this._rt1 )
			? this._rt2
			: this._rt1;

		GPGPU.render( this.material, this.renderTarget );
		this.material.uniforms.tData.value = this.renderTarget.texture;

	}

	fill( number ) {

		this._data.fill( number );
		FloatPack.pack( this._data, this.tData.image.data );

	}

	dispose() {

		this._rt1.dispose();
		this._rt2.dispose();
		this.tData.dispose();

	}

	// This is slow and intended for debug only
	read() {

		GPGPU.renderer.readRenderTargetPixels(
			this.renderTarget, 0, 0, this._size, this._size, this._buffer
		);
		FloatPack.unpack( this._buffer, this._data );

		return this._data;

	}

	/*-------------------------------------------------------------------------/

		Getters & Setters

	/-------------------------------------------------------------------------*/



	set data( data ) {

		// The data can either be an array or a length
		const dataIsArray = Array.isArray( data );

		const size = ( dataIsArray )
			? GPGPU.getTextureSize( data.length )
			: GPGPU.getTextureSize( data );
		this._size = size;

		this.tData = GPGPU.createTexture( size );
		this._buffer = this.tData.image.data;
		this._data = ( dataIsArray ) ? data : new Float32Array( size * size );
		if ( dataIsArray ) FloatPack.pack( data, this.tData.image.data );

		this.uniforms = this._uniforms;

		this._rt1 = GPGPU.createRenderTarget( size );
		this._rt2 = GPGPU.createRenderTarget( size );
		this.renderTarget = this._rt1;

	}

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

		uniforms.tData = { value: this.tData };
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

		return this.material.uniforms.tData.value;

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

    uniform sampler2D tData;

    ${ FloatPack.glsl }

    void main() {
        
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        float data = unpackFloat( texture2D( tData, uv ) );

        // Modify data...

        gl_FragColor = packFloat( data );

    }

`;

export { GPGPUVariable };
