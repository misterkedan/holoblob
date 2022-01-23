vec3 bayerMatrixDither( vec3 color ) {

	// Silly code because old devices ( OpenGL ES < 3 ) don't support arrays

	int index = int( mod( gl_FragCoord.x - 0.5, 8.0 ) ) + 
		int( mod( gl_FragCoord.y - 0.5, 8.0 ) * 8.0 );

	float dither = 0.0078;

	dither = ( index == 1 ) ? 0.0039 : dither;
	dither = ( index == 2 ) ? 0.0068 : dither;
	dither = ( index == 3 ) ? 0.0029 : dither;
	dither = ( index == 4 ) ? 0.0076 : dither;
	dither = ( index == 5 ) ? 0.0036 : dither;
	dither = ( index == 6 ) ? 0.0066 : dither;
	dither = ( index == 7 ) ? 0.0027 : dither;

	dither = ( index == 8 )  ? 0.0019 : dither;
	dither = ( index == 9 )  ? 0.0059 : dither;
	dither = ( index == 10 ) ? 0.0009 : dither;
	dither = ( index == 11 ) ? 0.0049 : dither;
	dither = ( index == 12 ) ? 0.0017 : dither;
	dither = ( index == 13 ) ? 0.0056 : dither;
	dither = ( index == 14 ) ? 0.0007 : dither;
	dither = ( index == 15 ) ? 0.0046 : dither;

	dither = ( index == 16 ) ? 0.0063 : dither;
	dither = ( index == 17 ) ? 0.0024 : dither;
	dither = ( index == 18 ) ? 0.0073 : dither;
	dither = ( index == 19 ) ? 0.0034 : dither;
	dither = ( index == 20 ) ? 0.0061 : dither;
	dither = ( index == 21 ) ? 0.0022 : dither;
	dither = ( index == 22 ) ? 0.0071 : dither;
	dither = ( index == 23 ) ? 0.0032 : dither;

	dither = ( index == 24 ) ? 0.0005 : dither;
	dither = ( index == 25 ) ? 0.0044 : dither;
	dither = ( index == 26 ) ? 0.0014 : dither;
	dither = ( index == 27 ) ? 0.0054 : dither;
	dither = ( index == 28 ) ? 0.0002 : dither;
	dither = ( index == 29 ) ? 0.0041 : dither;
	dither = ( index == 30 ) ? 0.0012 : dither;
	dither = ( index == 31 ) ? 0.0051 : dither;

	dither = ( index == 32 ) ? 0.0074 : dither;
	dither = ( index == 33 ) ? 0.0035 : dither;
	dither = ( index == 34 ) ? 0.0065 : dither;
	dither = ( index == 35 ) ? 0.0025 : dither;
	dither = ( index == 36 ) ? 0.0077 : dither;
	dither = ( index == 37 ) ? 0.0038 : dither;
	dither = ( index == 38 ) ? 0.0067 : dither;
	dither = ( index == 39 ) ? 0.0028 : dither;

	dither = ( index == 40 ) ? 0.0016 : dither;
	dither = ( index == 41 ) ? 0.0055 : dither;
	dither = ( index == 42 ) ? 0.0006 : dither;
	dither = ( index == 43 ) ? 0.0045 : dither;
	dither = ( index == 44 ) ? 0.0018 : dither;
	dither = ( index == 45 ) ? 0.0057 : dither;
	dither = ( index == 46 ) ? 0.0008 : dither;
	dither = ( index == 47 ) ? 0.0047 : dither;

	dither = ( index == 48 ) ? 0.006  : dither;
	dither = ( index == 49 ) ? 0.0021 : dither;
	dither = ( index == 50 ) ? 0.007  : dither;
	dither = ( index == 51 ) ? 0.003  : dither;
	dither = ( index == 52 ) ? 0.0062 : dither;
	dither = ( index == 53 ) ? 0.0023 : dither;
	dither = ( index == 54 ) ? 0.0072 : dither;
	dither = ( index == 55 ) ? 0.0033 : dither;

	dither = ( index == 56 ) ? 0.0001 : dither;
	dither = ( index == 57 ) ? 0.004  : dither;
	dither = ( index == 58 ) ? 0.0011 : dither;
	dither = ( index == 59 ) ? 0.005  : dither;
	dither = ( index == 60 ) ? 0.0003 : dither;
	dither = ( index == 61 ) ? 0.0043 : dither;
	dither = ( index == 62 ) ? 0.0013 : dither;
	dither = ( index == 63 ) ? 0.0052 : dither;

	return color - dither;
	
}