const HtlcWrapperErc721 = require('../../wrapper/htlc-wrapper-erc721')

const {assertEqualBN} = require('../helper/assert')
const {
  htlcERC721ArrayToObj,
  isSha256Hash,
  newSecretHashPair,
  nowSeconds,
  sha256,
  bufToStr,
  txLoggedArgs,
} = require('../helper/utils')

const HashedTimelockERC721 = artifacts.require('./HashedTimelockERC721.sol')
const AliceERC721 = artifacts.require('./helper/AliceERC721.sol')

// some testing data
const hourSeconds = 3600
const timeLock1Hour = nowSeconds() + hourSeconds

contract('HashedTimelockErc721Wrapper', accounts => {

  const truffleAssert = require('truffle-assertions');
  const sender = accounts[1]
  const receiver = accounts[2]
  //const tokenSupply = 1000
  const provider = new web3.providers.HttpProvider("http://localhost:7545");

  let htlcWrapper
  let token

  const assertTokenBal = async (token, addr, tokenAmount, msg) => {
    assertEqualBN(
      await token.balanceOf.call(addr),
      tokenAmount,
      msg ? msg : 'wrong token balance'
    )
  }

  before(async () => {
    htlcWrapper = new HtlcWrapperErc721(HashedTimelockERC721, provider, null);
    let address = await HashedTimelockERC721.new()
    htlcWrapper.setAddress(address.address)
    token = await AliceERC721.new("NFT1 Collection","NFT1")

    await token.mint(sender, 1)
    await assertTokenBal(
      token,
      sender,
      1,
      'balance not transferred to Alice in before()'
    )
  })

  it('newContract() in wrapper should create new contract and store correct details', async () => {
    const hashPair = newSecretHashPair()
    await token.approve(htlcWrapper.address, 1, {from: sender})
    const newContractTx = await  htlcWrapper.newContract(
      receiver,
      hashPair.hash,
      timeLock1Hour,
      token.address,
      1,
      bufToStr(sha256("test_forward_link")),
      sender
    )


    // check event logs
    const logArgs = txLoggedArgs(newContractTx)

    const contractId = logArgs.contractId
    assert(isSha256Hash(contractId))

    assert.equal(logArgs.sender, sender)
    assert.equal(logArgs.receiver, receiver)
    assert.equal(logArgs.tokenContract, token.address)
    assert.equal(logArgs.hashlock, hashPair.hash)
    assert.equal(logArgs.timelock, timeLock1Hour)

    // check htlc record
    const contractArr = await htlcWrapper.getContract(contractId)
    const contract = htlcERC721ArrayToObj(contractArr)
    assert.equal(contract.sender, sender)
    assert.equal(contract.receiver, receiver)
    assert.equal(contract.token, token.address)
    assert.equal(contract.tokenid.toNumber(), 1)
    assert.equal(contract.hashlock, hashPair.hash)

    assert.equal(contract.timelock.toNumber(), timeLock1Hour)
    assert.isFalse(contract.withdrawn)
    assert.isFalse(contract.refunded)
    assert.equal(
      contract.preimage,
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    )
    assert.equal(contract.blocknumber, 0)
    assert.equal(contract.forwardlink, bufToStr(sha256("test_forward_link")))

  })

    //check token collection info
    it('Extension of ERC 721 should work correctly, Minting with migration history and querying', async() =>{
    symbol = await token.symbol();
    assert.equal(symbol, "NFT1", "incorrect symbol");
    name = await token.name();
    assert.equal(name, "NFT1 Collection", "incorrect name");
    await token.mintWithHistory(sender, 10, bufToStr(sha256("test_history")))
    history_hash = await token.migrationHistory(10)
    //console.log(history_hash);
    //console.log(sha256("test_history"))
    assert.equal(history_hash, bufToStr(sha256("test_history")))
    try{
      await token.mintWithHistory(sender, 10, bufToStr(sha256("test_history_2")))
    }catch(e){

    }

    history_hash = await token.migrationHistory(10)
    assert.equal(history_hash, bufToStr(sha256("test_history")))

    await token.mintWithHistoryWithURI(sender, 132, bufToStr(sha256("test_history_132")), "testURL_132")
    history_hash = await token.migrationHistory(132)
    assert.equal(history_hash, bufToStr(sha256("test_history_132")))
    url_132 = await token.tokenURI(132)
    assert.equal(url_132, "testURL_132")

    //history_uri should be blank because it's not set
    history_uri = await token.historyURI(10)
    assert.equal(history_uri,"")

    //mintWithHistoryURIWithURI(address to, uint256 tokenId, bytes32 history, string memory tokenURI,  string memory historyURI )
    await token.mintWithURIWithHistoryURI(sender, 111, bufToStr(sha256("test_history_111")), "testURL_111", "test_history_url_111")
    history_hash = await token.migrationHistory(111)
    token_uri = await token.tokenURI(111)
    history_uri = await token.historyURI(111)


    assert.equal(history_hash,bufToStr(sha256("test_history_111")))
    assert.equal(token_uri, "testURL_111")
    assert.equal(history_uri, "test_history_url_111")

  })


})
