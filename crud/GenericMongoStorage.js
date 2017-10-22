const mongoose = require('mongoose');
const constants=require('./constants');
const events=constants.crud_events;
//const logger=APP.config.logger.getLogger('crud.GenericMongoStorage');

class GenericMongoStorage{
  constructor(model, resourceName) {
    this.model = model;
    this.resourceName = resourceName;
    //this.schema = schema;

    this.hasSoftDelete = false;
    this.deleteIsPermanentByDefault = false;
    this.defaultStatusToShow=constants.record_status.ACTIVE;

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

  /**
  * Save the element
  * @param  {Model} element [description]
  * @return {[type]}         [description]
  */
  create(element) {
    this._fireEvent(events.BEFORE_CREATE, element);
    let promise = new Promise((resolve, reject)=>{
      this.__save(element)
      .then((data)=>{
        this._fireEvent(events.AFTER_CREATE, data);
        resolve(data);
      }).catch((err)=>{
        this._fireEvent(events.ERROR_CREATE, err, element);
        reject(err)
      });
    });
    return promise;
  }

  /**
  * Update the element
  * @param  {Model} element [description]
  * @return {[type]}         [description]
  */
  update(element) {
    this._fireEvent(events.BEFORE_UPDATE, element);
    let promise = new Promise((resolve, reject)=>{
      this.__save(element)
      .then((data)=>{
        this._fireEvent(events.AFTER_UPDATE, data);
        resolve(data);
      }).catch((err)=>{
        this._fireEvent(events.ERROR_UPDATE, err, element);
        reject(err)
      });
    });
    return promise;
  }

  /**
  * Save element to mongo
  * @param  {[type]} elment [description]
  * @return {[type]}        [description]
  */
  __save(elment){
    return element.save();
  }


  /**
  * Delete element by id
  * @param  {[type]} id        [description]
  * @param  {[type]} permanent [description]
  * @return {[type]}           [description]
  */
  delete(id, permanent) {
    return this.deleteByFilter({ '_id': id }, permanent)
  }

  /**
  * Delete elements by filter
  * @param  {[type]} filter    [description]
  * @param  {[type]} permanent [description]
  * @return {[type]}           [description]
  */
  deleteByFilter(filter, permanent) {
    this._fireEvent(events.BEFORE_DELETE, filter);
    permanent = (undefined != permanent) ? permanent : this.deleteIsPermanentByDefault;
    let functionName = ((!permanent) && this.hasSoftDelete) ? "delete" : "remove";

    let promise = new Promise((resolve, reject)=>{
      this.model[functionName](filter)
      .then((data)=>{
        this._fireEvent(events.AFTER_DELETE, data, filter);
        resolve(data)
      }).catch((err)=>{
        this._fireEvent(events.ERROR_DELETE, err, filter);
        reject(err);
      })
    });
  }


  /**
  * Find one element by id
  * @param  {[type]} id           [description]
  * @param  {Object} [options={}] [description]
  * @return {[type]}              [description]
  */
  findById(id, options = {}) {
    this._fireEvent(events.BEFORE_FIND_BY_ID, id, options);
    id = new mongoose.Types.ObjectId(id);
    options.includeDeleted=(options.includeDeleted!=undefined && this.hasSoftDelete)?options.includeDeleted:this.defaultStatusToShow!=constants.record_status.ACTIVE;
    let functionName=(options.includeDeleted)? "findByIdWithDeleted" : "findById";
    options.populate = options.populate || [];

    let promise = new Promise((resolve, reject)=>{
      this.model[functionName]
      .select(options.fields)
      .populate(options.populate)
      .then((data)=>{
        this._fireEvent(events.AFTER_FIND_BY_ID, data, id, options);
        resolve(data)
      }).catch((err)=>{
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
    let functionName = 'findOne';
    filter.populate = filter.populate || [];
    filter.show=filter.show||this.defaultStatusToShow;

    if(this.hasSoftDelete){
      switch (filter.show) {
        case 'TRASHED':
        case 'DELETED':
        functionName = 'findOneDeleted';
        break;
        case 'ALL':
        functionName = 'findOneWithDeleted'
        break;
      }
    }

    let promise = new Promise((resolve, reject)=>{
      this
      .model[functionName](filter.query)
      .skip(filter.skip)
      .sort(filter.sort)
      .select(filter.fields)
      .populate(filter.populate)
      .then((data)=>{
        this._fireEvent(events.AFTER_FIND_ONE, data, filter);
        resolve(data);
      }).catch((err)=>{
        this._fireEvent(events.ERROR_FIND_ONE, err, filter);
        reject(err);
      })
    });

    return promise;
  }


  /**
  * List elements by filter
  * @param  {GenericFilter} filter the filter instance
  * @return {Promise}
  */
  list(filter) {
    this._fireEvent(events.BEFORE_LIST, filter);
    filter=filter||new GenericFilter();
    filter.populate = filter.populate || [];
    filter.show=filter.show||this.defaultStatusToShow;

    let functionName = 'find';
    //if the model has soft delete, we need to determine the method to execute
    if(this.hasSoftDelete){
      switch (filter.show) {
        case 'TRASHED':
        case 'DELETED':
        functionName = 'findDeleted';
        break;
        case 'ALL':
        functionName = 'findWithDeleted'
        break;
      }
    }

    //promise to be returned
    let promise=new Promise((resolve,reject)=>{
      this.model[functionName](filter.query)
      .skip(filter.skip)
      .limit(filter.limit)
      .sort(filter.sort)
      .select(filter.fields)
      .populate(filter.populate)
      .then((data)=>{
        this._fireEvent(events.AFTER_LIST, data, filter);
        resolve(data);
      }).catch((err)=>{
        this._fireEvent(events.ERROR_LIST, filter, err);
        reject(err);
      });
    });
    return promise;
  }


  /**
  * Counts elements by filter
  * @param  {GenericFilter} [filter={}] the filter intance
  * @return {Promise}
  */
  count(filter = {}) {
    this._fireEvent(events.BEFORE_COUNT, filter);

    let functionName = 'count';
    //if the model has soft delete, we need to determine the method to execute
    if(this.hasSoftDelete){
      switch (filter.show) {
        case 'TRASHED':
        case 'DELETED':
        functionName = 'countDeleted';
        break;
        case 'ALL':
        functionName = 'countWithDeleted'
        break;
      }
    }

    //promise to be returned
    let promise=new Promise((resolve,reject)=>{
      this.model[functionName](filter.query)
      .then((data)=>{
        this._fireEvent(events.AFTER_COUNT, data);
        resolve(data);
      }).catch((err)=>{
        this._fireEvent(events.ERROR_COUNT, filter, err);
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
      this.log('debug', 'Notify ' + eventName + ' to  ' +  this.listeners[eventName].length + ' listeners');
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
      this.log('debug', 'Adding new listener to ' + eventName);
      this.listeners[eventName].push(obj);
    } else {
      throw new Error("Listener must be a function!");
    }
  }
}

module.exports=GenericMongoStorage;
