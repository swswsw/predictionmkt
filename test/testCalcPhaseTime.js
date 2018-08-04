let rewire = require('rewire');
let test = require('tape');

let mainapp = rewire('../app.js');


test('test calcPhaseTime', function (t) {
  let calcPhaseTime = mainapp.__get__("calcPhaseTime");
  let time = calcPhaseTime(100);
  t.equal(time.marketEnd - time.marketStart, 3600);
  t.equal(time.voteEnd - time.voteStart, 3600);

  t.end();
});
