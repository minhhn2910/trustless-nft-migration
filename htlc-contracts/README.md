## HTLC contracts and ERC721 Extension 
  This part contains the contracts that should be deployed on the blockchains. 
  They can be tested using ganache testnet locally. 
  The test is written on two HTLC wrappers on a single blockchain (This will behave similar to how 2 htlcs on two blockchains should work). For multiple blockchain please use the webservice. 
  
  The tests: 
  * `htlc-contracts/test/wrapper/htlcErc721-wrapper-test.js` tests the interface to both HTLC Wrapper contract and ERC721 Extension Contract. 
  * `htlc-contracts/test/htlcERC721Migration.js` tests 2 migration screnarios : 
      * Sucessful withdrawal on both side.
      * Alice  and the Bridge both get the refund token back after timeout.
   
  The contracts: 
  * `htlc-contracts/contracts/HashedTimelockERC721.sol` Wrapper for all hashed time lock contract instances in a blockchain. It will contain multiple entries of HTLC which can be created, retrieved and interacted by anyone with a unique `id` for each `HTLC`.
  * `htlc-contracts/contracts/ERC721Extension.sol` The extension for ERC721 standard to include the migration history information for verification.
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
