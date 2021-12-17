const HashedTimelockERC721 = artifacts.require('./HashedTimelockERC721.sol')
const SampleERC721 = artifacts.require('./ERC721Sample.sol')

module.exports = function (deployer) {
  deployer.deploy(HashedTimelockERC721)
  deployer.deploy(SampleERC721,"Sample Collection","NFT")

}
