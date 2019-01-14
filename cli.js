const fs = require( 'fs' );

const argv = require( 'minimist' )( process.argv.slice( 2 ) );

const solrFake = require( './' );

let solrResponsesDirectory = argv._.pop();
if ( solrResponsesDirectory ) {
    solrResponsesDirectory = fs.realpathSync( solrResponsesDirectory );
}

let port = argv.port || undefined;

let solrRequestRewriterMiddleware;
if ( argv.middleware ) {
    solrRequestRewriterMiddleware = require( fs.realpathSync( argv.middleware ) );
}

solrFake.startSolrFake( solrResponsesDirectory, port, solrRequestRewriterMiddleware );
