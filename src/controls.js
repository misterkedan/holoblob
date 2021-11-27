import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BoxGeometry, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, Vector2 } from 'three';
import config from './config';
import render from './render';
import stage from './stage';

// Pointer setup

new OrbitControls( stage.camera, render.canvas );

const pointer = new Vector2();
const raycaster = new Raycaster();

const hitboxSize = config.size * 10;
const hitbox = new Mesh(
	new PlaneGeometry( hitboxSize, hitboxSize ),
	new MeshBasicMaterial( { color: 'red', opacity: 0.25, transparent:true  } )
);
stage.add( hitbox );

const cursorSize = config.size * 0.1;
const cursor = new Mesh(
	new BoxGeometry( cursorSize, cursorSize, cursorSize ),
	new MeshBasicMaterial( { color: 'blue', wireframe: true } )
);
stage.add( cursor );

// Event handlers

function onTouchStart( event ) {

	event.preventDefault();

}

function onPointerUp() {

	console.log( cursor.position );

}

function onPointerMove( event ) {

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = 1 - ( event.clientY / window.innerHeight ) * 2;

}

// Main

function init() {

	render.canvas.addEventListener( 'touchstart', onTouchStart );
	render.canvas.addEventListener( 'pointermove', onPointerMove );

	if ( config.debug ) {

		render.canvas.addEventListener( 'pointerup', onPointerUp );

	} else {

		hitbox.visible = false;
		cursor.visible = false;

	}

}

function update() {

	hitbox.quaternion.copy( stage.camera.quaternion );
	raycaster.setFromCamera( pointer, stage.camera );
	const intersection = raycaster.intersectObjects( [ hitbox ] )[ 0 ];
	if ( intersection ) cursor.position.copy( intersection.point );

}

export default { init, update, cursor: cursor.position };
