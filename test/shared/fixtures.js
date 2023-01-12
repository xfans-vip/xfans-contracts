

async function deployContract(name, args) {
  const factory = await ethers.getContractFactory(name)
    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
  const contract = await factory.deploy(...args)

  return await contract.deployed();
}

async function contractAt(name, address) {
  const factory = await ethers.getContractFactory(name)
  return await factory.attach(address)
}

//interface contract
async function getContractAt(name, address) {
  return await ethers.getContractAt(address)

  // const factory = await ethers.getContractFactory(name)
  // return await factory.getContractAt(address)
}

module.exports = {
  deployContract,
  contractAt,
  getContractAt
}
