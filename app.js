let lotion = require('lotion')

// initial state
// for demo purpose, we initialize the system with an opened prediction market.
let initMarket1 = {
  id: 1, // market id
  phase: "start",
  bets: [],
  oracles: [], // list of approved oracles when market is created
  oracleOutcome: -1, // for hackathon, we only have one oracle, so we makes it simple.
                    // just one single result.  outcome is specified by 1, 2, ....
                    // 0 indicate no outcome yet
  //oracleOutcomes: [], // when oracle pushes the result, it is stored here.
  challenge: {},
  voteRecords: [], // list of all vote
  // votes: {
  //   outcome1: 0,
  //   outcome2: 0,
  //   outcome3: 0,
  // }, // aggregated result of vote
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

format of vote
{
  type: "vote",
  user: "alice", // should be an address
  amount: 1000,
  outcome: 1,
}

format of distribute
{type: "distribute"}
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
app.use(txVoteHandler);
app.use(txDistributeHandler);


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
    let user = cloned.user;
    let amount = cloned.amount;
    // lock up their staking tokens
    state.balances[user] = state.balances[user] - amount;
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
    console.log("skip challenger verification and balance verification for hackathon.");
    let cloned = Object.assign({}, tx);
    console.log("challenge tx: ", cloned);
    let user = cloned.user;
    let amount = cloned.amount;
    // lock up their staking tokens
    state.balances[user] = state.balances[user] - amount;
    state.market1.challenge = cloned;
    console.log("challenge: ", state.market1.challenge);
  }
}

function txVoteHandler(state, tx, chainInfo) {
  if (tx.type === "vote") {
    console.log("skip voter verification and balance verification for hackathon");
    let cloned = Object.assign({}, tx);
    console.log("vote tx", cloned);
    let user = cloned.user;
    let amount = cloned.amount;
    let outcome = cloned.outcome;
    // lock up their staking tokens
    state.balances[user] = state.balances[user] - amount;
    state.market1.voteRecords.push(cloned);
    // update votes
    //updateVotes(outcome, amount);
    console.log("votes: ", state.market1.votes);
  }
}

function updateVotes(outcome, amount) {
  console.log("1");
  let outcomeName = 'outcome' + outcome;
  console.log("2");
  // if (! (outcome in state.market1.votes) ) {
  //   console.log("3");
  //   state.market1.votes[outcomeName] = 0;
  //   console.log("4");
  // }
  console.log("5");
  state.market1.votes[outcomeName] = state.market1.votes[outcomeName] + amount;
  console.log("6");
}

function txDistributeHandler(state, tx, chainInfo) {
  if (tx.type === "distribute") {
    // do final calculation and distribute the tokens accordingly.

    // if challenge is there
    if (Object.keys(state.market1.challenge).length > 0) {
      // take the challenge pool + voting pool
      // distribute to the winner of the voter who vote for it.
      console.log("challenge was requested");

      // sum up voting pool.
      // give it to the winners proportionally.
      let voteRecords = state.market1.voteRecords;
      console.log("1");
      let votePoolTotal = 0;
      for (let i = 0; i < voteRecords.length; i++) {
        let vote = voteRecords[i];
        //let result = {};
        //result[vote.outcome] =
        console.log("vote amount", vote.amount);
        votePoolTotal += vote.amount;
      }
      console.log("votePoolTotal: ", votePoolTotal);
      //votePoolTotal = votePoolTotal + state.market1.challenge.amount;
      // for demo purpose, just give all the pool to alice
      // sorry, demo only code here.
      state.balances['alice'] += votePoolTotal;
      console.log("distributed vote pool");
    }

    // distribute the original bet pool to the people
    console.log("5");
    let betPoolTotal = 0;
    let bets = state.market1.bets;
    for (let j = 0; j < bets.length; j++) {
      console.log("6");
      let bet = bets[j];
      betPoolTotal += bet.amount;
    }
    console.log("10");
    state.balances['alice'] += betPoolTotal;
    console.log("11");


    // if (challenged)
    //   update the final outcome according to voting results
    //   distributed the staked coins (in challenge and vote phase) according to votign results.
    // distribute coins according to result
    // condition to end phase: when everything in the phase is executed

    console.log("distribute done");
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
condition to end phase: time

** vote phase **
condition to enter phase: challenge phase completed
30. anyone can stake their coin and vote

** distribute phase **
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
