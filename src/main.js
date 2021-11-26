import { Ticker } from './animation/Ticker';

import { gui } from './gui';
import { render } from './render';
import { stage } from './stage';

// Setup

const toResize = [ stage, render ];
const toUpdate = [ render ];

// Start

init();

// Callbacks

function init() {

	render.init();
	gui.init();

	window.addEventListener( 'resize', resize );
	resize();

	const ticker = new Ticker( animate, 60 );
	ticker.start();

}

function resize() {

	toResize.forEach( item => item.resize( window.innerWidth, window.innerHeight ) );

}

function animate( time ) {

	toUpdate.forEach( item => item.update( time ) );

}
