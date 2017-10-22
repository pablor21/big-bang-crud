const constants=require('./constants');
const events=constants.crud_events;
//const logger=APP.config.logger.getLogger('crud.GenericService');

const GenericFilter=require('./GenericFilter');

class GenericService{

  constructor(model, dataManager, resourceName) {
    this.model = model;
    this.dataManager = dataManager;
    this.resourceName = resourceName;

    //event listeners
    this.listeners = {

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

  throwError(ex) {
    let err = new Error(ex.getMessage());
    err.exeption = ex;
    throw err;
  }

  _callDataManagerMethod(method) {
    return this.dataManager[method](arguments);
  }

  getDefaultFilterInstance(){
    return new GenericFilter();
  }

  validateElement(crudMethod, element) {
    let promise = new Promise((resolve, reject) => {
      element.validate((err)=>{
        if(err){
          reject(err);
        }else{
          resolve(element);
        }
      })
    });
    return promise;
  }


  create(element) {
    this._fireEvent(events.BEFORE_CREATE, element);
    let promise = new Promise((resolve, reject) => {
      this.validateElement('CREATE', element)
      .then(() => {
        this.dataManager.create(element)
        .then((data) => {
          this._fireEvent(events.AFTER_CREATE, data);
          resolve(data);
        })
        .catch((err) => {
          this._fireEvent(events.ERROR_CREATE, err, element);
          reject(err);
        })
      })
      .catch((err) => {
        this._fireEvent(events.ERROR_CREATE, err, element);
        reject(err);
      })
    });
    return promise;
  }


  update(element) {
    this._fireEvent(events.BEFORE_UPDATE, element);
    let promise = new Promise((resolve, reject) => {
      this.validateElement('UPDATE', element)
      .then(() => {
        this.dataManager.update(element)
        .then((data) => {
          this._fireEvent(events.AFTER_UPDATE, data);
          resolve(data);
        })
        .catch((err) => {
          this._fireEvent(events.ERROR_UPDATE, err, element);
          reject(err);
        })
      })
      .catch((err) => {
        this._fireEvent(events.ERROR_UPDATE, err, element);
        reject(err);
      })
    });
    return promise;
  }


  delete(id, permanent) {
    this._fireEvent(events.BEFORE_DELETE, filter);
    let promise=new Promise((resolve,reject)=>{
      this.dataManager.delete(id, permanent)
      .then((data)=>{
        this._fireEvent(events.AFTER_DELETE, data, filter);
        resolve(data)
      })
      .catch((err)=>{
        this._fireEvent(events.ERROR_DELETE, err, filter);
        reject(err);
      })
    });
    return promise;
  }

  deleteByFilter(filter, permanent) {
    this._fireEvent(events.BEFORE_DELETE, filter);
    let promise=new Promise((resolve,reject)=>{
      this.dataManager.deleteByFilter(filter, permanent)
      .then((data)=>{
        this._fireEvent(events.AFTER_DELETE, data, filter);
        resolve(data)
      })
      .catch((err)=>{
        this._fireEvent(events.ERROR_DELETE, err, filter);
        reject(err);
      })
    });
    return promise;
  }

  findById(id, options = {}) {
    this._fireEvent(events.BEFORE_FIND_BY_ID, id, options);
    let promise=new Promise((resolve,reject)=>{
      this.dataManager.findById(id, options)
      .then((data)=>{
        this._fireEvent(events.AFTER_FIND_BY_ID, data, id, options);
        resolve(data)
      })
      .catch((err)=>{
        this._fireEvent(events.ERROR_FIND_BY_ID, err, id, options);
        reject(err);
      })
    });
    return promise;

  }

  /**
   * Find one element by filter
   * @param  {Object} [filter={}] [description]
   * @return {[type]}             [description]
   */
  findOne(filter={}) {
    this._fireEvent(events.BEFORE_FIND_ONE, filter);
    let promise=new Promise((resolve,reject)=>{
      this.dataManager.findOne(filter)
      .then((data)=>{
        this._fireEvent(events.AFTER_FIND_ONE, data, filter);
        resolve(data)
      })
      .catch((err)=>{
        this._fireEvent(events.ERROR_FIND_ONE, err, filter);
        reject(err);
      })
    });
    return promise;
  }


  list(filter) {
    filter=filter||this.getDefaultFilterInstance();
    this._fireEvent(events.BEFORE_LIST, filter);

    let promise=new Promise((resolve,reject)=>{
      this.dataManager.list(filter)
      .then((data)=>{
        this._fireEvent(events.AFTER_LIST, data, filter);
        resolve(data);
      }).catch((err)=>{
        this._fireEvent(events.ERROR_LIST, err, filter);
        reject(err);
      })
    })

    return promise;
  }

  count(filter) {
    filter=filter||this.getDefaultFilterInstance();
    this._fireEvent(events.BEFORE_COUNT, filter);

    let promise=new Promise((resolve,reject)=>{
      this.dataManager.count(filter)
      .then((data)=>{
        this._fireEvent(events.AFTER_COUNT, data, filter);
        resolve(data);
      }).catch((err)=>{
        this._fireEvent(events.ERROR_COUNT, err, filter);
        reject(err);
      })
    })

    return promise;
  }


  /**
  * Function fired when a event happen
  * @param {string} eventName name of event
  * @param {object} data data of event
  */
  _fireEvent(eventName, data) {
    this.log('debug', 'Event ' + eventName + ' has fired');
    if (this.listeners[eventName]) {
      this.log('debug','Notify ' + eventName + ' to  ' +  this.listeners[eventName].length + ' listeners');
      this.listeners[eventName].forEach((func)=>{
        try {
          func(eventName, data, this);
        } catch (ex) {

        }
      });
    }
  }

  /**
  * Adds a listener to event
  * @param {string} eventName name of event
  * @param {function} obj function to call
  */
  on(eventName, obj) {
    if (typeof obj == "function") {
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }
      this.log('debug','Adding new listener to ' + eventName);
      this.listeners[eventName].push(obj);
    } else {
      throw new Error("Listener must be a function!");
    }
  }


}

module.exports=GenericService;
