import { Color, PerspectiveCamera, Scene } from 'three';

// Scene

const scene = new Scene();
scene.background = new Color( 0x0088ff );

// Camera

const fov = 45;
const aspect = 1;
const near = 0.1;
const far = 1000;

const camera = new PerspectiveCamera( fov, aspect, near, far );
camera.position.set( 10, 10, 10 );
camera.lookAt( 0, 0, 0 );

// Methods

function add( child ) {

	scene.add( child );

}

function remove( child ) {

	scene.remove( child );

}

function resize( width, height ) {

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

}

// Export

export default {
	scene, camera,
	add, remove, resize
};