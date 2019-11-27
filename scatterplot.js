var svgL,
    m = { t:5, r:10, b:10, l:10 },
    colContainer = document.querySelector("#column-left > .col-content"),
    wL = colContainer.clientWidth/* - m.l - m.r*/,
    hL = colContainer.clientHeight/* - m.t - m.b*/;

svgL = d3.select("#column-left > .col-content")
  .append("svg")
    .attr("width", wL)
    .attr("height", hL)
  .append("g")
    .attr("class","plot")
    .attr("height", hL)
    .attr("transform","translate("+ m.l +","+ m.t +")");

// scale for scatterplot
var genreValues = [ 'philosophy', 'religious-writings', 'literature', 'life-writings', 'nonfiction', 'reviews' ],
    genreRange = [];
genreValues.forEach( function(label, index) {
  var col = 40 + ((wL-30) * (index / genreValues.length));
  genreRange.push(col);
});

var scaleX = d3.scaleOrdinal()
      .domain(genreValues)
      .range(genreRange),
    scaleY = d3.scaleTime()
      .domain([ new Date(1804,0,1), new Date(1858,0,1) ])
      .range([ hL-40, 40 ]);

// domain for scatterplot
var axisY = d3.axisLeft()
    .scale(scaleY)
    .ticks(d3.timeYear.every(10))
    .tickFormat(d3.timeFormat("%Y"))
    .tickSize(0);
var axisX = d3.axisTop()
    .scale(scaleX)
    .tickValues(genreValues)
    .tickSize(0);

svgL.append("g")
    .attr("id","axis-y")
    .classed('axis axis-left axisColor', true)
    .attr('transform', 'translate(20,0)')
    .attr("fill","#292826")
    .call(axisY);
svgL.append("g")
    .attr("id","axis-x")
    .attr("transform", "translate(10,20)")
    .classed('axis axis-small axis-top', true)
    .call(axisX)
  .selectAll('text')
    .style('transform', 'rotate(-30deg)');
svgL.selectAll('.domain').remove();


dispatch.on("dataLoaded.scatterplot",function(allData){
  var bibliography = allData.bibliography,
      folders = allData.folders,
      genres = allData.genres,
      gestures = allData.gestures;

  // force-layout
  var forceX = d3.forceX()
    .x( function(d) { 
      /*console.log(d);*/ 
      return scaleX(d.genre)/* + 10*/; 
    });
  var forceY = d3.forceY()
    .y( function(d) { return scaleY(d.date); });
  var simulation = d3.forceSimulation()
    .force("collide", d3.forceCollide(4))
    .force("forceX", forceX )
    .force("forceY", forceY );
  simulation.first = 0;

  // create circles for metadata
  var dotEnter,
      dotData = [],
      dot = svgL.selectAll(".dots");
   gestures.forEach( function(d) {
     var folderDate = folders[d.folder].date;
      folderDate = new Date(folderDate, 0, 1);
      d.sources.forEach( function(src) {
        var dotObj = {
          'gesture': d,
          'date': folderDate,
          'genre': src['genreBroad']
        };
        if ( dotObj.genre ) {
          dotData.push(dotObj);
        } else {
          console.warn('Skipping '+src.id);
        }
      });
   });
   
   dot = dot.data(dotData);
   dot.exit().remove();
   
   dotEnter = dot.enter()
    .append("circle")
      .attr("class","dots")
      .attr("cx", function(d) { 
        d.x = scaleX(d.genre) + 4;
        return d.x;
      })
      .attr("cy", function(d) { 
        d.y = scaleY(d.date);
        return d.y;
      });
    
    dot = dot.merge(dotEnter)
      .attr("r", 2.5)
      .style("fill", getGenreColor)
      .style("stroke", getGenreColor)
      .style("stroke-width", "1px")
      .style("opacity", 0.8);
    
    simulation.on("tick", function() {
      dot.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    })
    .nodes(dotData);

  // interactions
  dot.on("mouseenter", function(d){
        var i = 1;
        dispatch.call("highlight", this, d.gesture, i);
      })
      .on("mouseout",function(d){
         dispatch.call("unhighlight", null);
      });
});

dispatch.on("highlight.scatterplot", function(gestureDatum){
  var lDots = svgL.selectAll(".dots");
  
  lDots
    .filter( function(d){ 
      return gestureDatum.id !== d.gesture.id; })
    .transition()
    .duration(100)
    .style("opacity", 0.4);
  lDots
    .transition()
    .duration(100)
    .style("opacity", 0.2);
  lDots
    .filter( function(d){ 
      return gestureDatum.id == d.gesture.id; })
    .transition()
    .duration(100)
    .style("stroke", getGenreColor)
    .style("stroke-width", "1px")
    .style("opacity", 1);
});

dispatch.on("highlightmeta.scatterplot",function(d){
  svgL.selectAll(".dots")
    .filter( function(e){ return e.mainGenre == d.key; })
    .transition()
    .duration(100)
    // .style("fill","black")
    .style("stroke", getGenreColor)
    .style("stroke-width", "1px")
    .style("opacity", 1);
  svgL.selectAll(".dots")
    .filter( function(e){ return e.mainGenre !== d.key; })
    .transition()
    .duration(100)
    .style("opacity", 0.4);
  svgL.selectAll(".legend")
    .transition()
    .duration(100)
    .style("opacity", 0.2);
});

dispatch.on("highlightelem.scatterplot",function(d){
  var idSet = new Set();
  elemTopData.forEach( function(e){
    if (d.key == e.element) { idSet.add(e.filename); }
  });
  svgL.selectAll(".dots")
    .filter( function(e){ return (e.isTop == 1) && (idSet.has(e.filename)); })
    .transition()
    .duration(100)
    .style("stroke", getGenreColor)
    .style("stroke-width","1px")
    .style("opacity", 1);
  svgL.selectAll(".dots")
    .filter( function(e){ return !(idSet.has(e.filename)); })
    .transition()
    .duration(100)
    .style("opacity", 0.4);
  svgL.selectAll(".legend")
    .transition()
    .duration(100)
    .style("opacity", 0.2);
});

dispatch.on("unhighlight.scatterplot", function(){
  svgL.selectAll(".dots")
    .transition()
    .duration(100)
    .style("fill", getGenreColor)
    .style("stroke", getGenreColor)
    .style("stroke-width", "1px")
    .style("opacity", 0.8);
  svgL.selectAll(".legend")
    .transition()
    .duration(100)
    .style("opacity", 0.6);
});
