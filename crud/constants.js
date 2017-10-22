const c={
  record_status:{
    TRASHED: 'TRASHED',
    DELETED: 'DELETED',
    ALL:'ALL',
    ACTIVE:'ACTIVE'
  },
  crud_events:{
    BEFORE_CREATE:'BEFORE_CREATE',
    AFTER_CREATE:'AFTER_CREATE',
    ERROR_CREATE:'ERROR_CREATE',
    BEFORE_UPDATE:'BEFORE_UPDATE',
    AFTER_UPDATE:'AFTER_UPDATE',
    ERROR_UPDATE:'ERROR_UPDATE',
    BEFORE_DELETE:'BEFORE_DELETE',
    AFTER_DELETE:'AFTER_DELETE',
    ERROR_DELETE:'ERROR_DELETE',
    BEFORE_FIND_BY_ID:'BEFORE_FIND_BY_ID',
    AFTER_FIND_BY_ID:'AFTER_FIND_BY_ID',
    ERROR_FIND_BY_ID:'ERROR_FIND_BY_ID',
    BEFORE_FIND_ONE:'BEFORE_FIND_ONE',
    AFTER_FIND_ONE:'AFTER_FIND_ONE',
    ERROR_FIND_ONE:'ERROR_FIND_ONE',
    BEFORE_COUNT:'BEFORE_COUNT',
    AFTER_COUNT:'AFTER_COUNT',
    ERROR_COUNT:'ERROR_COUNT',
    BEFORE_LIST:'BEFORE_LIST',
    AFTER_LIST:'AFTER_LIST',
    ERROR_LIST:'ERROR_LIST'
  }
}

module.exports=c;