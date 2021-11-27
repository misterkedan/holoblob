function trimFloat( float, decimals = 2, method = Math.round ) {

	var p = Math.pow( 10, decimals || 0 );
	var n = ( float * p ) * ( 1 + Number.EPSILON );
	return method( n ) / p;

}

export default { trimFloat };
