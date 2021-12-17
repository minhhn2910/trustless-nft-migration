This webservice implements:
1. The server listening on bridging tx and issue burn tx after knowing the secret to unlock the burn from the original htlc contract
2. The frontend allowing users to interact with the service using Metamask and web3js on browser. 

### Running the server 
#### Requirement
  * Node.js and npm
  * Browser with Metamask extension installed. 
  * nodemon (optional) 

#### Step to run the server: 
  
   cd to the current directory
  ```
  npm install
  ````
  run either: 
  ```
    node ./bin/www start
  ``` 
  or 
  
  ```
    npm install -g nodemon 
    nodemon start 
  ```
#### Step to interact with the frontend 

1. Open the browser and go to : localhost:3000/ 
2. Connect to a blockchain network using metamask 
3. Input NFT infomation (Contract address and NFTid) 
4. Click "View NFT Extended" or "View NFT Standard", One of them will work (correct contract ABI) and will show the NFT information (URI, id, owner )
5. Approve the token to be used by the bridge contract : click Approve token and wait until the status says "approved" 
6. Select the target blockchain on the dropdown list (top right corner) => Click Request Cloning NFT on the second chain  
7. After the tx is confirmed. Click randomize hashlock on the HTLC form (to create an secret and hash(secret) pair. If the user does not trust the webservice, the user can use a third party to generate this pair and input the hashlock. 
8. The user may change the timelock (default 10minutes). After confirming to the migration, click Create new HTLC  to create the HTLC1 on the original blockchain. 
9. After the tx is confirmed. The user will cick Next Step, requesting the server to create its side of the HTLC on the target blockchain (HTLC2) . 
10. User waits for the HTLC2 to be confirmed. The browser will alert user to switch blockchain. User switch blockchain on Metamask. 
11. User click withdraw. The withdraw will be ininitated with the cached secret on browser. The bridge will then burn the original NFT on the original blockchain. 

Some other use cases: 
1. NFT viewer can be used to view any NFT token and address 
2. HTLC viewer can be used to view the status any other HTLC with given ID that maynot related to this htlc migration 
3. If the user refresh the browser or click View HTLC on step 11 before withdrawing. The user needs to input the secret (cached input is gone) and the htlc id again before he/she can click withdraw. 
4. If the user changes his/her mind and do not want to migrate. The user must not process with step 11. Instead the user waits for timeout (default 10min) and click refund. 

### Limitations :
* This demo may not support arbitrary NFT collections and arbitrary ERC721 Contract due to difference in contract ABI. We only support openzepellin ERC721 interface [https://github.com/OpenZeppelin/openzeppelin-contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) and our ERC721Extension in the htlc-contracts folder
* Known Bug and workaround : If the user wants to migrate token with ID1 and the target blockchain's NFT contract already has ID1 minted, The workflow will fail. The complete product will check this condition and automatically deploy new contract and store in database. We workaround this problem by starting over with either of the below : 
 
   * Test minting and migrating another token with different id (some random high number )
   * OR Deploy a new ERC721 contract and put it in the first place hardcoded list of the server_side `routes/blockchain.js` 
   
   
* This demo is not optimized or secured, it should only work as a proof of concept and should not be used in production
* Better design should avoid spamming user and should concern about gas usage. 
* Currently only 3 blockchains are supported. It can be easily extended by adding more information (RPC link, explorer link , deployed ERC721 addresses to mint, deployed HTLC Wrapper address) into the `routes/blockchain.js` file 

