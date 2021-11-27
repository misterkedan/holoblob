import {
	BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, SphereGeometry,
} from 'three';
import config from './config';
import { FloatPack } from './gpgpu/FloatPack';
import { GPGPU } from './gpgpu/GPGPU';
import { GPGPUVariable } from './gpgpu/GPGPUVariable';
import render from './render';
import stage from './stage';
import utils from './utils';
import GPGPU_x_frag from './glsl/GPGPU_x.frag';
import GPGPU_y_frag from './glsl/GPGPU_y.frag';
import GPGPU_z_frag from './glsl/GPGPU_z.frag';
import controls from './controls';

// PREP

GPGPU.init( render.renderer );

// Geometry we will use to position the particles

const segments = 64;
const blueprint = new SphereGeometry( config.size, segments * 2, segments );
const vertices = utils.removeDuplicateVertices( blueprint );
//console.log( blueprint );

// Compute the size of the GPGPU Textures
const count = vertices.length / 3;
const textureSize = GPGPU.getTextureSize( count );

console.log( count );

// GPGPU

const startX = [];
const startY = [];
const startZ = [];

for ( let i = 0; i < vertices.length; i += 3 ) {

	startX.push( vertices[ i ] );
	startY.push( vertices[ i + 1 ] );
	startZ.push( vertices[ i + 2 ] );

}

GPGPU.start = {
	x: new GPGPUVariable( startX ),
	y: new GPGPUVariable( startY ),
	z: new GPGPUVariable( startZ ),
};

//GPGPU.start.x.compute();
//GPGPU.start.y.compute();
//GPGPU.start.z.compute();

const translateUniforms = {
	GPGPU_startX: { value: GPGPU.start.x.output },
	GPGPU_startY: { value: GPGPU.start.y.output },
	GPGPU_startZ: { value: GPGPU.start.z.output },
	uCursor: { value: controls.cursor }
};

GPGPU.translate = {

	x: new GPGPUVariable( startX, {
		shader: GPGPU_x_frag,
		uniforms: { ...translateUniforms },
	} ),

	y: new GPGPUVariable( startY, {
		shader: GPGPU_y_frag,
		uniforms: { ...translateUniforms },
	} ),

	z: new GPGPUVariable( startZ, {
		shader: GPGPU_z_frag,
		uniforms: { ...translateUniforms },
	} ),

};

// MESH

//const particleSize = 0.15;
const particleSize = 0.05;

const particleGeometry = new EdgesGeometry(
	new BoxGeometry( particleSize, particleSize, particleSize )
);

const geometry = GPGPU.cloneGeometry( particleGeometry, count, textureSize );

const material = new LineBasicMaterial( {
	opacity: 0.5,
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

	shader.uniforms.GPGPU_x = { value: GPGPU.translate.x.output };
	shader.uniforms.GPGPU_y = { value: GPGPU.translate.y.output };
	shader.uniforms.GPGPU_z = { value: GPGPU.translate.z.output };

	const before = 'void main()';
	const begin = '#include <begin_vertex>';

	let { vertexShader } = shader;
	vertexShader = vertexShader.replace( before, declarations + before );
	vertexShader = vertexShader.replace( begin, begin + modifications );
	shader.vertexShader = vertexShader;

	material.shader = shader;

};

const lines = new LineSegments( geometry, material );
stage.add( lines );


// METHODS

function update() {

	GPGPU.translate.x.compute();
	GPGPU.translate.y.compute();
	GPGPU.translate.z.compute();

	//if ( material.shader ) {

	//	material.shader.uniforms.GPGPU_y.value = GPGPU.translate.y.output;

	//}


}

// EXPORT

export default { material, update };
