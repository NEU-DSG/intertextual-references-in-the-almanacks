
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
      var myGenres = [],
          sources = gesture.sources,
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
        // Once and once only, map this gesture to this genre.
        if ( !myGenres.includes(mainGenre) ) {
          // Make sure this genre exists before adding the gesture.
          if ( genreGestures === undefined ) {
            genreGestures = meta['genres']
                .set(mainGenre, [])
              .get(mainGenre);
          }
          genreGestures.push(gesture);
          myGenres.push(mainGenre);
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
