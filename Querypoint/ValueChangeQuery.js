// Google BSD license http://code.google.com/google_bsd_license.html
// Copyright 2012 Google Inc. johnjbarton@google.com

(function(){

window.Querypoint = window.Querypoint || {};

function protect(expr) {
    return "eval(" + expr + ")"; // unwrapped by Querypoints
}

function unprotect(str) {
    return str.replace(/:\"eval\(([^\)]*)\)\"/,":$1");
}

var getTreeNameForType = traceur.syntax.trees.getTreeNameForType;

function getValueReferenceIdentifier(tree) {
  switch(tree.type) {
    case "MEMBER_EXPRESSION": return tree.memberName;
  }
}

Querypoint.ValueChangeQuery = function(identifier, tree) {
  Querypoint.Query.call(this);
  this.identifier = identifier; 
  this.tree = tree;
}
  
Querypoint.ValueChangeQuery.ifAvailableFor = function(tree) {
  var identifier = getValueReferenceIdentifier(tree);
  if (identifier) {
    var query = Querypoint.ValueChangeQuery.prototype.getQueryOnTree(tree, Querypoint.ValueChangeQuery);
    return query || new Querypoint.ValueChangeQuery(identifier, tree);
  }
},


Querypoint.ValueChangeQuery.prototype = {
  __proto__: Querypoint.Query.prototype,

  buttonName: function() {
    console.log("ValueChangeQuery buttonName called")
    return 'lastChange';
  },
  
  toolTip: function() {
    return "Trace the changes to the current expression and report the last one";
  },
  
  activate: function() {
    this._transformer = new Querypoint.ValueChangeQueryTransformer(this.identifier);
  },

  tracePrompt: function() {
    return "(no changes)";
  }, 
  
  // Add tracing code to the parse tree. Record the traces onto __qp.propertyChanges.<identifier>
  // 
  transformParseTree: function(tree) {
    return this._transformer.transformAny(tree);
  },

  runtimeSource: function() {
    var tree = this._transformer.runtimeInitializationStatements();
    return traceur.outputgeneration.TreeWriter.write(tree);
  },

  // Pull trace results out of the page for this querypoint
  extractTracepoints: function(rootTree, onTracepoint) {
    function onEval(result, isException) {
       if (!isException) {       
        onTracepoint(result)
      }
    }
    chrome.devtools.inspectedWindow.eval('window.__qp.extractTracepoint("propertyChanges","prop")', onEval);
  },
};


}());