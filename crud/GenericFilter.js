const aqp = require('api-query-params');
const constants=require('./constants');

const defaults = {
    'DEFAULT_MAX_RESULTS': APP.config.DEFAULT_MAX_RESULTS || 100,
    'DEFAULT_PAGE_SIZE': APP.config.DEFAULT_PAGE_SIZE || 100,
    'DEFAULT_ORDER': APP.config.DEFAULT_ORDER || '_id',
}


class GenericFilter {
    constructor(config, filter, skip, limit, sort, projection, populate) {
        this.config = config || {};


        this.query = filter || this.getDefaultQuery();
        this.skip = skip || 0;


        this.limit = limit || this.DEFAULT_PAGE_SIZE;
        if (this.limit > this.getMaxResults()) {
            this.limit = this.getMaxResults();
        }
        this.sort = sort || this.getDefaultSort();
        this.page = this.skip / this.limit + 1;

        if (projection == '*=1' || projection == 'all=1') {
            projection = {};
        }

        this.populate = populate || [];

        this.fields = projection || this.getDefaultProjection();

        this.hasStatusOptions = this.config.HAS_STATUS_OPTIONS;
        this.defaultStatus = this.config.defaultStatus||constants.record_status.ACTIVE;
        this.show = constants.record_status.ACTIVE;


    }

    setStatusFilter(status = constants.record_status.ACTIVE) {
        if (this.hasStatusOptions && status != constants.record_status.ACTIVE && (status in constants.record_status)) {
            this.show = status;
        }
    }

    getDefaultQuery() {
        return this.config.DEFAULT_FILTER || {};
    }

    getDefaultPageSize() {
        return this.config.DEFAULT_PAGE_SIZE || defaults.DEFAULT_PAGE_SIZE;
    }

    getMaxResults() {
        return this.config.MAX_RESULTS || defaults.MAX_RESULTS;
    }

    getDefaultSort() {
        return this.config.DEFAULT_ORDER || defaults.DEFAULT_ORDER;
    }

    getDefaultProjection() {
        return this.config.DEFAULT_PROJECTION || {};
    }

    static constructFromRequest(req, config = {}) {
        let query = aqp(req.query, {
            blacklist: ['include', 'page', 'show']
        });

        let conf = {
            'MAX_RESULTS': config.MAX_RESULTS || defaults.MAX_RESULTS,
            'DEFAULT_PAGE_SIZE': config.DEFAULT_PAGE_SIZE || defaults.DEFAULT_PAGE_SIZE,
            'DEFAULT_ORDER': config.DEFAULT_ORDER || defaults.DEFAULT_ORDER,
            'HAS_STATUS_OPTIONS': config.HAS_STATUS_OPTIONS || false,
            'DEFAULT_STATUS': config.DEFAULT_STATUS || null
        }

        query.skip = query.skip || 0;
        query.limit = query.limit || conf.DEFAULT_PAGE_SIZE;
        if (query.limit > conf.MAX_RESULTS) {
            query.limit = conf.MAX_RESULTS;
        }
        if (req.query.page) {
            query.skip = (req.query.page - 1) * query.limit;

        }

        query.sort = query.sort || conf.DEFAULT_ORDER;

        let include = req.query.include;
        if (include) {
            include = include.split(",");
        }

        let filter = new GenericFilter(conf, query.filter, query.skip, query.limit, query.sort, query.projection, include);
        let show = req.query.show;
        if (show) {
            filter.setStatusFilter(show.toUpperCase());
        }
        return filter;
    }


}

module.exports = GenericFilter;
module.exports.defaults = defaults;
