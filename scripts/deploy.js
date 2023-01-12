// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const { ethers } = require("hardhat");
const path = require("path");


async function deployContract(name, args) {
  const factory = await ethers.getContractFactory(name)
    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
  const contract = await factory.deploy(...args)
  return await contract.deployed();
}

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
      "gets automatically created and destroyed every time. Use the Hardhat" +
      " option '--network localhost'"
    );
  }

  //console.info('object',network.config.WETH);

  // ethers is available in the global scope
  const [deployer,a1,a2,a3] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("network:", network);
  const balanceBefore =  await deployer.getBalance();
  console.log("Account balance:", balanceBefore.toString());

 
  const Post =  await deployContract("Post",[]);
  console.log("Post address:", Post.address);

  const Subscription =  await deployContract("Subscription",[]);
  console.log("Subscription address:", Subscription.address);

  const Operator =  await deployContract("Operator",[network.config.WETH]);
  console.log("Operator address:", Operator.address);

  await Subscription.setOperator(Operator.address);
  await Post.setOperator(Operator.address);

  await Operator.setPostNft(Post.address); 
  await Operator.setSubscriptionNft(Subscription.address); 

  await Operator.setPriceFee(network.config.PRICE_FEE_ETHUSD); 
  await Operator.setFeeTo(process.env.feeTo); 
  await Operator.setAcceptedUsdTokens(network.config.USDC,true);//
  await Operator.setAcceptedUsdTokens(network.config.USDT,true);//

  const afterBalance =  await deployer.getBalance();
  const coast = balanceBefore.sub(afterBalance);
  console.log("deploy coast:",ethers.utils.formatEther(coast));
 
}
 

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// npx hardhat run scripts/deploy.js