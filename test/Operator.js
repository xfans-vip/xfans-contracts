// This is an example test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.
const { ethers } = require("hardhat");

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const {deployContract,contractAt,getContractAt} = require("./shared/fixtures")
const {expandDecimals} = require("./shared/utilities")
const {encodePath} = require("./shared/path")


 
// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage or Hardhat Network's snapshot functionality.
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// `describe` is a Mocha function that allows you to organize your tests.
// Having your tests organized makes debugging them easier. All Mocha
// functions are available in the global scope.
//
// `describe` receives the name of a section of your test suite, and a
// callback. The callback must define the tests of that section. This callback
// can't be an async function.
describe("Operator contract", function () {
  // We define a fixture to reuse the same setup in every test. We use
  // loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshot in every test.
  const USDC = network.config.USDC;//mainet
  const POOLFEEAMOUNT = 3000;
  const WETH = network.config.WETH;
  console.info('nework:',network);
  const value = expandDecimals(1,18);// ether
  const ether1 = expandDecimals(1,18);// ether
  const usdPrice = expandDecimals(10,6);

  
  async function deployTokenFixture() {
    const [owner, addr1, addr2,addr3,addr4,addr5,addr6] = await ethers.getSigners();
    //console.info('address:',owner, 'addr1:',addr1, 'addr2:',addr2);

    // Get the ContractFactory and Signers here.
    const postNft =await deployContract("Post",[]);
    const subNft =await deployContract("Subscription",[]);
    const contract =await deployContract("Operator",[network.config.WETH]);
    
    await contract.setPostNft(postNft.address)
    await contract.setSubscriptionNft(subNft.address)
    await contract.setFeeTo(addr6.address)
    await contract.setPriceFee(network.config.PRICE_FEE_ETHUSD); 
    await contract.setAcceptedUsdTokens(USDC,true);//

    await postNft.setOperator(contract.address)
    await subNft.setOperator(contract.address)

     
    console.info('network:',network);
    console.info('subNft:',subNft.address);
    console.info('postNft:',postNft.address);
    console.info('contract:',contract.address);

    console.info('addr1:',addr1.address,await addr1.getBalance());
    console.info('addr2:',addr2.address,await addr1.getBalance());
    console.info('addr3:',addr3.address);
    console.info('addr4:',addr4.address);
    console.info('addr5:',addr5.address);
    console.info('addr6:',addr6.address);

    const usdToken = await contractAt("TestERC20", USDC)

    // Fixtures can return anything you consider useful for your tests
    return { contract,usdToken, owner,postNft,subNft, addr1, addr2,addr3 ,addr4,addr5,addr6};
    }

    async function exactOutputSingle(
      tokenOut,
      amountOut = 1,
      amountInMaximum = 3,
      recipient
    ){
      const params = {
        tokenIn:WETH,
        tokenOut,
        fee: POOLFEEAMOUNT,
        recipient: recipient.address,
        deadline: Date.now(),
        amountOut,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      }
      const router = await contractAt("SwapRouter","0xE592427A0AEce92De3Edee1F18E0157C05861564")
  
      const data = [router.interface.encodeFunctionData('exactOutputSingle', [params])]
      // if (inputIsWETH9) data.push(router.interface.encodeFunctionData('unwrapWETH9', [0, trader.address]))
      data.push(router.interface.encodeFunctionData('refundETH'))
     
      return router.connect(recipient).multicall(data, { value:amountInMaximum })
    }

     

 

    it.skip("swapETH", async function () {
      const { contract,subNft, owner ,addr1,addr6} = await loadFixture(deployTokenFixture);
      
      const value = expandDecimals(1,18);//0.1ether
      await contract._swapETH(USDC,expandDecimals(5,6),500,{value})
      
 

    });
    

    it.skip("multicall out, mintSubscription anyERC20 swap then mint", async function () {
      const { contract,subNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      
      //swaptousd,then mintSubscription
      // const UNI =  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'//mainet
      const UNI =  '0x514910771AF9Ca656af840dff83E8264EcF986CA'//mainet link
      const uniToken = await contractAt("TestERC20", UNI)
      
      console.info('uni balanceOf before swap',await uniToken.balanceOf(addr3.address));
      const balanceBefore =  await addr3.getBalance();
      console.info('eth balanceOf before swap',await addr3.getBalance());
      await exactOutputSingle(UNI,expandDecimals(1234,18),expandDecimals(100,18),addr3)
      console.info('eth balanceOf after swap',await addr3.getBalance());
      console.info('eth balanceOf after swap',await addr3.getBalance());
      const afterBalance =  await addr3.getBalance();
      const coast = balanceBefore.sub(afterBalance);
      console.log("swap uni coast:",ethers.utils.formatEther(coast));



      const amountInMaximum = expandDecimals(100,18);//100uni >10usd
      const params = {
        tokenIn:UNI,
        tokenOut:USDC,
        fee: POOLFEEAMOUNT,
        recipient: contract.address,
        deadline: Date.now(),
        amountOut:usdPrice,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };
      const router = await contractAt("SwapRouter","0xE592427A0AEce92De3Edee1F18E0157C05861564")
      expect( await usdToken.balanceOf(addr3.address)).eq(0)
      console.info('addr3 uni balanceOf before mint',await uniToken.balanceOf(addr3.address));
      console.info('contract usd balanceOf before mint',await usdToken.balanceOf(contract.address));
      console.info('contract uni balanceOf before mint',await uniToken.balanceOf(contract.address));
      console.info('addr1 usd balanceOf before mint',await usdToken.balanceOf(addr1.address));

      console.info('approve------------------------');
      await uniToken.connect(addr3).approve(contract.address,expandDecimals(10000000,18));
      await contract.approveSwapRouterToken(UNI,expandDecimals(1e9,18))

      // await uniToken.connect(contract).approve(router.address,expandDecimals(10000000,18));
      //await usdToken.connect(addr3).approve(contract.address,expandDecimals(10000000,6));

      //1、transfer uni to contract,
      await uniToken.connect(addr3).transfer(contract.address,expandDecimals(100,18));
      console.info('contract uni balanceOf before mint',await uniToken.balanceOf(contract.address));
      

      const data = [router.interface.encodeFunctionData('exactOutputSingle', [params])]
     
      data.push(contract.interface.encodeFunctionData('mintSubscription',[addr3.address,addr1.address,USDC,usdPrice,111,222]))
      const targets = [router.address,contract.address]
      const gas =await contract.connect(addr3).estimateGas.multicall2(targets,data)
     //353852
      console.info('multicall mintSubscription anyerc20 swap  estimateGas:',gas);
      await contract.connect(addr3).multicall2(targets,data)

      console.info('addr3 usd balanceOf after mint',await usdToken.balanceOf(addr3.address));
      console.info('addr3 uni balanceOf after mint',await uniToken.balanceOf(addr3.address));
      console.info('contract uni balanceOf after mint',await uniToken.balanceOf(contract.address));
      console.info('addr1 usd balanceOf after mint',await usdToken.balanceOf(addr1.address));
      console.info('addr6 usd balanceOf after mint',await usdToken.balanceOf(addr6.address));

      //check tokenId's owner after mint
      let currentId ;
      currentId = await subNft.currentId();
      expect(await subNft.ownerOf(currentId)).eq(addr3.address)

    });


    it("swapMultiAndCall , anyERC20 swap then mint", async function () {
      const { contract,subNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      
      //swaptousd,then mintSubscription
      const UNI =  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'//mainet
      // const UNI =  '0x514910771AF9Ca656af840dff83E8264EcF986CA'//mainet link
      const uniToken = await contractAt("TestERC20", UNI)
      await contract.approveSwapRouterToken(UNI,expandDecimals(1e9,18))

      console.info('uni balanceOf before swap',await uniToken.balanceOf(addr3.address));
      const balanceBefore =  await addr3.getBalance();
      console.info('eth balanceOf before swap',await addr3.getBalance());
      await exactOutputSingle(UNI,expandDecimals(1234,18),expandDecimals(100,18),addr3)
      console.info('eth balanceOf after swap',await addr3.getBalance());
      const afterBalance =  await addr3.getBalance();
      const coast = balanceBefore.sub(afterBalance);
      console.log("swap uni coast:",ethers.utils.formatEther(coast));

 
      const router = await contractAt("SwapRouter","0xE592427A0AEce92De3Edee1F18E0157C05861564")
      expect( await usdToken.balanceOf(addr3.address)).eq(0)
      console.info('addr3 uni balanceOf before mint',await uniToken.balanceOf(addr3.address));
      console.info('contract usd balanceOf before mint',await usdToken.balanceOf(contract.address));
      console.info('contract uni balanceOf before mint',await uniToken.balanceOf(contract.address));
      console.info('addr1 usd balanceOf before mint',await usdToken.balanceOf(addr1.address));

      console.info('approve------------------------');
      await uniToken.connect(addr3).approve(contract.address,expandDecimals(10000000,18));

      
      const price = usdPrice ;
      const data = contract.interface.encodeFunctionData('mintSubscription',[addr3.address,addr1.address,USDC,price,111,222])
     
      const amountInMaximum = expandDecimals(3,18);//3uni >10usd
      let tokens =  [UNI, WETH, USDC];
      const path= encodePath(tokens.slice().reverse(), new Array(tokens.length - 1).fill(POOLFEEAMOUNT))
      
      //424715
      const gas =await contract.connect(addr3).estimateGas.swapMultiAndCall(path,UNI,amountInMaximum,price,data)
     // 
      console.info('swapMultiAndCall  mintSubscription estimateGas:',gas);
  
      await contract.connect(addr3).swapMultiAndCall(path,UNI,amountInMaximum,price,data)

      console.info('addr3 usd balanceOf after mint',await usdToken.balanceOf(addr3.address));
      console.info('addr3 uni balanceOf after mint',await uniToken.balanceOf(addr3.address));
      console.info('contract uni balanceOf after mint',await uniToken.balanceOf(contract.address));
      console.info('addr1 usd balanceOf after mint',await usdToken.balanceOf(addr1.address));
      console.info('addr6 usd balanceOf after mint',await usdToken.balanceOf(addr6.address));

      //check tokenId's owner after mint
      let currentId ;
      currentId = await subNft.currentId();
      expect(await subNft.ownerOf(currentId)).eq(addr3.address)

    });

    it("swapAndCall , anyERC20 swap then mint", async function () {
      const { contract,subNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      
      //swaptousd,then mintSubscription
      // const UNI =  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'//mainet
      const UNI =  '0x514910771AF9Ca656af840dff83E8264EcF986CA'//mainet link
      const uniToken = await contractAt("TestERC20", UNI)
      await contract.approveSwapRouterToken(UNI,expandDecimals(1e9,18))

      console.info('uni balanceOf before swap',await uniToken.balanceOf(addr3.address));
      const balanceBefore =  await addr3.getBalance();
      console.info('eth balanceOf before swap',await addr3.getBalance());
      await exactOutputSingle(UNI,expandDecimals(1234,18),expandDecimals(100,18),addr3)
      console.info('eth balanceOf after swap',await addr3.getBalance());
      const afterBalance =  await addr3.getBalance();
      const coast = balanceBefore.sub(afterBalance);
      console.log("swap uni coast:",ethers.utils.formatEther(coast));



 
      const router = await contractAt("SwapRouter","0xE592427A0AEce92De3Edee1F18E0157C05861564")
      expect( await usdToken.balanceOf(addr3.address)).eq(0)
      console.info('addr3 uni balanceOf before mint',await uniToken.balanceOf(addr3.address));
      console.info('contract usd balanceOf before mint',await usdToken.balanceOf(contract.address));
      console.info('contract uni balanceOf before mint',await uniToken.balanceOf(contract.address));
      console.info('addr1 usd balanceOf before mint',await usdToken.balanceOf(addr1.address));

      console.info('approve------------------------');
      await uniToken.connect(addr3).approve(contract.address,expandDecimals(10000000,18));

      
      const price = usdPrice ;
      const data = contract.interface.encodeFunctionData('mintSubscription',[addr3.address,addr1.address,USDC,price,111,222])
     
      const amountInMaximum = expandDecimals(3,18);//3uni >10usd
      //369378 386282
      const gas =await contract.connect(addr3).estimateGas.swapAndCall(UNI,USDC,amountInMaximum,price,POOLFEEAMOUNT,data)
     // 
      console.info('swapandcall  mintSubscription estimateGas:',gas);
      // require(amountIn <= params.amountInMaximum, 'Too much requested');
      await contract.connect(addr3).swapAndCall(UNI,USDC,amountInMaximum,price,POOLFEEAMOUNT,data)

      console.info('addr3 usd balanceOf after mint',await usdToken.balanceOf(addr3.address));
      console.info('addr3 uni balanceOf after mint',await uniToken.balanceOf(addr3.address));
      console.info('contract uni balanceOf after mint',await uniToken.balanceOf(contract.address));
      console.info('addr1 usd balanceOf after mint',await usdToken.balanceOf(addr1.address));
      console.info('addr6 usd balanceOf after mint',await usdToken.balanceOf(addr6.address));

      //check tokenId's owner after mint
      let currentId ;
      currentId = await subNft.currentId();
      expect(await subNft.ownerOf(currentId)).eq(addr3.address)

    });

    it("swapAndCall , eth swap then mint", async function () {
      const { contract,subNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
 
      expect( await usdToken.balanceOf(addr3.address)).eq(0)
      console.info('contract usd balanceOf before mint',await usdToken.balanceOf(contract.address));
      console.info('addr1 usd balanceOf before mint',await usdToken.balanceOf(addr1.address));
      const balanceBefore =  await addr3.getBalance();
      console.info('eth balanceOf before swap',balanceBefore);


      
      const price = usdPrice*3 ;
      const data = contract.interface.encodeFunctionData('mintSubscription',[addr3.address,addr1.address,USDC,price,111,222])
     
      const amountInMaximum = expandDecimals(1,18);//1e >10usd
      // 
      const gas =await contract.connect(addr3).estimateGas.swapAndCall(WETH,USDC,0,price,POOLFEEAMOUNT,data,{value:amountInMaximum})
     // 392137
      console.info('swapandcall eth  mintSubscription estimateGas:',gas);
      // require(amountIn <= params.amountInMaximum, 'Too much requested');
      await contract.connect(addr3).swapAndCall(WETH,USDC,0,price,POOLFEEAMOUNT,data,{value:amountInMaximum})

      console.info('addr3 usd balanceOf after mint',await usdToken.balanceOf(addr3.address));
      console.info('addr1 usd balanceOf after mint',await usdToken.balanceOf(addr1.address));
      console.info('addr6 usd balanceOf after mint',await usdToken.balanceOf(addr6.address));

      console.info('eth balanceOf after swap addr3 ',await addr3.getBalance());
      const afterBalance =  await addr3.getBalance();
      const coast = balanceBefore.sub(afterBalance);
      console.log("swap   coast:",ethers.utils.formatEther(coast));
      //check tokenId's owner after mint
      let currentId ;
      currentId = await subNft.currentId();
      expect(await subNft.ownerOf(currentId)).eq(addr3.address)

    });




    it.skip("multicall mintSubscription ETH", async function () {
      const { contract,subNft, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      
      //swaptousd,then mintSubscription
  
      const data = [contract.interface.encodeFunctionData('swapExactOutputETH', [USDC,usdPrice,POOLFEEAMOUNT])]
      // if (inputIsWETH9) data.push(router.interface.encodeFunctionData('unwrapWETH9', [0, trader.address]))
      data.push(contract.interface.encodeFunctionData('mintSubscription',[addr2.address,addr1.address,USDC,usdPrice,111,222]))

      const gas =await contract.connect(addr2).estimateGas.multicall(data, {value:ether1})
     //401023
      console.info('multicall mintSubscription estimateGas:',gas);
      await contract.connect(addr2).multicall(data, {value:ether1})

      //check tokenId's owner after mint
      let currentId ;
      currentId = await subNft.currentId();
      expect(await subNft.ownerOf(currentId)).eq(addr2.address)

    });
    
    
    it("mintSubscription free", async function () {
      const { contract,subNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// mintSubscribe 
      let currentId ;
 

      const priceZero =0;
      const gas = await contract.connect(addr1).estimateGas.mintSubscription(addr1.address,addr2.address,USDC,priceZero,111,2222)
      //249170 -lock =226061
      console.info('mintSubscription free estimateGas:',gas);

      expect( await usdToken.balanceOf(addr2.address)).eq(0)
      await contract.connect(addr1).mintSubscription(addr1.address,addr2.address,USDC,priceZero,111,2222)
      currentId = await subNft.currentId();
      expect(await subNft.ownerOf(currentId)).eq(addr1.address)

    });
    
    it("mintSubscription", async function () {
      const { contract,subNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// mintSubscribe 
      let currentId ;
      expect( await usdToken.balanceOf(addr1.address)).eq(0)
      await exactOutputSingle(USDC,usdPrice,value,addr1)
      expect( await usdToken.balanceOf(addr1.address)).eq(usdPrice)

      await usdToken.connect(addr1).approve(contract.address,expandDecimals(10000000,6));

    
      const gas = await contract.connect(addr1).estimateGas.mintSubscription(addr1.address,addr2.address,USDC,usdPrice,111,2222)
      //249170 -lock =226061
      console.info('mintSubscription estimateGas:',gas);

      expect( await usdToken.balanceOf(addr2.address)).eq(0)
      await contract.connect(addr1).mintSubscription(addr1.address,addr2.address,USDC,usdPrice,111,2222)
      currentId = await subNft.currentId();
      expect(await subNft.ownerOf(currentId)).eq(addr1.address)
      expect( await usdToken.balanceOf(addr2.address)).to.greaterThan(1)
    
      //usdc not enough ,reverted
      await expect( contract.connect(addr1).mintSubscription(addr1.address,addr2.address,USDC,usdPrice,111,2222)).to.be.reverted

    });
    
    it("mintSubscriptionETH", async function () {
      const { contract,subNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// mintSubscribe 
      let currentId ;
      expect( await usdToken.balanceOf(addr1.address)).eq(0)
      await exactOutputSingle(USDC,usdPrice,value,addr1)
      expect( await usdToken.balanceOf(addr1.address)).eq(usdPrice)

      await usdToken.connect(addr1).approve(contract.address,expandDecimals(10000000,6));

    
      const gas = await contract.connect(addr1).estimateGas.mintSubscriptionETH(addr1.address,addr2.address,usdPrice,111,2222,{value:ether1})
      //199276 - lock = 176534
      console.info('mintSubscriptionETH estimateGas:',gas);


      await contract.connect(addr1).mintSubscriptionETH(addr1.address,addr2.address,usdPrice,111,2222,{value:ether1})
      currentId = await subNft.currentId();
      expect(await subNft.ownerOf(currentId)).eq(addr1.address)

    
      //usdc not enough ,reverted
      // await expect( contract.connect(addr1).mintSubscriptionETH(addr1.address,addr2.address,USDC,111,2222)).to.be.reverted

    });
 
    it("buySubscription", async function () {
      const { contract,subNft,usdToken, owner ,addr1:buyer,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// buySubscribe
 
      let currentId ;
      await exactOutputSingle(USDC,usdPrice,value,addr4)
      await usdToken.connect(addr4).approve(contract.address,expandDecimals(10000000,6));
      await exactOutputSingle(USDC,usdPrice,value,buyer)
      await usdToken.connect(buyer).approve(contract.address,expandDecimals(10000000,6));

     
      await contract.connect(addr4).mintSubscription(addr4.address,addr2.address,USDC,usdPrice,111,2222)
      currentId = await subNft.currentId();

      await expect(contract.connect(buyer).buySubscription(buyer.address,USDC,usdPrice,currentId)).revertedWith("!sale")
      
      await subNft.connect(addr4).setPrice(currentId,usdPrice)
      
      const gas = await contract.connect(buyer).estimateGas.buySubscription(buyer.address,USDC,usdPrice,currentId)
      console.info('buySubscription estimateGas ',gas);//183636 182446
      await contract.connect(buyer).buySubscription(buyer.address,USDC,usdPrice,currentId)
      expect(await subNft.ownerOf(currentId)).eq(buyer.address)
    
      await expect(contract.connect(addr6).buySubscription(buyer.address,USDC,usdPrice,currentId)).revertedWith("!sale")
    });
    
 
    it("buySubscriptionETH", async function () {
      const { contract,subNft,usdToken, owner ,addr1:buyer,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// buySubscribe
 
      let currentId ;
      await exactOutputSingle(USDC,usdPrice,value,addr4)
      await usdToken.connect(addr4).approve(contract.address,expandDecimals(10000000,6));
      await exactOutputSingle(USDC,usdPrice,value,buyer)
      await usdToken.connect(buyer).approve(contract.address,expandDecimals(10000000,6));

     
      await contract.connect(addr4).mintSubscription(addr4.address,addr2.address,USDC,usdPrice,111,2222)
      currentId = await subNft.currentId();

      await expect(contract.connect(buyer).buySubscriptionETH(buyer.address,currentId)).revertedWith("!sale")
      
      await subNft.connect(addr4).setPrice(currentId,usdPrice)
      
      await contract.connect(buyer).buySubscriptionETH(buyer.address,currentId,{value})
      expect(await subNft.ownerOf(currentId)).eq(buyer.address)
    
      await expect(contract.connect(addr6).buySubscriptionETH(buyer.address,currentId)).revertedWith("!sale")
    });
    
 
    it.skip("buySubscription multicall ETH", async function () {
      const { contract,subNft,usdToken, owner ,addr1:buyer,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// buySubscribe

      let currentId ;
      const data1 = [contract.interface.encodeFunctionData('swapExactOutputETH', [USDC,usdPrice,POOLFEEAMOUNT])]
      data1.push(contract.interface.encodeFunctionData('mintSubscription',[addr2.address,addr3.address,USDC,usdPrice,111,222]))

      await contract.connect(addr2).multicall(data1, {value})

      currentId = await subNft.currentId();
      await subNft.connect(addr2).setPrice(currentId,usdPrice)

    
      const data = [contract.interface.encodeFunctionData('swapExactOutputETH', [USDC,usdPrice,POOLFEEAMOUNT])]
      data.push(contract.interface.encodeFunctionData('buySubscription',[buyer.address,USDC,usdPrice,currentId]))


      const gas = await  contract.connect(buyer).estimateGas.multicall(data, {value})
      //333621
      console.info('multicall buySubscription estimateGas:',gas);
      await contract.connect(buyer).multicall(data, {value})
      expect(await subNft.ownerOf(currentId)).eq(buyer.address)

    });
   
    
    it("mintPost", async function () {
      const { contract,subNft,postNft, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      const usdPrice = expandDecimals(10,6);
  
      let currentId ;
      expect(await postNft.balanceOf(addr3.address)).eq(0)
      const gas = await contract.connect(addr2).estimateGas.mintPost(usdPrice,101)
      //175091 ,notlock 152432 + not mintable 150303
      console.info('mintPost estimateGas:',gas);
      await contract.connect(addr2).mintPost(usdPrice,101)
      currentId = await postNft.currentId();
      expect(await postNft.ownerOf(currentId)).eq(addr2.address)
      expect(await postNft.balanceOf(addr2.address)).eq(1)
  
    });
    
     
    it("buyPost", async function () {
      const { contract,postNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// mintSubscribe
       
      let currentId ;
      expect( await usdToken.balanceOf(addr3.address)).eq(0)
      await exactOutputSingle(USDC,usdPrice,value,addr3)
      expect( await usdToken.balanceOf(addr3.address)).eq(usdPrice)

      await usdToken.connect(addr3).approve(contract.address,expandDecimals(10000000,6));
      
      await contract.connect(addr2).mintPost(usdPrice,101)
      currentId = await postNft.currentId();
      expect(await postNft.ownerOf(currentId)).eq(addr2.address)

      await contract.connect(addr3).buyPost(addr3.address,USDC,usdPrice,currentId)
      expect(await postNft.ownerOf(currentId)).eq(addr3.address)
      expect( await usdToken.balanceOf(addr3.address)).eq(0)
       
    });
     
   
    
     
    it("buyPostETH", async function () {
      const { contract,postNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// mintSubscribe
       
      let currentId ;
      expect( await usdToken.balanceOf(addr3.address)).eq(0)
      await exactOutputSingle(USDC,usdPrice,value,addr3)
      expect( await usdToken.balanceOf(addr3.address)).eq(usdPrice)

      await usdToken.connect(addr3).approve(contract.address,expandDecimals(10000000,6));
      
      await contract.connect(addr2).mintPost(usdPrice,101)
      currentId = await postNft.currentId();
      expect(await postNft.ownerOf(currentId)).eq(addr2.address)

      const gas = await contract.connect(addr3).estimateGas.buyPostETH(currentId,{value})
      console.info('buyPostETH gas',gas);//192589
      await contract.connect(addr3).buyPostETH(currentId,{value})
      expect(await postNft.ownerOf(currentId)).eq(addr3.address)

       
    });
     
   
     
    it.skip("buyPost multicall ETH", async function () {
      const { contract,postNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      /// swapETH for USDC,
      /// approvel contract spend USDC,
      /// mintSubscribe
      let currentId ;
      await contract.connect(addr2).mintPost(usdPrice,101)
      currentId = await postNft.currentId();
      expect(await postNft.ownerOf(currentId)).eq(addr2.address)

      
      const data = [contract.interface.encodeFunctionData('swapExactOutputETH', [USDC,usdPrice,POOLFEEAMOUNT])]
      data.push(contract.interface.encodeFunctionData('buyPost',[addr3.address,USDC,usdPrice,currentId]))

      await contract.connect(addr3).multicall(data, {value})
      expect(await postNft.ownerOf(currentId)).eq(addr3.address)
    
    });
    
  
  
    it("setFeeTo", async function () {
      const { contract, postNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
    
      await contract.connect(owner).setFeeTo(addr3.address);
      expect(await contract.feeTo()).eq(addr3.address)

      await expect(contract.connect(addr2).setFeeTo(addr1.address)).revertedWith('Ownable: caller is not the owner')

    });
    
  
  
  
  
    it("sendTips", async function () {
      const { contract, postNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
      
      await exactOutputSingle(USDC,expandDecimals(1234,6),expandDecimals(2,18),addr2)

      await usdToken.connect(addr2).approve(contract.address,expandDecimals(10000000,6));


      const gas = await contract.connect(addr2).estimateGas.sendTips(USDC,addr3.address,1,1000);
      console.info('sendTips estimateGas',gas);//119182 118668
      await contract.connect(addr2).sendTips(USDC,addr3.address,1,1000);

      expect(await usdToken.balanceOf(addr3.address)).eq(1000-30)

    });
  
  
  
  
    it("sendTipsETH", async function () {
      const { contract, postNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);

      const gas = await contract.connect(addr2).estimateGas.sendTipsETH(addr3.address,1,1000,{value:ether1});
      console.info('sendTipsETH estimateGas',gas);//47418 47743 68876
      await contract.connect(addr2).sendTipsETH(addr3.address,1,1000,{value:ether1});

    });
    
  
  
  
    it("chainlink pricefee", async function () {
      const { contract, postNft,usdToken, owner ,addr1,addr2,addr3,addr4,addr6} = await loadFixture(deployTokenFixture);
     
      //decimal 8
      // console.info('getLatestPrice gas', await contract.connect(addr2).estimateGas.getLatestPrice())
      // console.info('getLatestPrice', await contract.connect(addr2).getLatestPrice())
     
      // 
      console.info('getLatestPrice gas', await contract.connect(addr2).estimateGas.getOutputETHAmount(usdPrice))
      console.info('checkPrice ether:',ethers.utils.formatEther( await contract.connect(addr2).getOutputETHAmount(usdPrice)))


    });
});

// npm run test test/Operator.js