let rewire = require('rewire');
let test = require('tape');

let mainapp = rewire('../app.js');

test('test ', function(t) {
  let doPayout = mainapp.__get__('doPayout');
  let bets = [{"amount":10,"outcome":1,"type":"bet","user":"alice"},{"amount":10,"outcome":2,"type":"bet","user":"bob"}];
  let state = {"market1":{"id":1,"phaseTime":{},"bets":[{"amount":10,"outcome":1,"type":"bet","user":"alice"},{"amount":10,"outcome":2,"type":"bet","user":"bob"}],"oracles":[],"oracleOutcome":-1,"challenge":{},"voteRecords":[],"payoutRatio":1.5},"balances":{"alice":9990,"bob":9990,"carol":10000}};

  doPayout("bet", 1, bets, state);

  t.equals(state.balances.alice, 10010);
  t.equals(state.balances.bob, 9990);

  t.end();
});