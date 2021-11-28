import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Ticker } from './misc/Ticker';

import controls from './controls';
import core from './core';
import render from './render';
import stage from './stage';
import config from './config';

// Setup

const toUpdate = [ controls, core, render ];
let needsResize = true;

if ( config.debug ) {

	let stats = new Stats();
	stats.domElement.style.margin = '1rem';
	document.body.appendChild( stats.domElement );
	toUpdate.push( stats );

}

// Start

init();

// Callbacks

function init() {

	const toInit = [ render, controls ];
	toInit.forEach( item => item.init() );

	window.addEventListener( 'resize', () => needsResize = true );

	const ticker = new Ticker( animate, 0 );
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
