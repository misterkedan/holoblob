import {
	BoxGeometry, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, Vector2
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import config from './config';
import render from './render';
import stage from './stage';

/*-----------------------------------------------------------------------------/

	Orbit

/-----------------------------------------------------------------------------*/

const orbit = new OrbitControls( stage.camera, render.canvas );
orbit.enableDamping = true;
orbit.autoRotate = true;
orbit.dampingFactor = config.orbit.dampingFactor;
orbit.autoRotateSpeed = config.orbit.autoRotateSpeed;

/*-----------------------------------------------------------------------------/

	Raycast

/-----------------------------------------------------------------------------*/

const pointer = new Vector2( - 1, - 1 );
const raycaster = new Raycaster();

const hitboxSize = config.containerSize * 10;
const hitbox = new Mesh(
	new PlaneGeometry( hitboxSize, hitboxSize ),
	new MeshBasicMaterial( { color: 'red', opacity: 0.25, transparent:true  } )
);
stage.add( hitbox );

const cursorSize = config.containerSize * 0.1;
const cursor = new Mesh(
	new BoxGeometry( cursorSize, cursorSize, cursorSize ),
	new MeshBasicMaterial( { color: 'blue', wireframe: true } )
);
stage.add( cursor );

/*-----------------------------------------------------------------------------/

	Event handlers

/-----------------------------------------------------------------------------*/

//function onTouchStart( event ) {

//	event.preventDefault();

//}

function onMouseUp() {

	console.log( cursor.position );

}

function onMouseMove( event ) {

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = 1 - ( event.clientY / window.innerHeight ) * 2;

}

function onTouchMove( event ) {

	onMouseMove( event.targetTouches[ 0 ] );

}

/*-----------------------------------------------------------------------------/

	Functions

/-----------------------------------------------------------------------------*/

function init() {

	//render.canvas.addEventListener( 'touchstart', onTouchStart );
	render.canvas.addEventListener( 'mousemove', onMouseMove );
	render.canvas.addEventListener( 'touchmove', onTouchMove );

	if ( config.debug ) {

		render.canvas.addEventListener( 'mouseup', onMouseUp );

	} else {

		hitbox.visible = false;
		cursor.visible = false;

	}

	const deviceHasTouch = !! navigator.maxTouchPoints;
	//const deviceIsTablet = deviceHasTouch && Math.max( window.innerWidth, window.innerHeight ) > 1000;
	//const deviceIsMobile = deviceHasTouch && ! deviceIsTablet;
	if ( deviceHasTouch ) orbit.enabled = false;

}

function tick() {

	if ( orbit ) orbit.update();

	hitbox.quaternion.copy( stage.camera.quaternion );
	raycaster.setFromCamera( pointer, stage.camera );
	const intersection = raycaster.intersectObjects( [ hitbox ] )[ 0 ];
	if ( intersection ) cursor.position.copy( intersection.point );

}

/*-----------------------------------------------------------------------------/

	Export

/-----------------------------------------------------------------------------*/

export default { init, tick, cursor };
