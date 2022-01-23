import { Ticker } from './misc/Ticker';

import controls from './controls';
import core from './core';
import render from './render';
import stage from './stage';
import config from './config';

/*-----------------------------------------------------------------------------/

	App entry point

/-----------------------------------------------------------------------------*/

const toTick = [ controls, core, render ];
let needsResize = true;


init();

/*-----------------------------------------------------------------------------/

	Functions

/-----------------------------------------------------------------------------*/

function init() {

	const toInit = [ render, controls ];
	toInit.forEach( item => item.init() );

	window.addEventListener( 'resize', () => needsResize = true );

	const fps = ( config.debug ) ? 0 : 60;
	const ticker = new Ticker( tick, fps );
	ticker.start();

}

function resize() {

	const toResize = [ stage, render ];
	toResize.forEach( item => item.resize( window.innerWidth, window.innerHeight ) );

	needsResize = false;

}

function tick( delta, time ) {

	if ( needsResize ) resize();

	toTick.forEach( item => item.tick( delta, time ) );

}
