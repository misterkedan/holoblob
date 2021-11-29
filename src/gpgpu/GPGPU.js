/**
 * @author Pierre Keda
 *
 * three.js GPGPU
 *
 * Based on https://threejs.org/examples/?q=gpgpu#webgl_gpgpu_birds
 * And https://github.com/mrdoob/three.js/blob/dev/examples/jsm/misc/GPUComputationRenderer.js
 *
 * Basic usage :
 * GPGPU.init( renderer );
 * const variable = new GPGPUVariable();
 * variable.update();
 * uniforms.variable = { value: variable.output };
 */

import {
	BufferAttribute, BufferGeometry, Camera, ClampToEdgeWrapping, DataTexture,
	Mesh, NearestFilter, PlaneGeometry, RGBAFormat, Scene, Uint32BufferAttribute,
	UnsignedByteType, WebGLRenderTarget
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
	 * Initiates the GPGPU class with a three.js renderer. This needs to be done
	 * ( once only ) before creating any GPGPUVariable instance.
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

	createDataTexture: ( size ) => new DataTexture(
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

	/*-------------------------------------------------------------------------/

		Utility for preparing mesh-particles

	/-------------------------------------------------------------------------*/

	/**
	 * Clones a geometry x times, adding a 'GPGPU_target' vec2 attribute, in
	 * order to associate vertices with a texel of the GPGPUVariable output textures.
	 * One texel will contain the data for one clone.
	 * @param {BufferGeometry} 	stem 	The geometry to clone.
	 * @param {Number}			count	The number of times to clone the geometry.
	 * @returns {BufferGeometry}		A merged geometry containing all the clones.
	 */
	cloneGeometry: ( stem, count, textureSize ) => {

		if ( ! textureSize ) textureSize = GPGPU.getTextureSize( count );

		const verticesPerClone = stem.attributes.position.count;
		const positionsPerClone = verticesPerClone * 3;
		const uvsPerClone = verticesPerClone * 2;

		const verticesCount = verticesPerClone * count;
		const doubleCount = verticesCount * 2;
		const tripleCount = verticesCount * 3;

		const positions = new Float32Array( tripleCount );
		const normals = new Float32Array( tripleCount );
		const uvs = new Float32Array( doubleCount );
		const GPGPUtargets = new Float32Array( doubleCount );

		const stemPositions = stem.attributes.position.array;
		const stemNormals = stem.attributes.normal?.array || [];
		const stemUVs = stem.attributes.uv?.array || [];

		const geometry = new BufferGeometry();

		let x = 0;
		let y = 0;
		let reference = 0;
		let clone = 0;

		let position = 0;
		let uv = 0;

		for ( let i = 0; i < tripleCount; i ++ ) {

			// Instance

			if ( position === positionsPerClone ) {

				position = 0;
				clone ++;

				x = ( clone % textureSize ) / textureSize;
				y = ~ ~ ( clone / textureSize ) / textureSize;
				// note : ~ ~ is an obscure, bitwise equivalent of Math.floor()
				// not recommended in general, because it is less legible
				// used for performance because we're dealing with large arrays

			}

			if ( uv === uvsPerClone ) uv = 0;

			// Vertex

			if ( ! ( i % 3 ) ) {

				GPGPUtargets[ reference ++ ] = x;
				GPGPUtargets[ reference ++ ] = y;

			}

			// Position + normals

			positions[ i ] = stemPositions[ position ];
			normals[ i ] = stemNormals[ position ];
			position ++;

			// UV

			uvs[ i ] = stemUVs[ uv ];
			uv ++;

		}

		geometry.setAttribute(
			'GPGPU_target', new BufferAttribute( GPGPUtargets, 2 )
		);

		geometry.setAttribute(
			'position',  new BufferAttribute( positions, 3 )
		);

		if ( stem.attributes.normals ) geometry.setAttribute(
			'normal', new BufferAttribute( normals, 3 )
		);

		if ( stem.attributes.uv ) geometry.setAttribute(
			'uv', new BufferAttribute( uvs, 2 )
		);

		if ( stem.index ) {

			let stemIndices = stem.index.array;
			let indicesPerClone = stemIndices.length;
			let indicesTotal = indicesPerClone * count;
			let indices = new Uint32Array( indicesTotal );

			for ( let i = 0, offset; i < indicesTotal; i ++ ) {

				offset = ~ ~ ( i / indicesPerClone ) * verticesPerClone;
				indices[ i ] = stemIndices[ i % indicesPerClone ] + offset;

			}

			geometry.setIndex( new Uint32BufferAttribute( indices, 1 ) );

		}

		return geometry;

	},

};

export { GPGPU };
