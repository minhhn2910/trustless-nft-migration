## Trustless Crosschain NFT (ERC721) Migration Demo 
  The solution is designed based on Hashed TimeLock Contract (HTLC) between two blockchains. 
  Basic Workflow (Successful Migration):
  * Each blockchain will have a gateway (a HTLC wrapper contract containing the record and methods (create,withdraw,refund) for each HTLC)
  * User will approve the gateway address for future interaction where the contract will receive user's token
  * User will call the gateway contract HTLC1.Create() with hashedlock (user keeps the secret) and timelock (can get refund after timeout), receiver of this token will be the burn address if the secret message is known.
  * The bridge service will clone the NFT2 on the second blockchain and also call HTLC2.Create(user's given hashedlock) and shorter timelock than the user. The HTLC contract will send NFT2 to the user if secret is known before timeout.
  * User will use the secret message to withdraw from HTLC2. By doing so, the original secret is known publicly
  * The bridge will use the revealed secret to burn the token from HTLC1 (HTLC1.withdraw to burn_address). The burn address is predetermined when user create HTLC1. No body can change the destination (except refunding to user after timeout).
  * The workflow (both sucess and refund) is demonstrated in the test script : `./htlc-contracts/test/htlcERC721Migration.js`

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
  
  
### Data structure and function for interacting with each HTLC entry in the HTLCWrapper contract: 
```
struct LockContract {
        address sender;  // the Sender to receive the token after timeout 
        address receiver; // The receiver if the preimage is known
        address tokenContract; //ERC721 token address
        uint256 tokenId; // ERC721 token id
        bytes32 hashlock; // the hashlock 
        // locked UNTIL this time. Unit depends on consensus algorithm. Generally seconds in ethereum-like networks
        uint256 timelock;
        bool withdrawn; //withdraw can either mean burn or withdraw. Burn => receiver = 0x00 or 0x01
        bool refunded; 
        bytes32 preimage; // The secret used to create the hashlock : hashlock = sha256(preimage)
        uint256 blocknumber; //store the blocknumber when the final tx is finalized (either withdraw or refund). For faster retreiving  & verifying
        bytes32 forwardlink; //store the  forwardlink to the contract on the next blockchain. Because the next address maynot be the same format as on this blockchain. It should be in hashed form (type byte32 instead of address)
}
```

```
  function newContract(
        address _receiver,
        bytes32 _hashlock,
        uint256 _timelock,
        address _tokenContract,
        uint256 _tokenId,
        bytes32 _forwardlink //link to the contract in the next blockchain (if applicable)
    )
```
```
 function withdraw(bytes32 _contractId, bytes32 _preimage)
 function refund(bytes32 _contractId)
 function getContract(bytes32 _contractId)
```
### Extra Data and Extension for ERC721 to Verify identity : 

```
      // hash of the migration history path in this order "contract_addr1, chain_name1, contract_addr2, chain_name2"
      // NFT.id remains the same during its history
      // NFT.URI remains the same
      // use for verifying the authenticity of the NFT history

      mapping(uint256 => bytes32) private migration_history;

      // Optional. User can just keep the history raw data on a separate document and provide when necessary for verification.
      // URL for storing the history string publicly for everyone to verify. The content must be mutable (append new history after each migration to a new chain)
      // The string may be long (e.g. after more than 10 migrations between blockchains). Thus, a public URL is the way to conserve space
      mapping(uint256 => string) private _historyURIs;
```

```
 Other methods please refer to the file : trustless-nft-migration/htlc-contracts/contracts/ERC721Extension.sol
```
