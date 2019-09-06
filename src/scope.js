'use strict';
var _ = require('lodash');

// // My dictionary, i.e. terms I changed, to make sense of things:
//   // | original term | my term               |
//   // | $watch        | $register_a_watcher      |
//   // | $digest       | $check_dirty_watchers |


// constructor
function Scope() {
  // $$ signifies private var to Angular framework, and should not be called
  // from application code
  this.$$watchers = [];
  // to minimize the n of watchFn executions let's keep track of the last
  // dirty watch
  this.$$lastDirtyWatch = null;
}

// unique value for watcher.last
function initWatchVal() {}

Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() {},
    // initialize last with a unique value to be sure that the first digest
    // will trigger the call of the listener
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
  // let's reset the last dirty watch when a watch is added
  this.$$lastDirtyWatch = null;
};


Scope.prototype.$$digestOnce = function() {
  // to pass scope to watchFn to allow it to access scope values
  var self = this;
  // needed because we want to call the listener ONLY when there's a change
  // in some scope value

  // dirty is introduced with digestOnce to support multiple passes to take
  // care of watcher "dependencies". dirty is a boolean that will tell us
  // if at the end of ONE pass there were any changes or not (if true at
  // least one watcher was dirty)
  var newValue, oldValue, dirty;
  // for each watcher we'll check if there's a value change, if so, we call
  // the listener
  _.forEach(this.$$watchers, function(watcher) {
    // get newValue
    newValue = watcher.watchFn(self);
    // get oldValue
    oldValue = watcher.last;
    // if there's a change, meaning if the newValue is different from the
    // oldValue, the watcher is dirty and we are going to call the listener
    if (newValue !== oldValue) {
      // set the last dirty watcher
      self.$$lastDirtyWatch = watcher;
      // updating last
      watcher.last = newValue;
      // calling listener (reacting to change)
      watcher.listenerFn(newValue,
        // set oldValue to newValue the first time we digest to avoid
        // leak initWatchVal outside of scope
        (oldValue === initWatchVal ? newValue : oldValue), 
        self);
      dirty = true;
    // if the watcher is clean, meaning the if condition above is false,
    // and the watcher was the last dirty one
    } else if (self.$$lastDirtyWatch === watcher) {
      // returning false will get us out of _.forEach (see spec)
      // meaning dirty will not be assigned false, it will be undefined
      // which will end the enclosing loop
      return false;
    }
  });
  return dirty;
};

Scope.prototype.$digest = function() {
  // time to live: maximum n of iterations allowed before throwing an exception (when watchers depend on each other)
  var ttl = 10 
  var dirty;
  // whenever a new digest begins we reset the last dirty watch
  this.$$lastDirtyWatch = null;
  //this.$$lastDirtyWatch = null;
  // do at least one pass, then another only if dirty is true, meaning at least
  // a watch was dirty (when no watch was dirty the situation is deemed stable)
  do {
    dirty = this.$$digestOnce();
    // throw exception for a digest that's never stable (at least one watch
    // is dirty at each round)
    if (dirty && !(ttl--)) {
      throw '10 digest iterations reached';
    }
  } while (dirty);
};

module.exports = Scope;