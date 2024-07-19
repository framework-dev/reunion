const heightVw = 50;
const lineHeight = 2.8;
const linesPer = Math.floor(heightVw / lineHeight);
const config = {
  startingPoint: 0,
  numParas: 22,
  running: true,
  wordsShown: 11,
  // cosmetic
  // "rColumn": 33,
  regSize: "2vw",
  smallSize: "1.9vw",
  smallestSize: "1.75vw",
  smallParas: [3, 7, 17],
  smallestParas: [4, 10, 11, 12, 14, 15],
  // lineHeight: lineHeight,
  // this is 9/16 of 1080:
  // heightVw: heightVw,
  // linesPer: linesPer,
  // viewPortPx: 956,
  // these times are all now hundredths of seconds
  creditsPause: 800,
  interCycle: 300,
  interScore: 200,
  scoredPause: 100,
  slower: 0
}
export { config };