let lotion = require('lotion')

// initial state
let initMarket1 = {
  id: 1, // market id
  phase: "start",
  bets: [],
  oracles: [], // list of approved oracles when market is created
  oracleOutcome: 0, // for hackathon, we only have one oracle, so we makes it simple.
                    // just one single result.  outcome is specified by 1, 2, ....
                    // 0 indicate no outcome yet
  //oracleOutcomes: [], // when oracle pushes the result, it is stored here.
  // tokens: [
  //
  // ]
  payoutRatio: 1.5,

}

//

/*
format of bets
{
type: "bet",
user: "alice", // should be an address
amount: 3, // may allow multi token later
outcome: 1, // user bets on outcome 1,2,3, or...

}
*/

let app = lotion({
  initialState: {
    market1: initMarket1
  },
  devMode: true
})

app.use(txHandler1);
app.use(txHandler2);
app.use(txBetHandler);
app.use(txOracleHandler);

app.listen(3000).then(function(appInfo) {
  console.log(appInfo);
})


function txHandler1(state, tx, chainInfo) {
  console.log("tx: ", tx);
  //console.log(chainInfo);
}

function txHandler2(state, tx, chainInfo) {
  console.log("block height: ", chainInfo.height);
}

function txBetHandler(state, tx, chainInfo) {
  if (tx.type === "bet") {
    let cloned = Object.assign({}, tx);
    console.log("bet: ", cloned);
    state.market1.bets.push(cloned);
    console.log("bets: ", state.market1.bets);
  }
}

function txOracleHandler(state, tx, chainInfo) {
  if (tx.type === "oracle") {
    console.log("should check oracle identity, but that checking is skipped for hackathon.");
    let cloned = Object.assign({}, tx);
    console.log("oracle outcome: ", cloned);
    state.market1.oracleOutcome = tx.outcome;
    console.log("oracleOutcome: ", state.market1.oracleOutcome);
  }
}

function txChallengePhase(state, tx, chainInfo) {
  if (tx.type === "challenge") {
    console.log("should check challenger actually owns the staking tokens");

  }
}
/*

prediction market


** market phase **
1. open new market
2. allow bet
3. someone bets (record them)
4. market closes (by time)

** oracle phase **
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


** other info **
time is not actual time.  it is block height
*/
