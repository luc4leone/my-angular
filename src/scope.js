'use strict';
var _ = require('lodash');

// // My dictionary, i.e. terms I changed, to make sense of things:
//   // | original term | my term               |
//   // | $watch        | $register_a_watcher   |
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

Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
  // needed for the "destroy a watch" implementation
  var self = this;
  var watcher = {
    watchFn: watchFn,
    // if no listenerFn parameter is passed, we default to function() {}
    // to avoid runtime to throw an exception
    listenerFn: listenerFn || function() {},
    // if we don't pass valueEq, it will be !!undefined, which is false
    // it's a way to default to false, i.e. comparing by reference
    valueEq: !!valueEq,
    // initialize last with a unique value to be sure that the first digest
    // will trigger the call of the listener
    last: initWatchVal
  };
  // was 'push'. it's 'unshift' to handle a handle the case of a watch that
  // destroy itself during a digest. why?
  this.$$watchers.unshift(watcher);
  // let's reset the last dirty watch when a watch is added
  this.$$lastDirtyWatch = null;
  // destroy implementation: $watch will return a fn that the user can store
  // and call when he wants to destroy a watcher
  return function() {
    // get the index of the watcher in $$watchers and store it
    var index = self.$$watchers.indexOf(watcher);
    // if the watcher exists
    if (index >= 0) {
      self.$$watchers.splice(index, 1);
    }
  }
};

Scope.prototype.$digest = function() {
  // time to live: maximum n of iterations allowed before throwing an exception
  // (when watchers depend on each other)
  var ttl = 10;
  var dirty;
  // whenever a new digest begins we reset the last dirty watch, so we make
  // sure that we don't take the last digest lastDirtyWatch
  this.$$lastDirtyWatch = null;
  // this.$$lastDirtyWatch = null;
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

Scope.prototype.$$digestOnce = function() {
  // let's pass scope to watchFn to allow it to access scope fields
  // we exploit a closure property, to pass this to a callback
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
  _.forEachRight(this.$$watchers, function(watcher) {
    // catching exceptions when executing watch and listener, to make the
    // program more robust, avoiding program stops
    try {
      // get newValue
      newValue = watcher.watchFn(self);
      // get oldValue
      oldValue = watcher.last;
      // if there's a change, meaning if the newValue is different from the
      // oldValue, the watcher is dirty and we are going to call the listener
      // from newValue !== oldValue to the condition below to account for
      // comparison by value. hte bang in front because we are going to execute
      // the if block code if new and old value are NOT equal
      if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
        // set the last dirty watcher
        self.$$lastDirtyWatch = watcher;
        // updating last
        // if flag valueEq is true, meaning we want a by value comparison
        // then we update last with a copy of newValue, to avoid that last
        // and newValue point to the same address (then updating newValue would
        // update last, so I would always compare the same thing)
        watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
        // calling listener (reacting to a value change)
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
    } catch (exception) {
      console.log(exception);
    }
  });
  return dirty;
};

Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {
  // if the flag valueEq is true, meaning if we want to make the comparison
  // by value
  if (valueEq) {
    // lodash deep comparison
    return _.isEqual(newValue, oldValue);
  } else {
    // === compares by reference
    // now we use === instead of !== because I call $$areEqual with the Bang
    // in front
    return newValue === oldValue     ||
      ( typeof newValue === 'number' && 
        typeof oldValue === 'number' &&
        isNaN(newValue)              && 
        isNaN(oldValue)
      );
  }
};

module.exports = Scope;