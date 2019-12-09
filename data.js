
// Get the modal
var modal = document.getElementById('myModal');
// Get the button that opens the modal
var btn = document.getElementById("myBtn");
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

var dispatch = d3.dispatch("dataLoaded",
  "highlight", "highlightgenre", "highlighttype", "unhighlight");

var meta;

drawNetwork();

function drawNetwork() {
  d3.json('intertextual-gestures-mme.json').then( function(data) {
    /* Create Map of distinct genre values with the bibliography IDs and MME 
       gestures to which they map. */
    var totalExcerpts = 0,
        genreGrp = new Map(),
        qTypes = new Map();
    
    meta = data;
    meta['gestures'].forEach( function(gesture) {
      var types = gesture.type;
      types.forEach( function(typeStr) {
        var qTypeEntry = qTypes.get(typeStr) || [];
        qTypeEntry.push(gesture);
        qTypes.set(typeStr, qTypeEntry);
      });
      gesture.id = totalExcerpts;
      totalExcerpts++;
    });
    meta['bibliography'].forEach( function(entry) {
      var gestures, filteredITGs,
          id = entry['id'],
          mainGenre = entry['genreBroad'],
      mainGenre = mainGenre === null ? 'unknown' : mainGenre;
      // Retrieve only the IT gestures matching the current entry's ID. 
      gestures = genreGrp.get(mainGenre) || [];
      filteredITGs = meta['gestures'].filter( function(gesture) {
        var matches = gesture['sources'].some(src => src.id === id);
        // Handle multiple ITG types.
        if ( matches && gesture['type'].length > 1 ) {
          for (var i = 1; i < gesture['type'].length; i++) {
            gestures.push(gesture);
          }
        }
        return matches;
      });
      gestures = gestures.concat(filteredITGs);
      // Map null genres to "unknown"
      genreGrp.set(mainGenre, gestures);
    });
    meta['genres'] = genreGrp;
    meta['types'] = qTypes;
    console.log(meta);
    
    dispatch.call("dataLoaded", null, meta);
  });
};

function allowMouseover() {
  var selection = d3.select('.selected.clicked'),
      userAllowed = d3.select('#mouseover-control').property('checked');
  return userAllowed && selection.empty();
};
