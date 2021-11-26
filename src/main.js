import { Ticker } from './misc/Ticker';

import core from './core';
import render from './render';
import stage from './stage';

// Setup

const toUpdate = [ core, render ];
let needsResize = true;

// Start

init();

// Callbacks

function init() {

	render.init();

	window.addEventListener( 'resize', () => needsResize = true );

	const ticker = new Ticker( animate, 60 );
	ticker.start();

}

function resize() {

	const toResize = [ stage, render ];
	toResize.forEach( item => item.resize( window.innerWidth, window.innerHeight ) );

	needsResize = false;

}

function animate( time, delta ) {

	if ( needsResize ) resize();

	toUpdate.forEach( item => item.update( time, delta ) );

}
