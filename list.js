/* Set up the list of intertextual gestures. */
dispatch.on("dataLoaded.list",function(allData){
  var gestures = allData.gestures,
      list = d3.select("#column-right")
        .select(".list")
        .selectAll(".collection"),
      listItems = list.data(gestures).enter()
        .append('li')
          .classed("collection selectable", true)
          .text(d => d.plaintext);
  
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
      listItems = d3.selectAll(".collection");
  /* When the event has been triggered by the scatterplot, make sure that the 
    matching list item is visible on the page. */
  if ( i === 1 ) {
    targetItem = listItems.filter(k => k.id === d.id).node();
    targetItem.scrollIntoView({block: 'center'});
  }
  listItems
      .transition()
      .duration(100)
      .style("opacity", function(e){
        return d.id === e.id ? null : 0.2;
      });
});

/* On a "highlightgenre" event, hide any list items which do not map to the 
  currently-selected source genre. */
dispatch.on("highlightgenre.list", function(d, i) {
  d3.selectAll(".collection")
    .transition()
    .duration(100)
    .style("display", function(e) {
      var isRelevant = e['sources'].some(src => src.genreBroad === d.key);
      return isRelevant ? 'list-item' : 'none';
    });
    // .style("opacity",function(e){
    //   if((e.isTop == 1) && (e.mainGenre == d.key)){
    //     return 1;
    //   }
    //   else{ return 0.2; }
    // });
});

/* On a "highlighttype" event, hide any list items which do not map to the 
  currently-selected type of intertextual gesture. */
dispatch.on("highlighttype.list", function(d, i) {
  d3.selectAll(".collection")
    .transition()
    .duration(100)
    .style("display", function(e) {
      var isRelevant = e['type'].some(type => type === d.key);
      return isRelevant ? 'list-item' : 'none';
    });
    // .style("opacity",function(e){
    //   if((e.isTop == 1) && (idSet.has(e.filename))){
    //     return 1;
    //   }
    //   else{ return 0.2; }
    // });
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
