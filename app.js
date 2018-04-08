let lotion = require('lotion')

// initial state
// for demo purpose, we initialize the system with an opened prediction market.
let initMarket1 = {
  id: 1, // market id
  phase: "start",
  bets: [],
  oracles: [], // list of approved oracles when market is created
  oracleOutcome: 0, // for hackathon, we only have one oracle, so we makes it simple.
                    // just one single result.  outcome is specified by 1, 2, ....
                    // 0 indicate no outcome yet
  //oracleOutcomes: [], // when oracle pushes the result, it is stored here.
  challenge: {},
  payoutRatio: 1.5,

}

let initialState = {
  market1: initMarket1,
  balances: {
    'alice': 10000,
    'bob': 10000,
    'carol': 10000,
  },
}

//

/*
format of bets
{
type: "bet",
user: "alice", // should be an address
amount: 100, // may allow multi token later
outcome: 1, // user bets on outcome 1,2,3, or...

}

format of challenge
{
  type: "challenge",
  user: "alice", // should be an address
  amount: 100,
}
*/

let app = lotion({
  initialState: initialState,
  devMode: true
})

app.use(txHandler1);
app.use(txHandler2);
app.use(txBetHandler);
app.use(txOracleHandler);
app.use(txChallengeHandler);


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
    console.log("oracle tx: ", cloned);
    state.market1.oracleOutcome = cloned.outcome;
    console.log("oracleOutcome: ", state.market1.oracleOutcome);
  }
}

function txChallengeHandler(state, tx, chainInfo) {
  if (tx.type === "challenge") {
    console.log("should check that this is actually sent by the challenger.  and challenger's balance is fine");
    let cloned = Object.assign({}, tx);
    console.log("challenge tx: ", cloned);
    let user = cloned.user;
    let amount = cloned.amount;
    state.balances[user] = state.balances[user] - amount;
    state.market1.challenge = cloned;
    console.log("challenge: ", state.market1.challenge);
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
