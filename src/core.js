import {
	BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, SphereGeometry,
} from 'three';
import { FloatPack } from './gpgpu/FloatPack';
import { GPGPU } from './gpgpu/GPGPU';
import { GPGPUVariable } from './gpgpu/GPGPUVariable';

import GPGPU_x_frag from './glsl/GPGPU_x.frag';
import GPGPU_y_frag from './glsl/GPGPU_y.frag';
import GPGPU_z_frag from './glsl/GPGPU_z.frag';

import config from './config';
import controls from './controls';
import render from './render';
import stage from './stage';
import utils from './utils';

/*-----------------------------------------------------------------------------/

	GPGPU preparation

/-----------------------------------------------------------------------------*/

// Set the GPGPU renderer ( same as main renderer )
GPGPU.init( render.renderer );

// Geometry we will use to position the particles.
const container = new SphereGeometry(
	config.containerSize,
	config.containerSegments * 2,
	config.containerSegments
);

// We need to remove duplicate vertices to avoid duplicate particules.
const particlePositions = utils.removeDuplicateVertices( container );

/*-----------------------------------------------------------------------------/

	GPGPU constants

	We need to encode the positions in texture form, so we can access them
	from the GPGPU shaders. To do this easily, we use GPGPUVariable
	instances that will not be recomputed.

/-----------------------------------------------------------------------------*/

const startX = [];
const startY = [];
const startZ = [];

for ( let i = 0; i < particlePositions.length; i += 3 ) {

	startX.push( particlePositions[ i ] );
	startY.push( particlePositions[ i + 1 ] );
	startZ.push( particlePositions[ i + 2 ] );

}

const GPGPUstartX = new GPGPUVariable( startX );
const GPGPUstartY = new GPGPUVariable( startY );
const GPGPUstartZ = new GPGPUVariable( startZ );

/*-----------------------------------------------------------------------------/

	GPGPU variables

/-----------------------------------------------------------------------------*/

const particleCount = particlePositions.length / 3;
if ( config.debug ) console.log( { particleCount } );

const translateUniforms = {
	GPGPU_startX: { value: GPGPUstartX.output },
	GPGPU_startY: { value: GPGPUstartY.output },
	GPGPU_startZ: { value: GPGPUstartZ.output },
	uCursor: { value: controls.cursor }
};

const GPGPUx = new GPGPUVariable( particleCount, {
	shader: GPGPU_x_frag,
	uniforms: { ...translateUniforms },
} );

const GPGPUy = new GPGPUVariable( particleCount, {
	shader: GPGPU_y_frag,
	uniforms: { ...translateUniforms },
} );

const GPGPUz = new GPGPUVariable( particleCount, {
	shader: GPGPU_z_frag,
	uniforms: { ...translateUniforms },
} );

/*-----------------------------------------------------------------------------/

	Geometry

/-----------------------------------------------------------------------------*/

const particleGeometry = new EdgesGeometry( new BoxGeometry(
	config.particleSize, config.particleSize, config.particleSize
) );

// A lot of important thing happen in this utility method
const geometry = GPGPU.cloneGeometry( particleGeometry, particleCount );

/*-----------------------------------------------------------------------------/

	Material

/-----------------------------------------------------------------------------*/

const material = new LineBasicMaterial( {
	color: config.particleColor,
	opacity: config.particleOpacity,
	transparent: true,
} );

const declarations = /*glsl*/`
attribute vec2 reference;
uniform sampler2D GPGPU_x;
uniform sampler2D GPGPU_y;
uniform sampler2D GPGPU_z;
${ FloatPack.glsl }
`;

const modifications = /*glsl*/`
	transformed.x += unpackFloat( texture2D( GPGPU_x, reference ) );
	transformed.y += unpackFloat( texture2D( GPGPU_y, reference ) );
	transformed.z += unpackFloat( texture2D( GPGPU_z, reference ) );
`;

material.onBeforeCompile = ( shader ) => {

	shader.uniforms.GPGPU_x = { value: GPGPUx.output };
	shader.uniforms.GPGPU_y = { value: GPGPUy.output };
	shader.uniforms.GPGPU_z = { value: GPGPUz.output };

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

	GPGPUx.compute();
	GPGPUy.compute();
	GPGPUz.compute();

}

export default { update };
