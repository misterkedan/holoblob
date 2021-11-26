// https://threejs.org/examples/?q=post#webgl_postprocessing_fxaa

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

class FXAAPass extends ShaderPass {

	constructor() {

		super( FXAAShader );

	}

	setSize( width, height ) {

		const resolution = this.material.uniforms[ 'resolution' ].value;
		resolution.x = 1 / width;
		resolution.y = 1 / height;

	}

}

export { FXAAPass };
