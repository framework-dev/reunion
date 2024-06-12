const heightVw = 50;
const lineHeight = 2.8;
const linesPer = Math.floor(heightVw / lineHeight);
const config = {
  numParas: 1,
  running: true,
  // cosmetic
  // "rColumn": 33,
  fontSize: 2,
  // lineHeight: lineHeight,
  // this is 9/16 of 1080:
  // heightVw: heightVw,
  // linesPer: linesPer,
  viewPortPx: 956,
  // these times are all now hundredths of seconds
  interCycle: 300,
  interScore: 200,
  scoredPause: 100,
  slower: 0,
  startingPoint: 0,
  wordsShown: 11
}
export { config };