const http = require( 'http' );
const path = require( 'path' );
const url  = require( 'url' );

const DEFAULT_PORT = 3000;

function startSolrFake( solrResponsesIndex, solrResponsesDirectory, portArg ) {
    const solrResponses = require( path.join( __dirname, 'database' ) )( solrResponsesIndex, solrResponsesDirectory );

    const port = portArg || DEFAULT_PORT;

    console.log( 'JSON Server Solr fake is running on port ' + port );
}

module.exports.startSolrFake = startSolrFake;
