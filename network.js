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
  .x(function(d){ return d.x})
  .y(function(d){ return d.y})
  .curve(d3.curveBundle.beta(0.85));

var colorDrama = "#C2185B",
  colorFiction = "#673AB7",
  colorNonFiction = "#00ACC1",
  colorVerse = "#43A047";

// color scale for curves
var scaleColor2 = d3.scaleOrdinal()
      .domain(["Drama", "Drama: Prose", "Drama: Verse", "Fiction", "Fiction: Letter", "Fiction: Novel", "Fiction: Other", "Non-fiction", "Non-fiction: Essay", "Non-fiction: Letter", "Non-fiction: Other", "Verse", "Verse: Lyric", "Verse: Narrative", "Verse: Other"])
      .range([colorDrama, colorDrama, colorDrama, colorFiction, colorFiction, colorFiction, colorFiction, colorNonFiction, colorNonFiction, colorNonFiction, colorNonFiction, colorVerse, colorVerse, colorVerse, colorVerse]);


// function to make list of texts
function makePath(data){

  var elemPrev, y,
    countElem = 0,
    countTotal = 0;

  data.forEach(function(i){

    if(countTotal == 0){ elemPrev = i.element; }
    else if(elemPrev !== i.element){ countElem = 0; }

    increment = ((i.targetData.prop*networkHeight)/i.targetData.value) * countElem;

    y = i.targetData.y + increment;

    i.path = [{"x": i.sourceData.x - 4, "y": i.sourceData.y, "filename": i.filename, "element": i.element, "mainGenre": i.mainGenre},
      {"x": i.sourceData.x - (wC/10), "y": i.sourceData.y, "filename": i.filename, "element": i.element, "mainGenre": i.mainGenre},
      {"x": i.targetData.x + (wC/10), "y": y, "filename": i.filename, "element": i.element, "mainGenre": i.mainGenre},
      {"x": i.targetData.x + 4, "y": y, "filename": i.filename, "element": i.element, "mainGenre": i.mainGenre}];

    countElem++;
    countTotal++;
    elemPrev = i.element;
  })

  return data;

};

// dispatch.on("dataLoaded.network",function(meta, metaTop, metaTopGenre, elemDistTop, elemTop){
dispatch.on("dataLoaded.network",function(allData){
  var genres = allData.genres,
      gestures = allData.gestures,
      genreList = [];
  for (var key of genres.keys()) {
    genreList.push({'key': key, 'value': genres.get(key)});
  }
  // Create labels for genres.
  var genreLabels,
      totalGestures = 0,
      ypos = 0,
      countGestures = function(map) {
        var numGestures = 0;
        map.forEach( function(val) {
          numGestures += val.length;
        });
        return numGestures;
      },
      genreAxis = svgC.selectAll('.label-genre')
        .append('g')
          .attr('class', 'axis')
          .data(genreList)
          .enter();
  // Add labels for each genre.
  genreLabels = genreAxis.append('text')
      .attr('class', 'label-plot')
      .attr("fill", "#292826")
      .text( function(d) { 
        console.log(d);
        totalGestures += countGestures(d.value);
        return d.key;
      });
  // Position the genre labels along their axis. Use a 4px gap in between ranges.
  var gapPx = 4,
      hCFree = hC - ( genreList.length * gapPx );
  genreLabels
      .attr("x", function() { return col1 - 4; })
      .attr("y", function(d, i) {
        var numGestures = countGestures(d.value),
            // Place labels halfway within the datum's range.
            yPx = ( (numGestures / 2) * hCFree) / totalGestures,
            position = ypos + yPx + gapPx;
        // Use the full range of this datum to determine where the next should start.
        ypos += (yPx * 2) + (gapPx / 2);
        //console.log(position);
        return position;
      });
  
  // Create border rectangles for genre?
  // Create labels for @type.
  // 
});
