## HTLC contracts and ERC721 Extension 
  This part contains the contracts that should be deployed on the blockchain. 
  They can be tested using ganache testnet locally. 
  The test is written on two HTLC wrappers on a single blockchain (This will behave similar to how 2 htlcs on two blockchain should work). For multiple blockchain please use the webservice. 
## Run Tests

* Install Nodejs and npm [sample guide for linux](https://linuxhint.com/install-node-js-npm-ubuntu-s20-04/)
* Install ganache-cli, type: `npm install -g ganache-cli`
* Start [Ganache](https://www.trufflesuite.com/ganache) with network ID `4447`
* Run the [Truffle](https://www.trufflesuite.com/truffle) tests

Commands to use: 

$ cd to the current directory (htlc-contracts)
```
$ npm install
$ npm run ganache-start
$ npm run test
```

## Migration & deploy to real blockchain 
  Truffle-config.js contains the privatekey of a test account and 3 public testnet configuration. Please edit these information before running the command below to deploy.
 
  Deploy command: `truffle migrate --network binance_test`
  
   `binance_test` is the network in truffle-config.js. You can replace it with other networks.
