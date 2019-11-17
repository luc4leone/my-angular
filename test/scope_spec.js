'use strict';

var _ = require('lodash');
// vedi module.exports statement in scope.js
var Scope = require('../src/scope.js');

// I put 's' instead of 'S' because of it fn: "can be contructed..."
// it's the obj, not the contructor
describe('scope', function() {
  it('1.1 can be constructed and used as an object', function() {
    // create the scope
    var scope = new Scope();
    // add a property to the scope and initialize it to 1
    scope.aProperty = 1;

    // actual should be expected 1
    expect(scope.aProperty).toBe(1);
  });

  // nesting describe fn
  describe('digest', function() {
    var scope;

    // Jasmine method that takes an optional cb "that contains the code to setup your specs"
    // Initializing the scope, so we don't have to do it for each test
    // added name to fn passed in for debugging
    beforeEach(function initScope() {
      scope = new Scope();
    });

    // 1. you can register a watcher using $watch
    // 2. the watcher’s listener function is invoked when someone calls $digest.
    it('2.1 calls the listener function of a watch on first $digest', function() {
      var watchFn = function() {
        return 'wat';
      };
      // "spy": Jasmine terminology for a kind of mock function. It makes it convenient for us to answer questions like "Was this function called?" and "What arguments was it called with?"
      var listenerFn = jasmine.createSpy();

      // 1.
      scope.$watch(watchFn, listenerFn);
      // 2.
      scope.$digest();

      expect(listenerFn).toHaveBeenCalled();
    });

    it('2.2 calls the watch function with the scope as the argument', function() {
      var watchFn = jasmine.createSpy();
      var listenerFn = function() {};
      scope.$watch(watchFn, listenerFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalledWith(scope);
    });

    it('2.3 calls the listener function when the watched value changes', function() {
      // setup variables
      // put some values on the scope
      scope.someValue = 'a';
      scope.counter = 0;
      // setup a watcher of someValue
      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      // the listener should not be called if digest is not called
      expect(scope.counter).toBe(0);

      // FIRST time I called the digest the listener should be called even when no change occured to the watched vars
      scope.$digest();
      expect(scope.counter).toBe(1);

      // if I call digest again the listener should not be called if NO change occur to the vars
      scope.$digest();
      expect(scope.counter).toBe(1);

      // a change in someValue occurs. But the listener is not called, cause digest has not been called...
      scope.someValue = 'b';
      expect(scope.counter).toBe(1);

      // ...but if I call it, the listener is called
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('2.4 calls listener when watch value is first undefined', function() {
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('2.5 calls listener with new value as old value the first time', function() {
      // declare and initialize some var
      scope.someValue = 123;
      // just declare another var
      var oldValueGiven;

      scope.$watch(
        // watch on someValue
        function(scope) { return scope.someValue; },
        // update value of oldValueGiven to oldValue
        function(newValue, oldValue, scope) { oldValueGiven = oldValue; }
      );

      // first time we call digest (no change in someValue)
      scope.$digest();
      // since we set oldValueGiven in the listener to oldValue, and here
      // we state that we expect it to be 123, which is the newValue, we
      // are saying that the first time we must pass to listener newValue
      // as the oldValue argument
      expect(oldValueGiven).toBe(123);
    });

    it('2.6 may have watchers that omit the listener function', function() {
      var watchFn = jasmine.createSpy().and.returnValue('something');
      // calling $watch without passing in a listener
      scope.$watch(watchFn);

      // this call should trigger the call of the listener, but it's not there
      // so the code throws an exception
      scope.$digest();

      expect(watchFn).toHaveBeenCalled();
    });

    it('2.7 triggers chained watchers in the same digest', function() {
      // set a name property on the scope, and initialize to 'Jane'
      scope.name = 'Jane';

      // let's add a watcher to scope, watching nameUpper
      scope.$watch(
        // added fn names to see it in the debugger
        function watch_nameUpper(scope) { return scope.nameUpper; },
        function set_initial(newValue, oldValue, scope) {
          if (newValue) {
            scope.initial = newValue.substring(0, 1) + '.';
          }
        }
      );

      // let's add another watcher to scope, watching name
      scope.$watch(
        // added fn names to see it in the debugger
        function watch_name(scope) { return scope.name; },
        function set_nameUpper(newValue, oldValue, scope) {
          if (newValue) {
            scope.nameUpper = newValue.toUpperCase();
          }
        }
      );

      // the first time I run digest I am expecting the name watcher to run
      // the listener that would create nameUpper and initialize it to
      // 'JANE'. here we are at the end of the first round through the watchers.
      // if we expect initial to be 'J.' then there should be a second round
      scope.$digest();
      expect(scope.initial).toBe('J.');

      // same logic as above
      scope.name = 'Bob';
      scope.$digest();
      expect(scope.initial).toBe('B.');
    });

    it('2.8 gives up on the watches after 10 iterations', function() {
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$watch( // that checks for A but acts on B
        function(scope) { return scope.counterA; },
        function(newValue, oldValue, scope) { return scope.counterB++; }
        );

      scope.$watch( // that checks for B but acts on A
        function(scope) { return scope.counterB; },
        function(newValue, oldValue, scope) { return scope.counterA++; }
      );

      // the above situation is never stable, so an exception should be thrown
      expect((function() { scope.$digest(); })).toThrow();
    });

    // I changed the name of the test, to make clear to me what it tests
    it('2.9 ends the digest when the current watch that is clean is also the last dirty watch', function() {
      // https://lodash.com/docs/4.17.15#range
      // we put an array of 100 num on the scope
      scope.array = _.range(100);
      // a counter that is incremented each time the watch is executed
      var watchExecutions = 0;

      // https://lodash.com/docs/4.17.15#times
      // we create 100 watchers for the 100 numbers in the array
      _.times(100, function(i) {
        scope.$watch(
          function(scope) {
            // incrementing the "watch counter"
            watchExecutions++;
            return scope.array[i];
          },
          function(newValue, oldValue, scope) {
          }
        );
      });

      scope.$digest();
      // the first is dirty, from initWatchVal to 0 >>> watchExecution = 1
      // the second is dirty, from initWatchVal to 1 >>> watchExecution = 2
      // ... and so on until the 100th from initWatchVal to 99
        // >>> watchExecution = 100
      // the first is clean, from 0 to 0 >>> watchExecution = 101
      // the second is clean, from 1 to 1 >>> watchExecution = 102
      // ... and so on until the 100th from 99 to 99 >>> watchExecution = 200
      expect(watchExecutions).toBe(200);

      scope.array[0] = 420;
      // the first is dirty, from 0 to 420 >>> watchExecution = 201
      // the 100th is clean, from 99 to 99 >>> watchExecution = 300
      // the 101st is clean, from 420 to 420 >>> watchExecution = 301
        // here I'd like the digest to stop because 100 watchers were digested
        // without finding anyone dirty
      scope.$digest();
      expect(watchExecutions).toBe(301);
    });

    it('2.10 does not end digest so that new watches are not run', function() {
      // set and initialize aValue field on scope
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        // watch for aValue
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          // the listener for aValue setup another watch for a aValue
          scope.$watch(
            function(scope) { return scope.aValue; },
            function(newValue, oldValue, scope) {
              // so we are keeping track of the execution of the nested listener
              scope.counter++;
            }
          );
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('2.11 compares based on value if enabled', function() {
      // set aValue field on scope; initialize it to an array of numbers
      scope.aValue = [1, 2, 3];
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        },
        true
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      // when I push 4 to aValue, the array address is the same
      // that means that if I compare by reference, I will not see the change
      // thus I will not call the listener, thus the counter will be 1
      scope.aValue.push(4);
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('2.12 correctly handles NaNs', function() {
      scope.number = 0/0; // results in a NaN type
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.number; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      // we expect the counter to be 1 because there's the change from
      // last == initWatchVal to newValue == NaN
      expect(scope.counter).toBe(1);

      scope.$digest();
      // now last == NaN and newValue is still NaN, so I would expect counter
      // to still be 1, but that's not the case if I don't improve the code
      // resposible for the comparison, accounting for the fact that NaN is not
      // equal to NaN
      expect(scope.counter).toBe(1);
    });

    it('2.13 catches exceptions in watch functions and continues', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      // first watch throws an exception
      scope.$watch(
        function(scope) { throw 'Error'; },
        function(newValue, oldValue, scope) { }
      );
      // second watch has a counter in the listener
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      // we check that even if we have an exception on the first watch, the
      // second is executed
      expect(scope.counter).toBe(1);
    });

    it('2.14 catches exceptions in listener functions and continues', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          throw 'Error';
        }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      // we check that even if we have an exception on the first listener's
      // watcher, the second is executed
      expect(scope.counter).toBe(1);
    });

    it('2.15 allows destroying a $watch with a removal function', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      // scope.$watch() will setup a watcher as usual, but we save its
      // returned value into the variable destroyWatch
      var destroyWatch = scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue = 'def';
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.aValue = 'ghi';
      // calling destroyWatch should destroy the watch
      destroyWatch();
      scope.$digest();
      // since the watch is destroyed, we expect the counter not to increase
      // after calling the digest
      expect(scope.counter).toBe(2);
    });

    it('2.16 allows destroying a $watch during digest', function() {
      scope.aValue = 'abc';

      // to check later that the watches are iterated in the correct order
      var watchCalls = [];

      // first watch
      scope.$watch(
        function(scope) {
          watchCalls.push('first');
          return scope.aValue;
        }
      );

      // second watch, it removes itself
      var destroyWatch = scope.$watch(
        function(scope) {
          watchCalls.push('second');
          destroyWatch();
        }
      );

      // third watch
      scope.$watch(
        function(scope) {
          watchCalls.push('third');
          return scope.aValue;
        }
      );

      scope.$digest();
      expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);

      /**
        An experiment in the console to understand why this test does not pass:
        var a = [1,2,3];
        var arr = [];
        _.forEach(a, function(n, i) {
          arr.push(n);
          if (i == 1) a.splice(i,1);
        });
        a
        [1, 3]
        arr
        [1, 2, undefined]


        If I use push in $watch to add watcher to watchers, I get:
          watchers = [1,2,3]

        watchCalls = []
        watcher.length = 3
        | index | watchers before | watchCalls      | watchers after |
        | 0     | [1,2,3]         | [1]             | [1,2,3]        |
        | 1     | [1,2,3]         | [1,2]           | [1,3]          |
        | 2     | [1,3]           | [1,2,undefined] | [1,3]          |

        I can test this table:

          function forEach(array, callback) {
            var length = array.length;
            for (var i = 0; i < length; i++) {
              callback(array[i], i, array);
            }
          };
          undefined
          var a = [1,2,3];
          var arr = [];
          forEach(a, function(n, i) {
            arr.push(n);
            if (i == 1) a.splice(i,1);
          });
          undefined
          a
          (2) [1, 3]
          arr
          (3) [1, 2, undefined]

        If I use unshift instead of push I get:
          watchers = [3,2,1]
        Then I use forEachRight:

        | index | watchers before | watchCalls | watchers after |
        | 2     | [3,2,1]         | [1]        | [3,2,1]        |
        | 1     | [3,2,1]         | [1,2]      | [3,1]          |
        | 0     | [3,1]           | [1,2,3]    | [3,1]          |

        I can test this table with:

          function forEachRight(array, callback) {
            var length = array.length;
            for (var i = length - 1; i >= 0; i--) {
              callback(array[i], i, array);
            }
          };

          var a = [1,2,3];
          var arr = [];
          forEachRight(a, function(n, i) {
            arr.unshift(n);
            if (i == 1) a.splice(i,1);
          });
          undefined
          a
          (2) [1, 3]
          arr
          (3) [1, 2, 3]
       */
    });

    it('2.17 allows a $watch to destroy another during digest', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      // first watch calls destroyWatch in it's listener
      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          destroyWatch();
        }
      );

      // second watch
      // we store the fn returned by $watch() in destroyWatch var
      var destroyWatch = scope.$watch(
        function(scope) { },
        function(newValue, oldValue, scope) { }
      );

      // third watch
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      // 1. The first watch is executed. It is dirty, so it is stored in $$lastDirtyWatch
         // and its listener is executed. The listener destroys the second watch.
      // 2. The first watch is executed again, because it has moved one position down in
         // the watcher array. This time it is clean, and since it is also in
         // $$lastDirtyWatch, the digest ends. We never get to the third watch.
      scope.$digest();
      // instead I get 0
      expect(scope.counter).toBe(1);
    });

    it('2.18 allows destroying several $watches during digest', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      // the watch of the first watcher destroys watcher 1 and 2
      var destroyWatch1 = scope.$watch(
        function(scope) {
          destroyWatch1();
          destroyWatch2();
        }
      );

      // save returned fn when creating second watch to destroy it later
      var destroyWatch2 = scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(0);
    });

    // what's a digest phase?
    it('2.19 has a $$phase field whose value is the current digest phase', function() {
      // value to watch
      scope.aValue = [1, 2, 3];
      // maybe these are the phases...
      scope.phaseInWatchFunction = undefined;
      scope.phaseInListenerFunction = undefined;
      scope.phaseInApplyFunction = undefined;

      scope.$watch(
        function(scope) {
          scope.phaseInWatchFunction = scope.$$phase;
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.phaseInListenerFunction = scope.$$phase;
        }
      );

      scope.$apply(function(scope) {
        scope.phaseInApplyFunction = scope.$$phase;
      });

      expect(scope.phaseInWatchFunction).toBe('$digest');
      expect(scope.phaseInListenerFunction).toBe('$digest');
      expect(scope.phaseInApplyFunction).toBe('$apply');
    });

  }); // end of describe digest

  // executing code in the context of a scope: $eval
  describe('$eval', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('3.1 executes $evaled function and returns result', function() {
      scope.aValue = 42;

      // $eval takes a cb as an argument, and immediately execute that cb,
      // passing it the scope obj as an argument.
      // $eval returns whatever the cb returns
      // $eval is a method defined in scope, I made the mistake of thinking it belonged to the controller
      var result = scope.$eval(function(scope) {
        return scope.aValue;
      });

      expect(result).toBe(42);
    });

    // $eval takes also a second argument that passes to the cb
    it('3.2 passes the second $eval argument straight through', function() {
      scope.aValue = 42;

      var result = scope.$eval(function(scope, arg) {
        return scope.aValue + arg;
      }, 2);

      expect(result).toBe(44);
    });

  }); // end of describe $eval

  // executing code in the context of a scope: $apply
  describe('$apply', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('4.1 executes the given function and starts the digest', function() {
      scope.aValue = 'someValue';
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      // $apply takes a fn as an argument
      scope.$apply(function(scope) {
        scope.aValue = 'someOtherValue';
      });
      // we expect the counter to be 2, meaning calling $apply runs $digest
      expect(scope.counter).toBe(2);
    });

  }); // end of describe &apply

  describe('$evalAsync', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });
    // "in the same cycle" meaning within the current digest cycle,
    // which is not the case when the deferring goal is reached through
    // a different implementation, e.g. setTimeout or the angular $timeout
    // service where you relinquish control to the browser

    // in this test the code-to-run-later is in the listener
    it('5.1 executes given function later in the same cycle', function() {
      scope.aValue = [1, 2, 3];
      // better name: asyncEvaluatedLater
      scope.asyncEvaluated = false;
      scope.asyncEvaluatedImmediately = false;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          // run $evalAsync into the listener
          scope.$evalAsync(function(scope) {
            // update value
            scope.asyncEvaluated = true;
          });
          // update `asyncEvaluatedImmediately`
          scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
        }
      );

      // run digest
      scope.$digest();
      // this expectation implies the implementation should work like this:
      // the update of `scope.asyncEvaluated` should run by the end of `digest`
      expect(scope.asyncEvaluated).toBe(true);
      // this expectation means I want $evalAsync to run after all the code
      // in the listener has run
      expect(scope.asyncEvaluatedImmediately).toBe(false);
    });

    // this is something I should not do, because I don't want side effects
    // for watch functions
    it('5.2 executes $evalAsynced functions added by watch functions', function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;

      // this test makes the $evalAsync run once...
      scope.$watch(
        function(scope) {
          if (!scope.asyncEvaluated) {
            scope.$evalAsync(function(scope) {
              scope.asyncEvaluated = true;
            });
          }
          return scope.aValue;
        },
        function(newValue, oldValue, scope) { }
      );

      scope.$digest();

      expect(scope.asyncEvaluated).toBe(true);
    });

    // while this test makes the $evalAsync run more than once
    it('5.3 executes $evalAsynced functions even when not dirty', function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluatedTimes = 0;

      scope.$watch(
        function(scope) {
          if (scope.asyncEvaluatedTimes < 2) {
            scope.$evalAsync(function(scope) {
              scope.asyncEvaluatedTimes++;
            });
          }
          return scope.aValue;
        },
        function(newValue, oldValue, scope) { }
      );

      scope.$digest();

      expect(scope.asyncEvaluatedTimes).toBe(2);
    });

    it('5.4 eventually halts $evalAsyncs added by watches', function() {
      scope.aValue = [1, 2, 3];

      scope.$watch(
        function(scope) {
          scope.$evalAsync(function(scope) { });
          return scope.aValue;
        },
        function(newValue, oldValue, scope) { }
      );

      expect(function() { scope.$digest(); }).toThrow();
    });

    it('5.5 schedules a digest in $evalAsync', function(done) {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$evalAsync(function(scope) { });

      // expecting the digest doesn't run immediately
      expect(scope.counter).toBe(0);
      // checking that 50 ms later the digest is run
      setTimeout(function() {
        expect(scope.counter).toBe(1);
        // argument 'done' (see above) to make setTimeout work with Jasmine
        done();
      }, 50);
    });

    it('5.6 catches exceptions in $evalAsync', function(done) {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$evalAsync(function(scope) {
        throw 'Error';
      });

      setTimeout(function() {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });
  }); // end of describe $evalAsync

  describe('$applyAsync', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('6.1 allows async $apply with $applyAsync', function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      });
      // expectation implies $applyAsync will NOT run the update immediately
      expect(scope.counter).toBe(1);


      setTimeout(function() {
        // implies the update is delayed 50 ms
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it('6.2 never executes $applyAsynced function in the same cycle', function(done) {
      scope.aValue = [1, 2, 3];
      scope.asyncApplied = false;
      scope.asyncAppliedImmediately = false;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.$applyAsync(function(scope) {
            scope.asyncApplied = true;
          });
        }
      );

      scope.$digest();
      expect(scope.asyncApplied).toBe(false);
      setTimeout(function() {
        expect(scope.asyncApplied).toBe(true);
        done();
      }, 50);
    });

    it('6.3 coalesces many calls to $applyAsync', function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newValue, oldValue, scope) { }
      );

      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      });
      scope.$applyAsync(function(scope) {
        scope.aValue = 'def';
      });

      setTimeout(function() {
        // the first digest will run twice. it's triggered by the first 
        // $applyAsync call. That means the second call to $applyAsync should
        // 
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it('6.4 cancels $applyAsync if digested first', function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newValue, oldValue, scope) { }
      );

      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      });
      scope.$applyAsync(function(scope) {
        scope.aValue = 'def';
      });

      scope.$digest();
      expect(scope.counter).toBe(2);
      expect(scope.aValue).toEqual('def');

      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it('6.5 catches exceptions in $applyAsync', function(done) {
      scope.$applyAsync(function(scope) {
        throw 'Error';
      });
      scope.$applyAsync(function(scope) {
        throw 'Error';
      });
      scope.$applyAsync(function(scope) {
        scope.applied = true;
      });

      setTimeout(function() {
        expect(scope.applied).toBe(true);
        done();
      }, 50);
    });

  }); // end of describe $applyAsync

  describe('$postDigest', function() {

    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('7.1 runs after each digest', function() {
      scope.counter = 0;
      scope.$$postDigest(function() {
        scope.counter++;
      });

      expect(scope.counter).toBe(0);
      scope.$digest();

      expect(scope.counter).toBe(1);
      scope.$digest();

      expect(scope.counter).toBe(1);
    });

    it('7.2 does not include $$postDigest in the digest', function() {
      scope.aValue = 'original value';

      scope.$$postDigest(function() {
        scope.aValue = 'changed value';
      });
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.watchedValue = newValue;
        }
      );

      scope.$digest();
      expect(scope.watchedValue).toBe('original value');

      scope.$digest();
      expect(scope.watchedValue).toBe('changed value');
    });

    it('7.3 catches exceptions in $$postDigest', function() {
      var didRun = false;

      scope.$$postDigest(function() {
        throw 'Error';
      });
      scope.$$postDigest(function() {
        didRun = true;
      });

      scope.$digest();

      expect(didRun).toBe(true);
    });

  });

  describe('$watchGroup', function() {

    var scope;
    beforeEach(function() {
      scope = new Scope();
    });

    it('8.1 takes several watches as an array and calls listener with arrays', function() {
      var gotNewValues, gotOldValues;

      scope.aValue = 1;
      scope.anotherValue = 2;

      scope.$watchGroup([
        function(scope) { return scope.aValue; },
        function(scope) { return scope.anotherValue; }
      ], function(newValues, oldValues, scope) {
        gotNewValues = newValues;
        gotOldValues = oldValues;
      });
      scope.$digest();

      expect(gotNewValues).toEqual([1, 2]);
      expect(gotOldValues).toEqual([1, 2]);
    });

    it('8.2 only calls listener once per digest', function() {
      var counter = 0;

      scope.aValue = 1;
      scope.anotherValue = 2;

      scope.$watchGroup([
        function(scope) { return scope.aValue; },
        function(scope) { return scope.anotherValue; }
      ], function(newValues, oldValues, scope) {
        counter++;
      });
      scope.$digest();

      expect(counter).toEqual(1);
    });

    it('8.3 uses the same array of old and new values on first run', function() {
      var gotNewValues, gotOldValues;

      scope.aValue = 1;
      scope.anotherValue = 2;

      scope.$watchGroup([
        function(scope) { return scope.aValue; },
        function(scope) { return scope.anotherValue; }
      ], function(newValues, oldValues, scope) {
        gotNewValues = newValues;
        gotOldValues = oldValues;
      });
      scope.$digest();

      expect(gotNewValues).toBe(gotOldValues);
    });

    it('8.4 uses different arrays for old and new values on subsequent runs', function() {
      var gotNewValues, gotOldValues;

      scope.aValue = 1;
      scope.anotherValue = 2;

      scope.$watchGroup([
        function(scope) { return scope.aValue; },
        function(scope) { return scope.anotherValue; }
      ], function(newValues, oldValues, scope) {
        gotNewValues = newValues;
        gotOldValues = oldValues;
      });
      scope.$digest();

      scope.anotherValue = 3;
      scope.$digest();

      expect(gotNewValues).toEqual([1, 3]);
      expect(gotOldValues).toEqual([1, 2]);
    });

    it('8.5 calls the listener once when the watch array is empty', function() {
      var gotNewValues, gotOldValues;

      scope.$watchGroup([], function(newValues, oldValues, scope) {
        gotNewValues = newValues;
        gotOldValues = oldValues;
      });
      scope.$digest();

      expect(gotNewValues).toEqual([]);
      expect(gotOldValues).toEqual([]);
    });

    it('8.6 can be deregistered', function() {
      var counter = 0;

      scope.aValue = 1;
      scope.anotherValue = 2;

      var destroyGroup = scope.$watchGroup([
        function(scope) { return scope.aValue; },
        function(scope) { return scope.anotherValue; }
      ], function(newValues, oldValues, scope) {
        counter++;
      });
      scope.$digest();

      scope.anotherValue = 3;
      destroyGroup();
      scope.$digest();

      expect(counter).toEqual(1);
    });

    it('8.7 does not call the zero-watch listener when deregistered first', function() {
      var counter = 0;

      var destroyGroup = scope.$watchGroup([], function(newValues, oldValues, scope) {
        counter++;
      });
      destroyGroup();
      scope.$digest();

      expect(counter).toEqual(0);
    });

  });

  describe('inheritance', function() {
		// the child shares the properties of its parent scope
    it('9.1. inherits the parents properties', function() {
      var parent = new Scope();
      parent.aValue = [1, 2, 3];

      var child = parent.$new();

      expect(child.aValue).toEqual([1, 2, 3]);
    });
		// the parent doesn't share the properties of the child
    it('9.2. does not cause a parent to inherit its properties', function() {
      var parent = new Scope();

      var child = parent.$new();
      child.aValue = [1, 2, 3];

      expect(parent.aValue).toBeUndefined();
    });
    // When a property is defined on a parent scope, all of the scope’s existing child scopes also get the property
    it('9.3. inherits the parents properties whenever they are defined', function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.aValue = [1, 2, 3];

      expect(child.aValue).toEqual([1, 2, 3]);
    });
		// if it's an object, if it's a value it will shadow the parent value
    it('9.4. can manipulate a parent scopes property', function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.aValue = [1, 2, 3];
      child.aValue.push(4);

      expect(child.aValue).toEqual([1, 2, 3, 4]);
      expect(parent.aValue).toEqual([1, 2, 3, 4]);
    });

    it('9.5. can watch a property in the parent', function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.aValue = [1, 2, 3];
      child.counter = 0;

      child.$watch(
				// want to understand better the scope parameter
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        },
        true
      );

      child.$digest();
      expect(child.counter).toBe(1);

      parent.aValue.push(4);
      child.$digest();
      expect(child.counter).toBe(2);
    });

    it('9.6. can be nested at any depth', function() {
      var a = new Scope();
      var aa = a.$new();
      var aaa = aa.$new();
      var aab = aa.$new();
      var ab = a.$new();
      var abb = ab.$new();

      a.value = 1;

      expect(aa.value).toBe(1);
      expect(aaa.value).toBe(1);
      expect(aab.value).toBe(1);
      expect(ab.value).toBe(1);
      expect(abb.value).toBe(1);

      ab.anotherValue = 2;

      expect(abb.anotherValue).toBe(2);
      expect(aa.anotherValue).toBeUndefined();
      expect(aaa.anotherValue).toBeUndefined();
    });

    it('9.7. shadows a parents property with the same name', function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.name = 'Joe';
      child.name = 'Jill';

      expect(child.name).toBe('Jill');
      expect(parent.name).toBe('Joe');
    });

    it('9.8. does not shadow members of parent scopes attributes', function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.user = {name: 'Joe'};
      child.user.name = 'Jill';

      expect(child.user.name).toBe('Jill');
      expect(parent.user.name).toBe('Jill');
    });

    it('9.9. does not digest its parent(s)', function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.aValue = 'abc';
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.aValueWas = newValue;
        }
      );

      child.$digest();
      expect(child.aValueWas).toBeUndefined();
    });

    it('9.10. keeps a record of its children', function() {
      var parent = new Scope();
      var child1 = parent.$new();
      var child2 = parent.$new();
      var child2_1 = child2.$new();

      expect(parent.$$children.length).toBe(2);
      expect(parent.$$children[0]).toBe(child1);
      expect(parent.$$children[1]).toBe(child2);
      expect(child1.$$children.length).toBe(0);
      expect(child2.$$children.length).toBe(1);
      expect(child2.$$children[0]).toBe(child2_1);
    });

    it('9.11. digests its children', function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.aValue = 'abc';

      child.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.aValueWas = newValue;
        }
      );

      parent.$digest();
      expect(child.aValueWas).toBe('abc');
    });

    xit('9.12. digests from root on $apply', function() {
      var parent = new Scope();
      var child = parent.$new();
      var child2 = child.$new();

      parent.aValue = 'abc';
      parent.counter = 0;

      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      child2.$apply(function(scope) { });
      expect(parent.counter).toBe(1);
    });

    xit('9.13. schedules a digest from root on $evalAsync', function(done) {
      var parent = new Scope();
      var child = parent.$new();
      var child2 = child.$new();

      parent.aValue = 'abc';
      parent.counter = 0;
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      child2.$evalAsync(function(scope) { });
      setTimeout(function() {
        expect(parent.counter).toBe(1);
        done();
      }, 50);
    });

    xit('9.14. does not have access to parent attributes when isolated', function() {
      var parent = new Scope();
      var child = parent.$new(true);

      parent.aValue = 'abc';

      expect(child.aValue).toBeUndefined();
    });

    xit('9.15. cannot watch parent attributes when isolated', function() {
      var parent = new Scope();
      var child = parent.$new(true);

      parent.aValue = 'abc';

      child.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.aValueWas = newValue;
        }
      );

      child.$digest();
      expect(child.aValueWas).toBeUndefined();
    });

    xit('9.16. digests its isolated children', function() {
      var parent = new Scope();
      var child = parent.$new(true);

      child.aValue = 'abc';

      child.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.aValueWas = newValue;
        }
      );

      parent.$digest();
      expect(child.aValueWas).toBe('abc');
    });

    xit('9.17. digests from root on $apply when isolated', function() {
      var parent = new Scope();
      var child = parent.$new(true);
      var child2 = child.$new();

      parent.aValue = 'abc';
      parent.counter = 0;
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      child2.$apply(function(scope) { });
      expect(parent.counter).toBe(1);
    });

    xit('9.18. schedules a digest from root on $evalAsync when isolated', function(done) {
      var parent = new Scope();
      var child = parent.$new(true);
      var child2 = child.$new();

      parent.aValue = 'abc';
      parent.counter = 0;
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      child2.$evalAsync(function(scope) { });
      setTimeout(function() {
        expect(parent.counter).toBe(1);
        done();
      }, 50);
    });

    xit('9.19. executes $evalAsync functions on isolated scopes', function(done) {
      var parent = new Scope();
      var child = parent.$new(true);

      child.$evalAsync(function(scope) {
        scope.didEvalAsync = true;
      });

      setTimeout(function() {
        expect(child.didEvalAsync).toBe(true);
        done();
      }, 100);
    });

    xit('9.20. executes $applyAsync functions on isolated scopes', function() {
      var parent = new Scope();
      var child = parent.$new(true);
      var applied = false;

      parent.$applyAsync(function() {
        applied = true;
      });
      child.$digest();

      expect(applied).toBe(true);
    });

    xit('9.21. executes $$postDigest functions on isolated scopes', function() {
      var parent = new Scope();
      var child = parent.$new(true);

      child.$$postDigest(function() {
        child.didPostDigest = true;
      });
      parent.$digest();

      expect(child.didPostDigest).toBe(true);
    });

    xit('9.22. can take some other scope as the parent', function() {
      var prototypeParent = new Scope();
      var hierarchyParent = new Scope();
      var child = prototypeParent.$new(false, hierarchyParent);

      prototypeParent.a = 42;
      expect(child.a).toBe(42);

      child.counter = 0;
      child.$watch(function(scope) { 
        scope.counter++;
      });

      prototypeParent.$digest();
      expect(child.counter).toBe(0);

      hierarchyParent.$digest();
      expect(child.counter).toBe(2);
    });

    xit('9.23. is no longer digested when $destroy has been called', function() {
      var parent = new Scope();
      var child = parent.$new();

      child.aValue = [1, 2, 3];
      child.counter = 0;
      child.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        },
        true
      );

      parent.$digest();
      expect(child.counter).toBe(1);

      child.aValue.push(4);
      parent.$digest();
      expect(child.counter).toBe(2);

      child.$destroy();
      child.aValue.push(5);
      parent.$digest();
      expect(child.counter).toBe(2);
    });

  });
}); // end of describe scope