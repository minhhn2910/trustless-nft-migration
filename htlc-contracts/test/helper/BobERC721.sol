pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";
import "../../contracts/ERC721Extension.sol";
contract BobERC721 is  ERC721Full, ERC721Extension  {
    constructor(string memory name, string memory symbol) public ERC721Full(name, symbol) {}
}
