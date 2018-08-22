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

> curl -X POST http://localhost:3000/txs -d '{"type": "start", "marketId": "market2"}'

> curl -X POST http://localhost:3000/txs -d '{"type": "bet", "marketId": "market2", "outcome": 1, "amount": 10, "user": "alice"}'

> curl -X POST http://localhost:3000/txs -d '{"type": "bet", "marketId": "market2", "outcome": 2, "amount": 10, "user": "bob"}'

> curl -X POST http://localhost:3000/txs -d '{"type": "oracle", "marketId": "market2", "outcome": 2}'

> curl -X POST http://localhost:3000/txs -d '{"type": "challenge", "marketId": "market2", "user": "alice", "amount": 100}'

> curl -X POST http://localhost:3000/txs -d '{"type": "vote", "marketId": "market2", "user": "alice", "amount": 1000, "outcome": 1}'

> curl -X POST http://localhost:3000/txs -d '{"type": "vote", "marketId": "market2", "user": "bob", "amount": 10, "outcome": 2}'

> curl -X POST http://localhost:3000/txs -d '{"type": "vote", "marketId": "market2", "user": "carol", "amount": 1000, "outcome": 1}'

> curl -X POST http://localhost:3000/txs -d '{"type": "distribute", "marketId": "market2"}'


## update
