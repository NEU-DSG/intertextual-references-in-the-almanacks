dispatch.on("dataLoaded.list",function(allData){
  var gestures = allData.gestures;

  list = d3.select("#column-right")
    .select(".list")
    .selectAll(".collection");
  listItems = list.data(gestures).enter()
    .append('li')
      .attr("class","collection")
      .text(d => d.plaintext);

  /*var i = 0;
  d3.selectAll(".collection")
    .on("mouseenter",function(d){
      dispatch.call("highlight", null, d, i);
        // d3.select(this)
        //   .style("font-weight","bold");
    })
    .on("mouseleave",function(d){
      dispatch.call("unhighlight", null, d);
    });*/
    /*.on("click",function(d){
      window.open(d.url);
    })*/

});

dispatch.on("highlight.list", function(d,i){

  d3.selectAll(".collection")
    .transition()
    .duration(100)
    .style("opacity",function(e){
      if(d.filename != e.filename){
        return 0.2;
      }
      // else{ console.log(d.title); }
    });

  if(i == 1){
    var list = document.getElementById("list"),
    targetli = document.getElementById(d.filename);
    list.scrollTop = targetli.offsetTop - 298; //298 is offsetTop for the first element
  }
});

dispatch.on("highlightmeta.list",function(d,i){
  d3.selectAll(".collection")
    .transition()
    .duration(100)
    .style("display",function(e){
      if((e.isTop == 1) && (e.mainGenre == d.key)){
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

dispatch.on("unhighlight.list", function(d){

  // d3.selectAll("collection")
  //   .classed("selectedItem",false);
  d3.selectAll(".collection")
    .transition()
    .duration(200)
    // .style("font-weight","normal")
    .style("display","list-item")
    .style("opacity",1);

});

// dispatch.on("filterlistmeta", function(d){
//   d3.selectAll(".collection")
//     .filter(function(e){ return e.mainGenre != d.key})
//     .transition()
//     .duration(200)
//     .style("display","none");
// });
