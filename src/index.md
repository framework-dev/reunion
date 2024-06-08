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
    let spelId = spelStr + `_${spelNdx++}`;
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
  let supplyParas = await FileAttachment("data/supplyHTML.json").json();
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
// console.log(spels, paras); // DEBUG
const tstamps = await FileAttachment("data/limageinhii-0.json").json();
```
<div id="display"></div>