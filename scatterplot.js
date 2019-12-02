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
    .attr("class", "plot")
    .attr("height", hL)
    .attr("transform", "translate("+ m.l +","+ m.t +")");

// scale for scatterplot
var genreValues = [ 'philosophy', 'religious-writings', 'literature', 'life-writings', 'nonfiction', 'reviews' ],
    genreRange = [];
genreValues.forEach( function(label, index) {
  var col = 45 + ((wL-30) * (index / genreValues.length));
  genreRange.push(col);
});

var scaleX = d3.scaleOrdinal()
      .domain(genreValues)
      .range(genreRange),
    scaleY = d3.scaleTime()
      /* The date range is actually 1804 to 1858; here, rounded to the nearest 
        multiple of 10. */
      .domain([ new Date(1800,0,1), new Date(1860,0,1) ])
      .range([ hL-20, 60 ]);

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
    .attr("id", "axis-y")
    .classed('axis axis-left axisColor', true)
    .attr('transform', 'translate(25,0)')
    .attr("fill","#292826")
    .call(axisY);
svgL.append("g")
    .attr("id","axis-x")
    .attr("transform", "translate(10,30)")
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
      .classed("dots selectable", true)
      .attr("cx", function(d) { 
        d.x = scaleX(d.genre) + 4;
        return d.x;
      })
      .attr("cy", function(d) { 
        d.y = scaleY(d.date);
        return d.y;
      });
    
    dot = dot.merge(dotEnter)
        .attr("r", 3)
        .style("fill", getGenreColor)
        .style("opacity", 0.8);
    
    simulation.on("tick", function() {
      dot.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    })
    .nodes(dotData);

  /* Define mouseover behaviors. Mousing over a circle on the scatterplot will 
    trigger a "highlight" event, during which relevant network graph paths and 
    intertextual gestures will be foregrounded. */
    dot.on("click", function(d) {
        d3.event.stopPropagation();
        var el = d3.select(this),
            alreadyClicked = el.classed('selected'),
            i = 1; // Indicate that the scatterplot triggered the "highlight" event.
        if ( alreadyClicked || !allowMouseover() ) {
          dispatch.call("unhighlight", null);
        }
        if ( !alreadyClicked ) {
          el.classed("selected clicked", true);
          dispatch.call("highlight", this, d.gesture, i);
          //console.log(this);
        }
      })
      .on("mouseenter", function(d) {
        var el = d3.select(this),
            i = 1; // Indicate that the scatterplot triggered the "highlight" event.
        if ( allowMouseover() ) {
          d3.select(this).classed('selected', true);
          dispatch.call("highlight", this, d.gesture, i);
        }
      })
      .on("mouseout", function(d) {
        var el = d3.select(this);
        if ( allowMouseover() ) {
          //console.log('mouseout');
          el.classed('selected', false);
          dispatch.call("unhighlight", null);
        }
      });
});


/* During a "highlight" event, reduce opacity of any circles which do not match the 
  currently-selected datum. */
var highlightScatterplot = function(key, isRelevantFn) {
  svgL.selectAll(".dots")
      .transition()
      .duration(100)
      .style("fill", getGenreColor)
      .style("opacity", function(e) {
        return isRelevantFn(e, key) ? 1 : 0.25;
      });
};

dispatch.on("highlight.scatterplot", function(d) {
  highlightScatterplot(d.id, function(g, key) {
    return g.gesture.id === key;
  });
});
dispatch.on("highlightgenre.scatterplot", function(d) {
  highlightScatterplot(d.key, function(g, key) {
    return g.genre === key;
  });
});
dispatch.on("highlighttype.scatterplot", function(d) {
  highlightScatterplot(d.key, function(g, key) {
    return g.gesture['type'].some(type => type === key);
  });
});

/* On an "unhighlight" event, restore the color and opacity of the scatterplot dots. */
dispatch.on("unhighlight.scatterplot", function(){
  svgL.selectAll(".dots")
      .classed("selected clicked", false)
      .transition()
      .duration(100)
      .style("fill", getGenreColor)
      .style("opacity", 0.8);
  svgL.selectAll(".legend")
      .transition()
      .duration(100)
      .style("opacity", 0.6);
});
