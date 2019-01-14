const fs = require( 'fs' );

function solrResponses( solrResponsesDirectory ) {
    const data = { select : [] };

    fs.readdirSync( solrResponsesDirectory ).forEach( ( file ) => {
        const json = require( `${ solrResponsesDirectory }/${ file }` );

        data.select.push( json );
    } );

    return data;
}

module.exports = solrResponses;
