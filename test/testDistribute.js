let rewire = require('rewire');
let test = require('tape');

let mainapp = rewire('../app.js');

test('test distribute for no-vote situation', function(t) {
  let txDistributeHandler = mainapp.__get__('txDistributeHandler');

  let state = {"market1":{"id":1,"phaseTime":{},"bets":[{"amount":10,"outcome":1,"type":"bet","user":"alice"},{"amount":10,"outcome":2,"type":"bet","user":"bob"}],"oracles":[],"oracleOutcome":1,"challenge":{},"voteRecords":[],"payoutRatio":1.5},"balances":{"alice":9990,"bob":9990,"carol":10000}};
  let tx = {"type": "distribute"};
  let chainInfo = {height: 0}; // not used when we are in test mode that does not check for phase

  txDistributeHandler(state, tx, chainInfo);

  t.equal(state.balances.alice, 10010);
  t.equal(state.balances.bob, 9990);

  t.end();
});

test('test distribute for situation with vote', function(t) {
  let txDistributeHandler = mainapp.__get__('txDistributeHandler');

  let state = 
  {
    "market1": {
      "id": 1,
      "phaseTime": {
        
      },
      "bets": [
        {
          "amount": 10,
          "outcome": 1,
          "type": "bet",
          "user": "alice"
        },
        {
          "amount": 10,
          "outcome": 2,
          "type": "bet",
          "user": "bob"
        }
      ],
      "oracles": [
        
      ],
      "oracleOutcome": 2,
      "challenge": {
        "amount": 100,
        "type": "challenge",
        "user": "alice"
      },
      "voteRecords": [
        {
          "amount": 1000,
          "outcome": 1,
          "type": "vote",
          "user": "alice"
        },
        {
          "amount": 10,
          "outcome": 2,
          "type": "vote",
          "user": "bob"
        },
        {
          "amount": 1000,
          "outcome": 1,
          "type": "vote",
          "user": "carol"
        },
        {
          "amount": 1000,
          "outcome": 1,
          "type": "vote",
          "user": "alice"
        }
      ],
      "payoutRatio": 1.5
    },
    "balances": {
      "alice": 7890,
      "bob": 9980,
      "carol": 9000
    }
  }
  ;

  let tx = {"type": "distribute"};
  let chainInfo = {height: 0}; // not used when we are in test mode that does not check for phase

  txDistributeHandler(state, tx, chainInfo);

  // alice balance should be ~9896.66666666666666666666
  // tbd: worry about rounding
  t.true(state.balances.alice >= 9916.6666 && state.balances.alice <= 9916.6667, "check alice balances is correct");
  t.equals(state.balances.bob, 9980);
  t.equals(state.balances.carol, 10003.33333333333333333333);
  

  t.end();
});