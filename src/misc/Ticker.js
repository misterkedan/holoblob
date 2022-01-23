/**
 * Simple ticker.
 * @author Pierre Keda
 */

class Ticker {

	/**
	 * Fires the specified callback or array of callbacks repeatedly, on every
	 * animation frame or on a specified FPS rate.
	 * @param { Function|Array[Function] } callbacks
	 * 							Function(s) that will be repeatedly called.
	 * @param { Number } fps	Frames per second limiter, 0 for uncapped frames.
	 */
	constructor( callbacks = [], fps = 0 ) {

		this.callbacks = ( typeof callbacks === 'function' )
			? [ callbacks ]
			: callbacks;
		this.fps = fps;
		this.elapsed = 0;

		this._last = 0;
		this._deltaOffset = 0;
		this._isPlaying = false;
		this._update = this.update.bind( this );

	}

	/*-------------------------------------------------------------------------/

		Callback management

	/-------------------------------------------------------------------------*/

	/**
	 * Add a function to the animation loop.
	 * @param { Function } callback  Function that will start looping.
	 */
	add( callback ) {

		if ( this.has( callback ) ) return;
		this.callbacks.push( callback );

	}

	/**
	 * Remove a function from the animation loop.
	 * @param { Function } callback  Function that will stop looping.
	 */
	remove( callback ) {

		if ( ! this.has( callback ) ) return;
		this.callbacks.splice( this.callbacks.indexOf( callback ), 1 );

	}

	/**
	 * Check if a function is currently in the animation loop.
	 * @param { Function } callback  Function to check.
	 */
	has( callback ) {

		return this.callbacks.includes( callback );

	}

	/*-------------------------------------------------------------------------/

		Playback control

	/-------------------------------------------------------------------------*/

	reset() {

		this.elapsed = 0;

	}

	start() {

		this._last = this.now;
		this._deltaOffset = 0;
		this._isPlaying = true;
		this.requestFrame();

	}

	pause() {

		this._isPlaying = false;

	}

	stop() {

		this.pause();
		this.reset();

	}

	/*-------------------------------------------------------------------------/

		Animation

	/-------------------------------------------------------------------------*/

	update() {

		if ( this.isPlaying ) this.requestFrame();
		else return;

		const delta = Math.min( this.now - this._last, Ticker.maxDelta );
		this._last = this.now;
		this.elapsed += delta;

		// FPS uncapped or higher than actual framerate
		if ( delta >= this._frameDuration ) return this.tick( delta );

		// FPS cap + offset
		this._deltaOffset += delta;
		const diff = this._frameDuration - this._deltaOffset;
		if ( diff <= 0 ) {

			this.tick( this._frameDuration );
			this._deltaOffset = Math.abs( diff ) % this._frameDuration;

		}

	}

	tick( delta ) {

		this.callbacks.forEach( callback => callback( delta, this.elapsed ) );

	}

	requestFrame() {

		requestAnimationFrame( this._update );

	}

	/*-------------------------------------------------------------------------/

		Getters & Setters

	/-------------------------------------------------------------------------*/

	get fps() {

		return this._fps;

	}

	set fps( fps ) {

		this._fps = fps;
		this._frameDuration = ( fps > 0 ) ? Math.floor( 1000 / fps ) : 0;

	}

	/*-------------------------------------------------------------------------/

		Read-only

	/-------------------------------------------------------------------------*/

	get isPlaying() {

		return this._isPlaying;

	}

	get now() {

		return Ticker.time.now();

	}

}

Ticker.maxDelta = 100; // 100ms = 10fps
Ticker.time = Date || performance;

export { Ticker };
