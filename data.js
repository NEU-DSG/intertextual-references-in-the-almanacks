
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
      var id = entry['id'],
          mainGenre = entry['genreBroad'],
          gestures = genreGrp.get(mainGenre) || [];
      // Retrieve only the IT gestures matching the current entry's ID. 
      gestures = gestures.concat(meta['gestures'].filter(
        gesture => gesture['sources'].some(src => src.id === id)));
      genreGrp.set(mainGenre, gestures);
    });
    meta['genres'] = genreGrp;
    meta['types'] = qTypes;
    console.log(meta);
    
    dispatch.call("dataLoaded", null, meta);
    
  });
};

function allowMouseover() {
  var selection = d3.select('.selected.clicked');
  return selection.empty();
};
