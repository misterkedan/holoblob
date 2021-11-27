import {
	Camera, ClampToEdgeWrapping, DataTexture, Mesh, NearestFilter, PlaneGeometry,
	RGBAFormat, Scene, UnsignedByteType, WebGLRenderTarget
} from 'three';

function checkHardware() {

	GPGPU.isSupported = true;

	if ( ! GPGPU.renderer.capabilities.maxVertexTextures ) {

		console.warn( 'No support for vertex textures.' );
		GPGPU.isSupported = false;

	}

	if ( ! GPGPU.isSupported ) window.alert( 'Incompatible hardware.' );

	return GPGPU.isSupported;

}

const GPGPU = {

	/**
	 * Initiates the GPGPU class with a three.js renderer.
	 * This needs to be done ( once only ) before creating any GPGPUVariable instance.
	 * @param {WebGLRenderer}	renderer 	A WebGLRenderer instance
	 */
	init: ( renderer ) => {

		if ( GPGPU.renderer ) return;

		GPGPU.renderer = renderer;

		if ( ! checkHardware() ) return;

		GPGPU.renderer = renderer;
		GPGPU.scene = new Scene();
		GPGPU.camera = new Camera();
		GPGPU.mesh = new Mesh( new PlaneGeometry( 2, 2 ) );
		GPGPU.scene.add( GPGPU.mesh );

	},

	/**
	 * Calculates the minimum power of two texture size required to compute
	 * the specified number of elements.
	 * Ex:
	 * - 32x32 texture ( 1024 data-pixels ) for 1000 particules
	 * - 64x64 texture ( 4096 data-pixels ) for 1100 particules
	 * @param 	{Number} 	count	The number of elements to compute
	 * @returns {Number}	The texture size required
	 */
	getTextureSize: ( count ) => {

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

	},

	/*-------------------------------------------------------------------------/

		Utilities used by GPGPUVariable

	/-------------------------------------------------------------------------*/

	createTexture: ( size ) => new DataTexture(
		new Uint8Array( size * size * 4 ),	// data
		size, 				// width
		size,				// height
		RGBAFormat,			// format
		UnsignedByteType	// type
	),

	createRenderTarget: ( size ) => new WebGLRenderTarget(
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
	),

	render: ( material, renderTarget ) => {

		GPGPU.mesh.material = material;
		GPGPU.renderer.setRenderTarget( renderTarget );
		GPGPU.renderer.render( GPGPU.scene, GPGPU.camera );
		GPGPU.renderer.setRenderTarget( null );

	},

};

export { GPGPU };
