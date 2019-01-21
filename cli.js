const fs = require( 'fs' );

const argv = require( 'minimist' )( process.argv.slice( 2 ) );

const solrFake = require( './' );

let solrResponsesIndex = argv._[ 0 ];
if ( solrResponsesIndex ) {
    solrResponsesIndex = fs.realpathSync( solrResponsesIndex );
}

let solrResponsesDirectory = argv._[ 1 ];
if ( solrResponsesDirectory ) {
    solrResponsesDirectory = fs.realpathSync( solrResponsesDirectory );
}

let port = argv.port || undefined;

let updateSolrResponsesSolrServerUrl = argv[ 'update-solr-responses-solr-server-url' ] || undefined;

solrFake.startSolrFake( solrResponsesIndex, solrResponsesDirectory, port, updateSolrResponsesSolrServerUrl );
