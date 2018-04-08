** prediction market **


** market phase **
1. open new market
2. allow bet
3. someone bets (record them)
4. market closes (by time)

** resolve phase **
condition to enter phase: time
10. get data from oracle
11. determine the result and record it
condition to end phase: time

** challenge phase **
condition to enter phase: time, someone triggers it
20. someone stake their coin and challenges
21. anyone can now submit a vote
condition to end phase: time

** vote phase **
condition to enter phase: challenge phase completed
30. anyone can stake their coin and vote

** final phase **
condition to enter phase: time
40. determine the final outcome
if (challenged)
  update the final outcome according to voting results
  distributed the staked coins (in challenge and vote phase) according to votign results.
distribute coins according to result
condition to end phase: when everything in the phase is executed
