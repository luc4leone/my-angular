# My approach to reading the book

At first I've approached the book, implementing the code, section by section, following the author TDD style. Didn't work too well for me: without an idea, a proto of each functionality, TDD single building steps often made no sense to me. So I changed my approach.

## General approach

### Step 1

- Read the section without spending time on the details
- The goal of this step is to get a general understanding of the functionality I'm going to implement
- The output of this step should be to write something similar to an MDN method description
  - method arguments description
  - returned value
  - code examples that I will then run in Step 3 (I can use the tests in the book as a starting point)

For instance, if the method I would want to implement is `copyWithin`, I'd like to come up with something similar to:

```js
Array.prototype.copyWithin

GENERIC DESCRIPTION

`copyWithin()` copies part of an array to another location in the same array and returns it, without modifying its size.

ARGUMENTS

- signature
  - `arr.copyWithin(target[, start[, end]])`

- target
  - Zero based index at which to copy the sequence to.
  - If negative, target will be counted from the end.
  - If target is at or greater than arr.length, nothing will be copied.
  - If target is positioned after start, the copied sequence will be trimmed to fit `arr.length`.

- start (Optional)
  - Zero based index at which to start copying elements from.
  - If negative, start will be counted from the end.
  - If start is omitted, `copyWithin()` will copy from the start (defaults to 0).

- end (Optional)
  - Zero based index at which to end copying elements from. `copyWithin` copies up to but not including end.
  - If negative, end will be counted from the end.
  - If end is omitted, `copyWithin()` will copy until the end (default to `arr.length`).

RETURN VALUE

- The modified array.

REQUIREMENTS

- The sequence is copied and pasted as one operation.
- pasted sequence will have the copied values even when the copy and paste region overlap.
- The `copyWithin` function is intentionally generic, it does not require that its this value be an Array object.
- The `copyWithin` method is a mutable method. It does not alter the length of this, but will change its content and create new properties if necessary.
```

### Step 2: Copy & paste the end-of-the-chapter code

- Not the tests, the implementation code.
- The goal is to run my examples of Step 1 and play with the code (Step 3).

### Step 3: Play with the API method

- Running my examples, playing with the code.
- The goal is to understand what's expected from the functionality.
- Changing inputs, observing the outputs. Checking expectations.
- No step by step into the debugger.

### Step 4: Thinking about how to implement the functionality

- Now that I understand the functionality, **before** reading the test-driven implementation details in the book I should think about how I would implement it.
- I should try to write the code to implement it.

### Step 5: Test-drive the method following the book steps

- If I was able to write by myself the implementation code, than compare & contrast with the book implementation.
- If I was **not** able to write by myself I'll copy the code following the book, 1 test at a time, TDD style (this is the right time for stepping through the code in the debugger).

## Special cases

### $$everyScope

This was a though one. `$$everyScope` is a recursive method. When the exectution flow gets messy, I try to improve my understanding by sketching a diagram on paper. It's a sort of *flowchart*.


