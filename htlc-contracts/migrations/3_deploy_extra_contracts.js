const HashedTimelockERC721 = artifacts.require('./HashedTimelockERC721.sol')
const SampleERC721 = artifacts.require('./ERC721Sample.sol')
const ERC721SampleBase = artifacts.require('./ERC721SampleBase.sol')
module.exports = function (deployer) {
  deployer.deploy(SampleERC721,"Sample Collection 2 ","NFT")
  deployer.deploy(SampleERC721,"Sample Collection 3 ","NFT")
}
