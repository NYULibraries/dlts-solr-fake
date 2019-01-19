const http      = require( 'http' );
const path      = require( 'path' );
const url       = require( 'url' );

const stringify = require( 'json-stable-stringify' );

const DEFAULT_PORT = 3000;

let solrResponses;

function startSolrFake( solrResponsesIndex, solrResponsesDirectory, portArg ) {
    solrResponses = getSolrResponses( solrResponsesIndex, solrResponsesDirectory );

    const port = portArg || DEFAULT_PORT;

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

function handler( request, response ) {

    const requestUrl = url.parse( request.url );

    const normalizedQueryString = normalizeQueryString( requestUrl.search );

    const solrResponse = solrResponses[ normalizedQueryString ] ?
                         solrResponses[ normalizedQueryString ] :
                         {
                            error : `Query string "${ normalizedQueryString }" not found in index`
                         };

    const solrResponseString = stringify( solrResponse, { space: '    ' } );


    response.writeHead( 200, {
        "Content-Type"   : "text/plain;charset=utf-8",
        "Content-Length" : solrResponseString.length,
    } );

    response.write( solrResponseString );
    response.end();
}

module.exports.startSolrFake = startSolrFake;
