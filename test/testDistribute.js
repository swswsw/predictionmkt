let rewire = require('rewire');
let test = require('tape');
let {signTx} = require('./testCommon.js');

let mainapp = rewire('../app.js');

test('test distribute for no-vote situation', function(t) {
  let txDistributeHandler = mainapp.__get__('txDistributeHandler');

  let state = {"market":{"market1":{"id":"","phaseTime":{},"bets":[],"oracles":[],"oracleOutcome":-1,"voteRecords":[],"payoutRatio":1.5},"market2":{"id":"market2","phaseTime":{"marketStart":9,"marketEnd":3609,"oracleStart":3610,"oracleEnd":7210,"challengeStart":7211,"challengeEnd":10811,"voteStart":10812,"voteEnd":14412,"distributeStart":14413,"distributeEnd":18013},"bets":[{"amount":10,"marketId":"market2","outcome":1,"type":"bet","user":"alice"},{"amount":10,"marketId":"market2","outcome":2,"type":"bet","user":"bob"}],"oracles":[],"oracleOutcome":1,"voteRecords":[],"payoutRatio":1.5,"storage":{},}},"balances":{"alice":9990,"bob":9990,"carol":10000},"seq":{}};
  let tx = {"type": "distribute", "marketId": "market2"};
  let privAlice = Buffer.from("ebca1fcfba3e09e865613a87a3814813ab932936885c1b0495f1c05c7e21b1fc", "hex"); // alice's private key
  let sequence = 0;
  signTx(tx, privAlice, sequence); // need to add signature to tx
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
    "market": {
      "market1": {
        "id": "",
        "phaseTime": {
          
        },
        "bets": [
          
        ],
        "oracles": [
          
        ],
        "oracleOutcome": -1,
        "voteRecords": [
          
        ],
        "payoutRatio": 1.5
      },
      "market2": {
        "id": "market2",
        "phaseTime": {
          "marketStart": 13,
          "marketEnd": 3613,
          "oracleStart": 3614,
          "oracleEnd": 7214,
          "challengeStart": 7215,
          "challengeEnd": 10815,
          "voteStart": 10816,
          "voteEnd": 14416,
          "distributeStart": 14417,
          "distributeEnd": 18017
        },
        "bets": [
          {
            "amount": 10,
            "marketId": "market2",
            "outcome": 1,
            "type": "bet",
            "user": "alice"
          },
          {
            "amount": 10,
            "marketId": "market2",
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
          "marketId": "market2",
          "type": "challenge",
          "user": "alice"
        },
        "voteRecords": [
          {
            "amount": 1000,
            "marketId": "market2",
            "outcome": 1,
            "type": "vote",
            "user": "alice"
          },
          {
            "amount": 10,
            "marketId": "market2",
            "outcome": 2,
            "type": "vote",
            "user": "bob"
          },
          {
            "amount": 1000,
            "marketId": "market2",
            "outcome": 1,
            "type": "vote",
            "user": "carol"
          },
          {
            "amount": 1000,
            "marketId": "market2",
            "outcome": 1,
            "type": "vote",
            "user": "alice"
          }
        ],
        "payoutRatio": 1.5,
        "storage": {},
      }
    },
    "balances": {
      "alice": 7890,
      "bob": 9980,
      "carol": 9000
    },
    "seq":{

    },
  }
  ;

  let tx = {"type": "distribute", "marketId": "market2"};
  let privAlice = Buffer.from("ebca1fcfba3e09e865613a87a3814813ab932936885c1b0495f1c05c7e21b1fc", "hex"); // alice's private key
  let sequence = 0;
  signTx(tx, privAlice, sequence); // need to add signature to tx
  let chainInfo = {height: 0}; // not used when we are in test mode that does not check for phase

  txDistributeHandler(state, tx, chainInfo);

  // alice balance should be ~9896.66666666666666666666
  // tbd: worry about rounding
  t.true(state.balances.alice >= 9916.6666 && state.balances.alice <= 9916.6667, "check alice balances is correct");
  t.equals(state.balances.bob, 9980);
  t.equals(state.balances.carol, 10003.33333333333333333333);
  

  t.end();
});