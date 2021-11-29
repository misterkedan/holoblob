import {
	BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, SphereGeometry,
} from 'three';
import { FloatPack } from './gpgpu/FloatPack';
import { GPGPU } from './gpgpu/GPGPU';
import { GPGPUConstant } from './gpgpu/GPGPUConstant';
import { GPGPUVariable } from './gpgpu/GPGPUVariable';

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

// Pre-computed numbers
const particleCount = particlePositions.length / 3;
const textureSize = GPGPU.getTextureSize( particleCount );

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

const GPGPU_startX = new GPGPUConstant( startX );
const GPGPU_startY = new GPGPUConstant( startY );
const GPGPU_startZ = new GPGPUConstant( startZ );

/*-----------------------------------------------------------------------------/

	GPGPU variables

	See the shaders in /glsl/ to see exactly how the positions are computed.

/-----------------------------------------------------------------------------*/

const uniforms = {
	GPGPU_startX: { value: GPGPU_startX },
	GPGPU_startY: { value: GPGPU_startY },
	GPGPU_startZ: { value: GPGPU_startZ },
	uCursor: { value: controls.cursor.position }
};

const GPGPU_x = new GPGPUVariable( {
	name: 'x',
	shader: GPGPU_x_shader,
	uniforms,
	textureSize,
} );

const GPGPU_y = new GPGPUVariable( {
	name: 'y',
	shader: GPGPU_y_shader,
	uniforms,
	textureSize,
} );

const GPGPU_z = new GPGPUVariable( {
	name: 'z',
	shader: GPGPU_z_shader,
	uniforms,
	textureSize,
} );

/*-----------------------------------------------------------------------------/

	Geometry

	Here the particles will be cloned cubes ( one per vertex of the container
	sphere ), all merged in a single geometry.

/-----------------------------------------------------------------------------*/

const particleGeometry = new EdgesGeometry( new BoxGeometry(
	config.particleSize,
	config.particleSize,
	config.particleSize
) );

const geometry = GPGPU.cloneGeometry(
	particleGeometry,
	particleCount,
	textureSize
);

if ( config.debug ) {

	console.log( { particleCount } );
	console.log( { totalVertices: geometry.attributes.position.count } );

}

/*-----------------------------------------------------------------------------/

	Material

	The final material is modified before compilation, to apply the GPGPU
	computed positions to the vertices.

	Otherwise, all the cubes cloned above would be at ( 0, 0, 0 ).

/-----------------------------------------------------------------------------*/

const material = new LineBasicMaterial( {
	color: config.particleColor,
	opacity: config.particleOpacity,
	transparent: true,
} );

material.onBeforeCompile = ( shader ) => {

	shader.uniforms.GPGPU_x = { value: GPGPU_x.output };
	shader.uniforms.GPGPU_y = { value: GPGPU_y.output };
	shader.uniforms.GPGPU_z = { value: GPGPU_z.output };

	// Definitions of the GPGPU attributes/uniforms

	const insertA = /*glsl*/`
	attribute vec2 GPGPU_target;
	uniform sampler2D GPGPU_x;
	uniform sampler2D GPGPU_y;
	uniform sampler2D GPGPU_z;
	${ FloatPack.glsl }
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

/-----------------------------------------------------------------------------*/

const blob = new LineSegments( geometry, material );
stage.add( blob );

/*-----------------------------------------------------------------------------/

	Functions

/-----------------------------------------------------------------------------*/

// Called on every frame, from the main.js module.
function update() {

	GPGPU_x.update();
	GPGPU_y.update();
	GPGPU_z.update();

}

/*-----------------------------------------------------------------------------/

	Export

/-----------------------------------------------------------------------------*/

export default { update };
