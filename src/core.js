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

// PREP

GPGPU.init( render.renderer );

// Geometry we will use to position the particles

const segments = 32;
const blueprint = new SphereGeometry( config.size, segments * 2, segments );
const vertices = utils.removeDuplicateVertices( blueprint );
//console.log( blueprint );

// Compute the size of the GPGPU Textures
const count = vertices.length / 3;
const textureSize = GPGPU.getTextureSize( count );

// GPGPU

let startPositions = { x: [], y: [], z:[] };

for ( let i = 0; i < vertices.length; i += 3 ) {

	startPositions.x.push( vertices[ i ] );
	startPositions.y.push( vertices[ i + 1 ] );
	startPositions.z.push( vertices[ i + 2 ] );

}

const GPGPUPositionX = new GPGPUVariable( { data: startPositions.x } );
const GPGPUPositionY = new GPGPUVariable( { data: startPositions.y } );
const GPGPUPositionZ = new GPGPUVariable( { data: startPositions.z } );

GPGPUPositionX.compute();
GPGPUPositionY.compute();
GPGPUPositionZ.compute();

// MESH

const particleSize = 0.15;

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
uniform sampler2D gpgpuX;
uniform sampler2D gpgpuY;
uniform sampler2D gpgpuZ;
${ FloatPack.glsl }
`;

const modifications = /*glsl*/`
	transformed.x += unpackFloat( texture2D( gpgpuX, reference ) );
	transformed.y += unpackFloat( texture2D( gpgpuY, reference ) );
	transformed.z += unpackFloat( texture2D( gpgpuZ, reference ) );
`;

material.onBeforeCompile = ( shader ) => {

	shader.uniforms.gpgpuX = { value: GPGPUPositionX.output };
	shader.uniforms.gpgpuY = { value: GPGPUPositionY.output };
	shader.uniforms.gpgpuZ = { value: GPGPUPositionZ.output };

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

	//

}

// EXPORT

export default { material, update };
