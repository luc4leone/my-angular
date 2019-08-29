'use strict';

var Scope = require('../src/scope.js'); // vedi module.exports statement in scope.js

describe('Scope', function() {
  // questo è il test
  it('can be constructed and used as an object', function() {
    var scope = new Scope();
    scope.aProperty = 1; // assegno una proprietà allo scope

    expect(scope.aProperty).toBe(1);
  });

  // quindi posso fare nesting di describes
  describe('digest', function() {
    var scope;

    // Jasmine method that takes an optional cb "that contains the code to setup your specs"
    // Initializing the scope, so we don't have to do it for each test
    beforeEach(function() {
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
      // (?) counter is just for testing if the listener is called correctly (?)
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

    it('calls listener when watch value is first undefined', function() {
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    }

    );
  });
});