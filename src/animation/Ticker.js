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
		this._delta = 0;
		this._isPlaying = false;
		this._tick = this.tick.bind( this );

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

		Animation

	/-------------------------------------------------------------------------*/

	reset() {

		this.elapsed = 0;

	}

	start() {

		this._last = this.now;
		this._delta = 0;
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

	tick() {

		if ( this.isPlaying ) this.requestFrame();
		else return;

		const { now } = this;
		let delta = Math.min( Ticker.maxDelta, now - this._last );

		this._last = now;
		this._delta += delta;
		this.elapsed += delta;

		let diff = this._frameDuration - this._delta;
		if ( diff <= 0 ) {

			const normalizedDelta = this._frameDuration || delta;

			this.callbacks.forEach(
				callback => callback.call( this, this.elapsed, normalizedDelta )
			);

			this._delta = Math.abs( diff );

		}

	}

	requestFrame() {

		requestAnimationFrame( this._tick );

	}

	/*-------------------------------------------------------------------------/

		Getters/Setters

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

Ticker.maxDelta = 100; // 10fps
Ticker.time = Date || performance;

export { Ticker };
