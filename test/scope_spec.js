'use strict';

var _ = require('lodash');
var Scope = require('../src/scope.js'); // vedi module.exports statement in scope.js

// I put 's' instead of 'S' because of it fn: "can be contructed..." 
// it's the obj, not the contructor
describe('scope', function() { 
  it('can be constructed and used as an object', function() {
    // create the scope
    var scope = new Scope();
    // add a property to the scope and initialize it to 1
    scope.aProperty = 1;

    // actual shoiuld be expected 1
    expect(scope.aProperty).toBe(1);
  });

  // nesting describe fn
  describe('digest', function() {
    var scope;

    // Jasmine method that takes an optional cb "that contains the code to setup your specs"
    // Initializing the scope, so we don't have to do it for each test
    beforeEach(function initScope() { // added name for the debugger
      scope = new Scope();
    });

    // 1. you can register a watcher using $watch
    // 2. the watcher’s listener function is invoked when someone calls $digest.
    it('calls the listener function of a watch on first $digest', function() {
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

    it('calls the watch function with the scope as the argument', function() {
      var watchFn = jasmine.createSpy();
      var listenerFn = function() {};
      scope.$watch(watchFn, listenerFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalledWith(scope);
    });

    it('calls the listener function when the watched value changes', function() {
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

    it('calls listener when watch value is first undefined', function() {
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('calls listener with new value as old value the first time', function() {
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

    it('may have watchers that omit the listener function', function() {
      var watchFn = jasmine.createSpy().and.returnValue('something');
      // calling $watch without passing in a listener
      scope.$watch(watchFn);

      // this call should trigger the call of the listener, but it's not there
      // so the code throws an exception
      scope.$digest();

      expect(watchFn).toHaveBeenCalled();
    });

    it('triggers chained watchers in the same digest', function() {
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

    it('gives up on the watches after 10 iterations', function() {
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
    it('ends the digest when the current watch that is clean is also the last dirty watch', function() {
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

    it('does not end digest so that new watches are not run', function() {
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

    it('compares based on value if enabled', function() {
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

      scope.aValue.push(4);
      scope.$digest();
      expect(scope.counter).toBe(2);
    });


  });
});