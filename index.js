const http      = require( 'http' );
const path      = require( 'path' );
const url       = require( 'url' );

const stringify = require( 'json-stable-stringify' );

const DEFAULT_PORT = 3000;

let solrResponses;
let updateSolrResponsesSolrServerUrl;

function startSolrFake(
    solrResponsesIndex,
    solrResponsesDirectory,
    portArg,
    updateSolrResponsesSolrServerUrlArg ) {

    solrResponses = getSolrResponses( solrResponsesIndex, solrResponsesDirectory );

    const port = portArg || DEFAULT_PORT;

    let handler = normalHandler;

    if ( updateSolrResponsesSolrServerUrlArg  ) {
        updateSolrResponsesSolrServerUrl = updateSolrResponsesSolrServerUrlArg;

        console.log( 'Switching to update Solr responses mode' );
        console.log( `Solr server = ${ updateSolrResponsesSolrServerUrl }` );

        handler = updateSolrResponsesHandler;
    }

    http.createServer( handler ).listen( port )
        .on( 'listening', () => {
            console.log( 'Solr fake is running on port ' + port );
        } )
        .on( 'error', ( e ) => {
            console.error( e );
        } );
}

function getSolrResponses( solrResponsesIndex, solrResponsesDirectory ) {
    const data = {};

    const index = require( solrResponsesIndex );

    Object.keys( index ).forEach( queryString => {
        const file = path.join( solrResponsesDirectory, index[ queryString ] );

        const response = require( file );

        data[ normalizeQueryString( queryString ) ] = response;
    } );

    return data;
}

function normalizeQueryString( queryString ) {
    queryString = decodeURI( queryString );

    const urlSearchParams = new URLSearchParams( decodeURI( queryString ) );

    urlSearchParams.sort();

    return '?' + urlSearchParams.toString();
}

function normalHandler( request, response ) {

    const requestUrl = url.parse( request.url );

    const queryString = requestUrl.search;

    if ( ! queryString ) {
        return;
    }

    const normalizedQueryString = normalizeQueryString( queryString );

    let solrResponse = solrResponses[ normalizedQueryString ];

    if ( ! solrResponse ) {
        const errorMessage = `Query string "${ queryString }" not found in index`;

        solrResponse = {
            error : errorMessage,
        };

        console.error( errorMessage );
    }

    const solrResponseString = stringify( solrResponse, { space: '    ' } );

    response.writeHead( 200, {
        "Access-Control-Allow-Origin" : "*",
        "Content-Type"                : "text/plain;charset=utf-8",
    } );

    response.write( solrResponseString );
    response.end();
}

function updateSolrResponsesHandler( request, response ) {
    response.write( 'update!' );
    response.end();
}

module.exports.startSolrFake = startSolrFake;
