# My approach to reading the book

At first I've approached the book, implementing the code, section by section, following the author TDD style. Didn't work too well for me: without an idea, a proto of each functionality, TDD single building steps often made no sense to me. So I changed my approach.

## Step 1

- Read the section without spending time on the details
- The goal of this step is a general understanding of what the functionality should do
- The output of this step is to write something similar to an MDN method description
  - method arguments description
  - returned value
  - code examples that I will then run in Step 3

For instance, if the section would want to implement `copyWithin`, I'd like to come up with:

### Array.prototype.copyWithin

#### GENERIC DESCRIPTION

- `copyWithin()` copies part of an array to another location in the same array and returns it, without modifying its size.

#### ARGUMENTS

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

#### RETURN VALUE

- The modified array.

#### REQUIREMENTS

- The sequence is copied and pasted as one operation
- pasted sequence will have the copied values even when the copy and paste region overlap.
- The `copyWithin` function is intentionally generic, it does not require that its this value be an Array object.
- The copyWithin method is a mutable method. It does not alter the length of this, but will change its content and create new properties if necessary.

## Step 2: Copy & paste the end-of-the-chapter code

Not the tests code, but the implementation code. The goal is to run my examples of Step 1 and play with the code (Step 3).

## Step 3: Play with the API method

Running my examples, playing with the code. My goal is to understand. No step by step debugger. Changing inputs, observing the outputs. Checking expectations.

## Step 4: Thinking about how to implement the functionality

Now that I understand the functionality, before reading the test-driven implementation details in the book, I should think about how I would implement it.

## Step 5: Build the method with TTD following the book steps

If I wrote by myself the implementation code, that compare & contrast with the book implementation.

Otherwise write the code following the book instructions, 1 test at a time, TDD style. (This is the right time for stepping through the code in the debugger).
