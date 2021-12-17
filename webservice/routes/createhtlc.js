var express = require('express');
var router = express.Router();

const nowSeconds = () => Math.floor(Date.now() / 1000)

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

  /*var request_str = '?chainid='+target_chain_id+'&old_chainid='+HTLCFORM.source_blockchain_hidden_id.value+'&token_id='+target_token_id+'&hash_lock='+ 
            HTLCFORM.hash_lock.value + '&time_lock=' + HTLCFORM.time_lock.value + '&receiver=' + accounts[0] ; */
  console.log(htlc_wrapper_address);
  var HTLCWrapper_contract = new web3.eth.Contract(blockchain.HTLCWrapperABI, htlc_wrapper_address[0]);
  web3.eth.getGasPrice()
  .then( gas_price => {
    console.log(gas_price);

    time_lock = nowSeconds() + time_lock ; //lock how long from now;
    
    var  receiver = req.query.receiver;
    var hash_lock = req.query.hash_lock;
    var time_lock = req.query.time_lock / 2 + nowSeconds();
    var token_address = NFTextended_addr;
    var token_id = req.query.token_id;
    var forward_link = utils.bufToStr(utils.sha256(""));
    console.log(receiver,
                  hash_lock,
                  time_lock,
                  token_address,
                  token_id,
                  forward_link);
    HTLCWrapper_contract.methods.newContract(
      receiver,
      hash_lock,
      time_lock,
      token_address,
      token_id,
      forward_link
    ).send(
      {
        from: account,
        gas: 5000000, 
        gasPrice: gas_price,
      }).on('transactionHash', function(hash){
        console.log("txhash ", hash)
      })
      .on('receipt', function(receipt){
          console.log("Receipt ", receipt)


          const contractId = receipt.events.HTLCERC721New.returnValues.contractId;
          console.log("HTLCid ",contractId);
          res.send({ msg :' success ' ,
                htlc_id:  contractId,
                explorer_link: target_network_data[3] + 'tx/'+receipt.transactionHash,
              });
      })
      .on('error', function(error, receipt) {
          console.log("Error ", error)
          res.send({ msg :' htlc create   error ' +  error 
              });
      });

    });

    
/*
  NFT_contract.methods.ownerOf(req.query.id).call({from: account}).then(function(owner){


 

  });
*/
});


router.get('/burn', function(req, res, next) {
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
  
  var htlc_wrapper_address = blockchain.get_htlc_wrapper_address(req.query.chainid);

  /*var request_str = '?chainid='+chain_id+'+ '&htlc=' + htlc_id + '&secret=' + secret ; */
  console.log(htlc_wrapper_address);
  var HTLCWrapper_contract = new web3.eth.Contract(blockchain.HTLCWrapperABI, htlc_wrapper_address[0]);
  web3.eth.getGasPrice()
  .then( gas_price => {
    console.log(gas_price);


    var htlc_id = req.query.htlc;
    var secret = req.query.secret;
    console.log(req.query.chainid, htlc_id,secret);
    HTLCWrapper_contract.methods.withdraw(
      htlc_id,
      secret
    ).send(
      {
        from: account,
        gas: 5000000, 
        gasPrice: gas_price,
      }).on('transactionHash', function(hash){
        console.log("txhash ", hash)
      })
      .on('receipt', function(receipt){
          console.log("Receipt ", receipt)
          res.send({ msg :' success ' ,
                tx_id:  receipt.transactionHash,
                explorer_link: target_network_data[3] + 'tx/'+receipt.transactionHash,
              });
      })
      .on('error', function(error, receipt) {
          console.log("Error ", error)
          //res.send({ msg :' htlc burn   error ' +  error 
          //    });
      });

    });

    
/*
  NFT_contract.methods.ownerOf(req.query.id).call({from: account}).then(function(owner){


 

  });
*/
});



module.exports = router;
