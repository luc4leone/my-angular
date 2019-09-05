/* 
Solution sketch

function(.src/scope.js){
  return .src/scope.parsed.js
}

or

function(.src/scope.js){
  return .src/scope.parsed.js
}

*/

// Requiring fs module in which 
// writeFile function is defined. 
const fs = require('fs') 

var scope = fs.readFile(
  'src/scope.js', 
  (err, data) => { 
    if (err) throw err; 

    fs.writeFile('src/_parsed.js', data, (err) => { 
      // In case of a error throw err. 
      if (err) throw err; 
    });



    
  }); 

// Data which will write in a file. 
let data = "function(){ return 'nothing'}"

// Write data in 'Output.txt' . 
fs.writeFile('src/_parsed.js', scope, (err) => { 
    // In case of a error throw err. 
    if (err) throw err; 
}) 