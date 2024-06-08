---
title: l’Image
toc: false
head: "<link rel='stylesheet' href='style.css' type='text/css' media='all' />"
footer: false
sidebar: false
pager: false
---
```js
var paras = {accented: [], normed: []};
var spels = new Map();
var displayElem = document.getElementById("display");
const addSpans = (supplyHTML, spelNdx) => {
  let paraSpels = [];
  let spelStart = supplyHTML.search(/\S/); // find the first nonwhitespace
  while (spelStart != -1) {
    paraSpels.push(supplyHTML.substr(0, spelStart)); // grab everything up to that point
    supplyHTML = supplyHTML.substr(spelStart); // put the rest in supplyHTML
    let spelEnd = supplyHTML.search(/\s/); // find where whitespace starts again
    if (spelEnd == -1) spelEnd = supplyHTML.length; // supplyHTML ends with nonwhitespace
    // wrap the spel we've found in span tags
    paraSpels.push(`<span id="s${spelNdx}">` + supplyHTML.substr(0, spelEnd) + `</span>`); // add this to paraSpels
    supplyHTML = supplyHTML.substr(spelEnd); // put the rest in supplyHTML
    spelStart = supplyHTML.search(/\S/); // find the next nonwhitespace (if any)
  }
  return paraSpels;
}
async function preProc() {
  // console.log("preProc"); // DEBUG
  let elems = await FileAttachment("data/supplyHTML.json").json();
  let spelNdx = 0;
  for (var i = 0; i < elems.length; i++) {
    let innerSpels = addSpans(elems[i], spelNdx++);
    paras.accented.push(innerSpels);
    let normedSpels = []
    for (var j = 0; j < innerSpels.length; j++) {
      normedSpels.push(innerSpels[j].normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    }
    paras.normed.push(normedSpels);
    let p = document.createElement("p")
    p.setAttribute("id", i);
    p.setAttribute("class", "fade");
    p.addEventListener("mouseenter", () => p.innerHTML = paras.accented[p.id].join(" "));
    p.addEventListener("mouseleave", () => p.innerHTML = paras.normed[p.id].join(" "));
    // console.log(paras.normed); // DEBUG
    p.innerHTML = innerSpels.join(" ");
    displayElem.appendChild(p);
  }
}
preProc();
// console.log("functions defined", paras); // DEBUG
const tstamps = await FileAttachment("data/limageinhii-0.json").json();
```
<h2 style="margin-top: 3vw;">&nbsp;‘<span style="color: black;">l’Image</span>’ in <em>How It Is</em></h2>
<div id="display"></div>