import { BoxGeometry, BufferAttribute, BufferGeometry, EdgesGeometry, Mesh, MeshBasicMaterial, SphereGeometry, TetrahedronGeometry, Uint32BufferAttribute, Vector3 } from 'three';
import { FloatPack } from './gpgpu/FloatPack';
import { GPGPU } from './gpgpu/GPGPU';
import { GPGPUVariable } from './gpgpu/GPGPUVariable';
import render from './render';
import stage from './stage';
import utils from './utils';

// PREP

GPGPU.init( render.renderer );

// Geometry we will use to position the particles
const blueprint = new SphereGeometry( 5, 64, 32 );
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

const size = 0.2;

const stem = new EdgesGeometry( new BoxGeometry( size, size, size ) );
//console.log( stem );

const geometry = GPGPU.cloneGeometry( stem, count, textureSize );

const material = new MeshBasicMaterial( {
	opacity: 0.3,
	transparent: true,
	wireframe: true,
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

const mesh = new Mesh( geometry, material );
stage.add( mesh );


// METHODS

function update( time, delta ) {

	//console.log( { time, delta } );

}

// EXPORT

export default { update };
