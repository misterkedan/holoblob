import {
	BoxGeometry,
	EdgesGeometry,
	Float32BufferAttribute,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	LineBasicMaterial,
	LineSegments,
	SphereGeometry,
	Uniform,
} from 'three';

import { GPGPU } from './gpgpu/GPGPU';
import GPGPU_x_shader from './glsl/GPGPU_x.frag';
import GPGPU_y_shader from './glsl/GPGPU_y.frag';
import GPGPU_z_shader from './glsl/GPGPU_z.frag';

import config from './config';
import controls from './controls';
import render from './render';
import stage from './stage';
import utils from './utils';

/*-----------------------------------------------------------------------------/

	GPGPU preparation

/-----------------------------------------------------------------------------*/

// Need to link the GPGPU object and the renderer
GPGPU.init( render.renderer );

// Geometry we will use to position the particles
const container = new SphereGeometry(
	config.containerSize,
	config.containerSegments * 2,
	config.containerSegments
);

// We need to remove duplicate vertices to avoid duplicate particules
const particlePositions = utils.removeDuplicateVertices( container );

// The GPGPU object needs a maximum count in order to compute
// the size of the data texture it will use
const particleCount = particlePositions.length / 3;

const gpgpu = new GPGPU( particleCount );

/*-----------------------------------------------------------------------------/

	GPGPU constants

	We need to encode the positions in texture form, so we can access them
	from the GPGPU shaders.

/-----------------------------------------------------------------------------*/

const startX = [];
const startY = [];
const startZ = [];

for ( let i = 0; i < particlePositions.length; i += 3 ) {

	startX.push( particlePositions[ i ] );
	startY.push( particlePositions[ i + 1 ] );
	startZ.push( particlePositions[ i + 2 ] );

}

gpgpu.addConstant( 'startX', startX );
gpgpu.addConstant( 'startY', startY );
gpgpu.addConstant( 'startZ', startZ );

/*-----------------------------------------------------------------------------/

	GPGPU variables

	See the shaders in /glsl/ to see exactly how the positions are computed.

	The null uniforms will be set in the update() function later on.

/-----------------------------------------------------------------------------*/

const uCursor = new Uniform( controls.cursor.position );

gpgpu.addVariable( 'x', {
	shader: GPGPU_x_shader,
	uniforms: {
		GPGPU_startX: gpgpu.startX,
		uCursor,
	},
} );

gpgpu.addVariable( 'y', {
	shader: GPGPU_y_shader,
	uniforms: {
		GPGPU_startY: gpgpu.startY,
		uCursor,
	},
} );

gpgpu.addVariable( 'z', {
	shader: GPGPU_z_shader,
	uniforms: {
		GPGPU_startZ: gpgpu.startZ,
		uCursor,
	},
} );

gpgpu.assign( 'x', 'y' );
gpgpu.assign( 'x', 'z' );
gpgpu.assign( 'y', 'x' );
gpgpu.assign( 'y', 'z' );
gpgpu.assign( 'z', 'x' );
gpgpu.assign( 'z', 'y' );

/*-----------------------------------------------------------------------------/

	Geometry

	Here the particles will be cloned cubes ( one per vertex of the container
	sphere ), all merged in a single geometry.

/-----------------------------------------------------------------------------*/

const textureSize = gpgpu.textureSize;
const targets = new Float32Array( particleCount * 2 );

for ( let i = 0, j = 0; i < particleCount; i ++ ) {

	targets[ j ++ ] = ( i % textureSize ) / textureSize;
	targets[ j ++ ] = ~ ~ ( i / textureSize ) / textureSize;

}

// Create geometries we will use

const baseGeometry = new BoxGeometry(
	config.particleSize,
	config.particleSize,
	config.particleSize
);
const particleGeometry = new EdgesGeometry( baseGeometry );

// Create the final geometry

const geometry = new InstancedBufferGeometry();
geometry.setAttribute(
	'position',
	new Float32BufferAttribute().copy( particleGeometry.attributes.position )
);
geometry.setAttribute(
	'GPGPU_target',
	new InstancedBufferAttribute( targets, 2 )
);

// Clean-up

baseGeometry.dispose();
particleGeometry.dispose();

if ( config.debug ) {

	console.log( { particleCount } );
	console.log( { totalVertices: geometry.attributes.position.count } );

}

/*-----------------------------------------------------------------------------/

	Material

	The final material is modified before compilation, to apply the GPGPU
	computed positions to the vertices.

/-----------------------------------------------------------------------------*/

const material = new LineBasicMaterial( {
	color: config.particleColor,
	opacity: config.particleOpacity,
	transparent: true,
} );

material.onBeforeCompile = ( shader ) => {

	shader.uniforms.GPGPU_x = gpgpu.x;
	shader.uniforms.GPGPU_y = gpgpu.y;
	shader.uniforms.GPGPU_z = gpgpu.z;

	// Definitions of the GPGPU attributes/uniforms

	const insertA = /*glsl*/`
	attribute vec2 GPGPU_target;
	uniform sampler2D GPGPU_x;
	uniform sampler2D GPGPU_y;
	uniform sampler2D GPGPU_z;
	${ GPGPU.FloatPack.glsl }
	`;

	const tokenA = 'void main()';

	shader.vertexShader = shader.vertexShader.replace( tokenA, insertA + tokenA );

	// Modification of the vertices positions
	// Note: "transformed" is a position variable used in three.js material shaders

	const insertB = /*glsl*/`
		transformed.x += unpackFloat( texture2D( GPGPU_x, GPGPU_target ) );
		transformed.y += unpackFloat( texture2D( GPGPU_y, GPGPU_target ) );
		transformed.z += unpackFloat( texture2D( GPGPU_z, GPGPU_target ) );
	`;

	const tokenB = '#include <begin_vertex>';

	shader.vertexShader = shader.vertexShader.replace( tokenB, tokenB + insertB );

};

/*-----------------------------------------------------------------------------/

	Final GPGPU-computed object

	It's blobby.

/-----------------------------------------------------------------------------*/

const blob = new LineSegments( geometry, material );
stage.add( blob );

/*-----------------------------------------------------------------------------/

	Functions

	update() is called on every frame, from the main.js module.

/-----------------------------------------------------------------------------*/

function tick() {

	gpgpu.tick();

}

/*-----------------------------------------------------------------------------/

	Export

/-----------------------------------------------------------------------------*/

export default { tick };
