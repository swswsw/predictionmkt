prediction market
=======================

## market phase
1. open new market
2. allow bet
3. someone bets (record them)
4. market closes (by time)

## resolve phase

condition to enter phase: time

10. get data from oracle
11. determine the result and record it

condition to end phase: time

## challenge phase

condition to enter phase: time, someone triggers it

20. someone stake their coin and challenges

condition to end phase: time

## vote phase

condition to enter phase: challenge phase completed

30. anyone can stake their coin and vote

condition to end phase: time

## distribute phase
condition to enter phase: time

40. determine the final outcome

```
if (challenged)
  update the final outcome according to voting results
  distributed the staked coins in voting pool according to voting results.
distribute betting pool coins according to outcome
```

condition to end phase: when everything in the phase is executed




## note

the time of the phase is indicated by block height.  since we have finality, the
phase start and stop block can be next to each other.  in other ledger that
lacks finality, we should reserve more time (several blocks) between each phase.  


the distribute algorithm is not yet implemented correctly.



run
> node app.js


test invocation:

it is possible to do test invocation using curl.  however, you will need to supply signature yourself.  
it is recommended to use test/testCommon.js complexSendTx(), which will handle the signature, pubkey, and sequence.  

for example of test invocation, please see test/testIntegrate2.js

--------

if you need to use curl to send a tx, you need to supply from.pubkey, from.signature, from.sequence, and to.  the format is as follows.
> curl -X POST http://localhost:3000/txs -d '{"type": "verifySig", "from": { "pubkey": "rewlkjrlw", "signature": "rewlkajrlewk", "sequence": 0 }, "to": {} }'

all of the tx will need from and to.  however, for brevity purpose, they are omitted in the following calls:

> curl -X POST http://localhost:3000/txs -d '{"type": "start", "marketId": "market2", "startInfo": ...}'

example startInfo:
```
  "startInfo": {
      "question": "Who will win FIFA 2018?",
      "outcomes": [
        "england",
        "italy",
        "brazil",
        "germany"
      ],
      "oracle": ["9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL","5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj"], // addresses of approved oracles
      // meta data about oracle.  eg. description
      "oracleMeta": "http://data.com/oracleinfo",
      "phaseTime":{
        "marketStart":9,"marketEnd":3609,
        "oracleStart":3610,"oracleEnd":7210,
        "challengeStart":7211,"challengeEnd":10811,
        "voteStart":10812,"voteEnd":14412,
        "distributeStart":14413,"distributeEnd":18013
      },
    }
```

> curl -X POST http://localhost:3000/txs -d '{"type": "bet", "marketId": "market2", "outcome": 1, "amount": 10, "user": "5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj"}'

> curl -X POST http://localhost:3000/txs -d '{"type": "bet", "marketId": "market2", "outcome": 2, "amount": 10, "user": "9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL"}'

> curl -X POST http://localhost:3000/txs -d '{"type": "oracle", "marketId": "market2", "outcome": 2}'

> curl -X POST http://localhost:3000/txs -d '{"type": "challenge", "marketId": "market2", "user": "5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj", "amount": 100}'

> curl -X POST http://localhost:3000/txs -d '{"type": "vote", "marketId": "market2", "user": "5wvwWgKP3Qfw1akQoXWg4NtKmzx5v4dTj", "amount": 1000, "outcome": 1}'

> curl -X POST http://localhost:3000/txs -d '{"type": "vote", "marketId": "market2", "user": "9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL", "amount": 10, "outcome": 2}'

> curl -X POST http://localhost:3000/txs -d '{"type": "vote", "marketId": "market2", "user": "9x2yu6AzwWphm3j6h9pTaJh63h5ioG8RL", "amount": 1000, "outcome": 1}'

> curl -X POST http://localhost:3000/txs -d '{"type": "distribute", "marketId": "market2"}'

for example of sending token to another address, see test/testSend.js for example of tx format.

## update
