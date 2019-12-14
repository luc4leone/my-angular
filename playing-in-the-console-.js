// function definition: passo par
function logName(name) {
  return name
}
undefined
// function call: passo arg, un value
logName('lica')
"lica"
// posso passare una function call == value
logName(logName('lica'))
"lica"
// passo una function definition
logName(function() {return 'lica'})
ƒ (){return 'lica'} // mi rida la function definition
// ridefinisco logName
function logName(name) {
  return name()
}
undefined
// ora mi da il returned value della funzione che ho passato
logName(function() {return 'lica'})
"lica"
function logName(name) {
  return name
}
undefined
var luca = 'lica'
undefined
// solo per verificare che il value può essere una var
logName(luca)
"lica"
function logName(name) {
  return name()
}
undefined
function sayName() {return 'lica'}
undefined
logName(sayName)
"lica"


/*
  All these concepts mixed together builds up the complexity
    inheritance
    this
    recursion
    every
    passing fn to fn

Recursion
gordon observations:
1. if you are reading code you need to identify the recursive case and the base case
2. the recursive case needs to get closer to the base case at each call
3. note that you must have at least 1, but can have more than 1 base case 
(see gordon chain ex)
*/

function chainIsGood(link) {
  // base case
  // check is link cracked
  if (link.cracked) {
    return false;
  }
  
  // recursive case
  // process next link
  if (link.next) {
    return chainIsGood(link.next);
    
  // base case
  // if we reach the end we are good
  } else {
    return true;
  }
}


// to help us shape our code, gordon's use comments. the mindset when writing these comments is: if I were describing the process to a person that don't know how to program, what are the things I would say, the directions I would tell for him to get the work done

// beginning code
function logEachChildElement(el) {
  // 1. log the current element
  console.log(el);
  
  // 2. if there are no child elements then stops
  
  // 3. if there are child elements than repeat these same steps for each child  element
  
}

// 
function logEachChildElement(el) {
  // 1. log the current element
  console.log(el);
  
  // 2. if there are no child elements then stops
  if (el.children.length === 0) {
    return;
  }
  
  // 3. if there are child elements than repeat these same steps for each child  element
  if (el.children.length > 0) {
    for (var i = 0; i < el.children.length; i++) {
      logEachChildElement(el.children[i]);
    }
  }
}



