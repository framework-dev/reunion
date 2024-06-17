---
title: l’Image
toc: false
head: "<link rel='stylesheet' href='style.css' type='text/css' media='all' />"
header: false
footer: false
sidebar: false
pager: false
---
```js
console.log("--- Crawl It’s Image v1.0 for ELO 2024/07 ---");
import { config } from "/config.js";
// --- DEBUG congiguration
// config.startingPoint = 2; // DEBUG when RECORDING & REDUCTING EDIT here
// config.numParas = 2; // DEBUG and here: number of scores built depends on this
// config.running = false; // DEBUG
import { mod, sleep, msToTime } from "/utils.js";
var displayElem = document.getElementById("display");
var paraNum;
var paras;
var scores;
var spels = new Map();
const supplyParas = await FileAttachment("/data/supplyHTML.json").json();
const tstamps = await FileAttachment("/data/limageinhii.json").json();
// --- preprocessing ---
console.log("--- preprocessing begins ---"); // DEBUG
paras = await preProc(supplyParas);
scores = await linearScrs(tstamps, config.startingPoint, config.numParas);
console.log(paras[config.startingPoint]); // DEBUG , paras, scores
console.log("--- preprocessing done ---"); // DEBUG
// NEW
displayElem.addEventListener("mouseenter", () => {displayElem.innerHTML = paras[paraNum].reduce((a, c) => a + " " + spels.get(c).html, ""); toggleEmViz(displayElem);});
displayElem.addEventListener("mouseleave", () => displayElem.innerHTML = paras[paraNum].reduce((a, c) => a + " " + spels.get(c).normed, ""));
// --- preprocessing functions ---
function addSpans(supplyHTML, spelNdx) {
  let paraSpels = [];
  let spelStart = supplyHTML.search(/\S/); // find the first nonwhitespace
  let currentHTML = "";
  while (spelStart != -1) {
    currentHTML += supplyHTML.substr(0, spelStart); // grab everything up to that point
    supplyHTML = supplyHTML.substr(spelStart); // put the rest in supplyHTML
    let spelEnd = supplyHTML.search(/\s/); // find where whitespace starts again
    if (spelEnd == -1) spelEnd = supplyHTML.length; // supplyHTML ends with nonwhitespace
    // process the spel and put it into the map
    currentHTML = supplyHTML.substr(0, spelEnd);
    let spelStr = currentHTML.replace(/(<([^>]+)>)/ig, '').trim();
    let spelId = spelStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "") + `_${spelNdx++}`;
    // wrap the spel we've found in span tags
    let spelHTML = `<span id="${spelId}">${currentHTML}</span>`
    spels.set(spelId, {string: spelStr, html: spelHTML, normed: spelHTML.normalize("NFD").replace(/[\u0300-\u036f]/g, "")});
    paraSpels.push(spelId); // add ids to paraSpels
    supplyHTML = supplyHTML.substr(spelEnd); // put the rest in supplyHTML
    spelStart = supplyHTML.search(/\S/); // find the next nonwhitespace (if any)
  }
  // console.log(paraSpels); // DEBUG
  return paraSpels;
}
async function preProc(_supplyParas) {
  // console.log("preProc"); // DEBUG
  let spelNdx = 0;
  let _paras = [];
  for (var i = 0; i < _supplyParas.length; i++) {
    let paraSpels = await addSpans(_supplyParas[i], spelNdx);
    // console.log(spelNdx, paraSpels.length); // DEBUG
    spelNdx += paraSpels.length;
    _paras.push(paraSpels);
  }
  return _paras;
}
function toggleEmViz(elem) {
  let spans = Array.from(elem.getElementsByTagName("span"));
  let ems = []
  spans.forEach(span => ems = ems.concat(Array.from(span.getElementsByTagName("em"))));
  ems.forEach((em => em.classList.add("visible")));
}
// --- preprocessing alignment ---
function alignedSpels(alignmentJSON, _paraNum, spelNdx) {
  // build aligned spels
  // console.log("entered alignedSpels()"); // DEBUG
  let aSpels = [];
  alignmentJSON.forEach((alignedWord, idx) => {
    // get length of time taken to pronounce word:
    let p = alignedWord.end - alignedWord.start;
    // if we are not at the last word of the segment
    if (idx < alignmentJSON.length - 1) {
      // add the difference between start of next word and end of this one
      p = p + (alignmentJSON[idx + 1].start - alignedWord.end);
    }
    p = Math.round(p * 100); // convert to hundreths
    // in this project all spell id's are unique because serial numbers are added
    let spelId = alignedWord.word.trim() + "_" + spelNdx++;
    if (!spels.has(spelId)) console.log(`alignment problem at: ${spelId} in para: ${_paraNum}`);
    aSpels.push({
      id: spelId,
      pause: p + config.slower
    }); // spels[idx]
  });
  return aSpels;
}
// --- building linear scores ---
function linearScrs(_tstamps, startingPara, numParas) {
  let scores = [];
  let firstSpelId = paras[startingPara][0];
  // console.log(firstSpelId, firstSpelId.match(/\d+/)[0]); // DEBUG
  let spelNdx = parseInt(firstSpelId.match(/\d+/)[0]);
  for (let i = 0; i < numParas; i++) {
    let a = alignedSpels(_tstamps[startingPara + i], startingPara + i, spelNdx);
    spelNdx += a.length;
    // adding autofade here
    a.unshift({
      id: "AUTOFADE",
      pause: config.wordsShown
    });
    scores.push(a);
  }
  return scores;
}
//
// --- animation, based on the play() method in observablehq.com/@shadoof/sounding ---
async function play() {
  let idx,
    loopCount,
    loopMsg,
    rdnScore,
    score,
    scoreNum = 0,
    yieldMsg,
    scoreName,
    toggle = true;
  loopCount = 0;
  console.log("entered play()");
  await sleep(config.interCycle);
  let prevScore, cycStart;
  paraNum = config.startingPoint;
  while (config.running) { // stopped with false in config
    if (paraNum == config.startingPoint) cycStart = Date.now();
    // loop forever ...
    loopMsg = `loop: ${loopCount++}`;
    // show current paragraph
    if (config.smallestParas.includes(paraNum)) {
      displayElem.style.fontSize = config.smallestSize;
    }
    else if (config.smallParas.includes(paraNum)) {
      displayElem.style.fontSize = config.smallSize;
    }
    else {
      displayElem.style.fontSize = config.regSize;
    }
    displayElem.innerHTML = paras[paraNum].reduce((a, c) => a + " " + spels.get(c).normed, "");
    displayElem.style.opacity = 1;
    await sleep(300);
    //
    // (currently) unused mechanism for generating quasi-random scores on the fly (see 'Uchaf'):
    if (typeof scores[scoreNum] === "string") {
      switch (scores[scoreNum]) {
        case "schorus":
          // score = schorus();
          break;
        default:
          throw new Error("unknown score-building function name");
      }
      prevScore = score;
    } else {
      score = scores[scoreNum];
    }
    // console.log(scoreSet, "scoreNum", scoreNum, scoreSet[scoreNum]); // DEBUG
    console.log("number of items in score:", score.length);
    //
    // This is where we inner-loop through each item in the current score and
    // display the string of its spel for the length of time in its pause property.
    let autopause = -1,
      numWords = 1;
    for (idx = 0; idx < score.length; idx++) {
      if (!config.running) break;
      let spelId = score[idx].id;
      if (spelId === "AUTOFADE") {
        console.log("autoFade");
        // calculate autofade based on word number
        autopause = 0;
        let numWords = score[idx].pause;
        for (let fi = 0; fi <= numWords; ++fi) {
          autopause += score[fi].pause;
        }
        continue;
      }
      let str = "[pause]";
      if (spelId !== "PAUSE") {
        str = spels.get(spelId);
        if (str !== undefined) str = str.string;
      }
      // provide some info:
      yieldMsg =
        loopMsg + `, score: ${scoreNum}, item: ${idx}, paraNum: ${paraNum}, id: ${spelId}, `;
      yieldMsg += `string: '${str}', pause: ${score[idx].pause}`;
      console.log(yieldMsg); // (in other contexts:) yield yieldMsg;
      //
      // these next lines do all the work:
      // unless there is a scored pause: trigger fade in/out:
      if (spelId !== "PAUSE") {
//        let accentedEm = "";
        let elem = document.getElementById(spelId);
        elem.classList.add("visible");
        let emElems = elem.getElementsByTagName("em");
        let emElem, newInner = "";
        if (emElems && emElems.length == 1) {
          emElem = emElems.item(0);
          newInner = accentedEm(spelId, emElem);
          if (newInner != "") emElem.innerText = newInner;
          emElem.classList.add("visible");
        }
        if (autopause > 0) {
          let ridx = mod(idx - numWords, score.length);
          autopause += score[idx].pause - score[ridx].pause;
          sleep(autopause).then(() => {
            elem.classList.remove("visible");
            if (emElem) emElem.classList.remove("visible");
           if (newInner != "") sleep(200).then(() => elem.innerHTML = spels.get(spelId).normed);
          });
        }
      }
      await sleep(score[idx].pause); // pauses usually taken from the temporal data
    } // end of loop thru current score
    await sleep(autopause + config.interScore); // pause between scores
    // remove old paragraph:
    displayElem.style.opacity = 0;
    await sleep(300);
    // bump paraNum
    paraNum = ++paraNum;
    if (paraNum >= (config.numParas + config.startingPoint)) {
      console.log("--- end of cycle --- Duration:", msToTime(Date.now() - cycStart)); // DEBUG
      paraNum = config.startingPoint;
      await sleep(config.interCycle); // end of cycle pause
      let bl = document.getElementById("byline");
      bl.style.opacity = 1;
      await sleep(config.creditsPause); // credits pause 7s
      bl.style.opacity = 0;
      await sleep(config.interCycle); // end of cycle pause
    }
    // bump scoreNum
    scoreNum = ++scoreNum % scores.length;
  } // end of (endless) while loop
}
function accentedEm(spelId, emElem) {
  let inner = emElem.innnerText;
  let accented = spels.get(spelId).html.match(/<em>(.*)<\/em>/)[1];
  return inner == accented ? "" : accented;
}
if (config.running) play();
```
<!-- Version 1.0 for ELO 2024 -->
<div id="byline">
  <div class="clmleft">
    <span id="bytext"><cite>Crawl It’s Image</cite>&nbsp;&nbsp;•&nbsp;&nbsp;<a href="https://programmatology.com/?p=contents/bio.html">John Cayley</a></span>
  </div>
  <div class="clmright">
    <span style="font-size: 1.2vw;">
      <cite>static version:</cite> &nbsp;
      <a href="https://programmatology.com/imagegen/webapps/limage_in_hii.html">“l’Image” in <cite>How It Is</cite></a>&nbsp;&nbsp;•&nbsp;&nbsp;<cite>live-code notebooks:</cite> &nbsp;
      <a href="https://observablehq.com/@shadoof/hospitable-narratives-1">Workbook for static version</a><br>
      <cite>&amp;</cite>&nbsp;&nbsp;<a href="https://observablehq.com/@shadoof/commenttis/">Letteral grams finder</a>&nbsp;&nbsp;•&nbsp;&nbsp;<cite>made with:</cite> <a href="https://observablehq.com/framework/">Observable Framework</a>&nbsp;&nbsp;•&nbsp;&nbsp;June 2024
    </span>
  </div>
</div>
<div id="display" class="fade"></div>