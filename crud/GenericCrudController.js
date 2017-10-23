const aqp = require('api-query-params');
const DEFAULTS = require('./controller_config');
//const logger=APP.config.logger.getLogger('crud.GenericCrudController');

class GenericCrudController{
  constructor(service, renderClass, config = {}) {
    this.service=service;
    this.resourceName=service.resourceName;
    this.model = service.model;
    this.renderClass=renderClass;
    this.config=config;


    this.availableMethods = config.METHODS || DEFAULTS.METHODS;
    //this.operations = operations;
    this.MAX_RESULTS = config.MAX_RESULTS || DEFAULTS.DEFAULT_MAX_RESULTS;
    this.DEFAULT_PAGE_SIZE = config.DEFAULT_PAGE_SIZE || DEFAULTS.DEFAULT_PAGE_SIZE;
    this.DEFAULT_ORDER = config.DEFAULT_ORDER || DEFAULTS.DEFAULT_ORDER;

    this.hasPermissions = false;
    this.securityService=null;
    if (config.SECURITY_SERVICE) {
      this.securityService = config.securityService;
      this.hasPermissions=config.registerPermissions||false;
    }

    if (config.FILTER_CLASS) {
      this.filterClass = config.FILTER_CLASS;
    } else {
      this.filterClass = DEFAULTS.FILTER_CLASS;
    }
    //register permissions
    if (this.hasPermissions) {
      this.registerPermissions();
    }

    this.logger=null;

    this.init();
  }

  init() {

  }

  /**
   * Logger function
   * @param  {[type]} type    [description]
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
    log(type, message){
      if(this.logger){
        if(this.logger[type]){
          this.logger[type](message);
        }else{

        }
      }
    }

  /**
  * Register declared permissions on security service
  * @return {void}
  */
  registerPermissions() {
    this.permissions = [];
    for (var key in this.availableMethods) {
      let method = this.availableMethods[key];
      let permission = method.permission;
      this.securityService.registerPermission(this.resourceName, permission);
    }
  }

  /**
  * Gets default populate on operations
  * @param  {string} method [description]
  * @return {object}        [description]
  */
  getDefaultPopulate(method) {
    return {};
  }

  /**
  * Setup routes on router
  * @param  {[type]} router     [description]
  * @param  {String} [base='/'] The route prefix
  * @return {void}            [description]
  */
  setupRoutes(router, base = '/') {
    let routeNames = "Setting routes for " + this.constructor.name + " on " + base + " {\r\n";
    for (var key in this.availableMethods) {
      let method = this.availableMethods[key];
      let verbs = method.verbs;
      let middlewares= method.middlewares||[];
      if (verbs == '*') {
        verbs = ['all'];
      } else {
        verbs = verbs.split(",");
      }

      verbs.forEach((verb) => {
        routeNames += " [" + verb + "] " + base + method.url + "\r\n";
        router[verb](base + method.url, middlewares, (req, res, next) => {
          let user = this.getUserFromRequest(req);

          this.checkPermissions(method.permission, user);

          try {
            if (this[method.function]) {
              this[method.function](req, res, next);
            } else {
              var err = new Error("Not found");
              err.statusCode = 404;
              throw err;
            }
          } catch (ex) {
            this.log('error', ex);
            next(ex);
          }

        })
      });

    }
    this.log('debug', routeNames + "}");
  }

  getFilterInstance() {
    return new this.filterClass();
  }

  getUserFromRequest(req) {
    return req.user;
  }

  checkPermissions(permission, user) {
    if (this.hasPermissions) {
      return this.securityService.checkPermission(user, this.resourceName, permission);
    }
    return true;

  }

  checkPermissionMiddleware(req, res, next){

  }

  transformData(method, data) {
    return data;
  }

  getBlackListQueryParameters(method, req){
    return [];
  }

  parseRequestToObject(req) {
    let promise = new Promise((resolve, reject) => {
      let obj = new this.model(req.body);
      resolve(obj);
    })
    return promise;
  }

  parseFilter(method, req) {

    let blacklist=this.getBlackListQueryParameters(method, req);
    blacklist.push('include');
    blacklist.push('page');

    let query = aqp(req.query, {
      blacklist: blacklist
    });


    query.skip = query.skip || 0;
    query.limit = query.limit || this.DEFAULT_PAGE_SIZE;
    if (query.limit > this.MAX_RESULTS) {
      query.limit = this.MAX_RESULTS;
    }
    query.sort = query.sort || this.DEFAULT_ORDER;

    let config = {
      'MAX_RESULTS': this.MAX_RESULTS,
      'DEFAULT_PAGE_SIZE': this.DEFAULT_PAGE_SIZE,
      'DEFAULT_ORDER': this.DEFAULT_ORDER
    }

    let include = req.query.include;
    if (include) {
      include = include.split(",");
    }

    let filter = new this.filterClass(config, query.filter, query.skip, query.limit, query.sort, query.projection, include);

    return filter;
  }

  putMessage(res, type, message) {
    try {
      res.messages[type].push(message);
    } catch (ex) {

    }
  }

  getRenderClassInstance(params) {
    let instance = new this.renderClass();
    if (!instance) {
      let error = new Error();
      error.status = 400;
      error.local = "error.render_class_null";
      error.message = "Cannot instantiate class " + this.renderClass;
      throw error;
    }
    return instance;
  }

  render(params, req, res, next) {
    let rendererInstance = this.getRenderClassInstance();
    rendererInstance.data = params.data;
    rendererInstance.render(req, res, next);

  }

  catchError(ex, req, res, next) {
    ex.url = req.url;
    this.log('error', ex);
    let err = new Error(ex.message);
    err.status = 500;
    next(err);
  }

  translateMessage(key, vars, defaultMsgKey){
    if(undefined!==res.locals && (typeof res.locals.__=='function')){
      (res.locals.__(key) != key) ? res.locals.__(key, vars) : res.locals.__(defaultMsg, vars);
    }
    return key;
  }

  create(req, res, next, autoRender = true) {
    try {
      let promise = new Promise((resolve, reject) =>  {
        this.parseRequestToObject(req, 'create').then((obj) =>  {
          this._create(obj)
          .then((data) =>  {
            let message = this.translateMessage(this.resourceName + ".created", this.resourceName, "resource.created");
            this.putMessage(res, 'info', message);
            let params = {
              method: 'create',
              data: data
            };
            resolve(params);
          })
          .catch((err) =>  {
            reject(err);
          });

        })

      });
      //if autorender, render the view here, else return promise
      if (autoRender) {
        promise.then(function (params) {
          this.render(params, req, res, next);
        })
        .catch((err) =>  {
          this.catchError(err, req, res, next);
        })
      }
      return promise;

    } catch (ex) {
      this.catchError(ex, req, res, next);
    }
  }

  update(req, res, next, autoRender = true) {
    try {
      let promise = new Promise((resolve, reject) =>  {
        this.parseRequestToObject(req, 'update').then((obj) =>  {

          this._update(req.params.id, obj)
          .then((data) =>  {
            let message = this.translateMessage(this.resourceName + ".updated", this.resourceName, "resource.updated");
            this.putMessage(res, 'info', message);
            let params = {
              method: 'update',
              data: data
            };
            resolve(params);
          })
          .catch((err) =>  {
            reject(err);
          });
        });
      });
      //if autorender, render the view here, else return promise
      if (autoRender) {
        promise.then(function (params) {
          this.render(params, req, res, next);
        })
        .catch((err) =>  {
          this.catchError(err, req, res, next);
        })
      }
      return promise;

    } catch (ex) {
      this.catchError(ex, req, res, next);
    }
  }

  replace(req, res, next, autoRender = true) {
    try {
      let promise = new Promise((resolve, reject) =>  {
        this.parseRequestToObject(req, 'replace').then((obj) =>  {

          this._replace(req.params.id, obj)
          .then((data) =>  {
            let message = this.translateMessage(this.resourceName + ".updated", this.resourceName, "resource.updated");
            this.putMessage(res, 'info', message);
            let params = {
              method: 'replace',
              data: data
            };
            resolve(params);
          })
          .catch((err) =>  {
            reject(err);
          });
        });
      });

      //if autorender, render the view here, else return promise
      if (autoRender) {
        promise.then(function (params) {
          this.render(params, req, res, next);
        })
        .catch((err) =>  {
          this.catchError(err, req, res, next);
        })
      }
      return promise;


    } catch (ex) {
      this.catchError(ex, req, res, next);
    }
  }

  delete(req, res, next, autoRender = true) {
    try {
      let promise = new Promise((resolve, reject) =>  {
        this._deleteById(req.params.id)
        .then((data) =>  {
          let message = this.translateMessage(this.resourceName + ".deleted", this.resourceName, "resource.deleted");
          this.putMessage(res, 'info', message);
          let params = {
            method: 'delete',
            data: data
          };
          resolve(params);
        })
        .catch((err) =>  {
          reject(err);
        });
      });
      //if autorender, render the view here, else return promise
      if (autoRender) {
        promise.then(function (params) {
          this.render(params, req, res, next);
        })
        .catch((err) =>  {
          this.catchError(err, req, res, next);
        })
      }
      return promise;

    } catch (ex) {
      this.catchError(ex, req, res, next);
    }
  }

  list(req, res, next, autoRender = true) {
    try {
      let filter = this.parseFilter('list', req);
      let promise = new Promise((resolve, reject)=>{
        this._list(filter).then((data)=> {
          let finalResult = this.transformData('list', data.results);
          data.filter = filter;
          data.results=finalResult;

          if (data.total == 0) {
            let message = this.translateMessage(this.resourceName + ".no_results", this.resourceName, "resource.no_results");
            this.putMessage(res, 'warning', message);
          }
          let params = {
            method: 'list',
            data
          };
          resolve(params);
        }).catch((err)=>{
          reject(err);
        })
      })

      if(autoRender){
        promise.then((data)=>{
          this.render(data, req, res, next);
        }).catch((err)=>{
          this.catchError(err, req, res, next);
        })
      }
      return promise;
    } catch (e) {
      this.catchError(e, req, res, next);
    }
  }

  findById(req, res, next, autoRender = true) {
    try {
      let promise = new Promise((resolve, reject) =>  {
        let filter = {
          fields: req.query.fields,
          populate: req.query.include,
        }

        this._findById(req.params.id, filter)
        .then((data) =>  {
          let finalData = this.transformData('find_by_id', data);
          finalData.filter = req.params.id;
          let params = {
            method: 'find_by_id',
            data: finalData
          };
          resolve(params);
        })
        .catch((err) =>  {
          reject(err);
        });
      });
      //if autorender, render the view here, else return promise
      if (autoRender) {
        promise.then(function (params) {
          this.render(params, req, res, next);
        })
        .catch((err) =>  {
          this.catchError(err, req, res, next);
        })
      }
      return promise;
    } catch (ex) {
      this.catchError(ex, req, res, next);
    }
  }

  listAll(filter = {}) {
    return this._list({});
  }

  _list(filter){
    let promise = new Promise((resolve, reject)=>{
      let countPromise = this.service.count(filter);
      let dataPromise = this.service.list(filter);
      Promise.all([
        countPromise,
        dataPromise
      ]).then((data)=> {
        resolve({
          results:data[1],
          count: data[0]
        })
      }).catch((err)=>{
        reject(err);
      })
    })
    return promise;
  }


  _findById(id, options={}) {
    let promise = new Promise((resolve, reject) => {
      this.service.findById(id, options)
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject(err);
      });
    });
    return promise;
  }

  _count(filter = {}, includeDeleted = false) {

    let promise = new Promise((resolve, reject) =>  {
      this.service.count(filter, includeDeleted)
      .then((data) =>  {
        resolve(data);
      })
      .catch((err) =>  {
        reject(err);
      });
    });
    return promise;
  }

  _create(obj) {

    let promise = new Promise((resolve, reject) =>  {
      this.service.create(obj)
      .then((data) =>  {
        resolve(data);
      })
      .catch((err) =>  {
        reject(err);
      });
    });
    return promise;
  }

  _update(id, obj) {
    let promise = new Promise((resolve, reject) =>  {
      this.service.update(obj)
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject(err);
      });
    });
    return promise;
  }

  _replace(id, obj) {
    this._update(id, obj);
  }

  _deleteById(id) {
    let promise = new Promise((resolve, reject) =>  {
      this.service.deleteById(id)
      .then((data)=> {
        resolve(data);
      })
      .catch((err) => {
        reject(err);
      });
    });
    return promise;
  }

  _delete(query = {}) {
    let promise = new Promise((resolve, reject) => {
      this.service.deleteByFilter(query)
      .then((data) =>{
        resolve(data);
      })
      .catch((err) =>{
        reject(err);
      });
    });
    return promise;
  }
}

module.exports=GenericCrudController;
