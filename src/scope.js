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
  // to store $evalAsync tasks that have been deferred
  this.$$asyncQueue = [];
  // a new queue for applyAsync
  this.$$applyAsyncQueue = [];
  this.$$applyAsyncId = null;
  this.$$postDigestQueue = [];
  this.$root = this;
  this.$$children = [];
  this.$$phase = null;
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
  // was 'push'. it's 'unshift' to handle the case of a watch that
  // destroys itself during a digest
  this.$$watchers.unshift(watcher);
  // let's reset the last dirty watch when a watch is added
  this.$root.$$lastDirtyWatch = null;
  // destroy implementation: $watch will return a fn that the user can store
  // and call when he wants to destroy a watcher
  return function() {
    // get the index of the watcher in $$watchers and store it
    var index = self.$$watchers.indexOf(watcher);
    // if the watcher exists
    if (index >= 0) {
      // destroy it
      self.$$watchers.splice(index, 1);
      // reset last dirty watch to null to fix test 'allows a $watch to destroy another during digest'
      self.$root.$$lastDirtyWatch = null;
    }
  };
};

Scope.prototype.$watchGroup = function(watchFns, listenerFn) {
	var self = this;
	var oldValues = new Array(watchFns.length);
	var newValues = new Array(watchFns.length);
	var changeReactionScheduled = false;
	var firstRun = true;

	if (watchFns.length === 0) {
		var shouldCall = true;
		self.$evalAsync(function() {
			if (shouldCall) {
				listenerFn(newValues, newValues, self);
			}
		});
		return function() {
			shouldCall = false;
		};
	}

	function watchGroupListener() {
		if (firstRun) {
			firstRun = false;
			listenerFn(newValues, newValues, self);
		} else {
			listenerFn(newValues, oldValues, self);
		}
		changeReactionScheduled = false;
	}

	var destroyFunctions = _.map(watchFns, function(watchFn, i) {
		return self.$watch(watchFn, function(newValue, oldValue) {
			newValues[i] = newValue;
			oldValues[i] = oldValue;
			if (!changeReactionScheduled) {
				changeReactionScheduled = true;
				self.$evalAsync(watchGroupListener);
			}
		});
	});

	return function() {
		_.forEach(destroyFunctions, function(destroyFunction) {
			destroyFunction();
		});
	};
};

Scope.prototype.$digest = function() {
  // time to live: maximum n of iterations allowed before throwing an exception
  // (when watchers depend on each other)
  var ttl = 10;
  var dirty;
  // whenever a new digest begins we reset the last dirty watch, so we make
  // sure that we don't take the last digest lastDirtyWatch
  this.$root.$$lastDirtyWatch = null;
  // let’s set the phase as ”$digest” for the duration of the outer digest loop:
  this.$beginPhase('$digest');
	
  if (this.$root.$$applyAsyncId) {
    clearTimeout(this.$root.$$applyAsyncId);
    this.$$flushApplyAsync();
  }
  // do at least one pass, then another only if dirty is true, meaning at least
  // a watch was dirty (when no watch was dirty the situation is deemed stable)
  do {
    // if the queue is not empty, let's run the tasks $evalAsync
    // put into the tasks queue

    // from the book: "The implementation guarantees that if you defer a
    // function while the scope is still dirty, the function will
    // be invoked later but still during the same digest. That satisfies
    // our unit test: 'executes given function later in the same cycle'"
    // in my own words:
      // the following while statement is into the digest method,
      // so it must be run by the end of the digest run.
      // first time digest is run, dirty is undefined, no tasks
      // are in the queue, while condition is false, while block is not run.
      // dirty is set to true, because the first time a watcher is
      // always dirty, so we go to digest second iteration.
      // before running $$digestOnce, this time we run the while block,
      // since the queue is not empty, meaning we run the code that was
      // deferred in the listener.
      // then we go into $$digestOnce, the watcher is clean, so we don't
      // run the listener
    while (this.$$asyncQueue.length) {
			try {
				// first task in the queue
	      var asyncTask = this.$$asyncQueue.shift();
	      // run the deferred code
	      asyncTask.scope.$eval(asyncTask.expression);
		  } catch (e) {
		  	console.log(e);
		  }
    }
    dirty = this.$$digestOnce();
    // ttl check: throw exception for a digest that's never stable (at least one watch is dirty at each round)
    // to make the test 'eventually halts $evalAsyncs added by watches'
    // pass added the || part of the condition
    if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
      this.$clearPhase();
      throw '10 digest iterations reached';
    }
  // condition was just dirty, meaning dirty==true. the || part was added
  // to avoid stopping the digest when the queue is not empty
  } while (dirty || this.$$asyncQueue.length);
  this.$clearPhase();
	
  while (this.$$postDigestQueue.length) {
    try {
      this.$$postDigestQueue.shift()();
    } catch (e) {
      console.log(e);
    }
  }
};

// $$ significa che la usa angular. $ significa che la usa l'app (è
// una var di angular, ma fa parte dell'API)
// Scope.prototype.$$digestOnce = function() {
//   // let's pass scope to watchFn to allow it to access scope fields
//   // we exploit a closure property, to pass this to a callback
//   var self = this;
//   // needed because we want to call the listener ONLY when there's a change
//   // in some scope value
//
//   // dirty is introduced with digestOnce to support multiple passes to take
//   // care of watcher "dependencies". dirty is a boolean that will tell us
//   // if at the end of ONE pass there were any changes or not (if true at
//   // least one watcher was dirty)
//   var newValue, oldValue, dirty;
//   // for each watcher we'll check if there's a value change, if so, we call
//   // the listener
//   _.forEachRight(this.$$watchers, function(watcher) {
//     // catching exceptions when executing watch and listener, to make the
//     // program more robust, avoiding program stops
//     try {
//       // let's check the watcher exists, otherwise we get an exception
//       // making test 'allows destroying several $watches during digest' fail
//       // if watcher is undefined we skip the try block, thus skipping also
//       // the exception block
//       if (watcher) {
//         // get newValue
//         newValue = watcher.watchFn(self);
//         // get oldValue
//         oldValue = watcher.last;
//         // if there's a change, meaning if the newValue is different from the
//         // oldValue, the watcher is dirty and we are going to call the listener
//         // from newValue !== oldValue to the condition below to account for
//         // comparison by value. the bang in front because we are going to execute
//         // the if block code if new and old value are NOT equal
//         if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
//           // set the last dirty watcher
//           self.$$lastDirtyWatch = watcher;
//           // updating last
//           // if flag valueEq is true, meaning we want a by value comparison
//           // then we update last with a copy of newValue, to avoid that last
//           // and newValue point to the same address (then updating newValue would
//           // update last, so I would always compare the same thing)
//           watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
//           // calling listener (reacting to a value change)
//           watcher.listenerFn(newValue,
//             // set oldValue to newValue the first time we digest to avoid
//             // leak initWatchVal outside of scope
//             (oldValue === initWatchVal ? newValue : oldValue),
//             self);
//             dirty = true;
//             // if the watcher is clean, meaning the if condition above is false,
//             // and the watcher was the last dirty one
//           } else if (self.$$lastDirtyWatch === watcher) {
//             // returning false will get us out of _.forEach (see spec)
//             // meaning dirty will not be assigned false, it will be undefined
//             // which will end the enclosing loop
//             return false;
//           }
//       }
//     } catch (exception) {
//       console.log(exception);
//     }
//   });
//   return dirty;
// };

Scope.prototype.$$digestOnce = function() {
  var dirty;
  var continueLoop = true;
  var self = this;
  this.$$everyScope(function(scope) {
    var newValue, oldValue;
    _.forEachRight(scope.$$watchers, function(watcher) {
      try {
        if (watcher) {
          newValue = watcher.watchFn(scope);
          oldValue = watcher.last;
          if (!scope.$$areEqual(newValue, oldValue, watcher.valueEq)) {
            self.$root.$$lastDirtyWatch = watcher;
            watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), scope);
            dirty = true;
          } else if (self.$root.$$lastDirtyWatch === watcher) {
            continueLoop = false;
            return false;
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
    return continueLoop;
  });
  return dirty;
};
// 2 $$... means helper method
Scope.prototype.$$everyScope = function(fn) {
  if (fn(this)) { // fn(this) will return true or false
    // native every to $$children, significa true se cb da true su tutti i child
      // function(child) { return child.$$everyScope(fn)};
        // per ogni child richiamo $$everyScope
      return this.$$children.every( function(child) { return child.$$everyScope(fn); });
  } else {
    return false;
  }
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

Scope.prototype.$eval = function(expr, locals) {
  // why do I pass `this` to expr ? what's confusing is a fn call into a
  // fn definition. Let's break it down.
  // 1. this is the function definition of $eval
  // 2. it's a method on the scope proto, that means I usually call it as `scope.$eval`
  // 3. `expr` is a cb, I get it from the `return` statement
  // 4. can't say what's the value of `this` here. It's defined at call time, but since `$eval` most of the time will be called like this `instanceOfScope.$eval` then `this` most of the time will be `instanceOfScope`, aka scope 

  return expr(this, locals);
};

Scope.prototype.$apply = function(expr) {
  try {
    // set phase
    this.$beginPhase('$apply');
    return this.$eval(expr);
  // `finally` block is ALWAYS executed (compare with `catch`), but AFTER the
  // return statement above
  // so the `try` runs `expr`, the code I'd like to run, through `$eval`,
  // meaning in `this` context, then `finally` guarantees updates of values
  // by calling `$digest`
  } finally {
    // clear phase
    this.$clearPhase();
    this.$root.$digest();
  }
};

Scope.prototype.$evalAsync = function(expr) {
  // to make 'schedules a digest in $evalAsync' test pass
  var self = this;
  // condition: phase null and no queue
  if (!self.$$phase && !self.$$asyncQueue.length) {
    setTimeout(function() {
      if (self.$$asyncQueue.length) {
        self.$root.$digest();
      }
    });
  }
  // this is the first implementation, just an obj push to the queue
  this.$$asyncQueue.push({
    // storing scope on the queue obj is due to scope inheritance
    // I'll see it in Ch 3
    // basically I am pushing the code to defer into the queue
    // wrapped up into an obj
    scope: this,
    expression: expr
  });
};

Scope.prototype.$beginPhase = function(phase) {
  if (this.$$phase) {
    throw this.$$phase + ' already in progress.';
  }
  this.$$phase = phase;
};

Scope.prototype.$clearPhase = function() {
  this.$$phase = null;
};

Scope.prototype.$applyAsync = function(expr) {
  var self = this;
  // push the evaluated cb `$eval(expr)` to the queue, evaluated in the context of the scope `self.`
  self.$$applyAsyncQueue.push(function() {
    self.$eval(expr);
  });
	
  if (self.$root.$$applyAsyncId === null) {
    self.$root.$$applyAsyncId = setTimeout(function() {
      self.$apply(_.bind(self.$$flushApplyAsync, self));
    }, 0);
  }
};

Scope.prototype.$$flushApplyAsync = function() {
  // will go on until the length is 0, implies the loop will stop only
  // when the queue is empty
  while (this.$$applyAsyncQueue.length) {
    try {
			// ()() means call the fn returned by `self.$$applyAsyncQueue.shift()`
      this.$$applyAsyncQueue.shift()();
    } catch (e) {
      console.error(e);
    }
  }
  this.$root.$$applyAsyncId = null;
};

Scope.prototype.$$postDigest = function(fn) {
  this.$$postDigestQueue.push(fn);
};

Scope.prototype.$new = function(isolated) {
  var child;
  if (isolated) {
    child = new Scope();
    child.$root = this.$root;
    child.$$asyncQueue = this.$$asyncQueue;
    child.$$postDigestQueue = this.$$postDigestQueue;
    child.$$applyAsyncQueue = this.$$applyAsyncQueue;
  } else {
    var ChildScope = function() {};
    ChildScope.prototype = this;
    child = new ChildScope();
  }
  this.$$children.push(child);
  child.$$watchers = [];
  // to shadow `this` (`this` is parent)
  // think of $new as Scope: put here the instance properties; you added $$children in Scope, do the same here
  child.$$children = [];
  return child;
};



module.exports = Scope;


