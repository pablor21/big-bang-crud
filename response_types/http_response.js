const statuses = require('statuses');

class HttpResponse {


    /**
     * 
     * @param {type} data
     * @param {type} status
     * @param {type} statusText
     */
    constructor(data = {}, status = 200, statusText = null) {
        this.status = status || 200;
        this.statusText = statusText;
        this.data = data;
    }

    _prepare(req, res, next) {
        res.status = this.status;

        let user = req.user ? { '_id': req.user._id, username: req.user.username, authenticated: true } : { '_id': null, authenticated: false };
        user.authenticated = req.authenticated || false;
        //res.statics.time= Date.now()-res.statics.time;
        res.user = user;
    }

    _doRender(req, res, next) {
        res.send(this.data);
    }

    /**
     * Render response to user
     * @param Object req
     * @param Object res
     * @param function next
     * @returns void
     */
    render(req, res, next) {
        this._prepare(req, res, next);
        this._doRender(req, res, next);
    }
}
module.exports = HttpResponse;
