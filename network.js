var m = { t:5, r:10, b:10, l:-5 },
    colContainer = document.querySelector("#column-center > .col-content"),
    wC = colContainer.clientWidth/* - m.l - m.r*/,
    hC = colContainer.clientHeight/* - m.t - m.b*/;

var svgC = d3.select("#column-center > .col-content")
  .append("svg")
    .attr("width", wC)
    .attr("height", hC)
  .append('g')
    .attr('class','plot')
    .attr('transform','translate('+ m.l+','+ m.t +')');

var col1 = wC/5,
    col2 = (wC/5)*4,
    gapPx = 10,
    networkHeight = hC * 1,
    clicked = 0;
//console.log(networkHeight);

var curve = d3.line()
    .x( function(d) { return d.x; })
    .y( function(d) { return d.y; })
    .curve(d3.curveBundle.beta(0.85));

// color scale for curves
var getGenreColor = function(d) {
  var genreColors = {
        'philosophy':         '#C2185B',  // red
        'religious-writings': '#673AB7',  // purple
        'literature':         '#00ACC1',  // blue
        'life-writings':      '#43A047',  // green
        'nonfiction':         '#999999',  // gray
        'reviews':            '#FF7F00',  // orange
        'unknown':            '#000000'   // black
      },
      thisGenre = d.genre;
  return genreColors[thisGenre];
};


// function to make list of texts
function makePath(data) {
  var instancePrev,
      countInstance = 0,
      countTotal = 0;
  data.forEach( function(pathJoin, index) {
    var increment, y,
        genre = pathJoin.genreDatum,
        genreX = genre.x,
        gestureId = pathJoin.gesture.id,
        type = pathJoin.typeDatum,
        typeX = type.x,
        typeY = type.y;
    if ( countTotal === 0 ) { 
      console.log(genre);
      instancePrev = genre.key; }
    else if ( instancePrev !== genre.key ) { 
      console.log("Previous: "+instancePrev+" with "+countInstance
        +". New genre: "+genre.key);
      countInstance = 0;
      console.log(genre);
    }

    increment = (genre.yFree / genre.value.length) * countInstance;
    y = genre.y + increment;

    pathJoin.path = [
      { "x": genreX - 4, "y": y,
        'genre': genre.key,
        'gesture': gestureId,
        'type': type.key
      },
      { "x": genreX + (wC / 10), "y": y,
        'genre': genre.key,
        'gesture': gestureId,
        'type': type.key
      },
      { "x": typeX - (wC / 10), "y": typeY,
        'genre': genre.key,
        'gesture': gestureId,
        'type': type.key
      },
      { "x": typeX + 4, "y": typeY,
        'genre': genre.key,
        'gesture': gestureId,
        'type': type.key
      } ];
    countInstance++;
    countTotal++;
    instancePrev = genre.key;
  })
  console.log(countTotal);
  //console.log(data);
  return data;
};


dispatch.on("dataLoaded.network", function(allData){
  var genres = allData.genres,
      gestures = allData.gestures,
      genreList = [],
      typeMap = allData['types'],
      typeList = [],
      pathsList = [];
  
  for (var key of typeMap.keys()) {
    typeList.push({ 
      'key': key,
      'value': meta['types'].get(key)
    });
  }
  for (var key of genres.keys()) {
    var bibEntries = genres.get(key),
        bibGestures = [],
        targets = [],
        genreObj = {
          'key': key, 
          'value': bibEntries
        };
    typeList.forEach( function(type) {
      var matchesType = bibGestures.some( function(instance) {
        return instance['type'].includes(type['key']);
      });
      if ( matchesType ) { targets.push(type); }
    });
    genreList.push(genreObj);
    bibEntries.forEach( function(entry) {
      entry['type'].forEach( function(type) {
        var pathDatum = {
          'genreDatum': genreObj,
          'gesture': entry,
          'typeDatum': typeList.filter(typeObj => typeObj['key'] === type)[0]
        };
        pathsList.push(pathDatum);
      });
    });
  }
  console.log(pathsList);
  
  // Create labels for genres.
  var genreLabels,
      totalPaths = 0,
      ypos = 0,
      genreAxis = svgC.append('g')
          .classed('axis axis-left', true);
  // Add labels for each genre.
  genreLabels = genreAxis.selectAll('.label-plot')
      .data(genreList)
      .enter()
    .append('text')
      .classed('label-plot', true)
      .attr("fill", "#292826")
      .text( function(d) {
        var gestures = d.value,
            numPaths = 0;
        /* While we're looking at this datum, add to the running count of paths 
           corresponding to IT gestures (needed for label placement). */
        gestures.forEach( function(itg) {
          var numSrcs,
              useKey = d.key === 'unknown' ? null : d.key,
              numTypes = itg['type'].length;
          numSrcs = itg['sources'].filter( 
            src => src['genreBroad'] === useKey 
          ).length;
          numPaths += numSrcs * numTypes;
        });
        d.numPaths = numPaths;
        totalPaths +=numPaths;
        return d.key.replace(/[-_]/, " ");
      });
  // Position the genre labels along their axis. Include gaps in between ranges.
  var hCFree = networkHeight - ( (genreList.length - 1) * gapPx );
  //console.log(hCFree);
  genreLabels
      .attr("x", function(d) { 
        d.x = col1 + 4;
        return col1 - 4;
      })
      .attr("y", function(d, i) {
        var percentTotal, yPx, position,
            numPaths = 0;
        percentTotal = d.numPaths / totalPaths;
        // Place labels halfway within the datum's range.
        yPx = Math.floor( percentTotal * hCFree ) / 2;
        position = ypos + yPx;
        
        d.y = ypos;
        d.percent = percentTotal;
        d.yFree = Math.floor(percentTotal * hCFree);
        // Use the full range of this datum to determine where the next should start.
        ypos += d.yFree + gapPx;
        //console.log(ypos);
        return position;
      })
      .on('mouseover', function(d) {
        if ( allowMouseover() ) {
          dispatch.call('highlightgenre', this, d);
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
          el.classed("selected clicked", true);
          dispatch.call('highlightgenre', this, d);
        }
      });
  // Create border rectangles for genre?
  // Create labels for @type.
  var typeAxis, typeLabels, interval,
      totalTypes = 0;
  typeAxis = svgC.append('g')
      .classed('axis axis-right', true);
  typeLabels = typeAxis.selectAll('.label-plot')
      .data(typeList)
      .enter()
    .append('text')
      .classed('label-plot', true)
      .attr("fill", "#292826")
      .text( function(d) {
        totalTypes += d.value.length;
        return d.key.replace(/[-_]/, " ");
      });
  ypos = gapPx;
  hCFree = networkHeight - ( typeList.length * gapPx );
  interval = hCFree / typeList.length;
  console.log(interval);
  typeLabels
      .attr("x", function(d) { 
        d.x = col2 - 4;
        return col2 + 4;
      })
      .attr("y", function(d, i) {
        var numGestures = d.value.length,
            // Place labels at regular intervals along their axis.
            yPx = interval / 2,
            position = ypos + yPx;
        // Use the full range of this datum to determine where the next should start.
        ypos += interval + gapPx;
        d.y = position;
        return position;
      })
      .on('mouseover', function(d) {
        if ( allowMouseover() ) {
          dispatch.call('highlighttype', this, d);
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
          el.classed("selected clicked", true);
          dispatch.call('highlighttype', this, d);
        }
      });
  svgC.selectAll('.label-plot')
      .classed('selectable', true)
      .on('mouseout', function(d) {
        if ( allowMouseover() ) {
          dispatch.call('unhighlight', this, d);
        }
      });
  // Create curves joining genres to the types of quotes represented.
  console.log(pathsList);
  var linkLines = svgC.selectAll('.links')
      .data(makePath(pathsList))
      .enter()
    .append('g')
      .classed('links', true)
    .append('path')
      .classed('path-links', true)
      .datum(d => d.path)
      .attr('d', curve)
      .style('stroke', d => getGenreColor(d[0]))
});


/* On a "highlight" event, reduce the opacity of paths and labels which do not 
  correspond to the currently-selected datum. */
var highlightNetwork = function(key, isRelevantFn) {
  var labelSet = new Set();
  // Highlight paths, and keep track of the labels which need to be highlighted.
  svgC.selectAll('.path-links')
      .transition()
      .duration(200)
      .style('opacity', function(a) {
        var pathPart = a[0],
            opacityVal = 0;
        if ( isRelevantFn(pathPart, key) ) {
          labelSet.add(pathPart.genre);
          labelSet.add(pathPart.type);
          opacityVal = 0.5;
        }
        return opacityVal;
      });
  // Highlight labels.
  svgC.selectAll('.label-plot')
      .transition()
      .duration(200)
      .style('opacity', function(a) {
        return labelSet.has(a.key) ? 1 : 0.2;
      });
};

dispatch.on("highlight.network", function(d) {
  highlightNetwork(d.id, function(g, key) {
    return g.gesture === key;
  });
});
dispatch.on("highlightgenre.network", function(d) {
  highlightNetwork(d.key, function(g, key) {
    return g.genre === key;
  });
});
dispatch.on("highlighttype.network", function(d) {
  highlightNetwork(d.key, function(g, key) {
    return g.type === key;
  });
});

/* On an "unhighlight" event, restore the opacity of all paths and labels. */
dispatch.on("unhighlight.network", function() {
  svgC.selectAll(".path-links, .label-plot")
      .transition()
      .duration(200)
      .style('opacity', 1)
    .filter('.path-links')
      .style('opacity', null);
  svgC.selectAll('.selectable')
      .classed("selected clicked", false);
});
