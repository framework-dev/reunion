---
title: l’Image
toc: false
head: "<link rel='stylesheet' href='style.css' type='text/css' media='all' />"
header: '<h2 style="margin-top: 3vw;">&nbsp;‘<span style="color: black;">l’Image</span>’ in <em>How It Is</em></h2>'
footer: false
sidebar: false
pager: false
---
```js
import { config } from "/config.js";
import { mod, sleep } from "/utils.js";
// console.log(config); // DEBUG
var paras = {accented: [], normed: []};
var spels = new Map();
var displayElem = document.getElementById("display");
var paraDisplaying;
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
    spels.set(spelId, {string: spelStr, html: spelHTML});
    paraSpels.push(spelHTML); // add this to paraSpels
    supplyHTML = supplyHTML.substr(spelEnd); // put the rest in supplyHTML
    spelStart = supplyHTML.search(/\S/); // find the next nonwhitespace (if any)
  }
  // console.log(paraSpels); // DEBUG
  return paraSpels;
}
async function preProc(paraPicked) {
  // console.log("preProc"); // DEBUG
  let supplyParas = await FileAttachment("/data/supplyHTML.json").json();
  let spelNdx = 0;
  for (var i = 0; i < supplyParas.length; i++) {
    let innerSpels = addSpans(supplyParas[i], spelNdx);
    // console.log(spelNdx, innerSpels.length); // DEBUG
    spelNdx += innerSpels.length;
    paras.accented.push(innerSpels);
    let normedSpels = [];
    for (var j = 0; j < innerSpels.length; j++) {
      normedSpels.push(innerSpels[j].normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    }
    paras.normed.push(normedSpels);
    let p = document.createElement("p");
    p.setAttribute("id", i);
    if (i == paraPicked) {
      p.setAttribute("class", "fade");
      paraPicked = p;
     } else { p.setAttribute("class", "fade none"); }
    p.addEventListener("mouseenter", () => p.innerHTML = paras.accented[p.id].join(" "));
    p.addEventListener("mouseleave", () => p.innerHTML = paras.normed[p.id].join(" "));
    // console.log(paras.normed); // DEBUG
    p.innerHTML = innerSpels.join(" ");
    displayElem.appendChild(p);
  }
  return paraPicked;
}
paraDisplaying = preProc(0);
console.log(spels, paras); // DEBUG
const tstamps = await FileAttachment("/data/limageinhii.json").json();
// function buildTstamps(verseNames, verses) {
//   let obj = {};
//   let errorflag = false;
//   for (const [idx, verse] of verseNames.entries()) {
//     if (tstamps[verse] == undefined) continue; // allows pre-processing to complete before timestamps
//     let a = [];
//     for (let i = 0; i < tstamps[verse].length; i++) {
//       let obj = { ...tstamps[verse][i] };
//       let w = tstamps[verse][i].word;
//       let spIdx = verses[verse].start + i;
//       obj.word = w.trim() + "_" + spIdx;
//       if (!spels.has(obj.word)) {
//         console.log("tstamp obj.word not found in spels:", verse, obj.word);
//         errorflag = true;
//       }
//       a.push(obj);
//     }
//     obj[verse] = a;
//   }
//   if (errorflag) {
//     console.log("spels:", spels);
//     throw new Error("problems above while builtTstamps()");
//   }
//   return obj;
// }
function alignedSpels(alignmentJSON, spelNdx) {
  // OLD let allWords = alignmentJSON.slice(slcStart, slcEnd)
  // build aligned spels
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
    // in this project all spell id's are unique because serial numbers have been added
    let spelId = alignedWord.word.trim() + "_" + spelNdx++;
    if (!spels.has(spelId)) console.log("alignment problem at: ", spelId);
    aSpels.push({
      id: spelId,
      pause: p + config.slower
    }); // spels[idx]
  });
  return aSpels;
}
function linearScrs(numParas) {
  let scores = [];
  let spelNdx = 0;
  for (let i = 0; i < numParas; i++) {
    let a = alignedSpels(tstamps[i], spelNdx);
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
var scores = linearScrs(1);
// console.log(spels, scores[0], spels.has("last_0")); // DEBUG
async function play() {
  let idx,
    loopCount,
    loopMsg,
    rdnScore,
    score,
    scoreNum,
    yieldMsg,
    scoreName,
    interScoreDelay,
    toggle = true;
  loopCount = 0;
  console.log("entered play()");
  await sleep(config.interScore); // an initial pause
  // for (const key of spels.keys()) {
  //   let elem = document.getElementById(key);
  //   if (elem.classList.contains("visible"))
  //     await elem.classList.toggle("visible");
  // }
  await sleep(config.interCycle); // an initial pause
  let prevScore;
  let debugStartingPoint = config.debugStartingPoint;
  if (debugStartingPoint != -1) {
    console.log("debugging from ", debugStartingPoint);
    // scoreSetName = debugStartingPoint.substring(0, 4);
    // toggle = false;
    // if (scoreSetName == "ainh") {
    //   scoreSet = scores_ainh;
    //   ainhIdx = mod(
    //     parseInt(debugStartingPoint.substring(4)) - 2,
    //     scores_ainh.length
    //   );
    // } else {
    //   scoreSet = scores_hina;
    //   hinaIdx = mod(
    //     parseInt(debugStartingPoint.substring(4)) - 2,
    //     scores_hina.length
    //   );
    // }
  } else scoreNum = debugStartingPoint;
  while (config.running) {
    // loop forever ...
    loopMsg = `loop: ${loopCount++}`;
    // bump scoreNum appropriately
    scoreNum = ++scoreNum % scores.length
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
        loopMsg + `, score: ${scoreNum + 1}, item: ${idx}, id: ${spelId}, `;
      yieldMsg += `string: '${str}', pause: ${score[idx].pause}`;
      console.log(yieldMsg); // (in other contexts:) yield yieldMsg;
      //
      // these next lines do all the work:
      // unless scored_pause: trigger fade in/out:
      if (spelId !== "PAUSE") {
        let elem = document.getElementById(spelId);
        elem.classList.toggle("visible");
        if (autopause > 0) {
          let ridx = mod(idx - numWords, score.length);
          autopause += score[idx].pause - score[ridx].pause;
          sleep(autopause).then(() =>
            elem.classList.toggle("visible")
          );
        }
      }
      await sleep(score[idx].pause); // pauses usually taken from the temporal data
    } // end of loop thru current score
    interScoreDelay = config.interScore;
    await sleep(interScoreDelay); // pause between scores
    // single scoreSet loop ended here: } // end of loop thru scores (plural)
    // no cycle when using double scoreSet: await Promises.delay(config.interCycle * 10); // pause between cycle of scores
  } // end of (endless) while loop
}
play();
```
<div id="display"></div>