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

/-----------------------------------------------------------------------------*/

const particleCount = particlePositions.length / 3;
if ( config.debug ) console.log( { particleCount } );

const textureSize = GPGPU.getTextureSize( particleCount );

const uniforms = {
	GPGPU_startX: { value: GPGPU_startX },
	GPGPU_startY: { value: GPGPU_startY },
	GPGPU_startZ: { value: GPGPU_startZ },
	uCursor: { value: controls.cursor }
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

/-----------------------------------------------------------------------------*/

const particleGeometry = new EdgesGeometry( new BoxGeometry(
	config.particleSize, config.particleSize, config.particleSize
) );

const geometry = GPGPU.cloneGeometry( particleGeometry, particleCount, textureSize );

/*-----------------------------------------------------------------------------/

	Material

/-----------------------------------------------------------------------------*/

const material = new LineBasicMaterial( {
	color: config.particleColor,
	opacity: config.particleOpacity,
	transparent: true,
} );

const declarations = /*glsl*/`
attribute vec2 GPGPU_target;
uniform sampler2D GPGPU_x;
uniform sampler2D GPGPU_y;
uniform sampler2D GPGPU_z;
${ FloatPack.glsl }
`;

const modifications = /*glsl*/`
	transformed.x += unpackFloat( texture2D( GPGPU_x, GPGPU_target ) );
	transformed.y += unpackFloat( texture2D( GPGPU_y, GPGPU_target ) );
	transformed.z += unpackFloat( texture2D( GPGPU_z, GPGPU_target ) );
`;

material.onBeforeCompile = ( shader ) => {

	shader.uniforms.GPGPU_x = { value: GPGPU_x.output };
	shader.uniforms.GPGPU_y = { value: GPGPU_y.output };
	shader.uniforms.GPGPU_z = { value: GPGPU_z.output };

	const tokenA = 'void main()';
	const tokenB = '#include <begin_vertex>';

	shader.vertexShader = shader.vertexShader.replace(
		tokenA,
		declarations + tokenA
	);

	shader.vertexShader = shader.vertexShader.replace(
		tokenB,
		tokenB + modifications
	);

};

/*-----------------------------------------------------------------------------/

	Wrap-up

/-----------------------------------------------------------------------------*/

const lines = new LineSegments( geometry, material );
stage.add( lines );

function update() {

	GPGPU_x.compute();
	GPGPU_y.compute();
	GPGPU_z.compute();

}

export default { update };
