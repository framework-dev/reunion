function mod(n, m) {
  // mod function that handles negative numbers, usage: mod(num, modulous)
  return ((n % m) + m) % m;
}
function sleep(hundredths) {
  return new Promise(resolve => setTimeout(resolve, hundredths * 10));
}
export { mod, sleep }