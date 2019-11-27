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

d3.select('#colC-title')
    .style('width',wC + 'px');

var col1 = wC/5,
    col2 = (wC/5)*4,
    networkHeight = hC * 0.85
    clicked = 0;

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
        'reviews':            '#FF7F00'   // orange
      },
      thisGenre = d.genre;
  return genreColors[thisGenre];
};


// function to make list of texts
function makePath(data) {
  var increment, instancePrev, y,
      countInstance = 0,
      countTotal = 0;
  data.forEach( function(pathJoin, index) {
    var genre = pathJoin.genreDatum,
        genreX = genre.x,
        type = pathJoin.typeDatum,
        typeX = type.x,
        typeY = type.y;
    if ( countTotal === 0 ) { instancePrev = genre.key; }
    else if ( instancePrev !== genre.key ) { countInstance = 0; }

    increment = ((genre.percent * networkHeight) / genre.value.length) * countInstance;
    y = genre.y + increment;

    pathJoin.path = [
      { "x": genreX - 4, "y": y,
        'genre': genre.key,
        'type': type.key
      },
      { "x": genreX + (wC / 10), "y": y,
        'genre': genre.key,
        'type': type.key
      },
      { "x": typeX - (wC / 10), "y": typeY,
        'genre': genre.key,
        'type': type.key
      },
      { "x": typeX + 4, "y": typeY,
        'genre': genre.key,
        'type': type.key
      } ];
    countInstance++;
    countTotal++;
    instancePrev = genre.key;
  })
  //console.log(data);
  return data;
};

// dispatch.on("dataLoaded.network",function(meta, metaTop, metaTopGenre, elemDistTop, elemTop){
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
        //console.log(pathDatum);
        pathsList.push(pathDatum);
      });
    });
  }
  //console.log(pathsList);
  // Create labels for genres.
  var genreLabels,
      totalGestures = 0,
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
        /* While we're looking at this datum, add to the running count of IT 
           gestures (needed for label placement). */
        totalGestures += d.value.length;
        //console.log(d);
        return d.key;
      });
  // Position the genre labels along their axis. Use a 4px gap in between ranges.
  var gapPx = 4,
      hCFree = hC - ( genreList.length * gapPx );
  genreLabels
      .attr("x", function(d) { 
        d.x = col1 + 4;
        return col1 - 4;
      })
      .attr("y", function(d, i) {
        var numGestures = d.value.length,
            percentTotal = numGestures / totalGestures,
            // Place labels halfway within the datum's range.
            yPx = ( (numGestures / 2) * hCFree) / totalGestures,
            position = ypos + yPx + gapPx;
        d.y = ypos;
        d.percent = percentTotal;
        // Use the full range of this datum to determine where the next should start.
        ypos += (yPx * 2) + (gapPx / 2);
        //console.log(position);
        return position;
      });
  // Create border rectangles for genre?
  // Create labels for @type.
  var typeAxis, typeLabels,
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
        //console.log(d);
        return d.key;
      });
  ypos = 0;
  hCFree = hC - ( typeList.length * gapPx );
  typeLabels
      .attr("x", function(d) { 
        d.x = col2 - 4;
        return col2 + 4;
      })
      .attr("y", function(d, i) {
        var numGestures = d.value.length,
            // Place labels at regular intervals along their axis.
            yPx = hCFree / typeList.length,
            position = ypos + yPx + gapPx;
        // Use the full range of this datum to determine where the next should start.
        ypos += yPx + (gapPx / 2);
        d.y = ypos;
        return position;
      });
  // Create curves joining genres to the types of quotes represented.
  var linkLines = svgC.selectAll('.links');
  linkLines.data(makePath(pathsList))
      .enter()
    .append('g')
      .classed('links', true)
    .append('path')
      .classed('path-links', true)
      .datum(d => d.path)
      .attr('d', curve)
      .style('stroke', d => getGenreColor(d[0]))
});
