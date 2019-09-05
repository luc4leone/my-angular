'use strict';
var _ = require('lodash');

// // My dictionary, i.e. terms I changed, to make sense of things:
//   // | original term | my term               |
//   // | $watch        | $register_a_watcher      |
//   // | $digest       | $check_dirty_watchers |


// constructor
function Scope() {
  // $$ signifies private var to Angular framework, and should not be called from application code
  // ogni obj creato con Scope conterrà un arr dove verranno messi gli obj che contengono le 2 funzioni, watch e listener, cioè data e listener
  this.$$watchers = []; 
  // to minimize the n of watchFn executions
  // this.$$lastDirtyWatch = null; 
}

// function initWatchVal() {}

Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn// || function() {},
    // last: initWatchVal
  };
  this.$$watchers.push(watcher);
};


Scope.prototype.$digest = function() {
  // to pass scope to watchFn
  var self = this;
  _.forEach(this.$$watchers, function(watcher) {
    watcher.watchFn(self);
    watcher.listenerFn();
  });
};

// Scope.prototype.$$digestOnce = function() {
//   var self = this;
//   var newValue, oldValue, dirty;
//   _.forEach(this.$$watchers, function(watcher) {
//     newValue = watcher.watchFn(self);
//     oldValue = watcher.last;
//     if (newValue !== oldValue) { // if true, watcher is dirty
//       self.$$lastDirtyWatch = watcher; // let's keep track of (last) dirty watcher
//       watcher.last = newValue; // update last
//       // if watcher is dirty let's call the listener
//       watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
//       // (??) calling the listener it's like calling the cb 
//       // attached to an event (e.g. onclick="cb" 
//       // onclick is an event or a listener?) (??)
//       dirty = true;
//     } else if (self.$$lastDirtyWatch === watcher) { // ... watcher is clean then
//       return false; // break out of the loop (to optimize)
//     }
//   });
//   return dirty;
// };

// Scope.prototype.$digest = function() {
//   var ttl = 10 // time to live: maximum n of iterations allowed before throwing an exception (when watchers depend on each other)
//   var dirty;
//   this.$$lastDirtyWatch = null;
//   do {
//     dirty = this.$$digestOnce();
//     if (dirty && !(ttl--)) {
//       throw '10 digest iterations reached';
//     }
//   } while (dirty);
// };

module.exports = Scope;