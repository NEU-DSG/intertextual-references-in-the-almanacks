
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
    meta['genres'] = new Map();
    meta['gestures'].forEach( function(gesture) {
      var sources = gesture.sources,
          types = gesture.type;
      // Build out map of reference types.
      types.forEach( function(typeStr) {
        var qTypeEntry = qTypes.get(typeStr) || [];
        qTypeEntry.push(gesture);
        qTypes.set(typeStr, qTypeEntry);
      });
      // Build out map of broad genres.
      sources.forEach( function(src) {
        var genreGestures,
            mainGenre = src['genreBroad'];
        mainGenre = mainGenre === null ? 'unknown' : mainGenre;
        genreGestures = meta['genres'].get(mainGenre);
        if ( genreGestures === undefined ) {
          genreGestures = meta['genres']
              .set(mainGenre, [])
            .get(mainGenre);
        }
        for (var i = 0; i < types.length; i++) {
          genreGestures.push(gesture);
        }
      });
      gesture.id = totalExcerpts;
      totalExcerpts++;
    });
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
