const HttpResponse= require('./http_response');
const statuses = require('statuses');

class ViewResponse extends HttpResponse{

     /**
     *
     * @param {type} data
     * @param {type} status
     * @param {type} statusText
     */
    constructor(view, meta={}, data = {}, status = 200, statusText = null) {
        super(data, status, statusText);
        this.view=view;
        this.meta=meta;
        this.viewData={};
    }


    /**
     * Render response to user
     * @param Object req
     * @param Object res
     * @param function next
     * @returns void
     */
    _doRender(req, res, next) {

        let viewData = {
            meta: this.meta,
            messages:res.messages,
            user: res.user,
            locale: res.locale,
            time: Date.now(),
            status: res.status,
            statusText: this.statusText,
            statics: res.statics
        };

        if(this.data.layout){
            viewData.layout=this.data.layout;
        }


        if (statuses[res.status]) {
            if (!res.statusText) {
                viewData.statusText = statuses[res.status];
            } else {
                viewData.statusText = res.statusText;
            }
        }

        //merge objects
        Object.assign(res.locals, viewData, this.data, this.viewData);
        try{
            res.render(this.view, function(err, html){
                if(err) next(err);

                res.send(html);
            });
        }catch(ex){

        }

    }
}
module.exports = ViewResponse;
