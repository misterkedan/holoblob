function removeDuplicateVertices( geometry ) {

	const positions = geometry.attributes.position.array;
	const separator = '|';
	const stringVertices = [];

	for ( let i = 0; i < positions.length; i += 3 ) {

		const vertex = [ positions[ i ], positions[ i + 1 ], positions[ i + 2 ] ];
		stringVertices.push( vertex.join( separator ) );

	}

	const deduped = Array.from( new Set( stringVertices ) );

	const output = deduped.reduce( ( array, stringVertex ) => {

		const vertex = stringVertex.split( separator );
		vertex.forEach( position => array.push( Number( position ) ) );
		return array;

	}, [] );

	return output;

}

function trimFloat( float, decimals = 2, method = Math.round ) {

	var p = Math.pow( 10, decimals || 0 );
	var n = ( float * p ) * ( 1 + Number.EPSILON );
	return method( n ) / p;

}

export default { removeDuplicateVertices, trimFloat };
