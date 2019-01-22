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

const port = argv.port || undefined;

const logfile = argv.logfile || undefined;

const updateSolrResponsesSolrServerUrl = argv[ 'update-solr-responses-solr-server-url' ] || undefined;

solrFake.startSolrFake(
    solrResponsesIndex,
    solrResponsesDirectory,
    port,
    logfile,
    updateSolrResponsesSolrServerUrl
);
