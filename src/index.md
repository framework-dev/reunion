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
config.startingPoint = 0; // DEBUG when RECORDING & REDUCTING EDIT here
config.numParas = 8; // DEBUG and here: number of scores built depends on this
config.running = true; // DEBUG
import { mod, sleep } from "/utils.js";
var displayElem = document.getElementById("display");
var paraDisplaying;
var paras = [];
var scores;
var spels = new Map();
// --- preprocessing ---
const tstamps = await FileAttachment("/data/limageinhii.json").json();
paraDisplaying = await preProc(config.startingPoint);
scores = await linearScrs(config.startingPoint, config.numParas);
console.log(spels, paras, scores); // DEBUG
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
async function preProc(paraPicked) {
  // console.log("preProc"); // DEBUG
  let supplyParas = await FileAttachment("/data/supplyHTML.json").json();
  let spelNdx = 0;
  for (var i = 0; i < supplyParas.length; i++) {
    let innerSpels = await addSpans(supplyParas[i], spelNdx);
    // console.log(spelNdx, innerSpels.length); // DEBUG
    spelNdx += innerSpels.length;
    paras.push(innerSpels);
    let p = document.createElement("p");
    p.setAttribute("id", i); // id is a para(graph) number
    if (i == paraPicked) {
      p.setAttribute("class", "fade");
      paraPicked = p;
     } else { p.setAttribute("class", "fade none"); }
    p.addEventListener("mouseenter", () => {p.innerHTML = paras[p.id].reduce((a, c) => a + " " + spels.get(c).html, ""); toggleEmViz(p);});
    p.addEventListener("mouseleave", () => p.innerHTML = paras[p.id].reduce((a, c) => a + " " + spels.get(c).normed, ""))
    // console.log(paras.normed); // DEBUG
    p.innerHTML = paras[p.id].reduce((a, c) => a + " " + spels.get(c).normed, "");
    displayElem.appendChild(p);
  }
  return paraPicked;
}
function toggleEmViz(p) {
  let spans = Array.from(p.getElementsByTagName("span"));
  let ems = []
  spans.forEach(span => ems = ems.concat(Array.from(span.getElementsByTagName("em"))));
  ems.forEach((em => em.classList.add("visible")));
}
// --- preprocessing alignment ---
function alignedSpels(alignmentJSON, paraNum, spelNdx) {
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
    if (!spels.has(spelId)) console.log(`alignment problem at: ${spelId} in para: ${paraNum}`);
    aSpels.push({
      id: spelId,
      pause: p + config.slower
    }); // spels[idx]
  });
  return aSpels;
}
// --- building linear scores ---
function linearScrs(startingPara, numParas) {
  let scores = [];
  let firstSpelId = paras[startingPara][0];
  // console.log(firstSpelId, firstSpelId.match(/\d+/)[0]); // DEBUG
  let spelNdx = parseInt(firstSpelId.match(/\d+/)[0]);
  for (let i = 0; i < numParas; i++) {
    let a = alignedSpels(tstamps[startingPara + i], startingPara + i, spelNdx);
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
  await sleep(config.interCycle); // an initial pause
  let prevScore;
  let paraNum = config.startingPoint;
  while (config.running) { // stopped with false in config
    // loop forever ...
    loopMsg = `loop: ${loopCount++}`;
    // show current paragraph
    document.getElementById(paraNum).classList.remove("none");
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
    await sleep(config.interScore); // pause between scores
    // remove old paragraph:
    document.getElementById(paraNum).classList.add("none");
    // bump paraNum
    paraNum = ++paraNum;
    if (paraNum >= (config.numParas + config.startingPoint)) paraNum = config.startingPoint;
    // bump scoreNum
    scoreNum = ++scoreNum % scores.length;

  } // end of (endless) while loop
}
function accentedEm(spelId, emElem) {
  let inner = emElem.innnerText;
  let accented = spels.get(spelId).html.match(/<em>(.*)<\/em>/)[1];
  return inner == accented ? "" : accented;
}
play();
```
<div id="display"></div>