var m = {t:10,r:10,b:10,l:10},
    wC = document.getElementById("column-center").clientWidth - m.l - m.r,
    hC = document.getElementById("column-center").clientHeight - m.t - m.b;

var svgC = d3.select("#column-center")
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

var colorDrama = "#C2185B",
  colorFiction = "#673AB7",
  colorNonFiction = "#00ACC1",
  colorVerse = "#43A047";

// color scale for curves
var scaleColor2 = d3.scaleOrdinal(d3.schemeBlues[6])
      /*.domain(["philosophy", "religious-writings", "literature", "life-writings", "nonfiction", "reviews"])*/
      /*.range([colorDrama, colorDrama, colorDrama, colorFiction, colorFiction, colorFiction, colorFiction, colorNonFiction, colorNonFiction, colorNonFiction, colorNonFiction, colorVerse, colorVerse, colorVerse, colorVerse])*/;


// function to make list of texts
function makePath(data) {
  var elemPrev, increment, y,
      countElem = 0,
      countTotal = 0;
  //console.log(data);
  data.forEach( function(i) {
    console.log(i);
    if ( countTotal === 0 ) { elemPrev = i.gesture; }
    else if ( elemPrev !== i.gesture ) { countElem = 0; }

    increment = 4; /*((i.targetData.prop * networkHeight) / i.targetData.value) * countElem;*/
    y = i.typeDatum.y + increment;

    i.path = [
      { "x": i.genreDatum.x - 4, "y": i.genreDatum.y,
        'genre': i.genreDatum.key,
        'type': i.typeDatum.key},
      { "x": i.genreDatum.x - (wC / 10), "y": i.genreDatum.y,
        'genre': i.genreDatum.key,
        'type': i.typeDatum.key},
      { "x": i.typeDatum.x + (wC / 10), "y": y,
        'genre': i.genreDatum.key,
        'type': i.typeDatum.key},
      { "x": i.typeDatum.x + 4, "y": y,
        'genre': i.genreDatum.key,
        'type': i.typeDatum.key} ];
    countElem++;
    countTotal++;
    elemPrev = i.element;
  })
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
    /*for (var keyInner of bibEntries.keys()) {
      var theseGestures = bibEntries.get(keyInner);
      bibGestures = bibGestures.concat(theseGestures);
    }*/
    typeList.forEach( function(type) {
      var matchesType = bibGestures.some( function(instance) {
        return instance['type'].includes(type['key']);
      });
      if ( matchesType ) { targets.push(type); }
    });
    genreList.push(genreObj/*{
      'key': key, 
      'value': bibEntries,
      'sourceData': bibEntries,
      'targetData': targets
    }*/);
    bibEntries.forEach( function(entry) {
      entry['type'].forEach( function(type) {
        var pathDatum = {
          /*'genre': key,*/
          'genreDatum': genreObj,
          'gesture': entry,
          /*'type': type,*/
          'typeDatum': typeList.filter(typeObj => typeObj['key'] === type)[0]
        };
        //console.log(pathDatum);
        pathsList.push(pathDatum);
      });
    });
  }
  console.log(pathsList);
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
        d.x = col1 - 4;
        return d.x;
      })
      .attr("y", function(d, i) {
        var numGestures = d.value.length,
            // Place labels halfway within the datum's range.
            yPx = ( (numGestures / 2) * hCFree) / totalGestures,
            position = ypos + yPx + gapPx;
        // Use the full range of this datum to determine where the next should start.
        ypos += (yPx * 2) + (gapPx / 2);
        d.y = ypos;
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
        d.x = col2;
        return d.x;
      })
      .attr("y", function(d, i) {
        var numGestures = d.value.length,
            // Place labels halfway within the datum's range.
            yPx = ( (numGestures / 2) * hCFree) / totalTypes,
            position = ypos + yPx + gapPx;
        // Use the full range of this datum to determine where the next should start.
        ypos += (yPx * 2) + (gapPx / 2);
        //console.log(yPx);
        d.y = ypos;
        //console.log(position);
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
      .style('stroke', 'black'/*function(d) { return scaleColor2(0); }*/)
});
