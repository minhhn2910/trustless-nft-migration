/*global ethereum, MetamaskOnboarding */

//import Web3 from 'web3';
//import MetaMaskOnboarding from '@metamask/onboarding'
//import mergeImages from '/merge-images'

const forwarderOrigin = 'http://localhost:9010'
const contractStatus = document.getElementById('contractStatus')
const claimButton = document.getElementById('claimButton')
var accounts = [];
var tx_data ;
var claim_acc_final ;
var HTLC1Address;
var HTLC2Address;
var chain1_id;
var chain2_id;
var chain_id ; //the current connected chain
var global_NFTextended;
var global_NFTBase;
var global_HTLCWrapper;

var global_original_nft_address;
var global_original_chain_name;

var global_debug ; 

var global_currentNFTContract;

var global_HTLCWrapper_address;

const supported_network = {
  1:["ETH","Ethereum Mainnet"],
  4:["ETHR","Ethereum Rinkeby"],
  56: ["BSC","Binance Smart Chain MainNet"],
  97:["BSCT","Binance Smart Chain TestNet"],
  128: ["HTM", "Huobi ECO Chain Mainnet"],
  256: ["HTT", "Huobi ECO Chain TestNet"],
  137:["POLY","Polygon Mainnet"],
  80001:["POLYT","Polygon Mumbai Testnet"],
}

//helper functions
const nowSeconds = () => Math.floor(Date.now() / 1000)


const txGas = (txReceipt, gasPrice = defaultGasPrice) => web3.utils.toBN(txReceipt.receipt.gasUsed * gasPrice)
const txLoggedArgs = txReceipt => txReceipt.logs[0].args
const txContractId = txReceipt => txLoggedArgs(txReceipt).contractId

const htlcERC721ArrayToObj = c => {
  return {
    sender: c[0],
    receiver: c[1],
    token: c[2],
    tokenid: c[3],
    hashlock: c[4],
    timelock: c[5],
    withdrawn: c[6],
    refunded: c[7],
    preimage: c[8],
    blocknumber: c[9],
    forwardlink: c[10],
  }
}


function get_random32byte_hexstring(){

    //var hex_char = ['a','b','c','d','e','f','0','1','2','3','4','5','6','7','8','9'];
    var result = '0x';
    var hex_char = new Uint8Array(32);
    window.crypto.getRandomValues(hex_char);
    for (var i = 0; i < hex_char.length; i++) {
      var temp = hex_char[i].toString(16);
      if (temp.length == 1)
        result += '0'+temp
      else
        result += temp
    }
    return result;

}


function fetch_NFT_data_and_update(contract_address,id){

    //fetch_NFT_data_and_update
}
function getNetworkName(chainID){
    networks = {
        1:["ETH","Ethereum Mainnet"],
        4:["ETHR","Ethereum Rinkeby"],
        56: ["BSC","Binance Smart Chain MainNet"],
        97:["BSCT","Binance Smart Chain TestNet"],
        128: ["HTM", "Huobi ECO Chain Mainnet"],
        256: ["HTT", "Huobi ECO Chain TestNet"],
        137:["POLY","Polygon Mainnet"],
        80001:["POLYT","Polygon Mumbai Testnet"],
    }
    if (chainID in networks)
      return networks[chainID];
    else
      return ["UNKW","Unknown Network"];
}
function getHTLC_Address_fromNetwork(chainID){
  //todo : deploy HTLCERC721 Wrapper contracts to these networks and fill in the contract address
  networks = {
      1: "0x0000000000000000000000000000000000000000",
      4: "0xAC59E1b5eb3d27c76423CbbD4e9880ab36FaCDd1",
      56: "0x0000000000000000000000000000000000000000",
      97: "0xAC59E1b5eb3d27c76423CbbD4e9880ab36FaCDd1",
      128: "0x0000000000000000000000000000000000000000",
      256: "0x0000000000000000000000000000000000000000",
      137: "0x0000000000000000000000000000000000000000",
      80001: "0xAC59E1b5eb3d27c76423CbbD4e9880ab36FaCDd1",
  }
  if (chainID in networks)
    return networks[chainID];
  else
    return ["UNKW","Unknown Network"];
}

function get_sha256(string) {

    const hashHex =  CryptoJS.SHA256(string).toString();
    return '0x' + hashHex;

}


const initialize = () => {
  //You will start here
  const onboardButton = document.getElementById('connectButton');

  const getAccountsButton = document.getElementById('getAccounts');
  const getAccountsResult = document.getElementById('getAccountsResult');

  //contract

  const depositButton = document.getElementById('depositButton')
  const withdrawButton = document.getElementById('withdrawButton')
  const contractStatus = document.getElementById('contractStatus')

  const networkDiv = document.getElementById('networkName')
  const chainIdDiv = document.getElementById('chainId')
  const accountsDiv = document.getElementById('accounts')


  const requestMintNFTButton = document.getElementById('requestMintNFTButton')

  const viewNFTButtonBase =  document.getElementById('viewNFTButtonBase');
  const viewNFTButtonExtended =  document.getElementById('viewNFTButtonExtended');
  const approveNFTButton =  document.getElementById('approveNFTButton');
  //for dev testing minting nft

  const NFTMintBaseButton =  document.getElementById('mintNFTBase');
  const NFTMintFullButton = document.getElementById('mintNFTFull') ;

  //use a dict for the whole form, easier to retrieve
  const HTLCFORM = {
    receiver :  document.getElementById('htlc-receiver-input'),
    hash_lock :  document.getElementById('htlc-hashlock-input'),
    time_lock :  document.getElementById('htlc-timelock-input'),
    forward_link: document.getElementById('htlc-forwardlink-input'),
    token_address: document.getElementById('htlc-nft-contract-input'),
    token_id : document.getElementById('htlc-nft-id-input'),
    sender: document.getElementById('htlc-sender-input'),
    htlc_id : document.getElementById('htlc-contract-id-input'),
    view_button: document.getElementById('ViewHTLCContractButton'),
    withdraw_button: document.getElementById('WithdrawHTLCContractButton'),
    refund_button: document.getElementById('RefundHTLCContractButton'),
    create_button: document.getElementById('CreateHTLCButton'),
    status_text: document.getElementById('HTLCcontractStatus'),
    withdraw_status: document.getElementById('htlc-withdraw-status'),

    secret_input: document.getElementById('htlc-secret-input'),
    randomize_hashlock_button: document.getElementById('RandomSecretHTLCButton'),
    time_lock_relative: document.getElementById('htlc-timelock-relative-input'),
    next_step_button: document.getElementById('nextStepButton'),
    source_htlc_hidden_id : document.getElementById('htlc-source-id-hidden'),
    source_blockchain_hidden_id : document.getElementById('htlc-source-blockchain-hidden')
  }


  const NFTFORM = {

  }

  //const HTLC1Address = //'0x2D6F0aF8e7be65821811Fb2B1A937687E8c8A46E'; //truffle test
  const NFTbase_addr = "0x6FA94cE61eF4171Dd0686E14D2f97544B51f969d";

  const NFTextended_addr = "0xAb57281076B1086Cd29E9279E17e589701365Ef9";
  //var contract ;
  //var accounts;

  // Send Eth Section
  const sendButton = document.getElementById('sendButton')

  const isMetaMaskInstalled = () => {
    //Have to check the ethereum binding on the window object to see if it's installed
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };
  const MetaMaskClientCheck = () => {
    //Now we check to see if MetaMask is installed
    if (!isMetaMaskInstalled()) {
      //If it isn't installed we ask the user to click to install it
      onboardButton.innerText = 'Click here to install MetaMask!';
      //When the button is clicked we call this function
      onboardButton.onclick = onClickInstall;
      //The button is now disabled
      onboardButton.disabled = false;

    } else {
      //If it is installed we change our button text
      onboardButton.innerText = 'Connect';
      //When the button is clicked we call this function to connect the users MetaMask Wallet
      onboardButton.onclick = onClickConnect;
      //The button is now disabled
      onboardButton.disabled = false;
    }
  };

  const onboarding = new MetaMaskOnboarding({ forwarderOrigin });

  //This will start the onboarding proccess
  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress';
    onboardButton.disabled = true;
    //On this object we have startOnboarding which will start the onboarding process for our end user
    onboarding.startOnboarding();
  };

  const onClickConnect = async () => {
    try {
      // Will open the MetaMask UI
      // You should disable this button while the request is pending!
      await ethereum.request({ method: 'eth_requestAccounts' });
      window.web3 = new Web3(window.ethereum);





      //we use eth_accounts because it returns a list of addresses owned by us.
      accounts  = await ethereum.request({ method: 'eth_accounts' });
      //We take the first address in the array of addresses and display it
      getAccountsResult.innerHTML = accounts[0] || 'Not able to get accounts';

      HTLCFORM.sender.value = accounts[0];
      //search_address_and_update(accounts[0]);
      getNetworkAndChainId()

      ethereum.on('chainChanged', handleNewChain)
      ethereum.on('accountsChanged', handleNewAccounts)

      /*

      try {
              // check if the chain to connect to is installed
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x61' }], // chainId must be in hexadecimal numbers
              });
            } catch (error) {
              // This error code indicates that the chain has not been added to MetaMask
              // if it is not, then install it into the user MetaMask
              if (error.code === 4902) {
                try {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId: '0x61',
                        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
                      },
                    ],
                  });
                } catch (addError) {
                  console.error(addError);
                }
              }
              console.error(error);
            }

*/



      //var isContract = await web3.eth.getCode(HTLC1Address);


      /*
      else {
        ;
        //claimButton.disabled = false;

      }
      */
    } catch (error) {
      console.error(error);
      //alert(error);
    }

  };
/*
    //Eth_Accounts-getAccountsButton
  getAccountsButton.addEventListener('click', async () => {
    //we use eth_accounts because it returns a list of addresses owned by us.
    accounts  = await ethereum.request({ method: 'eth_accounts' });
    //We take the first address in the array of addresses and display it
    getAccountsResult.innerHTML = accounts[0] || 'Not able to get accounts';
  });
*/


  MetaMaskClientCheck();

  function handleNewAccounts (newAccounts) {
    accounts = newAccounts;
    getAccountsResult.innerHTML = accounts[0];
    //document.getElementById("claim-addr-input").value = accounts[0];

    HTLCFORM.sender.value = accounts[0];
  }

  async function  handleNewChain  (chainId) {
    chain_id = parseInt(chainId,16)
    chainIdDiv.innerHTML = chain_id; //hexadecimal chainid
    networkDiv.innerHTML = getNetworkName(chain_id)[1];//{symbol, name}
    console.log(chain_id)
    global_HTLCWrapper_address = getHTLC_Address_fromNetwork(chain_id)
    global_NFTBase = new web3.eth.Contract(ERCBaseMintableABI, NFTbase_addr);
    global_NFTextended = new web3.eth.Contract(ERCExtendedABI, NFTextended_addr);
    global_HTLCWrapper = new web3.eth.Contract(HTLCWrapperABI, global_HTLCWrapper_address);

    /*
    chainIdDiv.innerHTML = chainId
    try{
      var isContract = await web3.eth.getCode(HTLC1Address);
      //
    } catch (error) {
      console.error(error);
      alert(error);
    }
    */
  }

  function handleNewNetwork (networkId) {
  /*  networkDiv.innerHTML = networkId
    getNetworkName
    */
  }

  async function getNetworkAndChainId () {
    try {
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      })
      handleNewChain(chainId)

      const networkId = await ethereum.request({
        method: 'net_version',
      })
      handleNewNetwork(networkId)
    } catch (err) {
      console.error(err)
    }
  }


    NFTMintBaseButton.onclick = () => {

      var mint_address = document.getElementById("nft-mint-addr-input").value;
      var mint_id = document.getElementById("nft-mint-id-input").value;
      var mint_history_hash = document.getElementById("nft-mint-history-hash-input").value;
      var mint_uri = document.getElementById("nft-mint-uri-input").value;
      global_NFTBase.methods.mint( mint_address, mint_id).send(
            {
              from: accounts[0],
            }).on('transactionHash', function(hash){
                console.log("txhash ", hash)
                contractStatus.innerHTML = hash;//"Check Transaction Hash : <a target=\"_blank\" href=\"https://testnet.bscscan.com/tx/"+hash+"\" >" + "https://testnet.bscscan.com/tx/"+hash + " </a> "
              })
              .on('receipt', function(receipt){
                  console.log("Receipt ", receipt)
              })
              .on('error', function(error, receipt) {
                  console.log("Error ", error)
                  alert (error);
              });

      }
    NFTMintFullButton.onclick = () => {
        var mint_address = document.getElementById("nft-mint-addr-input").value;
        var mint_id = document.getElementById("nft-mint-id-input").value;
        var mint_history_hash = document.getElementById("nft-mint-history-hash-input").value;
        var mint_uri = document.getElementById("nft-mint-uri-input").value;
        var hashed_history = get_sha256(mint_history_hash);

          console.log(mint_address);
          console.log(mint_id);
          console.log(hashed_history);
          console.log(mint_uri);
          //token.mintWithHistoryWithURI(sender, 132, bufToStr(sha256("test_history_132")), "testURL_132")
          global_NFTextended.methods.mintWithHistoryWithURI( mint_address, mint_id, hashed_history, mint_uri ).send(
                {
                  from: accounts[0],
                }).on('transactionHash', function(hash){
                    console.log("txhash ", hash)
                    contractStatus.innerHTML = hash;//"Check Transaction Hash : <a target=\"_blank\" href=\"https://testnet.bscscan.com/tx/"+hash+"\" >" + "https://testnet.bscscan.com/tx/"+hash + " </a>"
                  })
                  .on('receipt', function(receipt){
                      console.log("Receipt ", receipt)
                  })
                  .on('error', function(error, receipt) {
                      console.log("Error ", error)
                      alert (error);
                  });



      }



      viewNFTButtonExtended.onclick = () => {

          var view_address = document.getElementById("nft-view-addr-input").value;
          var view_id = document.getElementById("nft-view-id-input").value;
          console.log( view_address, view_id);
          HTLCFORM.token_address.value = view_address ;
          HTLCFORM.token_id.value = view_id;
                web3.eth.getCode(view_address).then(function(isContract){
                      if (isContract){
                          var temp_contract = new web3.eth.Contract(ERCExtendedABI, view_address);

                          temp_contract.methods.migrationHistory(view_id).call().then(function(result){
                              console.log(result);
                              document.getElementById("nft-view-history-hash-input").value = result;
                            });
                          temp_contract.methods.tokenURI(view_id).call().then(function(result){
                              console.log(result);
                              document.getElementById("nft-view-uri-input").value = result;
                            });
                          temp_contract.methods.historyURI(view_id).call().then(function(result){
                              console.log(result);
                              document.getElementById("nft-view-history-uri-input").value  = result;
                            });
                          temp_contract.methods.ownerOf(view_id).call().then(function(result){
                                console.log(result);
                                document.getElementById("nft-view-owner-input").value = result;
                              });

                          temp_contract.methods.getApproved(view_id).call().then(function(result){
                                console.log(result);
                                if (result && result.toLowerCase() == global_HTLCWrapper_address.toLowerCase()){
                                    document.getElementById('nft-approve-status-input').value = "Token Approved"
                                    approveNFTButton.disabled = true;
                                }
                                else
                                {
                                    document.getElementById('nft-approve-status-input').value = "Token not Approved yet"
                                    approveNFTButton.disabled = false;
                                }
                              });


                          global_currentNFTContract = temp_contract;

                      }else{

                          alert ("the address input is not a contract. please check")
                      }
                })

        }


      viewNFTButtonBase.onclick = () => {

        var view_address = document.getElementById("nft-view-addr-input").value;
        var view_id = document.getElementById("nft-view-id-input").value;
        console.log( view_address, view_id);
        HTLCFORM.token_address.value = view_address ;
        HTLCFORM.token_id.value = view_id;

          //try again with simpler ABI
          web3.eth.getCode(view_address).then(function(isContract){
                if (isContract){
                    var temp_contract = new web3.eth.Contract(ERCBaseMintableABI, view_address);


                        document.getElementById("nft-view-history-hash-input").value = "";

                    temp_contract.methods.tokenURI(view_id).call().then(function(result){
                        console.log(result);
                        document.getElementById("nft-view-uri-input").value = result;
                      });

                      temp_contract.methods.ownerOf(view_id).call().then(function(result){
                          console.log(result);
                          document.getElementById("nft-view-owner-input").value = result;
                        });

                    temp_contract.methods.getApproved(view_id).call().then(function(result){
                          console.log(result);
                          if (result && result.toLowerCase() == global_HTLCWrapper_address.toLowerCase()){
                              document.getElementById('nft-approve-status-input').value = "Token Approved"
                              approveNFTButton.disabled = true;
                          }
                          else
                          {
                              document.getElementById('nft-approve-status-input').value = "Token not Approved yet"
                              approveNFTButton.disabled = false;
                          }
                        });


                        document.getElementById("nft-view-history-uri-input").value  = "";

                        global_currentNFTContract = temp_contract;
                }else{

                    alert ("the address input is not a contract. please check")
                }
          })
      }

      approveNFTButton.onclick = () => {
          var token_id = document.getElementById('nft-view-id-input').value;
          global_currentNFTContract.methods.approve(global_HTLCWrapper_address, token_id).send(
            {from: accounts[0],
            }).on('transactionHash', function(hash){
              console.log("txhash ", hash)
              document.getElementById('nft-approve-status-input').value = 'Approving';
            })
            .on('receipt', function(receipt){
                console.log("Receipt ", receipt)
                document.getElementById('nft-approve-status-input').value = 'Approved';
            })
            .on('error', function(error, receipt) {
                console.log("Error ", error)
                alert (error);
            });


      }

      requestMintNFTButton.onclick = () => {
        var view_address = document.getElementById("nft-view-addr-input").value;
        var view_id = document.getElementById("nft-view-id-input").value;
        var view_uri = document.getElementById("nft-view-uri-input").value;
        var view_history_hash = document.getElementById("nft-view-history-hash-input").value;
        var view_history_uri = document.getElementById("nft-view-history-uri-input").value;
        var target_chain_id = document.getElementById("targetChainId").innerHTML;
        if (isNaN(parseInt(target_chain_id))){
          alert ("Please select the target blockchain")
        }
        if (target_chain_id == 1 ) {
          alert ("Due to high gas fee, currently this demo does not migrate to Ethereum");
          return;
        }
        if (view_address.length != 42){
          alert ("Incorrect Address format, it should be 42 characters long");
          return;
        }

        if(view_id.length<1){
          alert ("invalid token id");
          return;
        }
        var xhttp;
          xhttp=new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              console.log (this.responseText);
              var temp = JSON.parse(this.responseText);
              console.log (temp);
              HTLCFORM.forward_link.value = temp.token_adress;

              document.getElementById("target-nft-address-hidden").value = temp.token_address;
              document.getElementById("target-nft-id-hidden").value = temp.token_id;
              document.getElementById("NFTInteractionStatus").innerHTML = "New Token minted at tx: " + temp.explorer_link;
              //approve after minting
              var  new_xhttp = new XMLHttpRequest();
              new_xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                  console.log (this.responseText);
                  document.getElementById("NFTInteractionStatus").innerHTML += "<br> New Token getting approved on second chain";


                  global_original_nft_address = view_address ;
                  global_original_chain_name = getNetworkName(chain_id);

                }
              }
              var request_str = '?chainid='+target_chain_id+'&tokenid='+ temp.token_id;
              console.log(request_str);
              new_xhttp.open("GET", "/erc721mint/approve"+request_str, true);
              new_xhttp.send()
            }
          }
          var request_str = '?chainid='+target_chain_id+'&addr='+view_address+'&id='+view_id+ '&uri='+view_uri + '&history='+view_history_hash+'&history_uri='+view_history_uri+'&back_link='+ view_address+getNetworkName(chain_id)[0] ;
          console.log(request_str);
          xhttp.open("GET", "/erc721mint"+request_str, true);
          xhttp.send();



      }

      HTLCFORM.view_button.onclick = () => {
        global_HTLCWrapper.methods.getContract(HTLCFORM.htlc_id.value).call().then(function(result){
              //console.log(result);
              /*
              sender: c[0],
              receiver: c[1],
              token: c[2],
              tokenid: c[3],
              hashlock: c[4],
              timelock: c[5],
              withdrawn: c[6],
              refunded: c[7],
              preimage: c[8],
              blocknumber: c[9],
              forwardlink: c[10],
              */
              var result_obj = htlcERC721ArrayToObj(result);
              console.log(result_obj)
              HTLCFORM.receiver.value = result_obj.receiver;
              HTLCFORM.sender.value = result_obj.sender;
              HTLCFORM.token_address.value = result_obj.token;
              HTLCFORM.token_id.value = result_obj.tokenid;
              HTLCFORM.hash_lock.value = result_obj.hashlock;
              //HTLCFORM.time_lock.value = result_obj.timelock;

              HTLCFORM.time_lock_relative.value = moment(result_obj.timelock * 1000).fromNow();

              HTLCFORM.secret_input.value = result_obj.preimage;
              HTLCFORM.forward_link.value = result_obj.forwardlink;
              HTLCFORM.status_text.innerHTML = "Viewing HTLC info"
              if(result_obj.withdrawn){
                  HTLCFORM.withdraw_status.value = "Withrawn at block " + result_obj.blocknumber;
                  HTLCFORM.withdraw_button.disabled = true;
                  HTLCFORM.refund_button.disabled = true;
              }else {

                  if(result_obj.refunded){
                      HTLCFORM.withdraw_status.value = "Refunded at block " + result_obj.blocknumber;
                      HTLCFORM.withdraw_button.disabled = true;
                      HTLCFORM.refund_button.disabled = true;
                  }else {
                      HTLCFORM.withdraw_status.value = "Neither Withdrawn nor Refunded "
                  }
            }

          });

      }

      HTLCFORM.withdraw_button.onclick = () => {
          var secret_input = HTLCFORM.secret_input.value;
          var target_chain_id = document.getElementById("targetChainId").innerHTML;
          if (chain_id != parseInt(target_chain_id)){
              alert("The metamask's network is different from target blockchain of the migration, please switch network");
              return;
          }
          if (!secret_input.includes("0x")){
            secret_input = get_sha256(secret_input);
          }
          global_HTLCWrapper.methods.withdraw(
            HTLCFORM.htlc_id.value,
            secret_input,
          )
          .send(
            {from: accounts[0],
            }).on('transactionHash', function(hash){
              console.log("txhash ", hash)

              HTLCFORM.status_text.innerHTML = 'Submitting, tx hash : ' + hash;
            })
            .on('receipt', function(receipt){
                console.log("Receipt ", receipt)
                HTLCFORM.status_text.innerHTML = 'Successfull, Waiting for the original token to be burned';

                //withdrawal successfull, request server to burn. 
                var old_chain_id = HTLCFORM.source_blockchain_hidden_id.value;
                var old_htlc_id = HTLCFORM.source_htlc_hidden_id.value;
                var secret_msg = HTLCFORM.secret_input.value;
                var request_str = '?chainid='+old_chain_id+ '&htlc=' + old_htlc_id + '&secret=' + secret_msg ;
                console.log(request_str);
                var xhttp;
                xhttp=new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                  if (this.readyState == 4 && this.status == 200) {
                    console.log (this.responseText);
                    var temp = JSON.parse(this.responseText);
                    console.log (temp);
                    
                    alert("Token on the original chain is burned, txhash: " + temp.tx_id)
                    HTLCFORM.status_text.innerHTML = "Burn transaction on the original blockchain: "+ temp.explorer_link;
                    HTLCFORM.status_text.innerHTML += " <br><br> Migration sucessful, please append this information on your history data for future verifcation: " 
                                                      + "<br> "+global_original_nft_address + "," +global_original_chain_name[0]+ "," + HTLCFORM.source_htlc_hidden_id.value;
                                                      
                  }

                }

                xhttp.open("GET", "/createhtlc/burn"+request_str, true);
                xhttp.send();

            })
            .on('error', function(error, receipt) {
                console.log("Error ", error)
                alert (error);
            });

      }
      HTLCFORM.refund_button.onclick = () => {
        if(!HTLCFORM.source_blockchain_hidden_id.value || HTLCFORM.source_blockchain_hidden_id.value != chain_id){
          alert ("please switch back to the original blockchain to initiate refund");
          return;

        }
        HTLCFORM.htlc_id.value = HTLCFORM.source_htlc_hidden_id.value;
        global_HTLCWrapper.methods.refund(
          HTLCFORM.htlc_id.value,
        )
        .send(
          {from: accounts[0],
          }).on('transactionHash', function(hash){
            console.log("txhash ", hash)

            HTLCFORM.status_text.innerHTML = 'Submitting, tx hash : ' + hash;
          })
          .on('receipt', function(receipt){
              console.log("Receipt ", receipt)
              HTLCFORM.status_text.innerHTML = 'Successfull';

          })
          .on('error', function(error, receipt) {
              console.log("Error ", error)
              alert (error);
          });

      }

      HTLCFORM.randomize_hashlock_button.onclick = () => {
            var secret = get_random32byte_hexstring();
            var message = CryptoJS.enc.Hex.parse(secret.substring(2));
            var hashlock = get_sha256(message);
            HTLCFORM.secret_input.value = secret;
            HTLCFORM.hash_lock.value = hashlock;


      }

      HTLCFORM.next_step_button.onclick = () => {
          var step4_header = document.getElementById("step4-header");
          step4_header.style.display = "block";
          HTLCFORM.create_button.disabled = true;
          HTLCFORM.receiver.disabled = true;
          HTLCFORM.hash_lock.disabled = true;
          HTLCFORM.time_lock.disabled  = true;
          HTLCFORM.forward_link.disabled = true;
          HTLCFORM.randomize_hashlock_button.disabled = true;

          var target_token_addr =  HTLCFORM.forward_link.value  ;
          var target_token_id = HTLCFORM.token_id.value;
          var target_chain_id = document.getElementById("targetChainId").innerHTML;
          //sending request to server to create new htlc
          var xhttp;
          xhttp=new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              console.log (this.responseText);
              var temp = JSON.parse(this.responseText);
              console.log (temp);
              
              HTLCFORM.htlc_id.value = temp.htlc_id;
              alert("The swap is ready, please switch to the target network on Metamask and Click withdraw or view the HTLC contract")
              HTLCFORM.next_step_button.disabled = true;
              
            }

          }
          var request_str = '?chainid='+target_chain_id+'&old_chainid='+HTLCFORM.source_blockchain_hidden_id.value+'&token_id='+target_token_id+'&hash_lock='+ 
            HTLCFORM.hash_lock.value + '&time_lock=' + HTLCFORM.time_lock.value + '&receiver=' + accounts[0] ;
          console.log(request_str);
          xhttp.open("GET", "/createhtlc"+request_str, true);
          xhttp.send();


      }

      HTLCFORM.create_button.onclick = () => {
          /*
            await token.approve(htlc.address, tokenId, {from: initiator})
            return htlc.newContract(
              counterparty,
              config.hashlock,
              config.timelock,
              token.address,
              tokenId,
              bufToStr(sha256(raw_forwardlink)),
              {
                from: initiator,
              }
            )
          */
          var receiver = HTLCFORM.receiver.value;
          var hash_lock = HTLCFORM.hash_lock.value;
          console.log(HTLCFORM.hash_lock.value);
          if (!hash_lock.includes("0x"))
            hash_lock = "0x" + hash_lock;
          var time_lock = parseInt(HTLCFORM.time_lock.value);
          var token_address = HTLCFORM.token_address.value;
          var token_id = HTLCFORM.token_id.value;
          var forward_link = get_sha256(HTLCFORM.forward_link.value);
          //HTLCFORM.forward_link.value = forward_link; //calculate hash and put back
          if (isNaN(time_lock) || time_lock >  86400){
            alert ("Time lock is too large or not properly formatted, we may not be able to refund your token if swapping is not success");
          }else{
              time_lock = nowSeconds() + time_lock ; //lock how long from now;

              global_HTLCWrapper.methods.newContract(
                receiver,
                hash_lock,
                time_lock,
                token_address,
                token_id,
                forward_link
              )
                .send(
                {from: accounts[0],
                }).on('transactionHash', function(hash){
                  console.log("txhash ", hash)

                  HTLCFORM.status_text.innerHTML = 'Submitting, tx hash : ' + hash;
                })
                .on('receipt', function(receipt){
                    console.log("Receipt ", receipt)
                    global_debug = receipt;
                    //global_debug.events.HTLCERC721New.returnValues.contractId
                    const contractId = receipt.events.HTLCERC721New.returnValues.contractId;
                    HTLCFORM.status_text.innerHTML = 'Successfull, htlc contract ID : ' + contractId;

                    console.log(contractId);

                    HTLCFORM.htlc_id.value = contractId;

                    HTLCFORM.source_htlc_hidden_id.value = contractId;
                    HTLCFORM.source_blockchain_hidden_id.value = chain_id;

                })
                .on('error', function(error, receipt) {
                    console.log("Error ", error)
                    alert (error);
                });

          }


      }

}
window.addEventListener('DOMContentLoaded', initialize)
