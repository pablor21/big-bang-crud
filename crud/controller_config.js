const METHODS = {
    'list': {
        url: '/',
        verbs: 'get',
        permission: 'read',
        function: 'list'
    },
    /*'listAll': {
        url: '/all',
        verbs: 'get',
        permission: 'read',
        function: 'listAll'
    },*/
    'create': {
        url: '/',
        verbs: 'post',
        permission: 'create',
        function: 'create'
    },
    'delete': {
        url: '/:id',
        verbs: 'delete',
        permission: 'delete',
        function: 'delete'
    },
    'update': {
        url: '/:id',
        verbs: 'patch',
        permission: 'update',
        function: 'replace'
    },
    'replace': {
        url: '/:id',
        verbs: 'put',
        permission: 'update',
        function: 'update'
    },
    'count': {
        url: '/count',
        verbs: 'get',
        permission: 'read',
        function: 'count'
    },
    'find_by_id': {
        url: '/:id',
        verbs: 'get',
        permission: 'read',
        function: 'findById'
    },

};


const DEFAULT_MAX_RESULTS = 100;
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_ORDER = '_id';


const defaults={
    'METHODS': METHODS,
    'DEFAULT_MAX_RESULTS': APP.config.DEFAULT_MAX_RESULTS||DEFAULT_MAX_RESULTS,
    'DEFAULT_PAGE_SIZE': APP.config.DEFAULT_PAGE_SIZE||DEFAULT_PAGE_SIZE,
    'DEFAULT_ORDER': APP.config.DEFAULT_ORDER||DEFAULT_ORDER,
    'SECURITY_SERVICE': APP.config.SECURITY_SERVICE,
    'FILTER_CLASS': APP.config.FILTER_CLASS || require('./GenericFilter'),
}

module.exports=defaults;
