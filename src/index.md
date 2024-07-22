---
title: Reunion
toc: false
head: "<link rel='stylesheet' href='style.css' type='text/css' media='all' />"
header: false
footer: false
sidebar: false
pager: false
---
<!-- July 2024 -->
<div id="byline">
  <div class="clmleft">
    <span id="bytext"><cite>Steep 2024 • 1974 &nbsp;&nbsp;&nbsp; Reunion</cite></span>
  </div>
  <div class="clmright">
    <span style="font-size: 1.2vw;">John Cayley</span>
  </div>
</div>
<div id="display" class="fade"></div>

```js
console.log("--- Reunion July 2024 ---");
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
var spels = new Map(await FileAttachment("/data/spels.json").json());
displayElem.innerHTML = await FileAttachment("/data/spanString.txt").text();
const tstamps = await FileAttachment("/data/reunion_tstamps.json").json();
// --- preprocessing ---
console.log("--- preprocessing begins ---"); // DEBUG
paras = await FileAttachment("/data/paras.json").json();
scores = await linearScrs(tstamps, config.startingPoint, config.numParas);
// scores = await FileAttachment("/data/scores.json").json(); // TODO default algorithmic tstamps only
// console.log(paras[config.startingPoint]); // DEBUG , paras, scores
console.log("--- preprocessing done ---"); // DEBUG
// displayElem.addEventListener("mouseenter", () => {displayElem.innerHTML = paras[paraNum].reduce((a, c) => a + " " + spels.get(c).html, ""); toggleEmViz(displayElem);});
// displayElem.addEventListener("mouseleave", () => displayElem.innerHTML = paras[paraNum].reduce((a, c) => a + " " + spels.get(c).normed, ""));
// --- preprocessing functions ---
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
      pause: config.fadeWords
    });
    scores.push(a);
  }
  return scores;
}
//
// --- animation, based on the play() method in observablehq.com/@shadoof/sounding ---
async function play() {
  console.log("entered play()");
  let cycStart,
    fadePause = 0,
    fadeWords = config.fadeWords,
    idx,
    loopCount = 0,
    loopMsg,
    paraNum = config.startingPoint,
    prevScore,
    rdnScore,
    score,
    scoreName,
    scoreNum = 0,
    toggle = true,
    yieldMsg;
  if (config.fadeWords > 0) await sleep(config.interCycle);
  while (config.running) { // stopped with false in config
    if (paraNum == config.startingPoint) cycStart = Date.now();
    // loop forever ...
    loopMsg = `loop: ${loopCount++}`;
    // >>> show current paragraph
    if (config.fadeWords == 0 ) {
      displayElem.style.opacity = 1;
      await sleep(300);
    }
    // <<<
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
    for (idx = 0; idx < score.length; idx++) {
      if (!config.running) break;
      let spelId = score[idx].id;
      // an 'AUTOFADE' score item can override the config.fadeWords default
      if (spelId === "AUTOFADE") { 
        console.log("autoFade");
        // calculate autofade based on word number
        fadePause = 0;
        fadeWords = score[idx].pause;
        for (let fi = 0; fi < fadeWords; ++fi) {
          let fidx = (idx + fi + 1) % score.length;
          fadePause += score[fidx].pause;
        }
        continue;
      }
      // >>> provide some info:
      let str = "[pause]";
      if (spelId !== "PAUSE") {
        str = spels.get(spelId);
        if (str !== undefined) str = str.string;
      }
      yieldMsg =
        loopMsg + `, score: ${scoreNum}, item: ${idx}, paraNum: ${paraNum}, id: ${spelId}, `;
      yieldMsg += `string: '${str}', pause: ${score[idx].pause}`;
      console.log(yieldMsg); // <<< (in other contexts:) yield yieldMsg;
      //
      // >>> these next lines do all the work
      let elem;
      if (spelId !== "PAUSE") {
        elem = document.getElementById(spelId);
        elem.classList.add("visible");
      }
      await sleep(score[idx].pause); // pauses usually taken from the temporal data
      if (spelId === "PAUSE") continue;
      // not a pause item, so check for fadeWords
      if (fadeWords > 0) {
        fadePause = 0;
        for (let fi = 0; fi < fadeWords; ++fi) {
          let fidx = mod((fi + idx + 1), score.length);
          fadePause += score[fidx].pause;
        }
      }
      if (fadePause > 0) {
        // let ridx = mod(idx - fadeWords, score.length);
        // fadePause += score[idx].pause - score[ridx].pause;
        sleep(fadePause).then(() => {
          elem.classList.remove("visible");
        });
      }
    } // end of loop thru current score
    await sleep(fadePause + config.interScore); // pause between scores
    // >>> remove old paragraph:
    if (config.fadeWords == 0) {
      displayElem.style.opacity = 0;
      await sleep(300);
      paras[paraNum].forEach(p => document.getElementById(p).classList.remove("visible"));
      await sleep(50);
    }
    // <<<
    // bump paraNum
    paraNum = ++paraNum;
    if (paraNum >= (config.numParas + config.startingPoint)) {
      console.log("--- end of cycle --- Duration:", msToTime(Date.now() - cycStart)); // DEBUG
      paraNum = config.startingPoint;
      await sleep(config.interCycle); // end of cycle pause
      if (config.creditsPause > 0) {
        let bl = document.getElementById("byline");
        bl.style.opacity = 1;
        await sleep(config.creditsPause); // credits pause
        bl.style.opacity = 0;
        await sleep(config.interCycle); // end of cycle pause
      }
    }
    // bump scoreNum
    scoreNum = ++scoreNum % scores.length;
  } // end of (endless) while loop
}
if (config.running) play();
```