import { Color, PerspectiveCamera, Scene } from 'three';
import config from './config';

// Scene

const scene = new Scene();
scene.background = new Color( config.backgroundColor );

// Camera

const fov = 45;
const aspect = 1;
const near = 0.1;
const far = 1000;

const camera = new PerspectiveCamera( fov, aspect, near, far );
camera.position.set( 0, 0, 20 );
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
