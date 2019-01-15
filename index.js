const path = require( 'path' );

const jsonServer  = require( 'json-server' );
const server      = jsonServer.create();
const middlewares = jsonServer.defaults();

const DEFAULT_PORT = 3000;

server.use( middlewares );

function defaultSolrRequestRewriterMiddleware( req, res, next ) {
    const query = {
        'responseHeader.params.defType'        : req.query[ 'defType' ],
        'responseHeader.params.facet'          : req.query[ 'facet' ],
        'responseHeader.params.facet.field'    : req.query[ 'facet.field' ],
        'responseHeader.params.facet.limit'    : req.query[ 'facet.limit' ],
        'responseHeader.params.facet.mincount' : req.query[ 'facet.mincount' ],
        'responseHeader.params.facet.sort'     : req.query[ 'facet.sort' ],
        'responseHeader.params.fl'             : req.query[ 'fl' ],
        'responseHeader.params.group'          : req.query[ 'group' ],
        'responseHeader.params.group.field'    : req.query[ 'group.field' ],
        'responseHeader.params.group.limit'    : req.query[ 'group.limit' ],
        'responseHeader.params.indent'         : req.query[ 'indent' ],
        'responseHeader.params.q'              : req.query[ 'q' ],
        'responseHeader.params.qf'             : req.query[ 'qf' ],
        'responseHeader.params.rows'           : req.query[ 'rows' ],
        'responseHeader.params.sort'           : req.query[ 'sort' ],
        'responseHeader.params.wt'             : req.query[ 'wt' ],
    };

    Object.getOwnPropertyNames( req.query ).forEach( prop => {
        delete req.query[ prop ];
    } );

    Object.getOwnPropertyNames( query ).forEach( prop => {
        req.query[ prop ] = query[ prop ];
    } );

    next();
}

function startSolrFake( solrResponsesDirectory, portArg, solrRequestRewriterMiddlewareArg ) {
    const db          = require( path.join( __dirname, 'database' ) )( solrResponsesDirectory );
    const router      = jsonServer.router( db );

    const port = portArg || DEFAULT_PORT;
    const solrRequestRewriterMiddleware =
              solrRequestRewriterMiddlewareArg || defaultSolrRequestRewriterMiddleware;

    server.get( '/select', solrRequestRewriterMiddleware );

    server.use( router );

    server.listen( port, () => {
        console.log( 'JSON Server Solr fake is running on port ' + port );
    } );
}

module.exports.startSolrFake = startSolrFake;
