var sayHello = require('../src/hello');
describe('Hello', function() {
  it('say hello', function() {
    expect(sayHello('Jane')).toBe('Hello, Jane!');
  });
});