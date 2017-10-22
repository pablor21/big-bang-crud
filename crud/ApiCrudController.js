const CrudController = require('./GenericCrudController');
const JsonResponse = require('../response_types/json_response');

class ApiCrudController extends CrudController {
    constructor(service, config = {}) {
        super(service, JsonResponse, config);
    }

}
module.exports = ApiCrudController;
