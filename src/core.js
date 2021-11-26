import { BoxGeometry, BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, Uint32BufferAttribute } from 'three';
import { FloatPack } from './gpgpu/FloatPack';
import { GPGPU } from './gpgpu/GPGPU';
import { GPGPUVariable } from './gpgpu/GPGPUVariable';
import render from './render';
import stage from './stage';

// PREP

GPGPU.init( render.renderer );

const count = 4;
const size = GPGPU.getTextureSize( count );

// GPGPU

let startPositions = {};

const x = new Array( count );
//const y = new Float32Array( count );
//const z = new Float32Array( count );

for ( let i = 0; i < count; i ++ ) {

	x[ i ] = i * 1.1;

}

const GPGPUPositionX = new GPGPUVariable( {
	data: x,
} );

GPGPUPositionX.compute();

// MESH

const stem = new BoxGeometry();
//console.log( stem );

function cloneGeometry( stem, count ) {

	const geometry = new BufferGeometry();

	const verticesPerClone = stem.attributes.position.count;
	const positionsPerClone = verticesPerClone * 3;
	const uvsPerClone = verticesPerClone * 2;

	const verticesCount = verticesPerClone * count;
	const positionsCount = verticesCount * 3;
	const uvsCount = verticesCount * 2;

	const positions = new Float32Array( positionsCount );
	const normals = new Float32Array( positionsCount );
	const uvs = new Float32Array( uvsCount );
	const references = new Float32Array( uvsCount );

	const stemPositions = stem.attributes.position.array;
	const stemNormals = stem.attributes.normal.array;
	const stemUVs = stem.attributes.uv.array;

	let x = 0;
	let y = 0;
	let reference = 0;
	let instance = 0;

	let position = 0;
	let uv = 0;

	for ( let i = 0; i < positionsCount; i ++ ) {

		// Instance

		if ( position === positionsPerClone ) {

			position = 0;
			instance ++;

			x = ( instance % size ) / size;
			y = ~ ~ ( instance / size ) / size;
			// note : ~ ~ is an obscure, bitwise equivalent of Math.floor()
			// not recommended in general, because it is less legible
			// used for performance because we're dealing with large arrays

		}

		if ( uv === uvsPerClone ) uv = 0;

		// Vertex

		if ( ! ( i % 3 ) ) {

			references[ reference ++ ] = x;
			references[ reference ++ ] = y;

		}

		// Position

		positions[ i ] = stemPositions[ position ];
		normals[ i ] = stemNormals[ position ];
		position ++;

		// UV

		uvs[ i ] = stemUVs[ uv ];
		uv ++;

	}

	geometry.setAttribute( 'position',  new BufferAttribute( positions,     3 ) );
	geometry.setAttribute( 'normal',    new BufferAttribute( normals,       3 ) );
	geometry.setAttribute( 'uv', 		new BufferAttribute( uvs,    		2 ) );
	geometry.setAttribute( 'reference', new BufferAttribute( references,    2 ) );

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

}

//console.time( 'test' );
const geometry = cloneGeometry( stem, count );
//console.timeEnd( 'test' );

const material = new MeshBasicMaterial( {
	wireframe: true,
} );

const declarations = /*glsl*/`
attribute vec2 reference;
uniform sampler2D gpgpuX;
${ FloatPack.glsl }
`;

const modifications = /*glsl*/`
	transformed.x += unpackFloat( texture2D( gpgpuX, reference ) );
`;

let mainShader;

material.onBeforeCompile = ( shader ) => {

	shader.uniforms.gpgpuX = { value: GPGPUPositionX.output };

	const before = 'void main()';
	const begin = '#include <begin_vertex>';

	let { vertexShader } = shader;
	vertexShader = vertexShader.replace( before, declarations + before );
	vertexShader = vertexShader.replace( begin, begin + modifications );
	shader.vertexShader = vertexShader;

	mainShader = shader;

};

const mesh = new Mesh( geometry, material );
stage.add( mesh );


// METHODS

function update( time, delta ) {

	//console.log( { time, delta } );

}

// EXPORT

export default { update };
