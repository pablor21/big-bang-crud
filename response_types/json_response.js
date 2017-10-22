const HttpResponse= require('./http_response');
const statuses = require('statuses');

class JsonResponse extends HttpResponse{
    

    /**
     * Render response to user
     * @param Object req
     * @param Object res
     * @param function next
     * @returns void
     */
    _doRender(req, res, next) {
       
        let ret = {
            payload: this.data,
            messages:res.messages,
            user: res.user,
            locale: res.locale,
            time: Date.now(),
            status: this.status,
            statusText: this.statusText,
            statics: res.statics
        };

        if (statuses[res.status]) {
            if (!res.statusText) {
                ret.statusText = statuses[res.status];
            } else {
                ret.statusText = res.statusText;
            }
        }
        res.json(ret);
        //res.terminate();
    }
}
module.exports = JsonResponse;