//Test Migration ERC721
//Mint and burn Scenario.
// Alice show Bob the address of the NFT to be migrated on NFTContract1
// BridgeService mints a new NFT with Alice's token metadata & colletion info. on NFTContract2
// Alice choose a secret message M, computes hashlock = hash(M)
// Alice constructs htlc1 with hashlock + timelock, forwardlink = NFTContract2 ;  receiver = burn address
// BridgeService constructs htlc2 with Alice's hashlock + timelock ; receiver = Alice's choice
// BridgeService sends Alice the htlc2 contract for verifying. If alice agrees, alice will use the secret to withdraw NFT on NFTcontract2
// BridgeService knows the secret M. It now calls withdraw on htlc1. This simply transfer Alice's token on NFTContract1 to the predetermined burn address  (e.g. receiver = 0x00)
//It does not matter whether {htlc1,NFTContract1} and {htlc2,NFTContract2} are on the same blockchain or not. The protocol still works.
//Forwardlink is used to identify the uniqueness of the mint-and-burn relationship . It will be written as immutatble data on htlc1 to for verifying (TokenID migrated from NFTContract1 => NFTContract2)
//For simplicity of truffle testing, This test is written to use 1 blockchain.
const {assertEqualBN} = require('./helper/assert')
const {
  bufToStr,
  sha256,
  htlcERC721ArrayToObj,
  isSha256Hash,
  newSecretHashPair,
  nowSeconds,
  random32,
  txContractId,
  txLoggedArgs,
} = require('./helper/utils')
const promisify = require('util').promisify
const sleep = promisify(require('timers').setTimeout)
const truffleAssert = require('truffle-assertions')

const HashedTimelockERC721 = artifacts.require('./HashedTimelockERC721.sol')
const AliceERC721TokenContract = artifacts.require('./helper/AliceERC721.sol')
const BridgeERC721TokenContract = artifacts.require('./helper/BobERC721.sol')
// Bob = Bridge Service
// some testing data
let timeLock2Sec
const tokenAmount = 5
const network1 = "ETH"
const network2 = "ETH"
contract('HashedTimelock Mint And Burn between two ERC721 tokens', accounts => {
  const Alice = accounts[1] // owner of AliceERC721 and wants swap for BobERC721
  const Bridge = accounts[2] // owner of BobERC721 and wants to swap for AliceERC721

  const burn_address = "0x0000000000000000000000000000000000000001" //agree universally & must still allow retreiving token information after transfer

  let htlc_1 //simulating a separate htlc on blockchain 1 // Alice's point of innitiating htlc
  let htlc_2 //simulating a separate htlc on blockchain 2 // Bridge Service point of innitiating htlc
  let AliceERC721
  let BridgeERC721
  let hashPair // shared b/w the two swap contracts in both directions
  let a2bSwapId // swap contract ID for Alice -> Bridge in the AliceERC721
  let b2aSwapId // swap contract ID for Bridge -> Alice in the BobERC721


  // use a variable to track the secret Bob will have learned from Alice's withdraw transaction
  // to make the flow more explicitly reflect the real world sequence of events
  let learnedSecret
  const token_id = 1234
  before(async () => {
    // if both tokens run on the same chain, they can share the HTLC contract to
    // coordinate the swap. They can also use separate instances on the same chain,
    // or even separate instances on different chains.
    // The key is the HTLC contract must be running on the same chain
    // that the target Token to be transferred between the two counterparties runs on
    htlc1 = await HashedTimelockERC721.new()
    htlc2 = await HashedTimelockERC721.new()

    AliceERC721 = await AliceERC721TokenContract.new("NFT collection 1","NF1")
    BridgeERC721 = await BridgeERC721TokenContract.new("NFT collection 2","NF2")
    console.log("Alice ", Alice)
    console.log("Bridge ", Bridge)
    console.log("NFT1 contract holding Alice's token ", AliceERC721.address)
    console.log("NFT2 contract for holding Bridge's token", BridgeERC721.address)
    console.log("burn address ", burn_address)
    await AliceERC721.mintWithHistoryWithURI(Alice, token_id,  "0x00", "test_metadata_url")
    //Alice send token info to Bridge
    //Bridge read token_info and construct a new NFT
    history_uri = await AliceERC721.historyURI(token_id)
    history_hash = await AliceERC721.migrationHistory(token_id)
    token_uri = await AliceERC721.tokenURI(token_id)


    console.log("history_hash ", history_hash)
    console.log("string to hash ", history_hash+BridgeERC721.address+network2)
    console.log("new hash ", bufToStr(sha256(history_hash+BridgeERC721.address+network2)))
    await BridgeERC721.mintWithURIWithHistoryURI(Bridge, token_id, bufToStr(sha256(history_hash+BridgeERC721.address+network2)), token_uri, history_uri )

    owner_alice_contract = await AliceERC721.ownerOf(token_id)
    owner_bob_contract =  await BridgeERC721.ownerOf(token_id)
    assert.equal(owner_alice_contract, Alice)
    assert.equal(owner_bob_contract, Bridge)

    hashPair = newSecretHashPair()
  })

  // Alice initiates the swap by setting up a transfer of AliceERC721 tokens to Bob
  // she does not need to worry about the Bridge unilaterally take ownership of the tokens
  // without fulfilling his side of the deal, because this transfer is locked by a hashed secret
  // that only Alice knows at this point
  // Note that we use 0x01 for the burn because some ERC721 template will prevent checking the token info if its owner is 0x00
  // checking token info after being burned is important because It will help verifying the authenticity of the token e.g. burned token's uri. burned token's history hash
  it('Step 1: Alice sets up a swap with Bob in the AliceERC721 contract', async () => {
    timeLock2Sec = nowSeconds() + 2
    const newSwapTx = await newSwap(AliceERC721, token_id, BridgeERC721.address , htlc1, {
      hashlock: hashPair.hash,
      timelock: timeLock2Sec
    }, Alice, burn_address)
    a2bSwapId = txContractId(newSwapTx)

    //Alice verify the token infomation before initiate the migration :

    // 1. The URI of token metadata must remain the same :
    token_uri_old = await AliceERC721.historyURI(token_id)
    token_uri_new = await BridgeERC721.historyURI(token_id)
    assert.equal(token_uri_old, token_uri_new)

    // 2.The history hash must update the history of the new token based on the old history hash
    history_hash_old = await AliceERC721.migrationHistory(token_id)
    history_hash_new = await BridgeERC721.migrationHistory(token_id)
    assert.equal(history_hash_new, bufToStr(sha256(history_hash_old+BridgeERC721.address+network2)))

    //(optional) 3.The history uri (if exists) must be the same as Alice's NFT on chain1
    history_uri_old = await AliceERC721.historyURI(token_id)
    history_uri_new = await BridgeERC721.historyURI(token_id)
    assert.equal(history_uri_old, history_uri_new)

    //All checks, Alice now agree to migratio and initiate the migration
    owner_alice_contract = await AliceERC721.ownerOf(token_id)
    owner_bridge_contract =  await BridgeERC721.ownerOf(token_id)
    assert.equal(owner_alice_contract, htlc1.address)
    assert.equal(owner_bridge_contract, Bridge)

  })

  // // The Bridge having observed the contract getting set up by Alice in htlc1, now
  // // responds by setting up the corresponding contract in the htlc2, using the same
  // // hash lock as Alice' side of the deal, Alice must disclose the secret to unlock
  // // the BridgeERC721 tokens transfer, and the same secret can then
  // // be used to buren the token locked in htlc1
  it('Step 2: The Bridge sets up a swap with Alice in the BobERC721 contract', async () => {
    // in a real world swap contract, the counterparty's swap timeout period should be shorter
    // but that does not affect the ideal workflow that we are testing here

    // check htlc record
    const contractArr = await htlc1.getContract(a2bSwapId)
    const htlc1_contract = htlcERC721ArrayToObj(contractArr)

    //The bridge first check on chain 1 htlc1  the data of this burn-and-mint:
    // Check 1: receiver is 0x01 (burn tx)
    assert.equal(htlc1_contract.receiver, burn_address)
    // Check 2: The forwardlink must be the BridgeERC721 address on chain2
    assert.equal(htlc1_contract.forwardlink, bufToStr(sha256(BridgeERC721.address)))
    // Check 3: Not withdrawn or refunded
    assert.isFalse(htlc1_contract.withdrawn)
    assert.isFalse(htlc1_contract.refunded)

    timeLock2Sec = nowSeconds() + 2
    const newSwapTx = await newSwap(BridgeERC721, token_id, "forwardlink from bob, not used" , htlc2, {
      hashlock: hashPair.hash,
      timelock: timeLock2Sec
    }, Bridge, Alice)
    b2aSwapId = txContractId(newSwapTx)

    //check if both tokens deposited
    owner_alice_contract = await AliceERC721.ownerOf(token_id)
    owner_bridge_contract =  await BridgeERC721.ownerOf(token_id)
    assert.equal(owner_alice_contract, htlc1.address)
    assert.equal(owner_bridge_contract, htlc2.address)
  })

  it('Step 3: Alice as the initiator withdraws from the BridgeERC721 with the secret', async () => {
    // Alice has the original secret, calls withdraw with the secret to claim the new migrated NFT
    await htlc2.withdraw(b2aSwapId, hashPair.secret, {
      from: Alice,
    })

    owner_alice_contract = await AliceERC721.ownerOf(token_id)
    owner_bridge_contract =  await BridgeERC721.ownerOf(token_id)
    assert.equal(owner_alice_contract, htlc1.address)
    assert.equal(owner_bridge_contract, Alice)

    const contractArr = await htlc2.getContract.call(b2aSwapId)
    const contract = htlcERC721ArrayToObj(contractArr)
    assert.isTrue(contract.withdrawn) // withdrawn set
    assert.isFalse(contract.refunded) // refunded still false
    // with this the secret is out in the open and the Bridge will have knowledge of it
    assert.equal(contract.preimage, hashPair.secret)
    console.log ("Alice received new NFT at block", contract.blocknumber.toString() )
    learnedSecret = contract.preimage
  })

  it("Step 4: Bridge as the counterparty burn the deposit token from AliceERC721 with the secret learned from Alice's withdrawal", async () => {
    //"withdraw" to the burn address
    await htlc1.withdraw(a2bSwapId, learnedSecret, {
      from: Bridge,
    })

    owner_alice_contract = await AliceERC721.ownerOf(token_id)
    owner_bridge_contract =  await BridgeERC721.ownerOf(token_id)
    assert.equal(owner_alice_contract, burn_address)
    assert.equal(owner_bridge_contract, Alice)

    const contractArr = await htlc1.getContract.call(a2bSwapId)
    const contract = htlcERC721ArrayToObj(contractArr)
    assert.isTrue(contract.withdrawn) // withdrawn set
    assert.isFalse(contract.refunded) // refunded still false
    assert.equal(contract.preimage, learnedSecret)
    console.log ("Bridge burned NFT  at block ", contract.blocknumber.toString() )
    // now the NFT is successfully migrated

  })


  describe("Test the refund scenario:", () => {
    it('the swap is set up with 3sec timeout on both sides', async () => {
      new_token_id = 3333
      await AliceERC721.mint(Alice, new_token_id)
      await BridgeERC721.mint(Bridge, new_token_id)
      timeLock2Sec = nowSeconds() + 3
      let newSwapTx = await newSwap(AliceERC721, new_token_id, "forward_link_from_alice", htlc1, {
        hashlock: hashPair.hash,
        timelock: timeLock2Sec
      }, Alice, Bridge)
      a2bSwapId = txContractId(newSwapTx)

      newSwapTx = await newSwap(BridgeERC721, new_token_id, "forward_link_from_bbridge", htlc2, {
        hashlock: hashPair.hash,
        timelock: timeLock2Sec
      }, Bridge, Alice)
      b2aSwapId = txContractId(newSwapTx)

      owner_alice_contract = await AliceERC721.ownerOf(new_token_id)
      owner_bridge_contract =  await BridgeERC721.ownerOf(new_token_id)
      assert.equal(owner_alice_contract, htlc1.address)
      assert.equal(owner_bridge_contract, htlc2.address)

      await sleep(3000)

      // after the timeout expiry Alice calls refund() to get her tokens back
      let result = await htlc1.refund(a2bSwapId, {
        from: Alice
      })

      // verify the event was emitted
      truffleAssert.eventEmitted(result, 'HTLCERC721Refund', ev => {
        return ev.contractId === a2bSwapId
      }, `Refunded Alice`)



      // Bridge can also get his tokens back by calling refund(); However this is not neccessary, the NFT is not anything useful for the bridge to get back
      result = await htlc2.refund(b2aSwapId, {
        from: Bridge
      })

      // verify the event was emitted
      truffleAssert.eventEmitted(result, 'HTLCERC721Refund', ev => {
        return ev.contractId === b2aSwapId
      }, `Refunded Bridge`)

      owner_alice_contract = await AliceERC721.ownerOf(new_token_id)
      owner_bridge_contract =  await BridgeERC721.ownerOf(new_token_id)
      assert.equal(owner_alice_contract, Alice)
      assert.equal(owner_bob_contract, Bridge)
    })
  })




  const newSwap = async (token, tokenId, raw_forwardlink, htlc, config, initiator, counterparty) => {
    // initiator of the swap has to first designate the swap contract as a spender of his/her money
    // with allowance matching the swap amount
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
  }
})
