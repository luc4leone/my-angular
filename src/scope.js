'use strict';
var _ = require('lodash');

// constructor
function Scope() {
  // $$ signifies private var to Angular framework, and should not be called from application code
  this.$$watchers = []; // ogni obj creato con Scope conterrà un arr dove verranno messi gli obj che contengono le 2 funzioni, watch e listener, cioè data e listener
}

// function initWatchVal() {}

Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn,
    //last: initWatchVal
  };
  this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function() {
  var self = this;
  var newValue, oldValue; //dirty;
  _.forEach(this.$$watchers, function(watcher) {
    //watcher.listenerFn();
    //watcher.watchFn(self);

    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    if (oldValue !== newValue) {
      watcher.last = newValue;
      watcher.listenerFn(newValue, oldValue, self);

      // watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
      // dirty = true;
    }
  });
  // return dirty;
};


module.exports = Scope;