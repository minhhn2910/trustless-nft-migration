pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "./ERC721Extension.sol";
contract ERC721SampleBase is  ERC721Full {
  constructor(string memory name, string memory symbol) public ERC721Full(name, symbol) {}

}
