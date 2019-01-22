const axios     = require( 'axios' );
const crypto    = require( 'crypto' );
const fs        = require( 'fs' );
const http      = require( 'http' );
const moment    = require( 'moment' );
const path      = require( 'path' );
const url       = require( 'url' );

const { createLogger, format, transports } = require( 'winston' );
const { combine, timestamp, label, printf } = format;

const stringify = require( 'json-stable-stringify' );

const DEFAULT_PORT = 3000;

let solrResponses;
let solrResponsesIndex;
let solrResponsesDirectory;
let updateSolrResponsesSolrServerUrl;

const customFormat = printf( info => {
    const timestamp = timestampEST();

    return `${ timestamp } ${ info.level }: ${ info.message }`;
} );

const logger = createLogger( {
    level : 'info',
    format: customFormat,
    transports : [
        new transports.Console(),
    ],
} );

function getSolrResponseFilename( queryString ) {
    const hash = crypto.createHmac( 'sha256', queryString )
        .update( queryString )
        .digest( 'hex' );

    return `${ hash }.json`;
}

function getSolrResponseFilePath( responseFile ) {
    return path.join( solrResponsesDirectory, responseFile )
}

async function getSolrResponseFromLiveSolr( queryString ) {
    try {
        const request = updateSolrResponsesSolrServerUrl + queryString;

        const response = await axios.get( request );

        return response.data;
    } catch( error ) {
        console.error( error );
    }
}

function getSolrResponses() {
    const data = {};

    const index = require( solrResponsesIndex );

    Object.keys( index ).forEach( queryString => {
        const file = getSolrResponseFilePath( index[ queryString ] );

        const response = require( file );

        data[ normalizeQueryString( queryString ) ] = response;
    } );

    return data;
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

function normalizeQueryString( queryString ) {
    queryString = decodeURI( queryString );

    const urlSearchParams = new URLSearchParams( decodeURI( queryString ) );

    urlSearchParams.sort();

    return '?' + urlSearchParams.toString();
}

function startSolrFake(
    solrResponsesIndexArg,
    solrResponsesDirectoryArg,
    portArg,
    updateSolrResponsesSolrServerUrlArg ) {

    solrResponsesIndex = solrResponsesIndexArg;
    solrResponsesDirectory = solrResponsesDirectoryArg;

    const port = portArg || DEFAULT_PORT;

    let handler;
    if ( updateSolrResponsesSolrServerUrlArg  ) {
        updateSolrResponsesSolrServerUrl = updateSolrResponsesSolrServerUrlArg;

        console.log( 'Switching to update Solr responses mode' );
        console.log( `Solr server = ${ updateSolrResponsesSolrServerUrl }` );

        handler = updateSolrResponsesHandler;
    } else {
        solrResponses = getSolrResponses( solrResponsesIndex, solrResponsesDirectory );

        handler = normalHandler;
    }

    http.createServer( handler ).listen( port )
        .on( 'listening', () => {
            console.log( 'Solr fake is running on port ' + port );
        } )
        .on( 'error', ( e ) => {
            console.error( e );
        } );
}

function stableStringify( data ) {
    return stringify( data, { space : '    ' } );
}

function updateSolrResponses( queryString, solrResponse ) {
    const index = require( solrResponsesIndex );

    const responseFilename = getSolrResponseFilename( queryString );
    const responseFilePath = getSolrResponseFilePath( responseFilename );

    index[ queryString ] = responseFilename;

    fs.writeFileSync( responseFilePath, solrResponse );

    fs.writeFileSync( solrResponsesIndex, stableStringify( index ) );

    console.log( `Updated Solr response "${ queryString }" : ${ responseFilename }` );
}

async function updateSolrResponsesHandler( request, response ) {
    const requestUrl = url.parse( request.url );

    const queryString = requestUrl.search;

    if ( ! queryString ) {
        return;
    }

    const normalizedQueryString = normalizeQueryString( queryString );

    const solrResponse = await getSolrResponseFromLiveSolr( normalizedQueryString );

    const solrResponseString = stableStringify( solrResponse );

    updateSolrResponses( normalizedQueryString, solrResponseString );

    response.writeHead( 200, {
        "Access-Control-Allow-Origin" : "*",
        "Content-Type"                : "text/plain;charset=utf-8",
    } );

    response.write( solrResponseString );
    response.end();
}

function signalEventHandler( signal, code ) {
    const timestamp = moment( new Date() ).format( "ddd, D MMM YYYY H:m:s " ) + 'EST';

    console.log( `Received ${ signal } at ${ timestamp }` );

    process.exit( code );
}

function timestampEST() {
    return moment( new Date() ).format( "ddd, D MMM YYYY H:m:s " ) + 'EST';
}

process.on( 'SIGINT', signalEventHandler );
process.on( 'SIGTERM', signalEventHandler );

process.on( 'exit', ( code ) => {
    const timestamp = moment( new Date() ).format( "ddd, D MMM YYYY H:m:s " ) + 'EST';

    console.log( `Exited with code ${ code } at ${ timestamp }` );
} );

module.exports.startSolrFake = startSolrFake;
