'use strict';

//var _ = require('lodash');
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

      // if I call digest again the listner should not be called if NO change occur to the vars
      scope.$digest();
      expect(scope.counter).toBe(1);

      // a change in someValue occurs. but the listener is not called, cause digest has not been called...
      scope.someValue = 'b';
      expect(scope.counter).toBe(1);

      // ...but if I call it, the listener is called
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    xit('calls listener when watch value is first undefined', function() {
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    xit('calls listener with new value as old value the first time', function() {
      scope.someValue = 123;
      var oldValueGiven;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { oldValueGiven = oldValue; }
      );

      scope.$digest();
      expect(oldValueGiven).toBe(123);
    });

    xit('may have watchers that omit the listener function', function() {
      var watchFn = jasmine.createSpy().and.returnValue('something');
      scope.$watch(watchFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalled();
    });

    xit('triggers chained watchers in the same digest', function() {
      scope.name = 'Jane';

      // let's add a watcher to scope. watching nameUpper
      scope.$setup_a_watcher( // var name change: $watch => $setup_a_watch
        function watch_nameUpper(scope) { return scope.nameUpper; }, // added name for the debugger
        function set_initial(newValue, oldValue, scope) { // added name for the debugger
          if (newValue) {
            scope.initial = newValue.substring(0, 1) + '.';
          }
        }
      );

      // let's add another watcher to scope. watching name
      scope.$setup_a_watcher( // var name change: $watch => $setup_a_watcher
        function watch_name(scope) { return scope.name; }, // added name for the debugger
        function set_nameUpper(newValue, oldValue, scope) { // added name for the debugger
          if (newValue) {
            scope.nameUpper = newValue.toUpperCase();
          }
        }
      );

      // let's check if the 2 watchers are dirty
      scope.$check_dirty_watcher(); // var name change: $digest => $check_dirty_watcher
      expect(scope.initial).toBe('J.');

      scope.name = 'Bob';
      scope.$check_dirty_watcher(); // var name change: $digest => $check_dirty_watcher
      expect(scope.initial).toBe('B.');
    });

    xit('gives up on the watches after 10 iterations', function() {
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$setup_a_watcher( // that checks for A but acts on B
        function(scope) { return scope.counterA; },
        function(newValue, oldValue, scope) { return scope.counterB++; }
        );
    
      scope.$setup_a_watcher( // that checks for B but acts on A
        function(scope) { return scope.counterB; },
        function(newValue, oldValue, scope) { return scope.counterA++; }
      );

      expect((function() { scope.$check_dirty_watcher(); })).toThrow();
    });

    xit('ends the digest when the last watch is clean', function() {
      scope.array = _.range(100); // https://lodash.com/docs/4.17.15#range
      var watchExecutions = 0; // counter that is incremented each time the watch is executed

      _.times(100, function(i) { // https://lodash.com/docs/4.17.15#times
        scope.$watch(
          function(scope) {
            watchExecutions++; // incrementing the "watch counter"
            return scope.array[i];
          },
          function(newValue, oldValue, scope) {
          }
        );
      });

      scope.$digest();
      expect(watchExecutions).toBe(200);

      scope.array[0] = 420;
      scope.$digest();
      expect(watchExecutions).toBe(301);  
    });

    xit('does not end digest so that new watches are not run', function() {
      scope.aValue = 'abc'; // set and initialize aValue field on scope
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; }, // watch for aValue
        function(newValue, oldValue, scope) {
          scope.$watch( // the listener for aValue setup another watch for a aValue
            function(scope) { return scope.aValue; },
            function(newValue, oldValue, scope) {
              scope.counter++; // so we are keeping track of the exection of the nested listener
            }
          );
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });


  });
});