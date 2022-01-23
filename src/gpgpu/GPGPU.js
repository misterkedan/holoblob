/**
 * @author Pierre Keda
 *
 * Float-packed three.js GPGPU
 *
 * Based on:
 * https://threejs.org/examples/?q=gpgpu#webgl_gpgpu_birds
 * https://github.com/mrdoob/three.js/blob/dev/examples/jsm/misc/GPUComputationRenderer.js
 *
 * Basic usage :
 * GPGPU.init( renderer );
 * const gpgpu = new GPGPU( 1337 );
 * gpgpu.addVariable( name, options ); // See GPGPUVariable for options
 * gpgpu.addConstant( name, data );
 *
 */

import {
	ClampToEdgeWrapping,
	DataTexture,
	Mesh,
	NearestFilter,
	PlaneGeometry,
	RGBAFormat,
	Camera,
	Scene,
	UnsignedByteType,
	WebGLRenderTarget
} from 'three';

import { GPGPUConstant } from './GPGPUConstant';
import { GPGPUVariable } from './GPGPUVariable';
import { FloatPack } from './FloatPack';

class GPGPU {

	constructor( size ) {

		this._textureSize = GPGPU.getTextureSize( size );
		this.variables = {};

	}

	addVariable( name, options ) {

		const variable = new GPGPUVariable( {
			...options,
			name,
			textureSize: this._textureSize,
		} );
		this.variables[ name ] = variable;
		this[ name ] = variable.output;

	}

	addConstant( name, data ) {

		this[ name ] = new GPGPUConstant( data, this._textureSize );

	}

	assign( targetName, sourceName ) {

		const target = this.variables[ targetName ];
		const source = this.variables[ sourceName ];
		target.uniforms[ source.name ] = source.output;

	}

	tick() {

		Object.values( this.variables ).forEach( variable => variable.update() );

	}

	/*-------------------------------------------------------------------------/

		Read-only

	/-------------------------------------------------------------------------*/

	get textureSize() {

		return this._textureSize;

	}

}

/*-----------------------------------------------------------------------------/

	Static

/-----------------------------------------------------------------------------*/

/**
 * Initiates the GPGPU class with a three.js renderer. This needs to be done
 * ( once only ) before creating any GPGPUVariable instance.
 * @param {WebGLRenderer}	renderer 	A WebGLRenderer instance
 */
GPGPU.init = ( renderer ) => {

	if ( GPGPU.renderer ) return;

	GPGPU.renderer = renderer;

	const checkHardware = () => {

		GPGPU.isSupported = true;

		if ( ! GPGPU.renderer.capabilities.maxVertexTextures ) {

			console.warn( 'No support for vertex textures.' );
			GPGPU.isSupported = false;

		}

		if ( ! GPGPU.isSupported ) window.alert( 'Incompatible hardware.' );

		return GPGPU.isSupported;

	};

	if ( ! checkHardware() ) return;

	GPGPU.renderer = renderer;
	GPGPU.scene = new Scene();
	GPGPU.camera = new Camera();
	GPGPU.mesh = new Mesh( new PlaneGeometry( 2, 2 ) );
	GPGPU.scene.add( GPGPU.mesh );

};

/**
 * Calculates the minimum power of two texture size required to compute
 * the specified number of elements.
 * Ex:
 * - 32x32 texture ( 1024 data-pixels ) for 1000 particules
 * - 64x64 texture ( 4096 data-pixels ) for 1100 particules
 * @param 	{Number} 	count	The number of elements to compute
 * @returns {Number}	The texture size required
 */
GPGPU.getTextureSize = ( count ) => {

	if (
		isNaN( count )
			|| ! isFinite( count )
			|| ! Number.isInteger( count )
			|| count < 1
	) throw new RangeError( 'Parameter must be an int > 0 ' );

	let n = 1;
	let size = 2;

	while ( size * size < count ) {

		size = Math.pow( 2, n );
		n ++;

	}

	return size;

};

/*-----------------------------------------------------------------------------/

	Utilities used by GPGPUVariable

/-----------------------------------------------------------------------------*/

GPGPU.createDataTexture = ( size ) => new DataTexture(
	new Uint8Array( size * size * 4 ),	// data
	size, 				// width
	size,				// height
	RGBAFormat,			// format
	UnsignedByteType	// type
);

GPGPU.createRenderTarget = ( size ) => new WebGLRenderTarget(
	size,	// width
	size,	// height
	{
		// options
		wrapS: ClampToEdgeWrapping,
		wrapT: ClampToEdgeWrapping,
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		stencilBuffer: false,
		depthBuffer: false,
		format: RGBAFormat,
		type: UnsignedByteType,
	}
);

GPGPU.render = ( material, renderTarget ) => {

	GPGPU.mesh.material = material;
	GPGPU.renderer.setRenderTarget( renderTarget );
	GPGPU.renderer.render( GPGPU.scene, GPGPU.camera );
	GPGPU.renderer.setRenderTarget( null );

};

GPGPU.FloatPack = FloatPack;

export { GPGPU };
