
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
  "highlight","highlightmeta","highlightelem","unhighlight");

var name = "persName";
//document.getElementById("element").innerHTML = "Person Names";
var redraws = 0;

var meta;

drawNetwork();

function drawNetwork(){

  d3.json('intertextual-gestures-mme.json').then( function(data) {
    meta = data;
    //console.log(meta);
    
    /* Create Map of distinct genre values with the bibliography IDs and MME 
       gestures to which they map. */
    var totalExcerpts = 0,
        genreGrp = new Map(),
        qTypes = new Map();
    meta['bibliography'].forEach( function(entry) {
      var id = entry['id'],
          mainGenre = entry['genreBroad'],
          gestures = genreGrp.get(mainGenre) || [];
      // Retrieve only the IT gestures matching the current entry's ID. 
      gestures = gestures.concat(meta['gestures'].filter(gesture => gesture['sources'].some(src => src.id === id)));
      genreGrp.set(mainGenre, gestures);
    });
    /*  */
    meta['gestures'].forEach( function(gesture) {
      var types = gesture.type;
      types.forEach( function(typeStr) {
        var qTypeEntry = qTypes.get(typeStr) || [];
        qTypeEntry.push(gesture);
        qTypes.set(typeStr, qTypeEntry);
      });
      totalExcerpts++;
    });
    meta['genres'] = genreGrp;
    meta['types'] = qTypes;
    console.log(meta);
    //console.log(totalExcerpts);
    
    /*var colorScaleGenres = d3.scaleOrdinal()
        .domain(['philosophy', 'religious-writings', 'literature', 'life-writings', 'nonfiction', 'reviews']);*/
    
    dispatch.call("dataLoaded", null, meta);
    
    
    function dataTransform(meta, elem){
      // create array of distinct in-text element values
      var elemDist = d3.nest()
          .key( function(d) { return d.element; })
          .rollup( function(d) { return d.length; })
          .entries(elem);

      elemDist.sort(function(a,b){
          return b["value"]-a["value"];
        });

      // take top 20 distinct in-text element values
      var elemDistTop = elemDist.slice(0,20);

      // filter element data to match elements in elemDistTop
      var elemTop = elem.filter(function(d){
        var i = 0;
        elemDistTop.forEach(function(a){
          if(a.key == d.element){
            i = 1;
          }
        });
        return i == 1;
      });

      // elemTop.sort(function(a,b){
      //   return d3.ascending(a.mainGenre, b.mainGenre);
      // });

      elemTop.sort(function(a,b){
        return b["pubDate"]-a["pubDate"];
      });

      elemTop.sort(function(a,b){
        return d3.ascending(a.element, b.element);
      });

      // filter metadata to match texts in elemTop
      meta.forEach(function(d){
        d.isTop = 0;
        elemTop.forEach(function(a){
          if(a.filename == d.filename){
            d.isTop = 1;
          }
        });

        if (d.isTop != 1) {
          d.isTop = 0;
        }
      });

      var metaTop = meta.filter(function(d){
        return d.isTop == 1;
      });

      metaTop.sort(function(a,b){
        if (a.title < b.title){
          return -1;
        }
        else if (a.title > b.title){
          return 1;
        }
        else{ return 0; }
      });

      // var metaTop = meta.filter(function(d){
      //   var i = 0;
      //   elemTop.forEach(function(a){
      //     if(a.filename == d.filename){
      //       i = 1;
      //     }
      //   });
      //   return i == 1;
      // });

      // create array of distinct genre values
      var metaTopGenre = d3.nest()
        .key(function(d){ return d.mainGenre })
        .rollup(function(d){return d.length})
        .entries(metaTop);

      metaTopGenre.sort(function(a,b){
        return d3.ascending(a.key, b.key);
      })

      // create objects connecting positions of element and genre text to link data
      var elemDistObj = {};
      var metaObj = {};
      elemDistTop.forEach(function(a){
        elemDistObj[a.key] = a
      });

      metaTopGenre.forEach(function(a){
        metaObj[a.key] = a
      });

      elemTop.forEach(function(i){
        i.sourceData = metaObj[i.mainGenre];
        i.targetData = elemDistObj[i.element];
      });

      return {
        meta: meta,
        metaTop: metaTop,
        metaTopGenre: metaTopGenre,
        elemTop: elemTop,
        elemDistTop: elemDistTop
      }
    };

    /*async function waitForDataTransform(){
      var allData = await dataTransform(meta['genres'], meta['gestures']);
      dispatch.call("dataLoaded", null, allData);
    };

    waitForDataTransform();*/
  });
  
};
