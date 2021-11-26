import * as dat from 'dat.gui';

// GUI

const gui = new dat.GUI();

gui.init = function () {

	const test = { test: () => console.log( 'Hello world !') }

	const settings = gui.addFolder( 'settings' );
	settings.add( test, 'test' );
	settings.open();

};

// Export

export default gui;
