## Trustless Crosschain NFT (ERC721) Migration Demo 
  The solution is designed based on Hashed TimeLock Contract (HTLC) between two blockchains. 
  Basic Workflow (Successful Migration):
  * Each blockchain will have a gateway (a HTLC wrapper contract containing the record and methods (create,withdraw,refund) for each HTLC)
  * User will approve the gateway address for future interaction where the contract will receive user's token
  * User will call the gateway contract HTLC1.Create() with hashedlock (user keeps the secret) and timelock (can get refund after timeout), receiver of this token will be the burn address if the secret message is known.
  * The bridge service will clone the NFT on the second blockchain and also call HTLC2.Create(user's given hashedlock) and shorter timelock than the user.
  * User will use the secret message to withdraw from HTLC2 
  * The bridge will use the reveal secret to burn the token from HTLC1 (HTLC1.withdraw to burn_address). The burn address is predetermined when user create HTLC1. No body can change the destination (except refunding to user after timeout).

  If the user change his/her mind, the user should not reveal the secret and wait for timeout passed. Then the user can call HTLC1.refund() to get the token back.
### There are two main components: 
  1. Smart contracts in solidity (htlc-contracts)
  2. Webservice written in Node.js /espress.js interacting with users using Metamask (webservice)
### General Usage : 
  1. You can test each component alone. The Readme file inside each component (`htlc-contracts/README.md` and `webservice/README.md`) will tell more details about installing and running. 
  2. Private key is hardcoded in this repository for easy deployment and testing. It should only be used on testing with testnet. Dont use that private key on anything else. 
  3. Fro webservice: (Backend works best on Linux, Node.js). Frontend requires  browser with Metamask installed and added configurations of the supported blockchain.  
  
### Demo video and demo transaction on public testnet: 
  The demo video of the webserivce can be viewed here: [https://youtu.be/shXWVofKmcE](https://youtu.be/shXWVofKmcE). The transaction information and demo viewing assets on OpenSea is included in the video description 
