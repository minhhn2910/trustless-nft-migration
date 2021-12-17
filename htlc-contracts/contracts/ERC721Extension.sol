pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";
contract ERC721Extension is ERC721, ERC721Mintable, ERC721Metadata {
      // hash of the migration history path in this order "contract_addr1, chain_name1, contract_addr2, chain_name2"
      // NFT.id remains the same during its history
      // NFT.URI remains the same
      // use for verifying the authenticity of the NFT history

      mapping(uint256 => bytes32) private migration_history;

      // URL for storing the history string publicly for everyone to verify. The content must be mutable (append new history after each migration to a new chain)
      // The string may be long (e.g. after more than 10 migrations between blockchains). Thus, a public URL is the way to conserve space
      mapping(uint256 => string) private _historyURIs;

      function migrationHistory(uint256 tokenId) external view returns (bytes32 ) {
          require(_exists(tokenId), "ERC721Metadata: migration_history query for nonexistent token");

          return migration_history[tokenId];
      }

      function _setMigrationHistory(uint256 tokenId, bytes32 history) internal {
          require(_exists(tokenId), "ERC721Metadata: migration_history set of nonexistent token");
          migration_history[tokenId] = history;
      }

      function mintWithHistory(address to, uint256 tokenId, bytes32 history) public returns (bool) {
          //_mint(to, tokenId);
          require(mint(to, tokenId) == true);
          _setMigrationHistory(tokenId, history);
          return true;
      }

      //The original URI of NFT is not immutable, user can add the migration history to their file for comparing with the hash migration_history on chain.
      function mintWithHistoryWithURI(address to, uint256 tokenId, bytes32 history, string memory tokenURI ) public returns (bool) {
          // mint and revert if token exists
          require(mint(to, tokenId) == true);
          _setMigrationHistory(tokenId, history);
          _setTokenURI(tokenId, tokenURI);
          return true;
      }


      //The original URI of NFT is on IPFS and immutable. User must use another link to publicly showing the migration history of this NFT for verification with the hash: migration_history.
      function mintWithURIWithHistoryURI(address to, uint256 tokenId, bytes32 history, string memory tokenURI,  string memory _historyURI ) public returns (bool) {
          // mint and revert if token exists
          require(mint(to, tokenId) == true);
          _setMigrationHistory(tokenId, history);
          _setTokenURI(tokenId, tokenURI);
          _setHistoryURI(tokenId, _historyURI);
          return true;
      }


      function historyURI(uint256 tokenId) external view returns (string memory) {
          require(_exists(tokenId), "ERC721Metadata: _historyURI query for nonexistent token");
          return _historyURIs[tokenId];
      }

      //helper function to set the mutable history URI in case the token URI is immutable
      function _setHistoryURI(uint256 tokenId, string memory _historyURI) internal {
          _historyURIs[tokenId] = _historyURI;
      }

}
