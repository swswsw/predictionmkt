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

test('test calling distribute again. distribute can only be called once.', function(t) {
  let txDistributeHandler = mainapp.__get__('txDistributeHandler');

  // storage.payouts is in the state,
  // which indicates that distribute is called.  
  let state = 
  {
    "market": {
      "m1537251525926": {
        "id": "m1537251525926",
        "phaseTime": {
          "challengeEnd": 10811,
          "challengeStart": 7211,
          "distributeEnd": 18013,
          "distributeStart": 14413,
          "marketEnd": 3609,
          "marketStart": 9,
          "oracleEnd": 7210,
          "oracleStart": 3610,
          "voteEnd": 14412,
          "voteStart": 10812
        },
        "bets": [
          {
            "amount": 10,
            "marketId": "m1537251525926",
            "outcome": 1,
            "type": "bet",
            "user": "5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj"
          },
          {
            "amount": 10,
            "marketId": "m1537251525926",
            "outcome": 2,
            "type": "bet",
            "user": "9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL"
          }
        ],
        "oracles": [
          
        ],
        "oracleOutcome": 2,
        "voteRecords": [
          
        ],
        "payoutRatio": 1.5,
        "storage": {
          "distribution": {
            "betPoolTotal": "20",
            "winnerPoolTotal": "10"
          },
          "payouts": [
            {
              "user": "9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL",
              "betAmount": "10",
              "payoutAmount": "20"
            }
          ]
        },
        "startInfo": {
          "oracle": [
            "9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL",
            "5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj"
          ],
          "oracleMeta": "http:\/\/data.com\/oracleinfo",
          "outcomes": [
            "england",
            "italy",
            "brazil",
            "germany"
          ],
          "phaseTime": {
            "challengeEnd": 10811,
            "challengeStart": 7211,
            "distributeEnd": 18013,
            "distributeStart": 14413,
            "marketEnd": 3609,
            "marketStart": 9,
            "oracleEnd": 7210,
            "oracleStart": 3610,
            "voteEnd": 14412,
            "voteStart": 10812
          },
          "question": "Who will win FIFA 2018?"
        }
      }
    },
    "balances": {
      "5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj": 9990,
      "9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL": 10010,
      "t6bUAUxNh8xoZzt6YZdQn27J4DSiR2oH": 10000
    },
    "seq": {
      "5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj": 1,
      "9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL": 3
    }
  }
  ;

  let tx = {"type": "distribute", "marketId": "m1537251525926"};
  let privAlice = Buffer.from("ebca1fcfba3e09e865613a87a3814813ab932936885c1b0495f1c05c7e21b1fc", "hex"); // alice's private key
  let sequence = 0;
  signTx(tx, privAlice, sequence); // need to add signature to tx
  let chainInfo = {height: 0}; // not used when we are in test mode that does not check for phase

  txDistributeHandler(state, tx, chainInfo);

  // the state contains storage.payouts.  which means distribute has already completed.
  // so calling distribute again should receive an error.
  // the balance should be the same as before.  
  t.equals(state.balances["5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj"], 9990, "alice balance");
  t.equals(state.balances["9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL"], 10010, "bob balance");
  t.equals(state.balances["t6bUAUxNh8xoZzt6YZdQn27J4DSiR2oH"], 10000, "carol balance");
  

  t.end();
});