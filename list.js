dispatch.on("dataLoaded.list",function(allData){
  var gestures = allData.gestures;

  list = d3.select("#column-right")
    .select(".list")
    .selectAll(".collection");
  listItems = list.data(gestures).enter()
    .append('li')
      .attr("class","collection")
      .text(d => d.plaintext);

  var i = 0;
  d3.selectAll(".collection")
    .on("mouseenter", function(d) {
      dispatch.call("highlight", null, d, i);
    })
    .on("mouseleave", function(d) {
      dispatch.call("unhighlight", null);
    });
    /*.on("click",function(d){
      window.open(d.url);
    })*/
});

dispatch.on("highlight.list", function(d, i){
  var targetItem,
      list = document.getElementById("list"),
      listItems = d3.selectAll(".collection");
  if ( i === 1 ) {
    targetItem = listItems.filter( function(k) {
      return k.id === d.id;
    }).node();
    targetItem.scrollIntoView({block: 'center'});
  }
  listItems
      .transition()
      .duration(100)
      .style("opacity", function(e){
        return d.id === e.id ? null : 0.2;
      });
});

dispatch.on("highlightmeta.list",function(d,i){
  d3.selectAll(".collection")
    .transition()
    .duration(100)
    .style("display",function(e){
      if ((e.isTop == 1) && (e.mainGenre == d.key)) {
        return "list-item";
      }
      else{ return "none"; }
    });
    // .style("opacity",function(e){
    //   if((e.isTop == 1) && (e.mainGenre == d.key)){
    //     return 1;
    //   }
    //   else{ return 0.2; }
    // });
});

dispatch.on("highlightelem.list",function(d,i){
  var idSet = new Set();
  elemTopData.forEach(function(e){
    if(d.key == e.element){ idSet.add(e.filename); }
  });
  d3.selectAll(".collection")
    .transition()
    .duration(100)
    .style("display",function(e){
      if((e.isTop == 1) && (idSet.has(e.filename))){
        return "list-item";
      }
      else{ return "none"; }
    });
    // .style("opacity",function(e){
    //   if((e.isTop == 1) && (idSet.has(e.filename))){
    //     return 1;
    //   }
    //   else{ return 0.2; }
    // });
});

dispatch.on("unhighlight.list", function(){
  // d3.selectAll("collection")
  //   .classed("selectedItem",false);
  d3.selectAll(".collection")
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
