var express = require('express');
const { token } = require('morgan');
var router = express.Router();


const PRIVATE_KEY = '1444d497cfd1e4a798fb53747b28514459cc7bef33911a3d0fa3163f1a67c279'

const blockchain = require( "./blockchain.js")
const utils = require( "./utils.js")
/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log(req.query);
  var Web3 = require('web3');
  var target_network_data = blockchain.get_network(req.query.chainid);
  console.log(target_network_data);
  var web3Provider = new Web3.providers.HttpProvider(target_network_data[2]);
  var web3 = new Web3(web3Provider);
  web3.eth.getBlockNumber().then((result) => {
    console.log("Latest Block is ",result);
  });
  
  web3.eth.accounts.wallet.add(PRIVATE_KEY)
  const account = web3.eth.accounts.wallet[0].address

  var all_erc721_address = blockchain.get_erc721_address(req.query.chainid);//req.query.addr;
  //to do, filter //checking mapping between erc721 address on two chains. For Proof of concept, currently maintain only 1 ERC721 address per blockchain. Dupplicate token id require manual intervention (create new erc721 contract)
  if (all_erc721_address.length == 0){
    res.send({ msg :'error: target blockchain currently not supported'});
  }
  var NFTextended_addr = all_erc721_address[0]; //proof of concept, use 1 erc721 address only.
  var htlc_wrapper_address = blockchain.get_htlc_wrapper_address(req.query.chainid);
  console.log(NFTextended_addr);

  NFT_contract = new web3.eth.Contract(blockchain.ERCExtendedABI, NFTextended_addr);
  web3.eth.getGasPrice()
  .then( gas_price => {
    console.log(gas_price);
    //new history_hash = sha(old_history + previous chain contract address)
    NFT_contract.methods.mintWithURIWithHistoryURI( account, req.query.id , utils.bufToStr(utils.sha256(req.query.back_link)), req.query.uri, req.query.history_uri ).send(
      {
        from: account,
        gas: 5000000, 
        gasPrice: gas_price,
      }).on('transactionHash', function(hash){
          console.log("txhash ", hash)

          
        })
        .on('receipt', function(receipt){
            console.log("Receipt ", receipt);
            var hash = receipt.transactionHash;
        
            res.send({ msg :'txhash ' + hash,
            explorer_link: target_network_data[3] + 'tx/'+hash,
            token_adress : NFTextended_addr,
            token_id : req.query.id,
            history_hash : utils.bufToStr(utils.sha256(req.query.history + req.query.address)),
            uri: req.query.uri,
            history_uri: req.query.history_uri
            }
        );
  
            
        })
        .on('error', function(error, receipt) {
            console.log("Error ", error)
            

        });



      });
/*
  NFT_contract.methods.ownerOf(req.query.id).call({from: account}).then(function(owner){


 

  });
*/
});

router.get('/approve', function(req, res, next) {
  console.log(req.query);
  var Web3 = require('web3');
  var target_network_data = blockchain.get_network(req.query.chainid);
  console.log(target_network_data);
  var web3Provider = new Web3.providers.HttpProvider(target_network_data[2]);
  var web3 = new Web3(web3Provider);
  web3.eth.getBlockNumber().then((result) => {
    console.log("Latest Block is ",result);
  });
  
  web3.eth.accounts.wallet.add(PRIVATE_KEY)
  const account = web3.eth.accounts.wallet[0].address
  // /erc721mint/approve?chainid=&tokenid= 
  var all_erc721_address = blockchain.get_erc721_address(req.query.chainid);//req.query.addr;

  if (all_erc721_address.length == 0){
    res.send({ msg :'error: target blockchain currently not supported'});
  }
  var NFTextended_addr = all_erc721_address[0]; //proof of concept, use 1 erc721 address only.
  var htlc_wrapper_address = blockchain.get_htlc_wrapper_address(req.query.chainid)[0];
  console.log(NFTextended_addr);

  NFT_contract = new web3.eth.Contract(blockchain.ERCExtendedABI, NFTextended_addr);

  var token_id = req.query.tokenid ; 
  console.log(htlc_wrapper_address, token_id);
  web3.eth.getGasPrice()
  .then( gas_price => {
    console.log(gas_price);
    //new history_hash = sha(old_history + previous chain contract address)
    NFT_contract.methods.approve(htlc_wrapper_address, token_id).send(
      {
        from: account,
        gas: 5000000, 
        gasPrice: gas_price,
      }).on('transactionHash', function(hash){
          console.log("txhash ", hash)

          res.send({ msg :'txhash ' + hash
              });
        })
        .on('receipt', function(receipt){
            console.log("Receipt ", receipt);
            
        
            
            res.send({ msg :'approved ' + receipt.transactionHash
              });
            
        })
        .on('error', function(error, receipt) {
            console.log("Error ", error)
            

        });



      });
/*
  NFT_contract.methods.ownerOf(req.query.id).call({from: account}).then(function(owner){


 

  });
*/
});

module.exports = router;
