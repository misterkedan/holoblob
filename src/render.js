import { WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { DitheredUnrealBloomPass } from './misc/DitheredUnrealBloomPass';
import { FXAAPass } from './misc/FXAAPass';

import config from './config';
import stage from './stage';

/*-----------------------------------------------------------------------------/

	Renderer

/-----------------------------------------------------------------------------*/

const renderer = new WebGLRenderer( {
	powerPreference: 'high-performance',
	antialias: false,
	stencil: false,
	depth: false
} );

const canvas = renderer.domElement;
document.getElementById( 'main' ).appendChild( canvas );

/*-----------------------------------------------------------------------------/

	Composer

/-----------------------------------------------------------------------------*/

const composer = new EffectComposer( renderer );

const passes = {
	render: new RenderPass( stage.scene, stage.camera ),
	fxaa: new FXAAPass(),
	bloom: new DitheredUnrealBloomPass( config.bloom ),
};

/*-----------------------------------------------------------------------------/

	Functions

/-----------------------------------------------------------------------------*/

function init() {

	Object.values( passes ).forEach( pass => composer.addPass( pass )	);

}

function resize( width, height ) {

	const pixelRatio = Math.min( window.devicePixelRatio, 2 );
	renderer.setPixelRatio( pixelRatio );
	renderer.setSize( width, height );
	composer.setSize( width, height );

	Object.values( passes ).forEach( ( pass ) => {

		if ( pass.setSize ) pass.setSize( width, height, pixelRatio );

	} );

}

function update() {

	composer.render();

}

/*-----------------------------------------------------------------------------/

	Export

/-----------------------------------------------------------------------------*/

export default {
	renderer, canvas, composer, passes,
	init, resize, update
};
