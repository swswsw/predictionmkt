let rewire = require('rewire');
let test = require('tape');

let mainapp = rewire('../app.js');

test('test doPayout for bets', function(t) {
  let doPayout = mainapp.__get__('doPayout');

  let bets = [{"amount":10,"outcome":1,"type":"bet","user":"alice"},{"amount":10,"outcome":2,"type":"bet","user":"bob"}];
  let state = {"market1":{"id":1,"phaseTime":{},"bets":[{"amount":10,"outcome":1,"type":"bet","user":"alice"},{"amount":10,"outcome":2,"type":"bet","user":"bob"}],"oracles":[],"oracleOutcome":-1,"challenge":{},"voteRecords":[],"payoutRatio":1.5},"balances":{"alice":9990,"bob":9990,"carol":10000}};

  doPayout("bet", 1, bets, state);

  t.equals(state.balances.alice, 10010);
  t.equals(state.balances.bob, 9990);

  t.end();
});

test('test doPayout for votes', function(t) {
  let doPayout = mainapp.__get__('doPayout');

  let votes = 
  [
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
  ]
  ;

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

  doPayout("vote", 1, votes, state);

  // alice balance should be ~9896.66666666666666666666
  // tbd: worry about rounding
  t.true(state.balances.alice >= 9896.6666 && state.balances.alice <= 9896.6667, "check alice balances is correct");
  t.equals(state.balances.bob, 9980);
  t.equals(state.balances.carol, 10003.33333333333333333333);
  

  t.end();
});