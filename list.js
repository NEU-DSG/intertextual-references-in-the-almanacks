/* Set up the list of intertextual gestures. */
dispatch.on("dataLoaded.list", function(allData){
  var gestures = allData.gestures,
      showMetadata = function(selection) {
        selection.append('dt')
            .classed('gloss', true)
            .text( function(d) {
              var folder = meta['folders'][d.folder];
              return folder['title'] + ', ' + folder['date'];
            });
        selection.append('dt')
            .classed('term', true)
            .text('Reference to:');
        selection.selectAll('dl')
          .data(d => d.sources)
          .enter().append('dd')
            .classed('gloss', true)
            .text( function(src) {
              var bibYear,
                  str = src.id,
                  cert = src.cert === 'high' ? '' : ' ('+src.cert+' certainty)',
                  bibEntry = meta['bibliography'].filter(
                    entry => entry.id === src.id )[0];
              if ( bibEntry !== undefined ) {
                console.log(cert);
                bibYear = bibEntry['year'];
                bibYear = bibYear !== null ? ', '+bibYear : '';
                str = bibEntry['titleDisplay'] + bibYear + cert;
              }
              return str;
            });
      },
      list = d3.select("#column-right")
        .select(".list")
        .selectAll(".collection"),
      listItems = list.data(gestures).enter()
        .append('li')
          .classed("collection selectable", true)
          .text(d => d.plaintext)
        .append('dl')
          .classed("item-meta", true)
          .call(showMetadata);
  
  /* Define mouseover behaviors. Mousing over a list item will trigger a "highlight" 
    event, during which relevant scatterplot dots and network graph paths will be 
    foregrounded. */
  d3.selectAll(".collection")
    .on("mouseenter", function(d) {
      if ( allowMouseover() ) {
        var i = 0; // Indicate that the list triggered the "highlight" event.
        dispatch.call("highlight", null, d, i);
      }
    })
    .on("mouseleave", function(d) {
      if ( allowMouseover() ) {
        dispatch.call("unhighlight", null);
      }
    })
    .on('click', function(d) {
      d3.event.stopPropagation();
      var el = d3.select(this),
          alreadyClicked = el.classed('selected');
      if ( alreadyClicked || !allowMouseover() ) {
        dispatch.call("unhighlight", null);
      }
      if ( !alreadyClicked ) {
        var i = 0; // Indicate that the list triggered the "highlight" event.
        el.classed("selected clicked", true);
        dispatch.call("highlight", null, d, i);
      }
    });
    /*.on("click",function(d){
      window.open(d.url);
    })*/
});

/* During a "highlight" event, reduce opacity of all list items which do not match 
  the target intertextual gesture. */
dispatch.on("highlight.list", function(d, i){
  var targetItem,
      list = document.getElementById("list"),
      listItems = d3.selectAll(".collection"),
      selected = listItems.filter('.selected.clicked');
  listItems
      .transition()
      //.duration(100)
      .style("opacity", function(e){
        return d.id === e.id ? null : 0.2;
      })
    /* Attempt to move the first relevant list item into view. */
    .filter( function(k) {
      var bool = false;
      if ( i === 1 ) {
        bool = k.id === d.id;
      } else if ( i === 0 ) {
        bool = d3.select(this).classed('selected');
      }
      return bool;
    })
      .on('end', function() {
        this.scrollIntoView({ block: 'center' });
      })
  if ( i !== 1 && i !== 0 ) {
    list.scrollTo(0, list.scrollTop);
  }
});

/* On a "highlightgenre" event, hide any list items which do not map to the 
  currently-selected source genre. */
dispatch.on("highlightgenre.list", function(d, i) {
  var checkRelevancy = function(datum) {
    return datum['sources'].some( function(src) {
      var useGenre = src.genreBroad === null ? 'unknown' : src.genreBroad;
      return useGenre === d.key;
    });
  };
  d3.selectAll(".collection")
      .transition()
      .duration(100)
      .style("display", function(e) {
        var isRelevant = checkRelevancy(e);
        return isRelevant ? 'list-item' : 'none';
      })
    .filter(checkRelevancy)
      .style('opacity', 1);
});

/* On a "highlighttype" event, hide any list items which do not map to the 
  currently-selected type of intertextual gesture. */
dispatch.on("highlighttype.list", function(d, i) {
  var checkRelevancy = function(datum) {
    return datum['type'].some(type => type === d.key);
  };
  d3.selectAll(".collection")
      .transition()
      .duration(100)
      .style("display", function(e) {
        var isRelevant = checkRelevancy(e);
        return isRelevant ? 'list-item' : 'none';
      })
    .filter(checkRelevancy)
      .style("opacity", 1);
});

/* On an "unhighlight" event, retore all list items to full opacity. */
dispatch.on("unhighlight.list", function() {
  d3.selectAll(".collection")
      .classed("selected clicked", false)
      .transition()
      .duration(200)
      .style("display", "list-item")
      .style("opacity", 1);
});

// dispatch.on("filterlistmeta", function(d){
//   d3.selectAll(".collection")
//     .filter(function(e){ return e.mainGenre != d.key})
//     .transition()
//     .duration(200)
//     .style("display","none");
// });
