const fs = require( 'fs' );
const path = require( 'path' );

function solrResponses( solrResponsesIndex, solrResponsesDirectory ) {
    const data = {};

    const index = require( solrResponsesIndex );

    Object.keys( index ).forEach( search => {
        const file = path.join( solrResponsesDirectory, index[ search ] );

        const response = require( file );

        data[ search ] = response;
    } );

    return data;
}

module.exports = solrResponses;
